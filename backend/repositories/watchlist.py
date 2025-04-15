from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from .base import BaseRepository
from ..models.watchlist import Stock, StockGroup
from ..schemas.watchlist import StockCreate, StockUpdate, StockGroupCreate, StockGroupUpdate

class StockRepository(BaseRepository[Stock, StockCreate, StockUpdate]):
    """Repository for stock operations"""
    
    def get_by_symbol(self, db: Session, symbol: str) -> Optional[Stock]:
        """
        Get stock by symbol
        """
        return db.query(Stock).filter(Stock.symbol == symbol).first()
    
    def get_or_create(self, db: Session, symbol: str, name: Optional[str] = None) -> Stock:
        """
        Get existing stock or create a new one
        """
        stock = self.get_by_symbol(db, symbol)
        if not stock:
            stock_data = StockCreate(symbol=symbol, name=name)
            stock = self.create(db, obj_in=stock_data)
        return stock

class StockGroupRepository(BaseRepository[StockGroup, StockGroupCreate, StockGroupUpdate]):
    """Repository for stock group operations"""
    
    def get_by_name(self, db: Session, name: str) -> Optional[StockGroup]:
        """
        Get group by name
        """
        return db.query(StockGroup).filter(StockGroup.name == name).first()
    
    def get_default_group(self, db: Session) -> StockGroup:
        """
        Get default group, create if not exists
        """
        default_group = self.get_by_name(db, "默认分组")
        if not default_group:
            default_data = StockGroupCreate(
                name="默认分组",
                description="默认股票分组"
            )
            default_group = self.create(db, obj_in=default_data)
        return default_group
    
    def add_stock_to_group(self, db: Session, group: StockGroup, stock: Stock) -> StockGroup:
        """
        Add stock to group
        """
        if stock not in group.stocks:
            group.stocks.append(stock)
            db.add(group)
            db.commit()
            db.refresh(group)
        return group
    
    def remove_stock_from_group(self, db: Session, group: StockGroup, stock: Stock) -> StockGroup:
        """
        Remove stock from group
        """
        if stock in group.stocks:
            group.stocks.remove(stock)
            db.add(group)
            db.commit()
            db.refresh(group)
        return group
    
    def build_group_tree(self, db: Session) -> Dict[str, Any]:
        """
        Build hierarchical tree of groups
        """
        # Get all top-level groups (no parent)
        top_groups = db.query(StockGroup).filter(StockGroup.parent_id == None).all()
        
        result = {}
        for group in top_groups:
            result[group.name] = self._build_group_dict(group)
        
        return result
    
    def _build_group_dict(self, group: StockGroup) -> Dict[str, Any]:
        """
        Recursively build dictionary representation of group
        """
        group_dict = {
            "description": group.description,
            "stocks": [stock.symbol for stock in group.stocks],
            "subGroups": {}
        }
        
        for subgroup in group.subgroups:
            group_dict["subGroups"][subgroup.name] = self._build_group_dict(subgroup)
            
        return group_dict
    
    def get_by_path(self, db: Session, path: str) -> Optional[StockGroup]:
        """
        Get group by path (e.g. 'Parent/Child/Grandchild')
        """
        if not path:
            return None
            
        parts = path.split('/')
        current_group = None
        
        # Start with the first part (top-level group)
        top_group_name = parts[0]
        current_group = self.get_by_name(db, top_group_name)
        
        if not current_group or len(parts) == 1:
            return current_group
            
        # Traverse the path
        for i in range(1, len(parts)):
            found = False
            for subgroup in current_group.subgroups:
                if subgroup.name == parts[i]:
                    current_group = subgroup
                    found = True
                    break
            
            if not found:
                return None
                
        return current_group

# Create singleton instances
stock_repository = StockRepository(Stock)
stock_group_repository = StockGroupRepository(StockGroup) 