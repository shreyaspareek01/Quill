from ..schemas import UserCreate,UserUpdate,UserResponse
from sqlalchemy.orm import Session
from ..database import get_db 
from .. import models,utils,oauth2
from fastapi import status,APIRouter,Depends
from fastapi.exceptions import HTTPException

router = APIRouter(prefix="/users",tags=["Users"])

@router.post("/",status_code=status.HTTP_201_CREATED,response_model=UserResponse)
async def create_user(user:UserCreate,db:Session=Depends(get_db)):
    # Normalize email
    user.email = user.email.lower()
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"User with email {user.email} already exists")

    # Check if username is taken
    if user.username:
        existing_username = db.query(models.User).filter(models.User.username == user.username).first()
        if existing_username:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Username {user.username} is already taken")

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

@router.put("/{id}",status_code=status.HTTP_200_OK,response_model=UserResponse)
async def update_user(id: int, updates: UserUpdate, db: Session=Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    if current_user.id != id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this profile")
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    update_data = updates.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    if "username" in update_data:
        existing = db.query(models.User).filter(models.User.username == update_data["username"], models.User.id != id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Username {update_data['username']} is taken")
    db.query(models.User).filter(models.User.id == id).update(update_data, synchronize_session=False)
    db.commit()
    db.refresh(user)
    return user
