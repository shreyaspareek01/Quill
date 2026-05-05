from ..schemas import UserCreate,UserResponse
from sqlalchemy.orm import Session
from ..database import get_db 
from .. import models,utils
from fastapi import status,APIRouter,Depends
from fastapi.exceptions import HTTPException

router = APIRouter(prefix="/users",tags=["Users"])

@router.post("/",status_code=status.HTTP_201_CREATED,response_model=UserResponse)
async def create_user(user:UserCreate,db:Session=Depends(get_db)):
    hashed_password = utils.hash(user.password)
    user.password=hashed_password
    created_user=models.User(**user.model_dump())
    db.add(created_user)
    db.commit()
    db.refresh(created_user) 
    return created_user

@router.get("/",status_code=status.HTTP_200_OK,response_model=list[UserResponse])
async def get_users(db:Session=Depends(get_db)):
    users=db.query(models.User).all()
    return users

@router.get("/{id}",status_code=status.HTTP_200_OK,response_model=UserResponse) 
async def get_user_by_id(id: int, db: Session=Depends(get_db)):
    user = db.query(models.User).filter(models.User.id==id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"User with id {id} not found!")
    return user
