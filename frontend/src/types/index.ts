import { Action, ThunkAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Redux action types
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Common types used throughout the app
export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
}

// Stock related types
export interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  note?: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export interface StockAnalysis {
  symbol: string;
  name: string;
  current_price: number;
  price_change: number;
  price_change_percent: number;
  volume: number;
  market_cap?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  technical_indicators: {
    sma_20?: number;
    sma_50?: number;
    sma_200?: number;
    rsi?: number;
    macd?: number;
    signal_line?: number;
  };
  recommendation: {
    action: string;
    strength: string;
    reasons: string[];
  };
  historical_data: {
    dates: string[];
    prices: number[];
    volumes: number[];
    sma_20: number[];
    sma_50: number[];
    rsi: number[];
    macd: number[];
    signal_line: number[];
  };
}

export interface StockGroup {
  description: string;
  stocks: string[];
  subGroups: Record<string, StockGroup>;
}

export interface BacktestResult {
  symbol: string;
  start_date: string;
  end_date: string;
  market_return: number;
  strategy_return: number;
  signals: {
    buy: number;
    sell: number;
  };
  historical_data: {
    dates: string[];
    prices: number[];
    sma_20: number[];
    sma_50: number[];
    market_return: number[];
    strategy_return: number[];
    buy_signals: string[];
    sell_signals: string[];
  };
} 