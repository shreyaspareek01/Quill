from typing import Optional
from pydantic import EmailStr
from datetime import datetime
from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import conint

class UserCreate(BaseModel):
    email:EmailStr  
    password:str
    username: Optional[str] = None
    full_name: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None

class UserResponse(BaseModel):
    id:int 
    email:EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    created_at:datetime
    model_config = ConfigDict(from_attributes=True)
    
class UserLogin(BaseModel):
    email:EmailStr
    password:str

class PostBase(BaseModel):
    title:str
    content:str
    image_url: Optional[str] = None
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
    has_reposted: bool = False
    comment_count: int = 0
    repost_count: int = 0
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token:str
    token_type:str
    user: UserResponse

class TokenData(BaseModel):
    id: Optional[int]=None

class Vote(BaseModel):
    post_id: int
    dir: conint(le=1,ge=0)

class CommentCreate(BaseModel):
    content: str
    post_id: int

class CommentResponse(BaseModel):
    id: int
    content: str
    post_id: int
    user_id: int
    user: UserResponse
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FollowResponse(BaseModel):
    follower_id: int
    following_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BookmarkResponse(BaseModel):
    post_id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReportCreate(BaseModel):
    post_id: int
    reason: Optional[str] = None

class RepostResponse(BaseModel):
    post_id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PostSummaryResponse(BaseModel):
    summary: str

class GenerateContentRequest(BaseModel):
    title: str

class GenerateContentResponse(BaseModel):
    content: str

class GenerateCoverResponse(BaseModel):
    image_url: str

class PolishTitleResponse(BaseModel):
    title: str