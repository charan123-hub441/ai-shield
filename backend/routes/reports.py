from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(tags=["reports"])


@router.post("/reports", response_model=schemas.ReportOut, status_code=201)
def submit_report(
    payload: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    report = models.Report(
        reporter_id=current_user.id,
        description=payload.description,
        incident_type=payload.incident_type or "cyberbullying",
        status="pending"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports", response_model=list[schemas.ReportOut])
def list_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(models.Report).order_by(models.Report.created_at.desc()).all()
    return (
        db.query(models.Report)
        .filter(models.Report.reporter_id == current_user.id)
        .order_by(models.Report.created_at.desc())
        .all()
    )


@router.patch("/reports/{report_id}/status")
def update_report_status(
    report_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if status not in ("pending", "reviewed", "resolved"):
        raise HTTPException(status_code=400, detail="Invalid status")
    report.status = status
    db.commit()
    return {"message": f"Report {report_id} updated to {status}"}
