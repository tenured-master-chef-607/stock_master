from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
import json
import os
import logging
import yfinance as yf
from pathlib import Path

logger = logging.getLogger(__name__)

stock_bp = Blueprint('stock', __name__)

# 加载本地股票数据
def load_stock_data():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(current_dir, '..', 'data', 'us_stocks.json')
        with open(data_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading stock data: {str(e)}")
        return {}

# 加载观察列表数据
def load_watchlist():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        watchlist_path = os.path.join(current_dir, '..', 'data', 'watchlist.json')
        with open(watchlist_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading watchlist: {str(e)}")
        return {"默认分组": {"description": "默认分组", "stocks": []}}

# 保存观察列表数据
def save_watchlist(watchlist):
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        watchlist_path = os.path.join(current_dir, '..', 'data', 'watchlist.json')
        with open(watchlist_path, 'w') as f:
            json.dump(watchlist, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving watchlist: {str(e)}")
        return False

STOCK_DATABASE = load_stock_data()

# Load notes data
def load_notes():
    try:
        data_dir = Path(os.path.dirname(os.path.dirname(__file__))) / 'data'
        notes_file = data_dir / 'stock_notes.json'
        
        if not notes_file.exists():
            return {}
            
        with open(notes_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading notes: {str(e)}")
        return {}

# Save notes data
def save_notes(notes):
    try:
        data_dir = Path(os.path.dirname(os.path.dirname(__file__))) / 'data'
        data_dir.mkdir(exist_ok=True)
        notes_file = data_dir / 'stock_notes.json'
        
        with open(notes_file, 'w', encoding='utf-8') as f:
            json.dump(notes, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Error saving notes: {str(e)}")
        return False

@stock_bp.route('/watchlist/add', methods=['POST'])
@cross_origin(supports_credentials=True)
def add_to_watchlist():
    try:
        data = request.get_json()
        print(f"收到添加股票请求: {data}")
        
        symbol = data.get('symbol')
        group = data.get('group', '默认分组')
        
        if not symbol:
            print("错误：股票代码为空")
            return jsonify({"error": "股票代码不能为空"}), 400

        # 验证股票是否存在于本地数据库中
        print(f"验证股票 {symbol} 是否在数据库中")
        print(f"数据库中的股票: {list(STOCK_DATABASE.keys())}")
        
        if symbol not in STOCK_DATABASE:
            print(f"错误：股票 {symbol} 不在数据库中")
            return jsonify({"error": "无效的股票代码"}), 400
            
        # 加载当前的观察列表
        print("加载观察列表")
        watchlist = load_watchlist()
        print(f"当前观察列表: {watchlist}")
        
        # 确保分组存在
        if group not in watchlist:
            print(f"创建新分组: {group}")
            watchlist[group] = {
                "description": group,
                "stocks": [],
                "subGroups": {}
            }
        
        # 检查股票是否已经在观察列表中
        if symbol not in watchlist[group]["stocks"]:
            print(f"添加股票 {symbol} 到分组 {group}")
            watchlist[group]["stocks"].append(symbol)
            
            # 保存更新后的观察列表
            if save_watchlist(watchlist):
                print("观察列表保存成功")
                return jsonify({
                    "success": True,
                    "message": f"成功添加 {symbol} 到 {group}",
                    "groups": watchlist
                })
            else:
                print("错误：保存观察列表失败")
                return jsonify({"error": "保存观察列表失败"}), 500
        else:
            print(f"股票 {symbol} 已在观察列表中")
            return jsonify({
                "success": True,
                "message": f"股票 {symbol} 已在观察列表中",
                "groups": watchlist
            })
            
    except Exception as e:
        print(f"添加股票时发生错误: {str(e)}")
        return jsonify({"error": str(e)}), 500

@stock_bp.route('/search/<query>', methods=['GET'])
def search_stock(query):
    """Search for stocks by symbol or name"""
    try:
        logger.info(f"Searching for stock: {query}")
        
        # Use Yahoo Finance API for real-time search results
        search_url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
        
        import requests
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(search_url, headers=headers)
        data = response.json()
        
        # Format results
        results = []
        for item in data.get('quotes', [])[:10]:
            if item.get('quoteType') in ['EQUITY', 'ETF', 'CRYPTOCURRENCY']:
                results.append({
                    'symbol': item.get('symbol'),
                    'name': item.get('longname') or item.get('shortname'),
                    'exchange': item.get('exchange')
                })
                
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error searching for stock: {str(e)}")
        return jsonify({"error": str(e)}), 500

@stock_bp.route('/validate/<symbol>', methods=['GET'])
def validate_stock(symbol):
    """Validate if a stock symbol exists"""
    try:
        logger.info(f"Validating stock symbol: {symbol}")
        
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='1d')
        
        if hist.empty:
            return jsonify({"valid": False, "error": "Unable to get stock data"})
            
        info = ticker.info
        return jsonify({
            "valid": True,
            "name": info.get('longName', '') or info.get('shortName', ''),
            "price": hist['Close'][-1] if not hist.empty else 0
        })
    except Exception as e:
        logger.error(f"Error validating stock: {str(e)}")
        return jsonify({"valid": False, "error": str(e)})

@stock_bp.route('/note/<symbol>', methods=['GET'])
def get_stock_note(symbol):
    """Get the note for a specific stock"""
    try:
        logger.info(f"Getting note for stock: {symbol}")
        
        # Load notes
        notes = load_notes()
        
        # Return note if it exists, empty string otherwise
        return jsonify({
            "symbol": symbol,
            "note": notes.get(symbol, "")
        })
    except Exception as e:
        logger.error(f"Error getting note for stock {symbol}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@stock_bp.route('/note', methods=['POST'])
def update_stock_note():
    """Update the note for a stock"""
    try:
        data = request.json
        symbol = data.get('symbol')
        note = data.get('note', '')
        
        if not symbol:
            return jsonify({"error": "Symbol is required"}), 400
            
        logger.info(f"Updating note for stock: {symbol}")
        
        # Load current notes
        notes = load_notes()
        
        # Update note
        notes[symbol] = note
        
        # Save notes
        if save_notes(notes):
            return jsonify({
                "success": True,
                "message": f"Updated note for {symbol}",
                "symbol": symbol,
                "note": note
            })
        else:
            return jsonify({"error": "Failed to save note"}), 500
    except Exception as e:
        logger.error(f"Error updating note: {str(e)}")
        return jsonify({"error": str(e)}), 500

@stock_bp.route('/info/<symbol>', methods=['GET'])
def get_stock_info(symbol):
    """Get basic information about a stock"""
    try:
        logger.info(f"Getting info for stock: {symbol}")
        
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Extract key information
        return jsonify({
            "symbol": symbol,
            "name": info.get('longName', '') or info.get('shortName', ''),
            "sector": info.get('sector', ''),
            "industry": info.get('industry', ''),
            "country": info.get('country', ''),
            "website": info.get('website', ''),
            "summary": info.get('longBusinessSummary', ''),
            "logo": info.get('logo_url', ''),
            "market_cap": info.get('marketCap', 0),
            "pe_ratio": info.get('trailingPE', 0),
            "dividend_yield": info.get('dividendYield', 0),
            "price": info.get('currentPrice', 0),
            "price_change": info.get('regularMarketChangePercent', 0),
            "volume": info.get('regularMarketVolume', 0)
        })
    except Exception as e:
        logger.error(f"Error getting stock info for {symbol}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@stock_bp.route('/delete', methods=['DELETE'])
@cross_origin(supports_credentials=True)
def delete_stock():
    try:
        group = request.args.get('group')
        symbol = request.args.get('symbol')
        
        if not group or not symbol:
            return jsonify({"error": "分组和股票代码不能为空"}), 400
            
        # 加载当前的观察列表
        watchlist = load_watchlist()
        
        # 处理嵌套分组路径
        group_parts = group.split('/')
        current_group = watchlist
        
        # 遍历分组路径
        for i, part in enumerate(group_parts):
            if part not in current_group:
                return jsonify({"error": f"分组 {part} 不存在"}), 404
                
            if i == len(group_parts) - 1:  # 最后一个分组
                if symbol not in current_group[part]["stocks"]:
                    return jsonify({"error": f"股票 {symbol} 不在分组 {part} 中"}), 404
                    
                # 从分组中移除股票
                current_group[part]["stocks"].remove(symbol)
                
                # 如果分组为空且不是默认分组，则删除该分组
                if (part != "默认分组" and 
                    len(current_group[part]["stocks"]) == 0 and 
                    (not current_group[part].get("subGroups") or len(current_group[part]["subGroups"]) == 0)):
                    del current_group[part]
            else:
                current_group = current_group[part]["subGroups"]
        
        # 保存更改
        if save_watchlist(watchlist):
            return jsonify({
                "success": True,
                "message": f"已从 {group} 中删除 {symbol}",
                "groups": watchlist
            })
        else:
            return jsonify({"error": "保存观察列表失败"}), 500
            
    except Exception as e:
        print(f"删除股票失败: {str(e)}")
        return jsonify({"error": str(e)}), 500 