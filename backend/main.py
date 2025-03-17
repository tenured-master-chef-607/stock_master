from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from services.stock_monitor import StockMonitor
from services.alert_service import AlertService
from services.stock_scanner import StockScanner
from services.stock_analyzer import StockAnalyzer
import logging
import sys
from pydantic import BaseModel
from typing import Optional, List, Dict
import yfinance as yf
import requests
import time
import json
import os
from pathlib import Path
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import urllib.parse

# 设置更详细的日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stock Monitor API", debug=True)

# 更新 CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 明确指定前端域名
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加错误处理
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": str(exc.detail)}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)}
    )

# 初始化服务
# stock_monitor = StockMonitor()
# alert_service = AlertService()
# stock_scanner = StockScanner()
stock_analyzer = StockAnalyzer()

# 创建数据目录
data_dir = Path(__file__).parent / 'data'
data_dir.mkdir(exist_ok=True)
watchlist_file = data_dir / 'watchlist.json'

# 初始化数据
if not watchlist_file.exists():
    initial_data = {
        "默认分组": {
            "description": "默认分组",
            "stocks": ["NVDA", "TSLA", "MARA", "RIOT", "COIN"]
        },
        "科技股": {
            "description": "科技类股票",
            "stocks": ["NVDA", "TSLA"]
        },
        "加密货币相关": {
            "description": "加密货币相关股票",
            "stocks": ["MARA", "RIOT", "COIN"]
        }
    }
    watchlist_file.write_text(json.dumps(initial_data, ensure_ascii=False, indent=2))

def load_watchlist():
    """从文件加载观察列表"""
    try:
        content = watchlist_file.read_text(encoding='utf-8')
        data = json.loads(content)
        if isinstance(data, list):
            # 如果是数组格式，自动转换为分组
            logger.warning("检测到数组格式的 watchlist，自动包装为默认分组")
            return {
                "默认分组": {
                    "description": "自动生成默认分组",
                    "stocks": [item["symbol"] for item in data]
                }
            }
        return data
    except Exception as e:
        logger.error(f"Error loading watchlist: {str(e)}")
        return {}


def save_watchlist(data):
    """保存观察列表到文件"""
    try:
        watchlist_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    except Exception as e:
        logger.error(f"Error saving watchlist: {str(e)}")
        raise

# 修改全局变量
STOCK_GROUPS = load_watchlist()

class StockAdd(BaseModel):
    symbol: str
    group: Optional[str] = "默认分组"

