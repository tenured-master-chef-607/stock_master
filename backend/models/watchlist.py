from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from backend.database import Base

# Association table for many-to-many relationship between StockGroup and Stock
group_stock_association = Table(
    'group_stock_association',
    Base.metadata,
    Column('group_id', Integer, ForeignKey('stock_groups.id')),
    Column('stock_id', Integer, ForeignKey('stocks.id'))
)

class StockGroup(Base):
    """Model for stock groups (watchlists)"""
    __tablename__ = "stock_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    parent_id = Column(Integer, ForeignKey('stock_groups.id'), nullable=True)
    
    # Relationships
    stocks = relationship("Stock", secondary=group_stock_association, back_populates="groups")
    subgroups = relationship("StockGroup", back_populates="parent", cascade="all, delete-orphan")
    parent = relationship("StockGroup", back_populates="subgroups", remote_side=[id])
    
    def to_dict(self):
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "stocks": [stock.symbol for stock in self.stocks],
            "subgroups": {group.name: group.to_dict() for group in self.subgroups}
        }

class Stock(Base):
    """Model for stocks"""
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    note = Column(String, nullable=True)
    
    # Relationships
    groups = relationship("StockGroup", secondary=group_stock_association, back_populates="stocks")
    
    def to_dict(self):
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "symbol": self.symbol,
            "name": self.name,
            "note": self.note
        } 