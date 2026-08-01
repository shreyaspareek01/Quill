from sqlalchemy import ForeignKey
from sqlalchemy import text as sql_text
from sqlalchemy import TIMESTAMP
from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import Column
from .database import Base
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector


class Post(Base):
    __tablename__ = 'posts'
    id = Column(Integer,primary_key=True,nullable=False)
    title = Column(String, nullable=False)
    content = Column(String,nullable=False)
    image_url = Column(String, nullable=True)
    published = Column( Boolean,server_default='True',nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),server_default=sql_text('NOW()'),nullable=False)
    owner_id = Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False)
    owner = relationship("User")
    embedding = Column(Vector(768), nullable=True)

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
    created_at = Column(TIMESTAMP(timezone=True),server_default=sql_text('NOW()'),nullable=False)

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
    created_at = Column(TIMESTAMP(timezone=True),server_default=sql_text('NOW()'),nullable=False)

class Comment(Base):
    __tablename__ = 'comments'
    id = Column(Integer,primary_key=True,nullable=False)
    content = Column(String,nullable=False)
    post_id = Column(Integer,ForeignKey("posts.id",ondelete="CASCADE"),nullable=False)
    user_id = Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),server_default=sql_text('NOW()'),nullable=False)
    post = relationship("Post")
    user = relationship("User")

class Bookmark(Base):
    __tablename__ = 'bookmarks'
    user_id = Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),primary_key=True)
    post_id = Column(Integer,ForeignKey("posts.id",ondelete="CASCADE"),primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True),server_default=sql_text('NOW()'),nullable=False)

class Report(Base):
    __tablename__ = 'reports'
    id = Column(Integer, primary_key=True, nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=sql_text('NOW()'), nullable=False)
    post = relationship("Post")
    user = relationship("User")

class Repost(Base):
    __tablename__ = 'reposts'
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=sql_text('NOW()'), nullable=False)
    user = relationship("User")
    post = relationship("Post")

class Notification(Base):
    __tablename__ = 'notifications'
    id         = Column(Integer, primary_key=True, nullable=False)
    # recipient — who receives the notification
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # actor — who triggered the action
    actor_id   = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # 'like' | 'follow' | 'comment' | 'repost'
    type       = Column(String, nullable=False)
    # optional — which post the action was on
    post_id    = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)
    read       = Column(Boolean, server_default='false', nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=sql_text('NOW()'), nullable=False)
    actor      = relationship("User", foreign_keys=[actor_id])
    post       = relationship("Post", foreign_keys=[post_id])

class PostView(Base):
    __tablename__ = 'post_views'
    id         = Column(Integer, primary_key=True, nullable=False)
    post_id    = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    read_pct   = Column(Integer, nullable=False, default=0) # 0 to 100
    created_at = Column(TIMESTAMP(timezone=True), server_default=sql_text('NOW()'), nullable=False)
    post       = relationship("Post")
    user       = relationship("User")

class PassageHighlight(Base):
    __tablename__ = 'passage_highlights'
    id         = Column(Integer, primary_key=True, nullable=False)
    post_id    = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    text       = Column(String, nullable=False)
    count      = Column(Integer, nullable=False, default=1)
    created_at = Column(TIMESTAMP(timezone=True), server_default=sql_text('NOW()'), nullable=False)
    post       = relationship("Post")