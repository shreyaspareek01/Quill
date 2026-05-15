from sqlalchemy import func
from ..schemas import PostCreate, PostResponse, PostResponseWithVotes
from sqlalchemy.orm import Session
from ..database import get_db 
from .. import models,oauth2
from fastapi import status,Response,APIRouter,Depends,Query
from fastapi.exceptions import HTTPException
from typing import Optional

router = APIRouter(prefix="/posts",tags=["Posts"])

def _post_query_base(db, user_id):
    voted_subquery = db.query(models.Vote.post_id).filter(models.Vote.user_id == user_id).subquery()
    reposted_subquery = db.query(models.Repost.post_id).filter(models.Repost.user_id == user_id).subquery()
    comment_subquery = db.query(func.count(models.Comment.id)).filter(models.Comment.post_id == models.Post.id).correlate(models.Post).scalar_subquery()
    repost_subquery = db.query(func.count(models.Repost.post_id)).filter(models.Repost.post_id == models.Post.id).correlate(models.Post).scalar_subquery()
    base = db.query(
        models.Post, 
        func.count(models.Vote.post_id).label("votes"),
        models.Post.id.in_(voted_subquery).label("has_voted"),
        models.Post.id.in_(reposted_subquery).label("has_reposted"),
        func.coalesce(comment_subquery, 0).label("comment_count"),
        func.coalesce(repost_subquery, 0).label("repost_count")
    ).join(
        models.Vote, models.Vote.post_id == models.Post.id, isouter=True
    )
    return base

def _format_results(results):
    return [{"Post": p, "votes": v, "has_voted": h, "has_reposted": hr, "comment_count": c, "repost_count": r} for p, v, h, hr, c, r in results]

@router.get("/",response_model=list[PostResponseWithVotes])
async def get_posts(db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user), limit: int = Query(10, ge=1, le=100), skip: int = Query(0, ge=0), search: Optional[str] = ""):
    user_id = user.id if user else -1
    results = _post_query_base(db, user_id).filter(
        models.Post.title.contains(search), models.Post.owner_id != user_id
    ).group_by(models.Post.id).limit(limit).offset(skip).all()
    return _format_results(results)

@router.get("/user/{user_id}", response_model=list[PostResponseWithVotes])
async def get_user_posts(user_id: int, db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user), limit: int = Query(50, ge=1, le=100), skip: int = Query(0, ge=0)):
    current_user_id = user.id if user else -1
    results = _post_query_base(db, current_user_id).filter(
        models.Post.owner_id == user_id
    ).group_by(models.Post.id).limit(limit).offset(skip).all()
    return _format_results(results)

@router.get("/liked/{user_id}", response_model=list[PostResponseWithVotes])
async def get_liked_posts(user_id: int, db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user)):
    current_user_id = user.id if user else -1
    liked_post_ids = db.query(models.Vote.post_id).filter(models.Vote.user_id == user_id).subquery()
    results = _post_query_base(db, current_user_id).filter(
        models.Post.id.in_(liked_post_ids)
    ).group_by(models.Post.id).all()
    return _format_results(results)

@router.get("/following", response_model=list[PostResponseWithVotes])
async def get_following_posts(db: Session = Depends(get_db), user: models.User = Depends(oauth2.get_current_user), limit: int = Query(10, ge=1, le=100), skip: int = Query(0, ge=0)):
    followed_ids = db.query(models.Follow.following_id).filter(models.Follow.follower_id == user.id).subquery()
    results = _post_query_base(db, user.id).filter(
        models.Post.owner_id.in_(followed_ids)
    ).group_by(models.Post.id).limit(limit).offset(skip).all()
    return _format_results(results)

@router.get("/{id}", response_model=PostResponseWithVotes)
async def get_post(id: int, db: Session = Depends(get_db), user: Optional[models.User] = Depends(oauth2.get_optional_user)):
    user_id = user.id if user else -1
    result = _post_query_base(db, user_id).filter(models.Post.id == id).group_by(models.Post.id).first()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Post with id:{id} not found!")
    p, v, h, hr, c, r = result
    return {"Post": p, "votes": v, "has_voted": h, "has_reposted": hr, "comment_count": c, "repost_count": r}

@router.post("/",status_code=status.HTTP_201_CREATED,response_model=PostResponse)
async def create_post(post:PostCreate,db:Session = Depends(get_db),user: int = Depends(oauth2.get_current_user)):
    new_post = models.Post(owner_id=user.id, **post.model_dump());
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.delete("/{id}",status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(id:int,db:Session=Depends(get_db),user: int = Depends(oauth2.get_current_user)):
    post_query = db.query(models.Post).filter(models.Post.id==id)
    post = post_query.first()
    if post == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Post with id: {id} not found!")
    if post.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Not authorized to perform the requested action")
    post_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
   
@router.put("/{id}",response_model=PostResponse)
async def update_post(id:int, post:PostCreate,db:Session=Depends(get_db),user:int = Depends(oauth2.get_current_user)):
    post_query = db.query(models.Post).filter(models.Post.id==id)
    db_post = post_query.first()
    if db_post == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Post with id: {id} not found!")
    if db_post.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Not authorized to perform the requested action")
    post_query.update(post.model_dump(),synchronize_session=False)
    db.commit()
    return post_query.first()
