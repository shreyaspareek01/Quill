from sqlalchemy import func
from ..schemas import PostCreate, PostResponse, PostResponseWithVotes
from sqlalchemy.orm import Session
from ..database import get_db 
from .. import models,oauth2
from fastapi import status,Response,APIRouter,Depends
from fastapi.exceptions import HTTPException
from typing import Optional
 
router = APIRouter(prefix="/posts",tags=["Posts"])

@router.get("/",response_model=list[PostResponseWithVotes])
async def get_posts(db: Session = Depends(get_db),user: int = Depends(oauth2.get_current_user),limit:int=10,skip:int=0,search:Optional[str]=""):
    # cursor.execute("""SELECT * FROM posts""")
    # posts = cursor.fetchall()
    result = db.query(models.Post,func.count(models.Vote.post_id).label("votes")).join(models.Vote,models.Vote.post_id==models.Post.id,isouter=True).group_by(models.Post.id).filter(models.Post.title.contains(search)).limit(limit).offset(skip).all()
    return result 

@router.get("/{id}",response_model=PostResponseWithVotes)
async def get_post(id:int,db:Session = Depends(get_db),user: int = Depends(oauth2.get_current_user)):
    # cursor.execute("""SELECT * FROM posts WHERE id=%s """,(id,))
    # post = cursor.fetchone()
    post = db.query(models.Post,func.count(models.Vote.post_id).label("votes")).join(models.Vote,models.Vote.post_id==models.Post.id,isouter=True).group_by(models.Post.id).filter(models.Post.id==id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Post with id:{id} not found!")
    return post

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
        
    db_post.update(post.model_dump(),synchronize_session=False)
    db.commit()
    return db_post