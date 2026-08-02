from ..database import get_db
from sqlalchemy.orm import Session
import httpx
from fastapi import APIRouter,Depends,status
from fastapi.exceptions import HTTPException
from ..schemas import UserLogin,Token,GoogleLoginRequest
from .. import models,utils,oauth2
from ..config import settings
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

@router.post("/login/google", response_model=Token)
async def login_google(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    credential = payload.credential
    email = None
    name = None
    avatar_url = None
    
    # Verify real token against Google API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}",
                timeout=10.0
            )
            if response.status_code == 200:
                user_info = response.json()
                aud = user_info.get("aud")
                if settings.google_client_id and aud != settings.google_client_id:
                    raise HTTPException(
                        status_code=400,
                        detail="Token audience mismatch"
                    )
                email = user_info.get("email")
                name = user_info.get("name")
                avatar_url = user_info.get("picture")
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid Google credential (status: {response.status_code})"
                )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Google token verification failed: {e}"
        )
            
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve email from Google credential"
        )
        
    # Check if user exists in database
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # Generate unique username
        base_username = email.split("@")[0]
        username = base_username
        counter = 1
        while db.query(models.User).filter(models.User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
            
        user = models.User(
            email=email,
            username=username,
            full_name=name,
            avatar_url=avatar_url,
            password=utils.hash(f"google_oauth_{email}") # Placeholder password
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token = oauth2.create_access_token(data={"user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": user}