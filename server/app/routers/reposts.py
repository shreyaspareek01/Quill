from sqlalchemy import func
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, oauth2
from ..schemas import PostResponseWithVotes
from .posts import _post_query_base, _format_results
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

router = APIRouter(prefix="/reposts", tags=["Reposts"])

@router.post("/{post_id}", status_code=status.HTTP_201_CREATED)
def repost_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    existing = db.query(models.Repost).filter(models.Repost.user_id == current_user.id, models.Repost.post_id == post_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already reposted")
    db.add(models.Repost(user_id=current_user.id, post_id=post_id))
    db.commit()
    return {"message": "Post reposted"}

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def undo_repost(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    query = db.query(models.Repost).filter(models.Repost.user_id == current_user.id, models.Repost.post_id == post_id)
    repost = query.first()
    if not repost:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repost not found")
    query.delete(synchronize_session=False)
    db.commit()
    return

@router.get("/{user_id}", response_model=list[PostResponseWithVotes])
def get_user_reposts(user_id: int, db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user)):
    current_user_id = user.id if user else -1
    reposted_post_ids = db.query(models.Repost.post_id).filter(models.Repost.user_id == user_id).subquery()
    results = _post_query_base(db, current_user_id).filter(
        models.Post.id.in_(reposted_post_ids)
    ).group_by(models.Post.id).order_by(models.Post.created_at.desc()).all()
    return _format_results(results)
