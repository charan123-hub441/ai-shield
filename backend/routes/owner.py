from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from auth import hash_password, get_current_user, require_owner
import models

router = APIRouter(prefix="/owner", tags=["owner"])

# ─── Schemas ────────────────────────────────────────────────────────────────

class OwnerSetupRequest(BaseModel):
    username: str
    email: str
    password: str
    secret_key: str   # A passphrase so only YOU can create the owner account

class UserAdminView(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    role: str
    is_banned: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class AllUsersResponse(BaseModel):
    total_users: int
    users: list[UserAdminView]


# ─── Owner account setup (one-time) ─────────────────────────────────────────

OWNER_SECRET = "POV_OWNER_2024_SAI_CHARAN"   # change this if you want

@router.post("/setup", status_code=201)
def setup_owner_account(payload: OwnerSetupRequest, db: Session = Depends(get_db)):
    """
    Create the owner account. Can only be called once (or if no owner exists yet).
    Requires a secret passphrase to prevent abuse.
    """
    if payload.secret_key != OWNER_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret key")

    # Check no owner exists already
    existing_owner = db.query(models.User).filter(models.User.role == "owner").first()
    if existing_owner:
        raise HTTPException(status_code=400, detail="Owner account already exists")

    # Check email/username not taken
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    owner = models.User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="owner",
        full_name="Owner"
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)

    return {
        "message": "Owner account created successfully!",
        "username": owner.username,
        "email": owner.email,
        "role": owner.role,
        "created_at": owner.created_at.isoformat()
    }


# ─── Owner-only: list all users ──────────────────────────────────────────────

@router.get("/users", response_model=AllUsersResponse)
def list_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner)
):
    """Return all registered users with their creation date. Owner only."""
    all_users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return AllUsersResponse(
        total_users=len(all_users),
        users=all_users
    )


# ─── Owner-only: single user detail ─────────────────────────────────────────

@router.get("/users/{user_id}", response_model=UserAdminView)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner)
):
    """Get detailed info about a specific user. Owner only."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
