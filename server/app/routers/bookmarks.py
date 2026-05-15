from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, oauth2
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])

@router.get("/")
def get_bookmarks(db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    bookmarks = db.query(models.Bookmark).filter(models.Bookmark.user_id == current_user.id).all()
    post_ids = [b.post_id for b in bookmarks]
    posts = db.query(models.Post).filter(models.Post.id.in_(post_ids)).all() if post_ids else []
    return [{"id": p.id, "title": p.title, "content": p.content[:100], "owner_id": p.owner_id, "created_at": p.created_at} for p in posts]

@router.post("/{post_id}", status_code=status.HTTP_201_CREATED)
def bookmark_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    existing = db.query(models.Bookmark).filter(models.Bookmark.user_id == current_user.id, models.Bookmark.post_id == post_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already bookmarked")
    bookmark = models.Bookmark(user_id=current_user.id, post_id=post_id)
    db.add(bookmark)
    db.commit()
    return {"message": "Post bookmarked"}

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_bookmark(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    query = db.query(models.Bookmark).filter(models.Bookmark.user_id == current_user.id, models.Bookmark.post_id == post_id)
    bookmark = query.first()
    if not bookmark:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")
    query.delete(synchronize_session=False)
    db.commit()
    return

@router.get("/{post_id}/status")
def bookmark_status(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    bookmarked = db.query(models.Bookmark).filter(models.Bookmark.user_id == current_user.id, models.Bookmark.post_id == post_id).first() is not None
    return {"bookmarked": bookmarked}
