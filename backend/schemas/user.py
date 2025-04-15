from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class UserBase(BaseModel):
    """Base User Schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    """Schema for user creation"""
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    """Schema for user update"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=8)
    
class User(UserBase):
    """Schema for user response"""
    id: int
    is_active: bool
    is_superuser: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    """Schema for access token"""
    access_token: str
    token_type: str = "bearer"
    
class TokenData(BaseModel):
    """Schema for token data"""
    username: Optional[str] = None
    
class ChangePassword(BaseModel):
    """Schema for password change"""
    current_password: str
    new_password: str = Field(..., min_length=8) 