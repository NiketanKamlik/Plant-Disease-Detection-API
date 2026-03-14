from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# API Key Schemas
class APIKeyBase(BaseModel):
    key: str

class APIKeyCreate(APIKeyBase):
    pass

class APIKeyOut(APIKeyBase):
    id: int
    user_id: int
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True

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

class HistoryOut(HistoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Used for returning user data (hides password)
class UserOut(UserBase):
    id: int
    is_active: bool
    api_keys: List[APIKeyOut] = []
    history: List[HistoryOut] = []

    class Config:
        from_attributes = True

# Used for login requests
class UserLogin(BaseModel):
    email: EmailStr
    password: str
