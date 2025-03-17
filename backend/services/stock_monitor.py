from typing import List, Dict
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import logging
from cachetools import TTLCache

logger = logging.getLogger(__name__)

class StockMonitor:
    def __init__(self):
        self.alert_thresholds = {
            'daily_change': 5.0,  # 5%
            'rapid_rise': 3.0,    # 3%
            'volume_surge': 300   # 300%
        }
        self.alerts_history = {}  # 用于存储已触发的预警，避免重复通知
        # 添加缓存，数据在60秒内有效
        self.data_cache = TTLCache(maxsize=100, ttl=60)
        
    def get_stock_data(self, symbol: str) -> Dict:
        """获取股票数据，使用缓存"""
        cache_key = f"{symbol}_{datetime.now().strftime('%Y%m%d_%H%M')}"
        
        if cache_key in self.data_cache:
            return self.data_cache[cache_key]
            
        stock = yf.Ticker(symbol)
        data = {
            'hist': stock.history(period='1d', interval='15m'),
            'daily_data': stock.history(period='1y'),
            'timestamp': datetime.now()
        }
        self.data_cache[cache_key] = data
        return data
        
    def check_alerts(self, symbol: str) -> Dict:
        """检查所有预警条件"""
        try:
            current_time = datetime.now()
            
            # 使用缓存获取数据
            data = self.get_stock_data(symbol)
            hist = data['hist']
            daily_data = data['daily_data']
            
            if hist.empty or daily_data.empty:
                return {
                    'symbol': symbol,
                    'alerts': [],
                    'timestamp': current_time.isoformat()
                }
            
            alerts = []
            
            # 1. 检查单日涨幅
            daily_change = ((hist['Close'][-1] - hist['Open'][0]) / hist['Open'][0]) * 100
            if daily_change > self.alert_thresholds['daily_change']:
                alerts.append({
                    'type': 'daily_surge',
                    'message': f'单日涨幅达到 {daily_change:.2f}%',
                    'value': daily_change,
                    'threshold': self.alert_thresholds['daily_change']
                })
            
            # 2. 检查15分钟急涨
            if len(hist) >= 2:
                fifteen_min_change = ((hist['Close'][-1] - hist['Close'][-2]) / hist['Close'][-2]) * 100
                if fifteen_min_change > self.alert_thresholds['rapid_rise']:
                    alerts.append({
                        'type': 'rapid_rise',
                        'message': f'15分钟涨幅达到 {fifteen_min_change:.2f}%',
                        'value': fifteen_min_change,
                        'threshold': self.alert_thresholds['rapid_rise']
                    })
            
            # 3. 检查52周新高
            fifty_two_week_high = daily_data['High'].max()
            current_price = hist['Close'][-1]
            if current_price >= fifty_two_week_high:
                alerts.append({
                    'type': 'new_high',
                    'message': f'突破52周新高: {current_price:.2f}',
                    'value': current_price,
                    'threshold': fifty_two_week_high
                })
            
            # 更新预警历史
            alert_key = f"{symbol}_{current_time.strftime('%Y%m%d_%H%M')}"
            if alerts and alert_key not in self.alerts_history:
                self.alerts_history[alert_key] = alerts
            
            return {
                'symbol': symbol,
                'alerts': alerts,
                'timestamp': current_time.isoformat()
            }
        except Exception as e:
            logger.error(f"Error checking alerts for {symbol}: {str(e)}")
            return {
                'symbol': symbol,
                'alerts': [],
                'timestamp': current_time.isoformat(),
                'error': str(e)
            } 