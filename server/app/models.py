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
    username = Column(String, nullable=True, unique=True)
    full_name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True),server_default=text('NOW()'),nullable=False)

class Vote(Base):
    __tablename__ = 'votes'
    user_id = Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),primary_key=True)
    post_id = Column(Integer,ForeignKey("posts.id",ondelete="CASCADE"),primary_key=True)
    user = relationship("User")
    post = relationship("Post")

class Follow(Base):
    __tablename__ = 'follows'
    follower_id = Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),primary_key=True)
    following_id = Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True),server_default=text('NOW()'),nullable=False)

class Comment(Base):
    __tablename__ = 'comments'
    id = Column(Integer,primary_key=True,nullable=False)
    content = Column(String,nullable=False)
    post_id = Column(Integer,ForeignKey("posts.id",ondelete="CASCADE"),nullable=False)
    user_id = Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),server_default=text('NOW()'),nullable=False)
    post = relationship("Post")
    user = relationship("User")

class Bookmark(Base):
    __tablename__ = 'bookmarks'
    user_id = Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),primary_key=True)
    post_id = Column(Integer,ForeignKey("posts.id",ondelete="CASCADE"),primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True),server_default=text('NOW()'),nullable=False)

class Report(Base):
    __tablename__ = 'reports'
    id = Column(Integer, primary_key=True, nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'), nullable=False)
    post = relationship("Post")
    user = relationship("User")

class Repost(Base):
    __tablename__ = 'reposts'
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'), nullable=False)
    user = relationship("User")
    post = relationship("Post")