from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

class StockBase(BaseModel):
    """Base Stock Schema"""
    symbol: str = Field(..., description="Stock symbol (e.g., AAPL)")
    
class StockCreate(StockBase):
    """Schema for stock creation"""
    name: Optional[str] = None
    
class StockUpdate(BaseModel):
    """Schema for stock update"""
    name: Optional[str] = None
    note: Optional[str] = None
    
class Stock(StockBase):
    """Schema for stock response"""
    id: int
    name: Optional[str] = None
    note: Optional[str] = None
    
    class Config:
        from_attributes = True

class StockAddToGroup(StockBase):
    """Schema for adding stock to group"""
    group: str = Field(default="默认分组", description="Group name to add stock to")

class StockNote(BaseModel):
    """Schema for stock note"""
    symbol: str
    note: str

class StockGroupBase(BaseModel):
    """Base Stock Group Schema"""
    name: str = Field(..., description="Group name")
    description: Optional[str] = None
    
class StockGroupCreate(StockGroupBase):
    """Schema for stock group creation"""
    parent_id: Optional[int] = None
    
class StockGroupUpdate(BaseModel):
    """Schema for stock group update"""
    name: Optional[str] = None
    description: Optional[str] = None
    
class StockGroup(StockGroupBase):
    """Schema for stock group response"""
    id: int
    stocks: List[str] = []
    subgroups: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True
        
class StockMove(BaseModel):
    """Schema for moving stock between groups"""
    symbol: str
    from_group: str
    to_group: str
    
class GroupMove(BaseModel):
    """Schema for moving group"""
    source_group: str
    target_group: str
    
class GroupRename(BaseModel):
    """Schema for renaming group"""
    old_path: str
    new_name: str
    
class GroupReorder(BaseModel):
    """Schema for reordering groups"""
    source_group: str
    target_group: str
    position: str = Field(..., description="Position: 'before' or 'after'")
    
class StockReorder(BaseModel):
    """Schema for reordering stocks within a group"""
    group: str
    source_symbol: str
    target_symbol: str
    position: str = Field(..., description="Position: 'before' or 'after'") 