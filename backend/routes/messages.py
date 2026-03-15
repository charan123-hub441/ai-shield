import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from auth import get_current_user
import models
import schemas
from ai.classifier import classify_text

router = APIRouter(tags=["messages"])


@router.post("/analyze", response_model=schemas.AnalysisResult)
def analyze_message(
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    # Run AI pipeline
    result = classify_text(payload.content)

    # Persist message
    msg = models.Message(
        content=payload.content,
        user_id=current_user.id,
        label=result["label"],
        score=result["score"],
        confidence=result["confidence"],
        is_flagged=result["is_flagged"]
    )
    db.add(msg)
    db.flush()

    # Auto-flag if harmful
    if result["is_flagged"]:
        flag = models.FlaggedMessage(
            message_id=msg.id,
            flagged_by=current_user.id,
            action="pending"
        )
        db.add(flag)

    db.commit()
    db.refresh(msg)

    return schemas.AnalysisResult(
        label=result["label"],
        confidence=result["confidence"],
        score=result["score"],
        message_id=msg.id,
        content=payload.content,
        is_flagged=result["is_flagged"]
    )


@router.get("/messages", response_model=list[schemas.MessageOut])
def get_messages(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Admins see all; regular users see their own
    if current_user.role == "admin":
        msgs = db.query(models.Message).order_by(models.Message.created_at.desc()).offset(skip).limit(limit).all()
    else:
        msgs = (
            db.query(models.Message)
            .filter(models.Message.user_id == current_user.id)
            .order_by(models.Message.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    result = []
    for m in msgs:
        out = schemas.MessageOut(
            id=m.id,
            content=m.content,
            label=m.label,
            confidence=m.confidence,
            score=m.score,
            is_flagged=m.is_flagged,
            created_at=m.created_at,
            username=m.user.username if m.user else "Unknown"
        )
        result.append(out)
    return result
