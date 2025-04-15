import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import plotly.graph_objects as go
from pathlib import Path
import logging
import pytz
import requests
from time import sleep
import yfinance as yf
import numpy as np
from fastapi import HTTPException, status
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class StockAnalyzer:
    def __init__(self):
        # 创建图表保存目录
        self.charts_dir = Path(__file__).parent.parent / 'static' / 'charts'
        self.charts_dir.mkdir(parents=True, exist_ok=True)
        
        # 设置请求头
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
            "Accept": "application/json"
        }

    def get_stock_data(self, ticker, period='1y', start=None, end=None):
        """使用Yahoo Finance API获取股票数据（支持时间范围或时间段）"""
        try:
            sleep(1)
            # 优先使用明确的时间范围参数
            use_date_range = start is not None or end is not None
            
            # 构建基础URL
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
            params = {
                "interval": "1d",
                "includePrePost": True,
                "events": "div,splits,capitalGains"
            }

            if use_date_range:
                # 处理日期范围模式
                start_date = pd.to_datetime(start)
                end_date = pd.to_datetime(end)
                
                # 转换为Unix时间戳（秒）
                params.update({
                    "period1": int(start_date.timestamp()),
                    "period2": int(end_date.timestamp())
                })
            else:
                # 处理时间段模式
                period_map = {
                    '1d': '1d', '5d': '5d', '1mo': '1mo', '3mo': '3mo',
                    '6mo': '6mo', '1y': '1y', '2y': '2y', '5y': '5y', 'max': 'max'
                }
                params["range"] = period_map.get(period, '1y')

            # 发送请求
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code != 200:
                logger.error(f"获取{ticker}数据失败，状态码: {response.status_code}")
                return None

            data = response.json()
            
            try:
                chart_data = data['chart']['result'][0]
                timestamps = chart_data['timestamp']
                quote = chart_data['indicators']['quote'][0]
                
                # 创建DataFrame
                df = pd.DataFrame({
                    'Open': quote.get('open', []),
                    'High': quote.get('high', []),
                    'Low': quote.get('low', []),
                    'Close': quote.get('close', []),
                    'Volume': quote.get('volume', [])
                }, index=pd.to_datetime(timestamps, unit='s'))
                
                # 处理调整后的收盘价
                if 'adjclose' in chart_data['indicators']:
                    df['Adj Close'] = chart_data['indicators']['adjclose'][0]['adjclose']
                
                # 清理数据：移除NaN和重复索引
                df = df.dropna().loc[~df.index.duplicated(keep='first')]
                
                # 确保时间范围有效性（当使用start/end时）
                if use_date_range:
                    df = df.loc[start_date:end_date]
                
                return df

            except (KeyError, IndexError) as e:
                logger.error(f"解析{ticker}数据失败: {str(e)}")
                return None
                
        except Exception as e:
            logger.error(f"获取{ticker}股票数据异常: {str(e)}")
            return None
        
        
    def generate_daily_report(self, ticker):
        """生成每日分析报告"""
        try:
            # 获取数据
            hist = self.get_stock_data(ticker, '5d')
            if hist is None:
                return {"error": "无法获取股票数据"}
            
            # 计算关键指标
            latest = hist.iloc[-1]
            prev_close = hist.iloc[-2]['Close']
            daily_change = (latest['Close'] - prev_close) / prev_close * 100
            
            # 波动分析
            atr = (hist['High'] - hist['Low']).mean()
            
            # 生成报告
            report = {
                "date": datetime.today().strftime('%Y-%m-%d'),
                "open": latest['Open'],
                "price": latest['Close'],
                "change": daily_change,
                "volume": latest['Volume']/1e6,
                "atr": atr,
                "volume_alert": self.detect_abnormal_volume(hist),
                "technical_signals": self.generate_technical_signals(hist),
                "volatility_alert": self.volatility_cluster_alert(hist),
                "money_flow": self.money_flow_analysis(hist)
            }
            
            return report
        except Exception as e:
            logger.error(f"Error generating daily report for {ticker}: {str(e)}")
            return {"error": str(e)}

    def detect_abnormal_volume(self, data):
        """成交量异动检测"""
        avg_volume = data['Volume'].rolling(5).mean().iloc[-1]
        latest_volume = data['Volume'].iloc[-1]
        
        if latest_volume > avg_volume * 2:
            return "成交量突破：当前成交量是5日均值的2倍以上"
        elif latest_volume < avg_volume * 0.5:
            return "交易清淡：当前成交量不足5日均值一半"
        else:
            return "成交量处于正常波动区间"

    def generate_technical_signals(self, data):
        """生成技术信号"""
        signals = []
        
        # 计算MACD
        exp1 = data['Close'].ewm(span=12, adjust=False).mean()
        exp2 = data['Close'].ewm(span=26, adjust=False).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9, adjust=False).mean()
        
        if macd.iloc[-1] > signal.iloc[-1] and macd.iloc[-2] <= signal.iloc[-2]:
            signals.append("MACD金叉")
        elif macd.iloc[-1] < signal.iloc[-1] and macd.iloc[-2] >= signal.iloc[-2]:
            signals.append("MACD死叉")
            
        # 计算RSI
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        if rsi.iloc[-1] > 70:
            signals.append(f"RSI超买 ({rsi.iloc[-1]:.1f})")
        elif rsi.iloc[-1] < 30:
            signals.append(f"RSI超卖 ({rsi.iloc[-1]:.1f})")
            
        return signals

    def volatility_cluster_alert(self, data):
        """波动率聚类分析"""
        returns = data['Close'].pct_change().dropna()
        clusters = []
        threshold = returns.std() * 1.5
        
        for r in returns[-5:]:
            if abs(r) > threshold:
                clusters.append(1)
            else:
                clusters.append(0)
        
        if sum(clusters) >= 3:
            return "波动率聚集预警：近期出现3次以上异常波动"
        return "波动率正常"

    def money_flow_analysis(self, data):
        """
        更敏感的资金流向分析，快速响应市场变化
        """
        try:
            # 计算价格变化率
            price_change = data['Close'].pct_change() * 100
            
            # 计算成交量变化率
            volume_change = data['Volume'].pct_change() * 100
            
            # 计算典型价格
            typical_price = (data['High'] + data['Low'] + data['Close']) / 3
            
            # 计算 Money Flow
            raw_money_flow = typical_price * data['Volume']
            
            # 使用更短期的资金流指标
            positive_flow = raw_money_flow.where(typical_price > typical_price.shift(1), 0).rolling(window=10).sum()
            negative_flow = raw_money_flow.where(typical_price < typical_price.shift(1), 0).rolling(window=10).sum()
            
            # 计算 MFI（使用更短的周期）
            mfi = 100 - (100 / (1 + positive_flow / negative_flow))
            
            # 计算 OBV 和短期变化
            obv = (data['Volume'] * (~data['Close'].diff().le(0) * 2 - 1)).cumsum()
            obv_change = obv.diff(3) / obv.abs().mean() * 100  # 缩短为3天
            
            # 获取最新值
            current_price_change = price_change.iloc[-1]
            current_volume_change = volume_change.iloc[-1]
            current_mfi = mfi.iloc[-1]
            current_obv_change = obv_change.iloc[-1]
            
            # 更敏感的上涨特征判断
            is_strong_uptrend = (
                current_price_change > 2 and  # 降低到2%
                current_volume_change > 30 and  # 降低到30%
                current_obv_change > 3  # 降低到3%
            )
            
            # 更敏感的下跌特征判断
            is_strong_downtrend = (
                current_price_change < -2 and  # 提高到-2%
                current_volume_change > 30 and  # 降低到30%
                current_obv_change < -3  # 提高到-3%
            )
            
            # 综合分析（更敏感的判断标准）
            if is_strong_uptrend:
                if current_mfi > 70:  # 降低阈值
                    return "主力资金大量涌入：强势上涨"
                else:
                    return "资金加速流入：看涨信号"
            elif is_strong_downtrend:
                if current_mfi < 30:  # 提高阈值
                    return "资金加速流出：看空信号"
                else:
                    return "资金持续流出：注意风险"
            else:
                if current_mfi > 70 and current_obv_change < -3:
                    return "资金流出警告：获利回吐"
                elif current_mfi < 30 and current_obv_change > 3:
                    return "资金流入信号：低位吸筹"
                elif current_mfi > 55 and current_obv_change > 2:  # 降低阈值
                    return "资金持续流入：多头占优"
                elif current_mfi < 45 and current_obv_change < -2:  # 提高阈值
                    return "资金逐步流出：空头占优"
                elif current_price_change > 0.5 and current_volume_change > 10:  # 更敏感的短期判断
                    return "资金小幅流入：短线看多"
                elif current_price_change < -0.5 and current_volume_change > 10:
                    return "资金小幅流出：短线谨慎"
                else:
                    return "资金流向观望：等待信号"
            
        except Exception as e:
            logger.error(f"Error in money flow analysis: {str(e)}")
            return "资金流向分析异常"

    def backtest_analysis(self, ticker: str, start_date: str, end_date: str):
        """获取指定日期的分析报告并验证其准确性"""
        try:
            logger.info(f"Attempting to fetch data for {ticker}")
            logger.info(f"Date range: {start_date} to {end_date}")

            # 转换日期为 Pandas 格式
            start_date_pd = pd.to_datetime(start_date)
            end_date_pd = pd.to_datetime(end_date)

            # 获取指定日期范围内的数据
            hist = self.get_stock_data(
                ticker, 
                start=start_date_pd - pd.Timedelta(days=7),  # 多取7天用于技术指标计算
                end=end_date_pd + pd.Timedelta(days=5)      # 确保包含 end_date
            )
            
            if hist is None or hist.empty:
                logger.error(f"No data available for {ticker}")
                return {"error": "无法获取历史数据"}

            # 确保索引是datetime类型
            hist.index = pd.to_datetime(hist.index)
            
            # 检查数据范围是否覆盖目标日期
            if hist.index[0].date() > start_date_pd.date() or hist.index[-1].date() < end_date_pd.date():
                logger.error(f"数据范围不足: {hist.index[0]} 至 {hist.index[-1]}")
                return {"error": "数据未覆盖指定日期范围"}

            # 精确匹配目标日期
            target_date = end_date_pd.date()
            matching_dates = hist.index[hist.index.date == target_date]

            
            if len(matching_dates) == 0:
                logger.error(f"目标日期 {end_date} 不存在于数据中")
                return {"error": f"{end_date} 无交易数据"}

            target_idx = hist.index.get_loc(matching_dates[0])
            
            # 检查是否有下一个交易日数据
            if target_idx >= len(hist) - 1:
                logger.error(f"No next day data available for {ticker} at {end_date}")
                return {"error": f"无法获取 {end_date} 的下一个交易日数据"}

            # 记录找到的具体日期
            test_date = hist.index[target_idx]
            next_date = hist.index[target_idx + 1]
            logger.info(f"Using test date: {test_date}")
            logger.info(f"Next trading day: {next_date}")

            # 使用目标日期的数据生成分析报告
            test_data = hist.iloc[target_idx:target_idx+1]
            next_day = hist.iloc[target_idx+1]
            analysis_data = hist[:target_idx+1]

            # 生成分析报告
            report = {
                "date": test_data.index[0].strftime('%Y-%m-%d'),
                "price": test_data['Close'].iloc[0],                
                "high": test_data['High'].iloc[0],
                "low": test_data['Low'].iloc[0],
                "open": test_data['Open'].iloc[0],
                
                "change": ((test_data['Close'].iloc[0] - test_data['Open'].iloc[0]) / 
                        test_data['Open'].iloc[0] * 100),
                "volume": test_data['Volume'].iloc[0] / 1e6,  # 转换为百万单位
                "technical_signals": self.generate_technical_signals(analysis_data),
                "volatility_alert": self.volatility_cluster_alert(analysis_data),
                "money_flow": self.money_flow_analysis(analysis_data),
                "volume_alert": self.detect_abnormal_volume(analysis_data),
                "next_day": {
                    "date": next_day.name.strftime('%Y-%m-%d'),
                    "price": next_day['Close'],
                    "change": ((next_day['Close'] - next_day['Open']) / next_day['Open'] * 100)
                }
            }

            # 添加次日数据
            report["next_day"] = {
                "date": next_day.name.strftime('%Y-%m-%d'),
                "price": next_day['Close'],
                "change": ((next_day['Close'] - next_day['Open']) / next_day['Open'] * 100)
            }


            return report

        except Exception as e:
            logger.error(f"Unexpected error in backtest analysis for {ticker}: {str(e)}")
            return {"error": str(e)}

