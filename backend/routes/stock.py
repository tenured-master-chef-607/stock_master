from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
import json
import os

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

@stock_bp.route('/stock/search/<query>', methods=['GET'])
@cross_origin(supports_credentials=True)
def search_stock(query):
    try:
        print(f"Received search query: {query}")
        
        # 过滤匹配的股票
        results = []
        query = query.upper().strip()
        
        # 首先尝试精确匹配
        if query in STOCK_DATABASE:
            info = STOCK_DATABASE[query]
            results.append({
                "ticker": query,
                "name": info['name'],
                "exchange": info['exchange']
            })
            return jsonify(results)
        
        # 如果没有精确匹配，尝试部分匹配
        for ticker, info in STOCK_DATABASE.items():
            # 匹配 ticker
            if query in ticker:
                results.append({
                    "ticker": ticker,
                    "name": info['name'],
                    "exchange": info['exchange']
                })
                continue
            
            # 匹配公司名称（不区分大小写）
            if query.lower() in info['name'].lower():
                results.append({
                    "ticker": ticker,
                    "name": info['name'],
                    "exchange": info['exchange']
                })
        
        # 按照 ticker 长度排序，优先显示更短的 ticker
        results.sort(key=lambda x: len(x['ticker']))
        
        # 限制返回结果数量
        results = results[:10]
        
        print(f"Returning results: {results}")
        return jsonify(results)
        
    except Exception as e:
        print(f"Search error: {str(e)}")
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