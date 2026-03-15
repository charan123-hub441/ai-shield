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

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