class StockAnalyzerService:
    """Service for stock analysis operations"""
    
    def generate_daily_report(self, symbol: str) -> Dict[str, Any]:
        """
        Generate a daily analysis report for a stock
        """
        try:
            # Get stock data
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="1y")
            
            if hist.empty:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No data found for stock {symbol}"
                )
            
            # Basic info
            info = ticker.info
            
            # Calculate some technical indicators
            hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
            hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
            hist['SMA_200'] = hist['Close'].rolling(window=200).mean()
            
            # RSI calculation
            delta = hist['Close'].diff()
            gain = delta.where(delta > 0, 0)
            loss = -delta.where(delta < 0, 0)
            avg_gain = gain.rolling(window=14).mean()
            avg_loss = loss.rolling(window=14).mean()
            rs = avg_gain / avg_loss
            hist['RSI'] = 100 - (100 / (1 + rs))
            
            # MACD
            hist['EMA_12'] = hist['Close'].ewm(span=12, adjust=False).mean()
            hist['EMA_26'] = hist['Close'].ewm(span=26, adjust=False).mean()
            hist['MACD'] = hist['EMA_12'] - hist['EMA_26']
            hist['Signal_Line'] = hist['MACD'].ewm(span=9, adjust=False).mean()
            
            # Get the most recent values
            latest = hist.iloc[-1]
            previous = hist.iloc[-2]
            
            # Format the data for the report
            report = {
                "symbol": symbol,
                "name": info.get('longName', symbol),
                "current_price": round(latest['Close'], 2),
                "price_change": round(latest['Close'] - previous['Close'], 2),
                "price_change_percent": round((latest['Close'] / previous['Close'] - 1) * 100, 2),
                "volume": int(latest['Volume']),
                "market_cap": info.get('marketCap', None),
                "pe_ratio": info.get('trailingPE', None),
                "dividend_yield": info.get('dividendYield', None),
                "52w_high": info.get('fiftyTwoWeekHigh', None),
                "52w_low": info.get('fiftyTwoWeekLow', None),
                "technical_indicators": {
                    "sma_20": round(latest['SMA_20'], 2) if not np.isnan(latest['SMA_20']) else None,
                    "sma_50": round(latest['SMA_50'], 2) if not np.isnan(latest['SMA_50']) else None,
                    "sma_200": round(latest['SMA_200'], 2) if not np.isnan(latest['SMA_200']) else None,
                    "rsi": round(latest['RSI'], 2) if not np.isnan(latest['RSI']) else None,
                    "macd": round(latest['MACD'], 2) if not np.isnan(latest['MACD']) else None,
                    "signal_line": round(latest['Signal_Line'], 2) if not np.isnan(latest['Signal_Line']) else None,
                },
                "recommendation": self._generate_recommendation(latest, info)
            }
            
            # Add historical data for charts
            report["historical_data"] = {
                "dates": hist.index[-30:].strftime('%Y-%m-%d').tolist(),
                "prices": hist['Close'][-30:].round(2).tolist(),
                "volumes": hist['Volume'][-30:].astype(int).tolist(),
                "sma_20": hist['SMA_20'][-30:].round(2).fillna(None).tolist(),
                "sma_50": hist['SMA_50'][-30:].round(2).fillna(None).tolist(),
                "rsi": hist['RSI'][-30:].round(2).fillna(None).tolist(),
                "macd": hist['MACD'][-30:].round(2).fillna(None).tolist(),
                "signal_line": hist['Signal_Line'][-30:].round(2).fillna(None).tolist(),
            }
            
            return report
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error analyzing stock {symbol}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to analyze stock: {str(e)}"
            )
    
    def _generate_recommendation(self, latest, info) -> Dict[str, Any]:
        """
        Generate a simple recommendation based on technical indicators
        """
        # Default recommendation
        recommendation = {
            "action": "HOLD",
            "strength": "NEUTRAL",
            "reasons": []
        }
        
        # RSI analysis
        if latest['RSI'] < 30:
            recommendation["reasons"].append("RSI is below 30, indicating oversold conditions")
            recommendation["strength"] = "STRONG"
            recommendation["action"] = "BUY"
        elif latest['RSI'] > 70:
            recommendation["reasons"].append("RSI is above 70, indicating overbought conditions")
            recommendation["strength"] = "STRONG"
            recommendation["action"] = "SELL"
        
        # Moving average analysis
        if latest['Close'] > latest['SMA_200']:
            recommendation["reasons"].append("Price is above 200-day SMA, indicating long-term uptrend")
            if recommendation["action"] != "SELL":
                recommendation["action"] = "BUY"
                if recommendation["strength"] == "NEUTRAL":
                    recommendation["strength"] = "MODERATE"
        else:
            recommendation["reasons"].append("Price is below 200-day SMA, indicating long-term downtrend")
            if recommendation["action"] != "BUY":
                recommendation["action"] = "SELL"
                if recommendation["strength"] == "NEUTRAL":
                    recommendation["strength"] = "MODERATE"
        
        # MACD analysis
        if latest['MACD'] > latest['Signal_Line']:
            recommendation["reasons"].append("MACD is above signal line, indicating bullish momentum")
            if recommendation["action"] != "SELL":
                recommendation["action"] = "BUY"
                if recommendation["strength"] == "NEUTRAL":
                    recommendation["strength"] = "MODERATE"
        else:
            recommendation["reasons"].append("MACD is below signal line, indicating bearish momentum")
            if recommendation["action"] != "BUY":
                recommendation["action"] = "SELL"
                if recommendation["strength"] == "NEUTRAL":
                    recommendation["strength"] = "MODERATE"
        
        return recommendation
    
    def backtest_strategy(self, symbol: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Backtest a simple trading strategy
        """
        try:
            # Get historical data
            ticker = yf.Ticker(symbol)
            hist = ticker.history(start=start_date, end=end_date)
            
            if hist.empty:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No data found for stock {symbol} in specified date range"
                )
            
            # Calculate indicators
            hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
            hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
            
            # Generate signals (buy when SMA_20 crosses above SMA_50, sell when crosses below)
            hist['Signal'] = 0
            hist.loc[hist['SMA_20'] > hist['SMA_50'], 'Signal'] = 1
            hist['Position'] = hist['Signal'].diff()
            
            # Calculate returns
            hist['Market_Return'] = hist['Close'].pct_change()
            hist['Strategy_Return'] = hist['Market_Return'] * hist['Signal'].shift(1)
            
            # Calculate cumulative returns
            hist['Cum_Market_Return'] = (1 + hist['Market_Return']).cumprod() - 1
            hist['Cum_Strategy_Return'] = (1 + hist['Strategy_Return']).cumprod() - 1
            
            # Count signals
            buy_signals = hist[hist['Position'] == 1].shape[0]
            sell_signals = hist[hist['Position'] == -1].shape[0]
            
            # Format the results
            backtest_results = {
                "symbol": symbol,
                "start_date": start_date,
                "end_date": end_date,
                "market_return": round(hist['Cum_Market_Return'].iloc[-1] * 100, 2),
                "strategy_return": round(hist['Cum_Strategy_Return'].iloc[-1] * 100, 2),
                "signals": {
                    "buy": buy_signals,
                    "sell": sell_signals
                },
                "historical_data": {
                    "dates": hist.index.strftime('%Y-%m-%d').tolist(),
                    "prices": hist['Close'].round(2).tolist(),
                    "sma_20": hist['SMA_20'].round(2).fillna(None).tolist(),
                    "sma_50": hist['SMA_50'].round(2).fillna(None).tolist(),
                    "market_return": (hist['Cum_Market_Return'] * 100).round(2).tolist(),
                    "strategy_return": (hist['Cum_Strategy_Return'] * 100).round(2).tolist(),
                    "buy_signals": hist.index[hist['Position'] == 1].strftime('%Y-%m-%d').tolist(),
                    "sell_signals": hist.index[hist['Position'] == -1].strftime('%Y-%m-%d').tolist(),
                }
            }
            
            return backtest_results
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error backtesting for stock {symbol}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to backtest strategy: {str(e)}"
            )

# Create a singleton instance
stock_analyzer_service = StockAnalyzerService()