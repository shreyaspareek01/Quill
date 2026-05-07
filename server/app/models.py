from sqlalchemy import ForeignKey
from sqlalchemy import text
from sqlalchemy import TIMESTAMP
from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import Column
from .database import Base
from sqlalchemy.orm import relationship

class Post(Base):
    __tablename__ = 'posts'
    id = Column(Integer,primary_key=True,nullable=False)
    title = Column(String, nullable=False)
    content = Column(String,nullable=False)
    image_url = Column(String, nullable=True)
    published = Column( Boolean,server_default='True',nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),server_default=text('NOW()'),nullable=False)
    owner_id = Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False)
    owner = relationship("User")

class User(Base):
    __tablename__  = 'users'

    id = Column(Integer,primary_key=True,nullable=False)
    email = Column(String, nullable=False,unique=True)
    password = Column(String,nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),server_default=text('NOW()'),nullable=False)

class Vote(Base):
    __tablename__ = 'votes'
    user_id = Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),primary_key=True)
    post_id = Column(Integer,ForeignKey("posts.id",ondelete="CASCADE"),primary_key=True)
    user = relationship("User")
    post = relationship("Post")