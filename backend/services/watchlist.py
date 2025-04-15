from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Dict, Any, List, Optional
import logging

from ..repositories.watchlist import stock_repository, stock_group_repository
from ..schemas.watchlist import StockCreate, StockAddToGroup, StockGroupCreate

logger = logging.getLogger(__name__)

class WatchlistService:
    """Service for watchlist operations"""
    
    def get_watchlist(self, db: Session) -> Dict[str, Any]:
        """
        Get all watchlist groups
        """
        return {"groups": stock_group_repository.build_group_tree(db)}
    
    def add_stock_to_watchlist(self, db: Session, stock_data: StockAddToGroup) -> Dict[str, Any]:
        """
        Add stock to watchlist group
        """
        try:
            # Get or create the stock
            stock = stock_repository.get_or_create(db, stock_data.symbol)
            
            # Get or create the group
            group = stock_group_repository.get_by_name(db, stock_data.group)
            if not group:
                group_data = StockGroupCreate(
                    name=stock_data.group,
                    description=stock_data.group
                )
                group = stock_group_repository.create(db, obj_in=group_data)
            
            # Add stock to group
            stock_group_repository.add_stock_to_group(db, group, stock)
            
            return {
                "success": True,
                "message": f"Successfully added {stock.symbol} to {group.name}",
                "groups": stock_group_repository.build_group_tree(db)
            }
            
        except Exception as e:
            logger.error(f"Error adding stock to watchlist: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add stock: {str(e)}"
            )
    
    def remove_stock_from_watchlist(self, db: Session, group_path: str, symbol: str) -> Dict[str, Any]:
        """
        Remove stock from watchlist group
        """
        try:
            # Get the stock
            stock = stock_repository.get_by_symbol(db, symbol)
            if not stock:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Stock {symbol} not found"
                )
            
            # Get the group by path
            group = stock_group_repository.get_by_path(db, group_path)
            if not group:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Group {group_path} not found"
                )
            
            # Remove stock from group
            stock_group_repository.remove_stock_from_group(db, group, stock)
            
            # Delete empty non-default groups
            if not group.stocks and not group.subgroups and group.name != "默认分组":
                stock_group_repository.delete(db, group.id)
            
            return {
                "success": True,
                "message": f"Successfully removed {symbol} from {group_path}",
                "groups": stock_group_repository.build_group_tree(db)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error removing stock from watchlist: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to remove stock: {str(e)}"
            )
    
    def add_group(self, db: Session, group_data: StockGroupCreate) -> Dict[str, Any]:
        """
        Add new group
        """
        try:
            # Check if group already exists
            existing_group = stock_group_repository.get_by_name(db, group_data.name)
            if existing_group:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Group {group_data.name} already exists"
                )
            
            # Create the group
            stock_group_repository.create(db, obj_in=group_data)
            
            return {
                "success": True,
                "message": f"Successfully created group {group_data.name}",
                "groups": stock_group_repository.build_group_tree(db)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error adding group: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add group: {str(e)}"
            )
    
    def delete_group(self, db: Session, group_path: str) -> Dict[str, Any]:
        """
        Delete group
        """
        try:
            # Get the group by path
            group = stock_group_repository.get_by_path(db, group_path)
            if not group:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Group {group_path} not found"
                )
            
            # Can't delete default group
            if group.name == "默认分组":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete default group"
                )
            
            # Delete the group
            stock_group_repository.delete(db, group.id)
            
            return {
                "success": True,
                "message": f"Successfully deleted group {group_path}",
                "groups": stock_group_repository.build_group_tree(db)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting group: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete group: {str(e)}"
            )

# Create a singleton instance
watchlist_service = WatchlistService() 