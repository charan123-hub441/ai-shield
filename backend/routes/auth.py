from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from auth import hash_password, verify_password, create_access_token
import models
import schemas

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=schemas.Token, status_code=201)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    clean_email = str(payload.email).strip().lower()
    clean_username = payload.username.strip()

    if db.query(models.User).filter(models.User.email.ilike(clean_email)).first():
        raise HTTPException(status_code=400, detail="Email already registered. Please log in with your email or username.")
    if db.query(models.User).filter(models.User.username.ilike(clean_username)).first():
        raise HTTPException(status_code=400, detail="Username already taken. Please choose another username or log in.")

    user = models.User(
        username=clean_username,
        email=clean_email,
        hashed_password=hash_password(payload.password),
        phone_number=payload.phone_number.strip() if payload.phone_number else None,
        role="user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    identifier = payload.email.strip()
    clean_email = identifier.lower()

    user = db.query(models.User).filter(
        (models.User.email.ilike(clean_email)) | 
        (models.User.username.ilike(identifier))
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password"
        )

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}
