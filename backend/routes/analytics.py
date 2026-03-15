from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(tags=["analytics"])


@router.get("/analytics", response_model=schemas.AnalyticsOut)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    total = db.query(models.Message).count()
    safe = db.query(models.Message).filter(models.Message.label == "Safe").count()
    offensive = db.query(models.Message).filter(models.Message.label == "Offensive").count()
    cyberbullying = db.query(models.Message).filter(models.Message.label == "Cyberbullying").count()
    severe = db.query(models.Message).filter(models.Message.label == "Severe Harassment").count()
    flagged = db.query(models.Message).filter(models.Message.is_flagged == True).count()
    total_reports = db.query(models.Report).count()
    pending_reports = db.query(models.Report).filter(models.Report.status == "pending").count()

    return schemas.AnalyticsOut(
        total_messages=total,
        safe_count=safe,
        offensive_count=offensive,
        cyberbullying_count=cyberbullying,
        severe_count=severe,
        flagged_count=flagged,
        total_reports=total_reports,
        pending_reports=pending_reports
    )
