from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, oauth2
from ..schemas import ReportCreate
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def report_post(report: ReportCreate, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == report.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    existing = db.query(models.Report).filter(
        models.Report.post_id == report.post_id,
        models.Report.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already reported this post")
    db.add(models.Report(post_id=report.post_id, user_id=current_user.id, reason=report.reason))
    db.commit()
    return {"message": "Post reported"}
