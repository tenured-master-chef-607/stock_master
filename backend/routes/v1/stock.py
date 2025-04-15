from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from ...database import get_db
from ...services.auth import auth_service
from ...services.stock_analyzer import stock_analyzer_service
from ...schemas.watchlist import StockNote
from ...repositories.watchlist import stock_repository

router = APIRouter()

@router.get("/validate/{symbol}")
def validate_stock(symbol: str, db: Session = Depends(get_db)) -> Any:
    """
    Validate a stock symbol
    """
    try:
        # Use the analyzer service to get stock data
        report = stock_analyzer_service.generate_daily_report(symbol)
        return {
            "valid": True,
            "name": report["name"],
            "price": report["current_price"]
        }
    except HTTPException as e:
        if e.status_code == 404:  # Not found
            return {"valid": False, "error": "Stock not found"}
        else:
            return {"valid": False, "error": str(e.detail)}
    except Exception as e:
        return {"valid": False, "error": str(e)}

@router.get("/search/{query}")
def search_stocks(
    query: str,
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Search for stock symbols
    """
    try:
        # TODO: Implement a more robust stock search service
        # For now, just return some sample data
        if len(query) < 1:
            return []
            
        # Sample response for testing
        return [
            {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ"},
            {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ"},
            {"symbol": "AMZN", "name": "Amazon.com, Inc.", "exchange": "NASDAQ"},
            {"symbol": "GOOG", "name": "Alphabet Inc.", "exchange": "NASDAQ"},
            {"symbol": "META", "name": "Meta Platforms, Inc.", "exchange": "NASDAQ"},
        ]
    except Exception as e:
        # Return empty list instead of throwing an error
        return []

@router.get("/analysis/{symbol}")
def analyze_stock(
    symbol: str, 
    db: Session = Depends(get_db)
) -> Any:
    """
    Get stock analysis report
    """
    # Return mock data for testing
    return {
        "symbol": symbol,
        "name": f"{symbol} Corporation",
        "current_price": 157.85,
        "change_percent": 1.25,
        "volume": 35.2,
        "volatility_alert": "Normal volatility",
        "money_flow": "Slight inflow",
        "technical_signals": [
            "RSI neutral (54.3)",
            "MACD bullish crossover",
            "20-day MA support"
        ],
        "volume_alert": "Volume above average"
    }

@router.get("/backtest/{symbol}")
def backtest_stock(
    symbol: str,
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get stock backtest analysis
    """
    # Return mock data for testing
    return {
        "symbol": symbol,
        "start_date": start_date,
        "end_date": end_date,
        "performance": {
            "total_return": 12.5,
            "annualized_return": 8.7,
            "max_drawdown": -6.2,
            "sharpe_ratio": 1.4
        },
        "signals": [
            {"date": "2023-05-12", "signal": "Buy", "price": 142.30, "return": 5.2},
            {"date": "2023-06-15", "signal": "Sell", "price": 149.80, "return": 2.8},
            {"date": "2023-08-03", "signal": "Buy", "price": 144.25, "return": 4.5}
        ]
    }

@router.get("/note/{symbol}")
def get_stock_note(
    symbol: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get note for a stock
    """
    # Mock implementation for testing
    return {"note": f"This is a sample note for {symbol}. Add your analysis here."}

@router.post("/note")
def update_stock_note(
    note: StockNote,
    db: Session = Depends(get_db)
) -> Any:
    """
    Update note for a stock
    """
    # Mock implementation for testing
    return {"success": True, "message": f"Note updated for {note.symbol}"}

@router.get("/profile")
def get_profile(db: Session = Depends(get_db)) -> Any:
    """
    Get user profile data
    """
    # Return mock profile data for testing
    return {
        "username": "demo_user",
        "email": "demo@example.com",
        "settings": {
            "theme": "dark",
            "default_timeframe": "D",
            "enable_notifications": True
        }
    } 