@app.post("/api/watchlist/add")
async def add_to_watchlist(stock: StockAdd, request: Request):
    try:
        # 记录接收到的原始请求数据
        raw_data = await request.json()
        logger.info(f"Received raw request data: {raw_data}")
        logger.info(f"Parsed stock data: {stock}")
        logger.info(f"Adding stock {stock.symbol} to group {stock.group}")
        
        # 每次添加股票前都重新加载最新的 watchlist 数据
        current_watchlist = load_watchlist()
        
        # 确保分组存在
        if stock.group not in current_watchlist:
            logger.info(f"Creating new group {stock.group}")
            current_watchlist[stock.group] = {
                "description": stock.group,
                "stocks": [],
                "subGroups": {}
            }
        
        # 检查股票是否已在分组中
        if stock.symbol not in current_watchlist[stock.group]["stocks"]:
            current_watchlist[stock.group]["stocks"].append(stock.symbol)
            logger.info(f"Added {stock.symbol} to {stock.group}")
            
            # 保存更改
            save_watchlist(current_watchlist)
            
            # 更新全局变量
            global STOCK_GROUPS
            STOCK_GROUPS = current_watchlist.copy()  # 使用 copy 来避免引用问题
            
            return {
                "success": True,
                "message": f"成功添加 {stock.symbol} 到 {stock.group}",
                "groups": current_watchlist
            }
        else:
            logger.info(f"Stock {stock.symbol} already in group {stock.group}")
            return {
                "success": True,
                "message": f"股票 {stock.symbol} 已在 {stock.group} 中",
                "groups": current_watchlist
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding stock to watchlist: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class StockGroup(BaseModel):
    name: str
    description: Optional[str] = None

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

# 添加新的 Pydantic 模型用于备注
class StockNote(BaseModel):
    symbol: str
    note: str

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up FastAPI application")

@app.get("/", status_code=200)
async def root():
    logger.info("Handling root endpoint request")
    try:
        response = {"message": "Welcome to Stock Monitor API"}
        logger.info(f"Returning response: {response}")
        return response
    except Exception as e:
        logger.error(f"Error in root endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/watchlist")
async def get_watchlist():
    logger.info("Fetching watchlist")
    try:
        # 每次获取 watchlist 时都重新从文件加载
        current_watchlist = load_watchlist()
        global STOCK_GROUPS
        STOCK_GROUPS = current_watchlist.copy()  # 更新全局变量
        return {"groups": STOCK_GROUPS}
    except Exception as e:
        logger.error(f"Error in get_watchlist: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# @app.get("/api/alerts/{symbol}")
# async def check_alerts(symbol: str):
#     try:
#         alerts = stock_monitor.check_alerts(symbol)
#         return alerts
#     except Exception as e:
#         logger.error(f"Error checking alerts for {symbol}: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/api/scanner")
# async def scan_stocks():
#     try:
#         results = stock_scanner.scan_market()
#         return results
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/watchlist/{group:path}/{symbol}")
async def remove_stock(group: str, symbol: str):
    try:
        logger.info(f"Received group: {group}, symbol: {symbol}")
        
        # 加载当前的 watchlist
        watchlist = load_watchlist()
        
        # 处理嵌套分组路径
        group_parts = group.split('/')
        current_group = watchlist
        
        # 遍历分组路径
        for i, part in enumerate(group_parts[:-1]):  # 除了最后一个部分
            if part not in current_group:
                raise HTTPException(status_code=404, detail=f"分组 {part} 不存在")
            if "subGroups" not in current_group[part]:
                current_group[part]["subGroups"] = {}
            current_group = current_group[part]["subGroups"]
        
        # 处理最后一个分组
        last_part = group_parts[-1]
        if last_part not in current_group:
            raise HTTPException(status_code=404, detail=f"分组 {last_part} 不存在")
        
        if "stocks" not in current_group[last_part]:
            current_group[last_part]["stocks"] = []
        
        if symbol not in current_group[last_part]["stocks"]:
            raise HTTPException(status_code=404, detail=f"股票 {symbol} 不在分组 {last_part} 中")
        
        # 从分组中删除股票
        current_group[last_part]["stocks"].remove(symbol)
        
        # 如果分组为空且不是默认分组，则删除该分组
        if (last_part != "默认分组" and 
            len(current_group[last_part]["stocks"]) == 0 and 
            (not current_group[last_part].get("subGroups") or 
             len(current_group[last_part]["subGroups"]) == 0)):
            del current_group[last_part]
        
        # 保存更改
        save_watchlist(watchlist)
        
        return {
            "success": True,
            "message": f"已从 {group} 中删除 {symbol}",
            "groups": watchlist
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除股票失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/groups")
async def add_group(group: StockGroup):
    try:
        if group.name in STOCK_GROUPS:
            raise HTTPException(status_code=400, detail="Group already exists")
        STOCK_GROUPS[group.name] = {"description": group.description, "stocks": []}
        # 保存更改
        save_watchlist(STOCK_GROUPS)
        return {"status": "success", "message": f"Added group {group.name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/validate/{symbol}")
async def validate_stock(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='1d')
        
        if hist.empty:
            return {"valid": False, "error": "无法获取股票数据"}
            
        info = ticker.info
        return {
            "valid": True,
            "name": info.get('longName', '') or info.get('shortName', ''),
            "price": hist['Close'][-1] if not hist.empty else 0
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}

@app.get("/api/stock/search/{query}")
async def search_stocks(query: str):
    try:
        # 添加请求头和延迟
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # 添加重试机制
        max_retries = 3
        retry_delay = 1  # 秒
        
        for attempt in range(max_retries):
            try:
                search_url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
                response = requests.get(search_url, headers=headers)
                
                if response.status_code == 429:  # Rate limit
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        continue
                    else:
                        return []  # 达到最大重试次数
                
                response.raise_for_status()
                data = response.json()
                
                # 过滤并格式化结果
                suggestions = []
                for item in data.get('quotes', [])[:10]:
                    if item.get('quoteType') in ['EQUITY', 'ETF', 'CRYPTOCURRENCY']:
                        suggestions.append({
                            'symbol': item.get('symbol'),
                            'name': item.get('longname') or item.get('shortname'),
                            'exchange': item.get('exchange')
                        })
                return suggestions
                
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                logger.error(f"Request failed after {max_retries} attempts: {str(e)}")
                return []
                
    except Exception as e:
        logger.error(f"Error in stock search: {str(e)}")
        # 返回空列表而不是抛出错误，这样前端不会崩溃
        return []

@app.get("/api/stock/analysis/{symbol}")
async def analyze_stock(symbol: str):
    """获取股票分析报告"""
    try:
        report = stock_analyzer.generate_daily_report(symbol)
        return report
    except Exception as e:
        logger.error(f"Error analyzing stock {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/backtest/{symbol}")
async def backtest_stock(symbol: str, start_date: str, end_date: str):
    """获取股票回测分析结果"""
    try:
        logger.info(f"Starting backtest for {symbol} from {start_date} to {end_date}")
        results = stock_analyzer.backtest_analysis(symbol, start_date, end_date)
        
        if isinstance(results, dict) and "error" in results:
            raise HTTPException(status_code=400, detail=results["error"])
            
        logger.info(f"Backtest completed successfully")
        return results
    except Exception as e:
        logger.error(f"Error in backtest analysis for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/watchlist/move")
async def move_stock(move: StockMove):
    try:
        logger.info(f"Moving stock {move.symbol} from {move.from_group} to {move.to_group}")
        
        # 加载当前的 watchlist
        watchlist = load_watchlist()
        
        # 处理源分组路径
        from_parts = move.from_group.split('/')
        current_from = watchlist
        
        # 遍历源分组路径
        for i, part in enumerate(from_parts[:-1]):
            if part not in current_from:
                raise HTTPException(status_code=404, detail=f"源分组 {part} 不存在")
            if "subGroups" not in current_from[part]:
                raise HTTPException(status_code=404, detail=f"源分组 {part} 没有子分组")
            current_from = current_from[part]["subGroups"]
            
        # 检查最后一个源分组
        last_from = from_parts[-1]
        if last_from not in current_from:
            raise HTTPException(status_code=404, detail=f"源分组 {last_from} 不存在")
            
        # 检查股票是否在源分组中
        if move.symbol not in current_from[last_from]["stocks"]:
            raise HTTPException(status_code=404, detail=f"股票 {move.symbol} 不在分组 {last_from} 中")
            
        # 处理目标分组路径
        to_parts = move.to_group.split('/')
        current_to = watchlist
        
        # 遍历目标分组路径
        for i, part in enumerate(to_parts[:-1]):
            if part not in current_to:
                raise HTTPException(status_code=404, detail=f"目标分组 {part} 不存在")
            if "subGroups" not in current_to[part]:
                current_to[part]["subGroups"] = {}
            current_to = current_to[part]["subGroups"]
            
        # 检查最后一个目标分组
        last_to = to_parts[-1]
        if last_to not in current_to:
            raise HTTPException(status_code=404, detail=f"目标分组 {last_to} 不存在")
            
        # 确保目标分组有 stocks 数组
        if "stocks" not in current_to[last_to]:
            current_to[last_to]["stocks"] = []
            
        # 从源分组中移除股票
        current_from[last_from]["stocks"].remove(move.symbol)
        
        # 添加到目标分组
        if move.symbol not in current_to[last_to]["stocks"]:
            current_to[last_to]["stocks"].append(move.symbol)
            
        # 如果源分组为空且不是默认分组，则删除该分组
        if (last_from != "默认分组" and 
            len(current_from[last_from]["stocks"]) == 0 and 
            (not current_from[last_from].get("subGroups") or 
             len(current_from[last_from]["subGroups"]) == 0)):
            del current_from[last_from]
            
        # 保存更改
        save_watchlist(watchlist)
        
        return {
            "success": True,
            "message": f"已将 {move.symbol} 从 {move.from_group} 移动到 {move.to_group}",
            "groups": watchlist
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"移动股票失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/groups/move")
async def move_group(move: GroupMove):
    try:
        logger.info(f"Moving group {move.source_group} to {move.target_group}")
        
        # 加载当前的 watchlist
        watchlist = load_watchlist()
        
        # 检查源分组是否存在
        if move.source_group not in watchlist:
            raise HTTPException(status_code=404, detail=f"源分组 {move.source_group} 不存在")
            
        # 获取要移动的分组数据
        moving_group = watchlist[move.source_group]
        
        # 如果目标路径为空，表示移动到顶层
        if not move.target_group:
            # 直接添加到顶层
            watchlist[move.source_group] = moving_group
        else:
            # 检查目标分组是否存在
            if move.target_group not in watchlist:
                raise HTTPException(status_code=404, detail=f"目标分组 {move.target_group} 不存在")
                
            # 确保目标分组有 subGroups 字段
            if 'subGroups' not in watchlist[move.target_group]:
                watchlist[move.target_group]['subGroups'] = {}
                
            # 将分组移动到目标位置
            watchlist[move.target_group]['subGroups'][move.source_group] = moving_group
            
            # 从原位置删除
            del watchlist[move.source_group]
        
        # 保存更改
        save_watchlist(watchlist)
        
        # 更新全局变量
        global STOCK_GROUPS
        STOCK_GROUPS = watchlist
        
        return {
            "status": "success",
            "message": f"已移动分组 {move.source_group}",
            "groups": watchlist
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error moving group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/groups/{group_path}")
async def delete_group(group_path: str):
    try:
        # 分割路径，处理嵌套的情况
        path_parts = group_path.split('/')
        
        if path_parts[0] == "默认分组":
            raise HTTPException(status_code=400, detail="不能删除默认分组")
        
        # 递归查找要删除的分组
        current_groups = STOCK_GROUPS
        parent_groups = None
        target_group_name = None
        
        for i, part in enumerate(path_parts):
            if part not in current_groups:
                raise HTTPException(status_code=404, detail=f"分组 {part} 不存在")
            
            if i == len(path_parts) - 1:  # 最后一个部分
                parent_groups = current_groups
                target_group_name = part
            else:
                current_groups = current_groups[part].get('subGroups', {})
        
        if not parent_groups or not target_group_name:
            raise HTTPException(status_code=404, detail="找不到目标分组")
            
        # 将该分组的股票移动到默认分组
        group_to_delete = parent_groups[target_group_name]
        default_stocks = set(STOCK_GROUPS["默认分组"]["stocks"])
        
        # 递归收集所有子分组中的股票
        def collect_stocks(group):
            stocks = set(group.get("stocks", []))
            for subgroup in group.get("subGroups", {}).values():
                stocks.update(collect_stocks(subgroup))
            return stocks
        
        all_stocks = collect_stocks(group_to_delete)
        STOCK_GROUPS["默认分组"]["stocks"] = list(default_stocks | all_stocks)
        
        # 删除分组
        del parent_groups[target_group_name]
        
        # 保存更改
        save_watchlist(STOCK_GROUPS)
        return {"status": "success", "message": f"已删除分组 {group_path}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/groups/rename")
async def rename_group(rename: GroupRename):
    try:
        # 解码路径
        old_path = urllib.parse.unquote(rename.old_path)
        
        if old_path == "默认分组":
            raise HTTPException(status_code=400, detail="不能重命名默认分组")
            
        # 查找要重命名的分组
        if old_path not in STOCK_GROUPS:
            raise HTTPException(status_code=404, detail=f"分组 {old_path} 不存在")
            
        # 检查新名称是否已存在
        if rename.new_name in STOCK_GROUPS:
            raise HTTPException(status_code=400, detail=f"分组名称 {rename.new_name} 已存在")
            
        # 重命名分组
        STOCK_GROUPS[rename.new_name] = STOCK_GROUPS.pop(old_path)
        
        # 保存更改
        save_watchlist(STOCK_GROUPS)
        return {"status": "success", "message": f"已将分组 {old_path} 重命名为 {rename.new_name}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error renaming group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/groups/reorder")
async def reorder_groups(reorder: GroupReorder):
    try:
        logger.info(f"Reordering group {reorder.source_group} {reorder.position} {reorder.target_group}")
        
        # 加载当前的 watchlist
        watchlist = load_watchlist()
        
        # 检查源分组和目标分组是否存在
        if reorder.source_group not in watchlist:
            raise HTTPException(status_code=404, detail=f"源分组 {reorder.source_group} 不存在")
        if reorder.target_group not in watchlist:
            raise HTTPException(status_code=404, detail=f"目标分组 {reorder.target_group} 不存在")
            
        # 获取所有分组的列表
        groups = list(watchlist.keys())
        
        # 找到源分组和目标分组的位置
        source_index = groups.index(reorder.source_group)
        target_index = groups.index(reorder.target_group)
        
        # 从列表中移除源分组
        groups.pop(source_index)
        
        # 根据位置重新插入源分组
        new_index = target_index if reorder.position == 'before' else target_index + 1
        groups.insert(new_index, reorder.source_group)
        
        # 创建新的有序字典
        new_watchlist = {}
        for group in groups:
            new_watchlist[group] = watchlist[group]
            
        # 保存更改
        save_watchlist(new_watchlist)
        
        # 更新全局变量
        global STOCK_GROUPS
        STOCK_GROUPS = new_watchlist
        
        return {
            "status": "success",
            "message": f"已重新排序分组 {reorder.source_group}",
            "groups": new_watchlist
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reordering groups: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/watchlist/reorder")
async def reorder_stocks(reorder: StockReorder):
    try:
        logger.info(f"Reordering stock {reorder.source_symbol} {reorder.position} {reorder.target_symbol} in group {reorder.group}")
        
        # 加载当前的 watchlist
        watchlist = load_watchlist()
        
        # 处理嵌套分组路径
        group_parts = reorder.group.split('/')
        current_group = watchlist
        
        # 遍历分组路径
        for i, part in enumerate(group_parts[:-1]):  # 除了最后一个部分
            if part not in current_group:
                raise HTTPException(status_code=404, detail=f"分组 {part} 不存在")
            current_group = current_group[part]["subGroups"]
            
        # 检查最后一个分组
        last_part = group_parts[-1]
        if last_part not in current_group:
            raise HTTPException(status_code=404, detail=f"分组 {last_part} 不存在")
            
        group_data = current_group[last_part]
        
        # 检查源股票和目标股票是否存在
        if reorder.source_symbol not in group_data["stocks"]:
            raise HTTPException(status_code=404, detail=f"股票 {reorder.source_symbol} 不在分组中")
        if reorder.target_symbol not in group_data["stocks"]:
            raise HTTPException(status_code=404, detail=f"目标股票 {reorder.target_symbol} 不在分组中")
            
        # 获取股票列表
        stocks = group_data["stocks"]
        
        # 移除源股票
        stocks.remove(reorder.source_symbol)
        
        # 获取目标位置
        target_index = stocks.index(reorder.target_symbol)
        
        # 根据位置重新插入源股票
        if reorder.position == 'after':
            target_index += 1
        stocks.insert(target_index, reorder.source_symbol)
        
        # 保存更改
        save_watchlist(watchlist)
        
        return {
            "success": True,
            "message": f"已重新排序股票 {reorder.source_symbol}",
            "groups": watchlist
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reordering stocks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/note/{symbol}")
async def get_stock_note(symbol: str):
    """获取股票备注"""
    try:
        # 从文件加载备注数据
        notes_file = data_dir / 'stock_notes.json'
        if not notes_file.exists():
            return {"note": ""}
            
        with open(notes_file, 'r', encoding='utf-8') as f:
            notes = json.load(f)
            
        return {"note": notes.get(symbol, "")}
    except Exception as e:
        logger.error(f"Error getting note for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stock/note")
async def update_stock_note(note: StockNote):
    """更新股票备注"""
    try:
        notes_file = data_dir / 'stock_notes.json'
        
        # 加载现有备注
        if notes_file.exists():
            with open(notes_file, 'r', encoding='utf-8') as f:
                notes = json.load(f)
        else:
            notes = {}
            
        # 更新备注
        notes[note.symbol] = note.note
        
        # 保存更新后的备注
        with open(notes_file, 'w', encoding='utf-8') as f:
            json.dump(notes, f, ensure_ascii=False, indent=2)
            
        return {"success": True, "message": "备注已更新"}
    except Exception as e:
        logger.error(f"Error updating note: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))