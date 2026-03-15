from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(tags=["moderation"])


@router.get("/moderation/flagged", response_model=list[schemas.FlaggedMessageOut])
def get_flagged_messages(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    flags = (
        db.query(models.FlaggedMessage)
        .order_by(models.FlaggedMessage.created_at.desc())
        .all()
    )
    result = []
    for f in flags:
        msg = f.message
        if not msg:
            continue
        result.append(schemas.FlaggedMessageOut(
            id=f.id,
            message_id=f.message_id,
            content=msg.content,
            username=msg.user.username if msg.user else "Unknown",
            label=msg.label or "Unknown",
            score=msg.score or 0.0,
            action=f.action,
            created_at=f.created_at
        ))
    return result


@router.post("/moderation/action")
def take_moderation_action(
    payload: schemas.ModerationAction,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    flag = db.query(models.FlaggedMessage).filter(
        models.FlaggedMessage.id == payload.flagged_message_id
    ).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flagged message not found")

    valid_actions = ("warned", "deleted", "blocked", "pending")
    if payload.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Action must be one of {valid_actions}")

    flag.action = payload.action
    db.commit()
    return {"message": f"Action '{payload.action}' applied to flagged message #{flag.id}"}
