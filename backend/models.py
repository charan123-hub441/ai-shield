from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")        # "user" | "admin"
    full_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    profile_pic_url = Column(String, nullable=True)
    warn_count = Column(Integer, default=0)
    is_banned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="user")
    reports = relationship("Report", back_populates="reporter")
    flagged = relationship("FlaggedMessage", back_populates="flagged_by_user")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    label = Column(String)          # Safe | Offensive | Cyberbullying | Severe Harassment
    confidence = Column(Float)
    score = Column(Float)
    is_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="messages")
    flag_record = relationship("FlaggedMessage", back_populates="message", uselist=False)


class FlaggedMessage(Base):
    __tablename__ = "flagged_messages"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    flagged_by = Column(Integer, ForeignKey("users.id"))
    action = Column(String, default="pending")  # pending | warned | deleted | blocked
    created_at = Column(DateTime, default=datetime.utcnow)

    message = relationship("Message", back_populates="flag_record")
    flagged_by_user = relationship("User", back_populates="flagged")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    description = Column(Text, nullable=False)
    incident_type = Column(String, default="cyberbullying")
    status = Column(String, default="pending")   # pending | reviewed | resolved
    created_at = Column(DateTime, default=datetime.utcnow)

    reporter = relationship("User", back_populates="reports")


# ─── Social Feed ──────────────────────────────────────────────────────────────

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, default="")
    media_url = Column(String, nullable=True)       # path to uploaded image/video
    media_type = Column(String, nullable=True)       # "image" | "video" | None
    is_flagged = Column(Boolean, default=False)
    flag_label = Column(String, nullable=True)
    flag_score = Column(Float, nullable=True)
    flag_warning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")


class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="comments")
    user = relationship("User")


class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="likes")
    user = relationship("User")


# ─── Chat ─────────────────────────────────────────────────────────────────────

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("ConversationMember", back_populates="conversation", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ConversationMember(Base):
    __tablename__ = "conversation_members"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    conversation = relationship("Conversation", back_populates="members")
    user = relationship("User")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="chat_messages")
    sender = relationship("User")

