from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, oauth2
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/follows", tags=["Follows"])

@router.post("/{user_id}", status_code=status.HTTP_201_CREATED)
def follow_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    existing = db.query(models.Follow).filter(models.Follow.follower_id == current_user.id, models.Follow.following_id == user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already following this user")
    follow = models.Follow(follower_id=current_user.id, following_id=user_id)
    db.add(follow)
    db.commit()
    return {"message": "Now following user"}

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    query = db.query(models.Follow).filter(models.Follow.follower_id == current_user.id, models.Follow.following_id == user_id)
    follow = query.first()
    if not follow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not following this user")
    query.delete(synchronize_session=False)
    db.commit()
    return

@router.get("/{user_id}/followers", response_model=list[dict])
def get_followers(user_id: int, db: Session = Depends(get_db)):
    follows = db.query(models.Follow).filter(models.Follow.following_id == user_id).all()
    user_ids = [f.follower_id for f in follows]
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all() if user_ids else []
    return [{"id": u.id, "email": u.email, "username": u.username, "full_name": u.full_name, "avatar_url": u.avatar_url} for u in users]


@router.get("/{user_id}/following", response_model=list[dict])
def get_following(user_id: int, db: Session = Depends(get_db)):
    follows = db.query(models.Follow).filter(models.Follow.follower_id == user_id).all()
    user_ids = [f.following_id for f in follows]
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all() if user_ids else []
    return [{"id": u.id, "email": u.email, "username": u.username, "full_name": u.full_name, "avatar_url": u.avatar_url} for u in users]


@router.get("/{user_id}/status")
def get_follow_status(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    following = db.query(models.Follow).filter(models.Follow.follower_id == current_user.id, models.Follow.following_id == user_id).first() is not None
    followers_count = db.query(models.Follow).filter(models.Follow.following_id == user_id).count()
    following_count = db.query(models.Follow).filter(models.Follow.follower_id == user_id).count()
    return {"is_following": following, "followers_count": followers_count, "following_count": following_count}
