from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import List, Optional

# API Key Schemas
class APIKeyBase(BaseModel):
    name: str

class APIKeyName(BaseModel):
    name: str

class APIKeyCreate(APIKeyBase):
    pass

class APIKeyOut(BaseModel):
    id: int
    key: str
    name: Optional[str]
    user_id: int
    created_at: datetime
    expires_at: Optional[datetime]
    last_used: Optional[datetime]
    usage_count: int
    usage_limit: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

# Base properties for User
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None

# Inherits UserBase, used for creating a new user (requires password)
class UserCreate(UserBase):
    password: str

# History Schemas
class HistoryBase(BaseModel):
    disease_name: str
    confidence: int
    recommendation: str

class HistoryCreate(HistoryBase):
    user_id: int
    api_key_id: Optional[int] = None

class HistoryOut(HistoryBase):
    id: int
    user_id: int
    api_key_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Used for returning user data (hides password)
class UserOut(UserBase):
    id: int
    is_active: bool
    plan_type: str
    api_keys: List[APIKeyOut] = []
    history: List[HistoryOut] = []

    model_config = ConfigDict(from_attributes=True)

# Used for login requests
class UserLogin(BaseModel):
    email: EmailStr
    password: str
