from ..database import get_db
from sqlalchemy.orm import Session
from fastapi import APIRouter,Depends,status
from fastapi.exceptions import HTTPException
from ..schemas import UserLogin,Token
from .. import models,utils,oauth2
from fastapi.security.oauth2 import OAuth2PasswordRequestForm

router = APIRouter(tags=['Auth'])

@router.post("/login",response_model=Token)
async def login(credentials:OAuth2PasswordRequestForm=Depends(),db:Session=Depends(get_db)):
    user = db.query(models.User).filter(models.User.email==credentials.username).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Invalid Credentials!")

    if not utils.verify(credentials.password,user.password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Invalid Credentials!")
    
    access_token = oauth2.create_access_token(data={"user_id":user.id})
    return {"access_token":access_token,"token_type":"bearer","user":user}