from flask import Blueprint, jsonify, request
from services.stock_analyzer import StockAnalyzer
import logging
import yfinance as yf
import traceback

logger = logging.getLogger(__name__)

# Initialize services
stock_analyzer = StockAnalyzer()

# Create blueprint
analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/stock/<symbol>', methods=['GET'])
def analyze_stock(symbol):
    """Generate a daily analysis report for a stock"""
    try:
        logger.info(f"Generating analysis for {symbol}")
        report = stock_analyzer.generate_daily_report(symbol)
        return jsonify(report)
    except Exception as e:
        logger.error(f"Error analyzing stock {symbol}: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"Failed to analyze stock: {str(e)}"}), 500

@analysis_bp.route('/backtest/<symbol>', methods=['GET'])
def backtest_stock(symbol):
    """Perform backtest analysis for a stock"""
    try:
        # Get date parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({"error": "Missing start_date or end_date parameters"}), 400
            
        logger.info(f"Performing backtest for {symbol} from {start_date} to {end_date}")
        
        # Get historical data
        ticker = yf.Ticker(symbol)
        hist = ticker.history(start=start_date, end=end_date)
        
        if hist.empty:
            return jsonify({"error": "No historical data available for the given period"}), 404
        
        # Perform backtest analysis
        backtest_results = stock_analyzer.backtest(symbol, hist)
        
        return jsonify(backtest_results)
    except Exception as e:
        logger.error(f"Error backtesting {symbol}: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"Failed to perform backtest: {str(e)}"}), 500

@analysis_bp.route('/indicators/<symbol>', methods=['GET'])
def get_indicators(symbol):
    """Get technical indicators for a stock"""
    try:
        # Get timeframe parameter
        timeframe = request.args.get('timeframe', 'daily')
        period = request.args.get('period', '1y')
        
        logger.info(f"Getting indicators for {symbol} with timeframe {timeframe}")
        
        # Calculate indicators
        indicators = stock_analyzer.calculate_indicators(symbol, timeframe, period)
        
        return jsonify(indicators)
    except Exception as e:
        logger.error(f"Error calculating indicators for {symbol}: {str(e)}")
        return jsonify({"error": f"Failed to calculate indicators: {str(e)}"}), 500

@analysis_bp.route('/screening', methods=['POST'])
def screen_stocks():
    """Screen stocks based on criteria"""
    try:
        data = request.json
        
        if not data or 'criteria' not in data:
            return jsonify({"error": "Missing criteria"}), 400
            
        logger.info(f"Screening stocks with criteria: {data['criteria']}")
        
        # Get stock universe (either from request or default to some common stocks)
        universe = data.get('universe', [])
        if not universe:
            # Use watchlist stocks if no universe provided
            from routes.watchlist import load_watchlist
            watchlist = load_watchlist()
            for group in watchlist.values():
                universe.extend(group.get('stocks', []))
            universe = list(set(universe))  # Remove duplicates
        
        # Perform screening
        screening_results = stock_analyzer.screen_stocks(universe, data['criteria'])
        
        return jsonify({"results": screening_results})
    except Exception as e:
        logger.error(f"Error in stock screening: {str(e)}")
        return jsonify({"error": f"Failed to screen stocks: {str(e)}"}), 500 