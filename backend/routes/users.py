from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid
import shutil

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(tags=["users"])

# Use same DATA_DIR as main.py — critical for Render persistent volume
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.environ.get("DATA_DIR", BASE_DIR)
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
print(f"USERS ROUTE: Saving uploads to {UPLOAD_DIR}")

@router.get("/users/me", response_model=schemas.UserProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Count posts
    post_count = db.query(models.Post).filter(models.Post.user_id == current_user.id).count()
    
    return schemas.UserProfileOut(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        bio=current_user.bio,
        profile_pic_url=current_user.profile_pic_url,
        warn_count=current_user.warn_count,
        is_banned=current_user.is_banned,
        post_count=post_count
    )

@router.put("/users/me", response_model=schemas.UserProfileOut)
def update_profile(
    payload: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.profile_pic_url is not None:
        current_user.profile_pic_url = payload.profile_pic_url
        
    db.commit()
    db.refresh(current_user)
    
    post_count = db.query(models.Post).filter(models.Post.user_id == current_user.id).count()
    
    return schemas.UserProfileOut(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        bio=current_user.bio,
        profile_pic_url=current_user.profile_pic_url,
        warn_count=current_user.warn_count,
        is_banned=current_user.is_banned,
        post_count=post_count
    )

@router.post("/users/me/profile-pic")
async def upload_profile_pic(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    print(f"UPLOAD REQUEST: User={current_user.username}, File={file.filename}")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(400, "Invalid image format")
        
    filename = f"profile_{current_user.id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    url = f"/uploads/{filename}"
    current_user.profile_pic_url = url
    db.commit()
    
    return {"url": url}

@router.put("/users/me/password")
def change_password(
    payload: schemas.UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from auth import verify_password, hash_password
    
    # Verify current password
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    # Check if new password is the same as the old one
    if verify_password(payload.new_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password cannot be the same as the current password")
    
    # Update password
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

# ─── Social / Follow Features ──────────────────────────────────────────────────

@router.get("/users/search", response_model=list[schemas.UserSearchResponse])
def search_users(
    q: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not q or len(q) < 2:
        return []
    
    search_term = f"%{q}%"
    users = db.query(models.User).filter(
        (models.User.username.ilike(search_term)) | 
        (models.User.full_name.ilike(search_term))
    ).filter(models.User.id != current_user.id).limit(20).all()
    
    return users

@router.get("/users/{user_id}/profile", response_model=schemas.UserPublicProfile)
def get_public_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    followers_count = db.query(models.UserFollow).filter(models.UserFollow.followed_id == user_id, models.UserFollow.status == 'accepted').count()
    following_count = db.query(models.UserFollow).filter(models.UserFollow.follower_id == user_id, models.UserFollow.status == 'accepted').count()
    
    existing_follow = db.query(models.UserFollow).filter(
        models.UserFollow.follower_id == current_user.id,
        models.UserFollow.followed_id == user_id
    ).first()
    
    is_following = existing_follow is not None and existing_follow.status == 'accepted'
    follow_status = existing_follow.status if existing_follow else "none"
    
    return schemas.UserPublicProfile(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        bio=user.bio,
        profile_pic_url=user.profile_pic_url,
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following,
        follow_status=follow_status
    )

@router.post("/users/{user_id}/follow")
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")
        
    user_to_follow = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_follow:
        raise HTTPException(status_code=404, detail="User not found")
        
    existing_follow = db.query(models.UserFollow).filter(
        models.UserFollow.follower_id == current_user.id,
        models.UserFollow.followed_id == user_id
    ).first()
    
    if existing_follow:
        if existing_follow.status == 'pending':
            return {"message": "Follow request already sent", "status": "pending"}
        return {"message": "Already following", "status": "accepted"}
        
    new_follow = models.UserFollow(follower_id=current_user.id, followed_id=user_id, status="pending")
    db.add(new_follow)
    db.commit()
    
    return {"message": f"Follow request sent to {user_to_follow.username}", "status": "pending"}

@router.delete("/users/{user_id}/follow")
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    follow_record = db.query(models.UserFollow).filter(
        models.UserFollow.follower_id == current_user.id,
        models.UserFollow.followed_id == user_id
    ).first()
    
    if not follow_record:
        return {"message": "Not following this user"}
        
    db.delete(follow_record)
    db.commit()
    
    return {"message": "Unfollowed successfully"}

@router.get("/users/me/follow-requests", response_model=list[schemas.FollowRequestResponse])
def get_follow_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    requests = db.query(models.UserFollow).filter(
        models.UserFollow.followed_id == current_user.id,
        models.UserFollow.status == 'pending'
    ).all()
    
    response = []
    for req in requests:
        follower = db.query(models.User).filter(models.User.id == req.follower_id).first()
        if follower:
            response.append(schemas.FollowRequestResponse(
                id=req.id,
                follower_id=follower.id,
                follower_username=follower.username,
                follower_profile_pic_url=follower.profile_pic_url,
                created_at=req.created_at
            ))
            
    return response

@router.post("/users/requests/{follower_id}/accept")
def accept_follow_request(
    follower_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    follow_record = db.query(models.UserFollow).filter(
        models.UserFollow.follower_id == follower_id,
        models.UserFollow.followed_id == current_user.id,
        models.UserFollow.status == 'pending'
    ).first()
    
    if not follow_record:
        raise HTTPException(status_code=404, detail="Follow request not found")
        
    follow_record.status = 'accepted'
    db.commit()
    return {"message": "Follow request accepted"}

@router.post("/users/requests/{follower_id}/reject")
def reject_follow_request(
    follower_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    follow_record = db.query(models.UserFollow).filter(
        models.UserFollow.follower_id == follower_id,
        models.UserFollow.followed_id == current_user.id,
        models.UserFollow.status == 'pending'
    ).first()
    
    if not follow_record:
        raise HTTPException(status_code=404, detail="Follow request not found")
        
    db.delete(follow_record)
    db.commit()
    return {"message": "Follow request rejected"}

