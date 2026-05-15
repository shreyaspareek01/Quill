from sqlalchemy import func
from ..schemas import PostCreate, PostResponse, PostResponseWithVotes
from sqlalchemy.orm import Session
from ..database import get_db 
from .. import models,oauth2
from fastapi import status,Response,APIRouter,Depends,Query
from fastapi.exceptions import HTTPException
from typing import Optional

router = APIRouter(prefix="/posts",tags=["Posts"])

@router.get("/",response_model=list[PostResponseWithVotes])
async def get_posts(db: Session = Depends(get_db),user: Optional[models.User] = Depends(oauth2.get_optional_user),limit:int=Query(10, ge=1, le=100),skip:int=Query(0, ge=0),search:Optional[str]=""):
    user_id = user.id if user else -1
    voted_subquery = db.query(models.Vote.post_id).filter(models.Vote.user_id == user_id).subquery()
    comment_subquery = db.query(models.Comment.post_id, func.count(models.Comment.id).label("cnt")).group_by(models.Comment.post_id).subquery()
    
    results = db.query(
        models.Post, 
        func.count(models.Vote.post_id).label("votes"),
        models.Post.id.in_(voted_subquery).label("has_voted"),
        func.coalesce(comment_subquery.c.cnt, 0).label("comment_count")
    ).join(
        models.Vote, models.Vote.post_id == models.Post.id, isouter=True
    ).join(
        comment_subquery, comment_subquery.c.post_id == models.Post.id, isouter=True
    ).group_by(models.Post.id, comment_subquery.c.cnt).filter(models.Post.title.contains(search)).limit(limit).offset(skip).all()
    
    return [{"Post": post, "votes": votes, "has_voted": has_voted, "comment_count": cc} for post, votes, has_voted, cc in results]

@router.get("/following",response_model=list[PostResponseWithVotes])
async def get_following_posts(db: Session = Depends(get_db),user: models.User = Depends(oauth2.get_current_user),limit:int=Query(10, ge=1, le=100),skip:int=Query(0, ge=0)):
    followed_ids = db.query(models.Follow.following_id).filter(models.Follow.follower_id == user.id).subquery()
    voted_subquery = db.query(models.Vote.post_id).filter(models.Vote.user_id == user.id).subquery()
    comment_subquery = db.query(models.Comment.post_id, func.count(models.Comment.id).label("cnt")).group_by(models.Comment.post_id).subquery()
    
    results = db.query(
        models.Post, 
        func.count(models.Vote.post_id).label("votes"),
        models.Post.id.in_(voted_subquery).label("has_voted"),
        func.coalesce(comment_subquery.c.cnt, 0).label("comment_count")
    ).join(
        models.Vote, models.Vote.post_id == models.Post.id, isouter=True
    ).join(
        comment_subquery, comment_subquery.c.post_id == models.Post.id, isouter=True
    ).filter(models.Post.owner_id.in_(followed_ids)).group_by(models.Post.id, comment_subquery.c.cnt).limit(limit).offset(skip).all()
    
    return [{"Post": post, "votes": votes, "has_voted": has_voted, "comment_count": cc} for post, votes, has_voted, cc in results]

@router.get("/{id}",response_model=PostResponseWithVotes)
async def get_post(id:int,db:Session = Depends(get_db),user: Optional[models.User] = Depends(oauth2.get_optional_user)):
    user_id = user.id if user else -1
    voted_subquery = db.query(models.Vote.post_id).filter(models.Vote.user_id == user_id).subquery()
    comment_subquery = db.query(models.Comment.post_id, func.count(models.Comment.id).label("cnt")).group_by(models.Comment.post_id).subquery()
    
    result = db.query(
        models.Post, 
        func.count(models.Vote.post_id).label("votes"),
        models.Post.id.in_(voted_subquery).label("has_voted"),
        func.coalesce(comment_subquery.c.cnt, 0).label("comment_count")
    ).join(
        models.Vote, models.Vote.post_id == models.Post.id, isouter=True
    ).join(
        comment_subquery, comment_subquery.c.post_id == models.Post.id, isouter=True
    ).group_by(models.Post.id, comment_subquery.c.cnt).filter(models.Post.id==id).first()
    
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Post with id:{id} not found!")
    
    post, votes, has_voted, comment_count = result
    return {"Post": post, "votes": votes, "has_voted": has_voted, "comment_count": comment_count}

@router.post("/",status_code=status.HTTP_201_CREATED,response_model=PostResponse)
async def create_post(post:PostCreate,db:Session = Depends(get_db),user: int = Depends(oauth2.get_current_user)):
    # cursor.execute("""INSERT INTO posts (title,content,published) VALUES (%s,%s,%s) RETURNING *""",(post.title,post.content,post.published))
    # created_post=cursor.fetchone()
    # conn.commit()
    new_post = models.Post(owner_id=user.id, **post.model_dump());
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.delete("/{id}",status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(id:int,db:Session=Depends(get_db),user: int = Depends(oauth2.get_current_user)):
    # cursor.execute("""DELETE FROM posts WHERE id = %s RETURNING *""",(id,))
    # deleted_post = cursor.fetchone()
    post_query = db.query(models.Post).filter(models.Post.id==id)
    post = post_query.first()

    if post == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Post with id: {id} not found!")

    if post.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Not authorized to perform the requested action")
    # conn.commit()
    post_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
   
@router.put("/{id}",response_model=PostResponse)
async def update_post(id:int, post:PostCreate,db:Session=Depends(get_db),user:int = Depends(oauth2.get_current_user)):
    # cursor.execute("""UPDATE posts SET title=%s,content=%s,published=%s WHERE id=%s RETURNING *""",(post.title,post.content,post.published,id,))
    # updated_post=cursor.fetchone()

    post_query = db.query(models.Post).filter(models.Post.id==id)
    db_post = post_query.first()
    if db_post == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Post with id: {id} not found!")
    # conn.commit()
    if db_post.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Not authorized to perform the requested action")
        
    post_query.update(post.model_dump(),synchronize_session=False)
    db.commit()
    return post_query.first()