from typing import List, Dict
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup

class StockScanner:
    def __init__(self):
        self.market_cap_threshold = 5_000_000_000  # 50亿美元
        self.volume_surge_threshold = 300  # 300%
        self.institutional_ownership_threshold = 5.0  # 5%
        
    def scan_market(self) -> List[Dict]:
        """扫描整个市场寻找符合条件的股票"""
        # 获取纳斯达克所有股票列表（示例使用部分股票）
        symbols = ["AAPL", "MSFT", "NVDA", "AMD", "TSLA", "MARA", "RIOT", "COIN"]
        results = []
        
        for symbol in symbols:
            try:
                stock_data = self.analyze_stock(symbol)
                if stock_data and self.check_conditions(stock_data):
                    results.append(self.generate_report(stock_data))
            except Exception as e:
                print(f"Error analyzing {symbol}: {str(e)}")
                continue
                
        return results
    
    def analyze_stock(self, symbol: str) -> Dict:
        """分析单个股票的所有相关数据"""
        stock = yf.Ticker(symbol)
        
        # 获取历史数据
        hist = stock.history(period='60d')  # 获取60天数据用于计算均值
        if hist.empty:
            return None
            
        # 获取公司信息
        info = stock.info
        
        return {
            'symbol': symbol,
            'history': hist,
            'info': info,
            'institutional_ownership': self.get_institutional_ownership(symbol),
            'market_cap': info.get('marketCap', float('inf')),
            'current_volume': hist['Volume'][-1],
            'avg_volume_30d': hist['Volume'][-30:].mean(),
            'price': hist['Close'][-1],
            'price_change': ((hist['Close'][-1] - hist['Close'][-2]) / hist['Close'][-2]) * 100,
            'volume_change': ((hist['Volume'][-1] - hist['Volume'][-2]) / hist['Volume'][-2]) * 100
        }
    
    def check_conditions(self, stock_data: Dict) -> bool:
        """检查股票是否满足所有条件"""
        conditions = {
            'volume_surge': self.check_volume_surge(stock_data),
            'not_trending': self.check_not_trending(stock_data['symbol']),
            'low_institutional': self.check_institutional_ownership(stock_data),
            'small_cap': self.check_market_cap(stock_data),
            'technical_breakout': self.check_technical_breakout(stock_data)
        }
        
        return all(conditions.values())
    
    def check_volume_surge(self, stock_data: Dict) -> bool:
        """检查成交量是否突增300%以上"""
        volume_ratio = (stock_data['current_volume'] / stock_data['avg_volume_30d']) * 100
        return volume_ratio > self.volume_surge_threshold
    
    def check_not_trending(self, symbol: str) -> bool:
        """检查是否未进入热门榜（这里可以根据实际数据源调整）"""
        # 示例实现，实际应该查询热门股票榜单
        trending_symbols = self.get_trending_stocks()
        return symbol not in trending_symbols
    
    def get_trending_stocks(self) -> List[str]:
        """获取热门股票列表（示例实现）"""
        # 实际实现应该从可靠数据源获取
        return ["AAPL", "MSFT", "GOOGL"]  # 示例热门股票
    
    def check_institutional_ownership(self, stock_data: Dict) -> bool:
        """检查机构持股比例是否小于阈值"""
        return stock_data['institutional_ownership'] < self.institutional_ownership_threshold
    
    def get_institutional_ownership(self, symbol: str) -> float:
        """获取机构持股比例"""
        try:
            stock = yf.Ticker(symbol)
            # 实际应该从更可靠的数据源获取
            return stock.info.get('institutionalOwnership', 0) * 100
        except:
            return 0
    
    def check_market_cap(self, stock_data: Dict) -> bool:
        """检查是否为小市值股票"""
        return stock_data['market_cap'] < self.market_cap_threshold
    
    def check_technical_breakout(self, stock_data: Dict) -> bool:
        """检查技术面是否突破"""
        hist = stock_data['history']
        
        # 计算技术指标
        # 1. 突破20日均线
        ma20 = hist['Close'].rolling(window=20).mean()
        price_above_ma = hist['Close'][-1] > ma20[-1]
        
        # 2. RSI指标
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        rsi_bullish = rsi[-1] > 50 and rsi[-1] < 70
        
        # 3. 成交量确认
        volume_confirmation = hist['Volume'][-1] > hist['Volume'][-20:].mean()
        
        return price_above_ma and rsi_bullish and volume_confirmation
    
    def generate_report(self, stock_data: Dict) -> Dict:
        """生成异动分析报告"""
        return {
            'symbol': stock_data['symbol'],
            'market_cap': stock_data['market_cap'],
            'current_price': stock_data['price'],
            'price_change': stock_data['price_change'],
            'volume_change': ((stock_data['current_volume'] / stock_data['avg_volume_30d']) - 1) * 100,
            'institutional_ownership': stock_data['institutional_ownership'],
            'analysis': {
                'technical': self.get_technical_analysis(stock_data),
                'fundamental': self.get_fundamental_analysis(stock_data),
                'news': self.get_related_news(stock_data['symbol'])
            },
            'alerts': self.get_alerts(stock_data)
        }
    
    def get_technical_analysis(self, stock_data: Dict) -> Dict:
        """获取技术面分析"""
        hist = stock_data['history']
        return {
            'ma_analysis': '突破20日均线' if self.check_technical_breakout(stock_data) else '未突破',
            'volume_analysis': f"成交量较30日均值增加{((stock_data['current_volume']/stock_data['avg_volume_30d'])-1)*100:.2f}%",
            'price_momentum': '上升趋势' if stock_data['price_change'] > 0 else '下降趋势'
        }
    
    def get_fundamental_analysis(self, stock_data: Dict) -> Dict:
        """获取基本面分析"""
        info = stock_data['info']
        return {
            'market_cap': f"${stock_data['market_cap']/1000000000:.2f}B",
            'pe_ratio': info.get('forwardPE', 'N/A'),
            'institutional_ownership': f"{stock_data['institutional_ownership']:.2f}%"
        }
    
    def get_related_news(self, symbol: str) -> List[Dict]:
        """获取相关新闻（示例实现）"""
        # 实际实现应该从新闻API获取
        return [
            {
                'title': f'示例新闻 - {symbol}出现异动',
                'source': '示例新闻源',
                'timestamp': datetime.now().isoformat()
            }
        ]
    
    def get_alerts(self, stock_data: Dict) -> List[str]:
        """生成警报信息"""
        alerts = []
        if self.check_volume_surge(stock_data):
            alerts.append(f"成交量突增{((stock_data['current_volume']/stock_data['avg_volume_30d'])-1)*100:.2f}%")
        if self.check_technical_breakout(stock_data):
            alerts.append("技术面突破")
        if stock_data['institutional_ownership'] < self.institutional_ownership_threshold:
            alerts.append(f"机构持股较低({stock_data['institutional_ownership']:.2f}%)")
        return alerts 