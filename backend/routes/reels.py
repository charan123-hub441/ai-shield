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

router = APIRouter(prefix="/reels", tags=["reels"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_VIDEO_EXT = {".mp4", ".webm", ".mov", ".avi", ".mkv"}

WARNING_MESSAGES = {
    "Severe Harassment": (
        "⚠️ CRITICAL WARNING: Your reel caption contains severe harassment content. "
        "This violates our community guidelines. Remove this reel immediately "
        "or your account will be permanently BANNED."
    ),
    "Cyberbullying": (
        "⚠️ WARNING: Your reel caption has been flagged for cyberbullying. "
        "This is a violation of POV community standards. Please remove this reel within 24 hours."
    ),
    "Offensive": (
        "⚠️ NOTICE: Your reel caption contains offensive language. "
        "Please be mindful of the community guidelines."
    ),
}


def _reel_to_out(reel: models.Reel, current_user_id: int) -> schemas.ReelOut:
    liked = any(l.user_id == current_user_id for l in reel.likes)
    comments = [
        schemas.ReelCommentOut(
            id=c.id,
            text=c.text,
            username=c.user.username if c.user else "Unknown",
            created_at=c.created_at,
        )
        for c in reel.comments
    ]
    return schemas.ReelOut(
        id=reel.id,
        caption=reel.caption,
        video_url=reel.video_url,
        thumbnail_url=reel.thumbnail_url,
        username=reel.user.username if reel.user else "Unknown",
        profile_pic_url=reel.user.profile_pic_url if reel.user else None,
        view_count=reel.view_count,
        like_count=len(reel.likes),
        liked_by_me=liked,
        comment_count=len(reel.comments),
        comments=comments,
        is_flagged=reel.is_flagged,
        flag_label=reel.flag_label,
        flag_score=round(reel.flag_score, 3) if reel.flag_score else None,
        flag_warning=reel.flag_warning,
        created_at=reel.created_at,
    )


@router.post("", response_model=schemas.ReelOut, status_code=201)
async def create_reel(
    caption: str = Form(""),
    video: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not video or not video.filename:
        raise HTTPException(400, "Video file is required")

    ext = os.path.splitext(video.filename)[1].lower()
    if ext not in ALLOWED_VIDEO_EXT:
        raise HTTPException(400, f"Unsupported video format: {ext}")

    filename = f"reel_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(video.file, f)
    video_url = f"/uploads/{filename}"

    # AI classification on caption
    ai_result = classify_text(caption) if caption.strip() else None
    is_flagged = ai_result["is_flagged"] if ai_result else False
    flag_label = ai_result["label"] if ai_result else "Safe"
    flag_score = ai_result["score"] if ai_result else 0.0
    flag_warning = WARNING_MESSAGES.get(flag_label) if is_flagged else None

    reel = models.Reel(
        user_id=current_user.id,
        caption=caption,
        video_url=video_url,
        is_flagged=is_flagged,
        flag_label=flag_label,
        flag_score=flag_score,
        flag_warning=flag_warning,
    )
    db.add(reel)
    db.commit()
    db.refresh(reel)

    return _reel_to_out(reel, current_user.id)


@router.get("", response_model=list[schemas.ReelOut])
def get_reels(
    skip: int = 0,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    reels = (
        db.query(models.Reel)
        .order_by(models.Reel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_reel_to_out(r, current_user.id) for r in reels]


@router.get("/{reel_id}", response_model=schemas.ReelOut)
def get_reel(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    reel = db.query(models.Reel).filter(models.Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(404, "Reel not found")

    # increment view count
    reel.view_count += 1
    db.commit()

    return _reel_to_out(reel, current_user.id)


@router.post("/{reel_id}/like")
def toggle_reel_like(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    reel = db.query(models.Reel).filter(models.Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(404, "Reel not found")

    existing = (
        db.query(models.ReelLike)
        .filter(models.ReelLike.reel_id == reel_id, models.ReelLike.user_id == current_user.id)
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        return {"liked": False}
    else:
        like = models.ReelLike(reel_id=reel_id, user_id=current_user.id)
        db.add(like)
        db.commit()
        return {"liked": True}


@router.post("/{reel_id}/comment", response_model=schemas.ReelCommentOut)
def add_reel_comment(
    reel_id: int,
    payload: schemas.ReelCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    reel = db.query(models.Reel).filter(models.Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(404, "Reel not found")

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

    comment = models.ReelComment(
        reel_id=reel_id,
        user_id=current_user.id,
        text=payload.text,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return schemas.ReelCommentOut(
        id=comment.id,
        text=comment.text,
        username=current_user.username,
        created_at=comment.created_at,
    )


@router.delete("/{reel_id}")
def delete_reel(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    reel = db.query(models.Reel).filter(models.Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(404, "Reel not found")
    if reel.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not allowed")

    # Remove video file
    filepath = os.path.join(UPLOAD_DIR, os.path.basename(reel.video_url))
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(reel)
    db.commit()
    return {"message": "Reel deleted"}
