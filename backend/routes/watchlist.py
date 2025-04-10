from flask import Blueprint, request, jsonify
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import logging
import json
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# Create blueprint
watchlist_bp = Blueprint('watchlist', __name__)

# Models
class StockAdd(BaseModel):
    symbol: str
    group: Optional[str] = "Default Group"

class StockMove(BaseModel):
    symbol: str
    from_group: str
    to_group: str

class GroupMove(BaseModel):
    source_group: str
    target_group: str

class GroupRename(BaseModel):
    old_path: str
    new_name: str

class GroupReorder(BaseModel):
    source_group: str
    target_group: str
    position: str  # 'before' or 'after'

class StockReorder(BaseModel):
    group: str
    source_symbol: str
    target_symbol: str
    position: str  # 'before' or 'after'

# Data file setup
data_dir = Path(os.path.dirname(os.path.dirname(__file__))) / 'data'
data_dir.mkdir(exist_ok=True)
watchlist_file = data_dir / 'watchlist.json'

def load_watchlist():
    """Load the watchlist from the JSON file"""
    try:
        if not watchlist_file.exists():
            initial_data = {
                "Default Group": {
                    "description": "Default Group",
                    "stocks": ["AAPL", "MSFT", "GOOG", "AMZN", "TSLA"]
                },
                "Tech Stocks": {
                    "description": "Technology sector stocks",
                    "stocks": ["AAPL", "MSFT", "GOOG"]
                },
                "Crypto Related": {
                    "description": "Cryptocurrency related stocks",
                    "stocks": ["COIN", "MARA", "RIOT"]
                }
            }
            watchlist_file.write_text(json.dumps(initial_data, ensure_ascii=False, indent=2))
            return initial_data
            
        content = watchlist_file.read_text(encoding='utf-8')
        data = json.loads(content)
        if isinstance(data, list):
            # Auto-convert from array format to group format
            logger.warning("Array format watchlist detected, auto-converting to Default Group")
            return {
                "Default Group": {
                    "description": "Auto-generated Default Group",
                    "stocks": [item["symbol"] for item in data]
                }
            }
        return data
    except Exception as e:
        logger.error(f"Error loading watchlist: {str(e)}")
        return {}

def save_watchlist(data):
    """Save watchlist data to file"""
    try:
        watchlist_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    except Exception as e:
        logger.error(f"Error saving watchlist: {str(e)}")
        raise

# Global watchlist data
STOCK_GROUPS = load_watchlist()

@watchlist_bp.route('', methods=['GET'])
def get_watchlist():
    """Get the entire watchlist with all groups"""
    try:
        # Reload from file each time to ensure latest data
        current_watchlist = load_watchlist()
        global STOCK_GROUPS
        STOCK_GROUPS = current_watchlist
        return jsonify({"groups": STOCK_GROUPS})
    except Exception as e:
        logger.error(f"Error getting watchlist: {str(e)}")
        return jsonify({"error": str(e)}), 500

@watchlist_bp.route('/add', methods=['POST'])
def add_to_watchlist():
    """Add a stock to a watchlist group"""
    try:
        data = request.json
        stock = StockAdd(**data)
        
        # Reload latest watchlist
        current_watchlist = load_watchlist()
        
        # Ensure group exists
        if stock.group not in current_watchlist:
            current_watchlist[stock.group] = {
                "description": stock.group,
                "stocks": [],
                "subGroups": {}
            }
        
        # Check if stock already in group
        if stock.symbol not in current_watchlist[stock.group]["stocks"]:
            current_watchlist[stock.group]["stocks"].append(stock.symbol)
            
            # Save changes
            save_watchlist(current_watchlist)
            
            # Update global variable
            global STOCK_GROUPS
            STOCK_GROUPS = current_watchlist.copy()
            
            return jsonify({
                "success": True,
                "message": f"Added {stock.symbol} to {stock.group}",
                "groups": current_watchlist
            })
        else:
            return jsonify({
                "success": True,
                "message": f"Stock {stock.symbol} already in {stock.group}",
                "groups": current_watchlist
            })
            
    except Exception as e:
        logger.error(f"Error adding stock to watchlist: {str(e)}")
        return jsonify({"error": str(e)}), 500

