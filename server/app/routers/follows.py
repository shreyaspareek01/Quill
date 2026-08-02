from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
from .. import models, oauth2
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/follows", tags=["Follows"])


@router.get("/recommendations")
def get_recommendations(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_optional_user),
):
    """
    Two-hop graph traversal over the follows adjacency table.

    Finds users who are followed by people you follow (2nd-degree connections)
    but whom you do not yet follow yourself.
    Ranks candidates by how many of your followed users also follow them
    (mutual_count), which serves as a proxy for relevance / social proof.

    This mirrors the core idea behind Twitter/LinkedIn PYMK at the query level.
    """
    if not current_user:
        # Return top followed users globally for unauthenticated visitors
        sql = text("""
            SELECT
                u.id,
                u.username,
                u.full_name,
                u.avatar_url,
                u.bio,
                0 AS mutual_count
            FROM users u
            LEFT JOIN follows f ON f.following_id = u.id
            GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.bio
            ORDER BY COUNT(f.follower_id) DESC
            LIMIT :lim
        """)
        rows = db.execute(sql, {"lim": limit}).mappings().all()
        return [dict(row) for row in rows]

    sql = text("""
        SELECT
            u.id,
            u.username,
            u.full_name,
            u.avatar_url,
            u.bio,
            COUNT(DISTINCT f1.follower_id) AS mutual_count
        FROM follows f1
        JOIN follows f2 ON f1.following_id = f2.follower_id
        JOIN users   u  ON u.id = f2.following_id
        WHERE
            f1.follower_id   = :uid
            AND f2.following_id != :uid
            AND f2.following_id NOT IN (
                SELECT following_id
                FROM follows
                WHERE follower_id = :uid
            )
        GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.bio
        ORDER BY mutual_count DESC
        LIMIT :lim
    """)

    rows = db.execute(sql, {"uid": current_user.id, "lim": limit}).mappings().all()

    # If the social graph is too sparse (new platform / new user), fall back
    # to users with the most followers that the current user doesn't follow yet.
    if not rows:
        fallback_sql = text("""
            SELECT
                u.id,
                u.username,
                u.full_name,
                u.avatar_url,
                u.bio,
                0 AS mutual_count
            FROM users u
            LEFT JOIN follows f ON f.following_id = u.id
            WHERE
                u.id != :uid
                AND u.id NOT IN (
                    SELECT following_id FROM follows WHERE follower_id = :uid
                )
            GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.bio
            ORDER BY COUNT(f.follower_id) DESC
            LIMIT :lim
        """)
        rows = db.execute(fallback_sql, {"uid": current_user.id, "lim": limit}).mappings().all()

    return [dict(row) for row in rows]

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
    # Create notification for followed user
    from .notifications import create_notification
    create_notification(
        db,
        user_id=user_id,
        actor_id=current_user.id,
        type="follow"
    )
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
