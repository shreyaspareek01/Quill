from typing import Optional
from pydantic import EmailStr
from datetime import datetime
from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import conint

class UserCreate(BaseModel):
    email:EmailStr  
    password:str

class UserResponse(BaseModel):
    id:int 
    email:EmailStr
    created_at:datetime
    model_config = ConfigDict(from_attributes=True)
    
class UserLogin(BaseModel):
    email:EmailStr
    password:str

class PostBase(BaseModel):
    title:str
    content:str
    published:bool =  True
    model_config = ConfigDict(extra="forbid")

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id:int
    created_at:datetime
    owner_id:int
    owner:UserResponse
    model_config = ConfigDict(from_attributes=True)

class PostResponseWithVotes(BaseModel):
    Post:PostResponse
    votes: int
    has_voted: bool = False
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token:str
    token_type:str

class TokenData(BaseModel):
    id: Optional[int]=None

class Vote(BaseModel):
    post_id: int
    dir: conint(le=1,ge=0)