from sqlalchemy.orm import Session
from . import schemas,database,models
from datetime import datetime,timedelta
from jose import JWTError,jwt
from .config import settings
from fastapi import Depends,status
from fastapi.exceptions import HTTPException
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

SECRET_KEY = settings.jwt_secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

def create_access_token(data:dict):
    to_encode=data.copy()  
    expire = datetime.utcnow() +  timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp":expire})
    encoded_jwt = jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token:str,credentials_exception):
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        id = payload.get("user_id")

        if id is None:
            raise credentials_exception
        
        token_data = schemas.TokenData(id=id)
    except JWTError:
        raise credentials_exception
    return token_data

def get_current_user(token:str = Depends(oauth2_scheme),db: Session=Depends(database.get_db)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail=f"Could not validate credentials!",headers={"WWW-Authenticate":"Bearer"})
    token_data = verify_access_token(token,credentials_exception)
    user = db.query(models.User).filter(models.User.id==token_data.id).first()
    if user is None:
        raise credentials_exception
    return user

def get_optional_user(token:str = Depends(oauth2_scheme_optional),db: Session=Depends(database.get_db)):
    if token is None:
        return None
    try:
        token_data = verify_access_token(token, HTTPException(status_code=status.HTTP_401_UNAUTHORIZED))
        if token_data is None or token_data.id is None:
            return None
        return db.query(models.User).filter(models.User.id==token_data.id).first()
    except:
        return None