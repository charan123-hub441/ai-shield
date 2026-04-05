import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from auth import get_current_user
import models
import schemas
from ai.classifier import classify_text

router = APIRouter(tags=["posts"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_VIDEO_EXT = {".mp4", ".webm", ".mov", ".avi"}

# Warning messages per severity level
WARNING_MESSAGES = {
    "Severe Harassment": (
        "⚠️ CRITICAL WARNING: Your post contains severe harassment content. "
        "This violates our community guidelines. Remove this post immediately "
        "or your account will be permanently BANNED. This is your final warning."
    ),
    "Cyberbullying": (
        "⚠️ WARNING: Your post has been flagged for cyberbullying. "
        "This is a violation of POV community standards. Please remove this post within 24 hours "
        "or your account will be suspended. Repeated violations will result in a permanent ban."
    ),
    "Offensive": (
        "⚠️ NOTICE: Your post contains offensive language. "
        "Please be mindful of the community guidelines. Continued posting of offensive content "
        "may result in account restrictions."
    ),
}


@router.post("/posts", response_model=schemas.PostOut, status_code=201)
async def create_post(
    content: str = Form(""),
    media: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    media_url = None
    media_type = None

    if media and media.filename:
        ext = os.path.splitext(media.filename)[1].lower()
        if ext in ALLOWED_IMAGE_EXT:
            media_type = "image"
        elif ext in ALLOWED_VIDEO_EXT:
            media_type = "video"
        else:
            raise HTTPException(400, f"Unsupported file type: {ext}")

        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(media.file, f)
        media_url = f"/uploads/{filename}"

    if not content.strip() and not media_url:
        raise HTTPException(400, "Post must have text or media")

    # ── AI Classification ─────────────────────────────────────────────
    ai_result = classify_text(content) if content.strip() else None
    is_flagged = ai_result["is_flagged"] if ai_result else False
    flag_label = ai_result["label"] if ai_result else "Safe"
    flag_score = ai_result["score"] if ai_result else 0.0
    flag_warning = WARNING_MESSAGES.get(flag_label) if is_flagged else None

    # Increment warning count for harmful content
    if is_flagged and flag_label in ["Severe Harassment", "Cyberbullying"]:
        current_user.warn_count += 1
        # Auto-ban if warn_count reaches threshold (e.g., 5)
        if current_user.warn_count >= 5:
            current_user.is_banned = True
        db.commit()

    post = models.Post(
        user_id=current_user.id,
        content=content,
        media_url=media_url,
        media_type=media_type,
        is_flagged=is_flagged,
        flag_label=flag_label,
        flag_score=flag_score,
        flag_warning=flag_warning
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return _post_to_out(post, current_user.id)


@router.get("/posts", response_model=list[schemas.PostOut])
def get_feed(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    posts = (
        db.query(models.Post)
        .order_by(models.Post.created_at.desc())
        .offset(skip).limit(limit).all()
    )
    return [_post_to_out(p, current_user.id) for p in posts]


@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    existing = db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id,
        models.PostLike.user_id == current_user.id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"liked": False}
    else:
        like = models.PostLike(post_id=post_id, user_id=current_user.id)
        db.add(like)
        db.commit()
        return {"liked": True}


@router.post("/posts/{post_id}/comment", response_model=schemas.CommentOut)
def add_comment(
    post_id: int,
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
        
    ai_result = classify_text(payload.text)
    if ai_result["is_flagged"]:
        current_user.warn_count += 1
        db.commit()
        
        if current_user.warn_count >= 3:
            current_user.is_banned = True
            db.commit()
            raise HTTPException(400, "ACCOUNT BANNED: You have repeatedly posted offensive content. Your account is now disabled.")
            
        remaining = 3 - current_user.warn_count
        raise HTTPException(400, f"⚠️ WARNING: Your comment contains offensive or bullying words and was blocked. You have {remaining} strike(s) left before a permanent ban.")

    comment = models.PostComment(
        post_id=post_id,
        user_id=current_user.id,
        text=payload.text
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return schemas.CommentOut(
        id=comment.id,
        text=comment.text,
        username=current_user.username,
        created_at=comment.created_at
    )


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not allowed")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}


# ─── Users list (for starting chats / finding people) ────────────────────────
@router.get("/users", response_model=list[schemas.UserBasic])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    users = db.query(models.User).filter(models.User.id != current_user.id).all()
    return [schemas.UserBasic(id=u.id, username=u.username) for u in users]


# ─── Helper ──────────────────────────────────────────────────────────────────
def _post_to_out(post: models.Post, current_user_id: int, ai_override=None) -> schemas.PostOut:
    liked = any(l.user_id == current_user_id for l in post.likes)
    comments = [
        schemas.CommentOut(
            id=c.id, text=c.text,
            username=c.user.username if c.user else "Unknown",
            created_at=c.created_at
        )
        for c in post.comments
    ]

    # Run classifier on existing posts when loading feed
    if ai_override:
        is_flagged = ai_override["is_flagged"]
        flag_label = ai_override["flag_label"]
        flag_score = ai_override["flag_score"]
    elif post.content and post.content.strip():
        result = classify_text(post.content)
        is_flagged = result["is_flagged"]
        flag_label = result["label"]
        flag_score = result["score"]
    else:
        is_flagged = False
        flag_label = "Safe"
        flag_score = 0.0

    warning = WARNING_MESSAGES.get(flag_label) if is_flagged else None

    return schemas.PostOut(
        id=post.id,
        content=post.content,
        media_url=post.media_url,
        media_type=post.media_type,
        username=post.user.username if post.user else "Unknown",
        like_count=len(post.likes),
        liked_by_me=liked,
        comments=comments,
        created_at=post.created_at,
        is_flagged=is_flagged,
        flag_label=flag_label,
        flag_score=round(flag_score, 3),
        flag_warning=warning
    )
