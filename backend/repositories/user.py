from sqlalchemy.orm import Session
from typing import Optional
from .base import BaseRepository
from ..models.user import User
from ..schemas.user import UserCreate, UserUpdate

class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    """Repository for user operations"""
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Get user by email
        """
        return db.query(User).filter(User.email == email).first()
    
    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        """
        Get user by username
        """
        return db.query(User).filter(User.username == username).first()

# Create a singleton instance
user_repository = UserRepository(User) 