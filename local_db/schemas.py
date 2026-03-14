from pydantic import BaseModel, EmailStr

# Base properties for User
class UserBase(BaseModel):
    email: EmailStr
    name: str

# Inherits UserBase, used for creating a new user (requires password)
class UserCreate(UserBase):
    password: str

# Used for returning user data (hides password)
class UserOut(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True

# Used for login requests
class UserLogin(BaseModel):
    email: EmailStr
    password: str
