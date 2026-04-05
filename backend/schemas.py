from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    phone_number: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class LoginRequest(BaseModel):
    email: str
    password: str


# ─── Messages ────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: int
    content: str
    label: Optional[str]
    confidence: Optional[float]
    score: Optional[float]
    is_flagged: bool
    created_at: datetime
    username: Optional[str] = None

    model_config = {"from_attributes": True}


class AnalysisResult(BaseModel):
    label: str
    confidence: float
    score: float
    message_id: int
    content: str
    is_flagged: bool


# ─── Reports ─────────────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    description: str
    incident_type: Optional[str] = "cyberbullying"


class ReportOut(BaseModel):
    id: int
    description: str
    incident_type: str
    status: str
    created_at: datetime
    reporter_id: int

    model_config = {"from_attributes": True}


# ─── Moderation ──────────────────────────────────────────────────────────────

class FlaggedMessageOut(BaseModel):
    id: int
    message_id: int
    content: str
    username: str
    label: str
    score: float
    action: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ModerationAction(BaseModel):
    flagged_message_id: int
    action: str   # warned | deleted | blocked


# ─── Analytics ───────────────────────────────────────────────────────────────

class AnalyticsOut(BaseModel):
    total_messages: int
    safe_count: int
    offensive_count: int
    cyberbullying_count: int
    severe_count: int
    flagged_count: int
    total_reports: int
    pending_reports: int


# ─── Social Feed ─────────────────────────────────────────────────────────────

class CommentOut(BaseModel):
    id: int
    text: str
    username: str
    created_at: datetime
    model_config = {"from_attributes": True}


class PostOut(BaseModel):
    id: int
    content: str
    media_url: Optional[str]
    media_type: Optional[str]
    username: str
    like_count: int
    liked_by_me: bool
    is_flagged: bool = False
    flag_label: Optional[str] = None
    flag_score: Optional[float] = None
    flag_warning: Optional[str] = None
    comments: list[CommentOut] = []
    created_at: datetime
    model_config = {"from_attributes": True}


class UserProfileOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_pic_url: Optional[str] = None
    warn_count: int
    is_banned: bool
    post_count: int = 0
    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_pic_url: Optional[str] = None


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class CommentCreate(BaseModel):
    text: str


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatMessageOut(BaseModel):
    id: int
    sender_id: int
    sender_username: str
    text: str
    created_at: datetime
    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    other_user: str
    other_user_id: int
    last_message: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    username: str       # username of the person to chat with


# ─── Users listing & Social ───────────────────────────────────────────────────

class UserBasic(BaseModel):
    id: int
    username: str
    profile_pic_url: Optional[str] = None
    model_config = {"from_attributes": True}

class UserSearchResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    profile_pic_url: Optional[str] = None
    model_config = {"from_attributes": True}

class UserPublicProfile(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_pic_url: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False
    follow_status: str = "none"
    model_config = {"from_attributes": True}

class FollowRequestResponse(BaseModel):
    id: int
    follower_id: int
    follower_username: str
    follower_profile_pic_url: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Reels ───────────────────────────────────────────────────────────────────

class ReelCommentOut(BaseModel):
    id: int
    text: str
    username: str
    created_at: datetime
    model_config = {"from_attributes": True}


class ReelOut(BaseModel):
    id: int
    caption: str
    video_url: str
    thumbnail_url: Optional[str] = None
    username: str
    profile_pic_url: Optional[str] = None
    view_count: int = 0
    like_count: int = 0
    liked_by_me: bool = False
    comment_count: int = 0
    comments: list[ReelCommentOut] = []
    is_flagged: bool = False
    flag_label: Optional[str] = None
    flag_score: Optional[float] = None
    flag_warning: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class ReelCommentCreate(BaseModel):
    text: str

