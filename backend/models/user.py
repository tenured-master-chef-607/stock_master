from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    """Model for user accounts"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    def to_dict(self):
        """Convert to dictionary representation (exclude password)"""
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "is_active": self.is_active,
            "is_superuser": self.is_superuser
        } 