@watchlist_bp.route('/<path:group>/<symbol>', methods=['DELETE'])
def remove_stock(group, symbol):
    """Remove a stock from a watchlist group"""
    try:
        # Load current watchlist
        watchlist = load_watchlist()
        
        # Handle nested group paths
        group_parts = group.split('/')
        current_group = watchlist
        
        # Navigate through group path
        for i, part in enumerate(group_parts[:-1]):
            if part not in current_group:
                return jsonify({"error": f"Group {part} does not exist"}), 404
            if "subGroups" not in current_group[part]:
                current_group[part]["subGroups"] = {}
            current_group = current_group[part]["subGroups"]
        
        # Handle last part of group
        last_part = group_parts[-1]
        if last_part not in current_group:
            return jsonify({"error": f"Group {last_part} does not exist"}), 404
        
        if "stocks" not in current_group[last_part]:
            current_group[last_part]["stocks"] = []
        
        if symbol not in current_group[last_part]["stocks"]:
            return jsonify({"error": f"Stock {symbol} not in group {last_part}"}), 404
        
        # Remove stock from group
        current_group[last_part]["stocks"].remove(symbol)
        
        # If group is empty and not default, delete it
        if (last_part != "Default Group" and 
            len(current_group[last_part]["stocks"]) == 0 and 
            (not current_group[last_part].get("subGroups") or 
             len(current_group[last_part]["subGroups"]) == 0)):
            del current_group[last_part]
        
        # Save changes
        save_watchlist(watchlist)
        
        return jsonify({
            "success": True,
            "message": f"Removed {symbol} from {group}",
            "groups": watchlist
        })
        
    except Exception as e:
        logger.error(f"Error removing stock: {str(e)}")
        return jsonify({"error": str(e)}), 500

@watchlist_bp.route('/move', methods=['POST'])
def move_stock():
    """Move a stock from one group to another"""
    try:
        data = request.json
        move = StockMove(**data)
        
        # Load current watchlist
        current_watchlist = load_watchlist()
        
        # Find stock in source group
        source_found = False
        for group_name, group_data in current_watchlist.items():
            if group_name == move.from_group and move.symbol in group_data["stocks"]:
                # Remove from source group
                group_data["stocks"].remove(move.symbol)
                source_found = True
                break
                
        if not source_found:
            return jsonify({"error": f"Stock {move.symbol} not found in {move.from_group}"}), 404
            
        # Add to target group
        if move.to_group not in current_watchlist:
            current_watchlist[move.to_group] = {
                "description": move.to_group,
                "stocks": [],
                "subGroups": {}
            }
            
        if move.symbol not in current_watchlist[move.to_group]["stocks"]:
            current_watchlist[move.to_group]["stocks"].append(move.symbol)
            
        # Save changes
        save_watchlist(current_watchlist)
        
        return jsonify({
            "success": True,
            "message": f"Moved {move.symbol} from {move.from_group} to {move.to_group}",
            "groups": current_watchlist
        })
        
    except Exception as e:
        logger.error(f"Error moving stock: {str(e)}")
        return jsonify({"error": str(e)}), 500

@watchlist_bp.route('/reorder', methods=['POST'])
def reorder_stocks():
    """Reorder stocks within a group"""
    try:
        data = request.json
        reorder = StockReorder(**data)
        
        # Load current watchlist
        current_watchlist = load_watchlist()
        
        # Find the correct group based on the path
        group_parts = reorder.group.split('/')
        current_level = current_watchlist
        
        for i, part in enumerate(group_parts):
            if i < len(group_parts) - 1:
                if part not in current_level or "subGroups" not in current_level[part]:
                    return jsonify({"error": f"Group path {reorder.group} not found"}), 404
                current_level = current_level[part]["subGroups"]
            else:
                if part not in current_level:
                    return jsonify({"error": f"Group {part} not found"}), 404
                target_group = current_level[part]
                
        # Check that both symbols exist in the group
        if reorder.source_symbol not in target_group["stocks"]:
            return jsonify({"error": f"Source symbol {reorder.source_symbol} not found in group"}), 404
            
        if reorder.target_symbol not in target_group["stocks"]:
            return jsonify({"error": f"Target symbol {reorder.target_symbol} not found in group"}), 404
            
        # Remove source symbol from current position
        target_group["stocks"].remove(reorder.source_symbol)
        
        # Find target position
        target_index = target_group["stocks"].index(reorder.target_symbol)
        
        # Insert at appropriate position
        if reorder.position == "after":
            target_group["stocks"].insert(target_index + 1, reorder.source_symbol)
        else:  # "before"
            target_group["stocks"].insert(target_index, reorder.source_symbol)
            
        # Save changes
        save_watchlist(current_watchlist)
        
        return jsonify({
            "success": True,
            "message": f"Reordered {reorder.source_symbol} {reorder.position} {reorder.target_symbol}",
            "groups": current_watchlist
        })
        
    except Exception as e:
        logger.error(f"Error reordering stocks: {str(e)}")
        return jsonify({"error": str(e)}), 500 