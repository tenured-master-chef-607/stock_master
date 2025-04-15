from typing import Generic, TypeVar, Type, Any, Optional, List, Union, Dict
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.encoders import jsonable_encoder
from sqlalchemy.exc import IntegrityError
from ..database import Base

# Define type variable for SQLAlchemy model
ModelType = TypeVar("ModelType", bound=Base)
# Define type variable for Pydantic schema used for creating
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
# Define type variable for Pydantic schema used for updating
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Base repository with common CRUD operations
    """
    def __init__(self, model: Type[ModelType]):
        """
        Initialize repository with model class
        """
        self.model = model
    
    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Get record by ID
        """
        return db.query(self.model).filter(self.model.id == id).first()
    
    def get_by(self, db: Session, **kwargs) -> Optional[ModelType]:
        """
        Get record by arbitrary field values
        """
        query = db.query(self.model)
        for key, value in kwargs.items():
            query = query.filter(getattr(self.model, key) == value)
        return query.first()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """
        Get all records with pagination
        """
        return db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, db: Session, obj_in: CreateSchemaType) -> ModelType:
        """
        Create a new record
        """
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)  # type: ignore
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            db.rollback()
            raise e
    
    def update(self, db: Session, db_obj: ModelType, obj_in: Union[UpdateSchemaType, Dict[str, Any]]) -> ModelType:
        """
        Update a record
        """
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
            
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
                
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            db.rollback()
            raise e
    
    def delete(self, db: Session, id: Any) -> ModelType:
        """
        Delete a record by ID
        """
        obj = db.query(self.model).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj 