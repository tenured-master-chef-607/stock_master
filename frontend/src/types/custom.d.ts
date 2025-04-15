// Type declarations for the store modules
declare module '*/store/slices/authSlice' {
  import { User } from '../index';
  
  interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  }
  
  const authReducer: import('@reduxjs/toolkit').Reducer<AuthState>;
  export default authReducer;
}

declare module '*/store/slices/watchlistSlice' {
  import { StockGroup } from '../index';
  
  interface WatchlistState {
    groups: Record<string, StockGroup>;
    loading: boolean;
    error: string | null;
  }
  
  const watchlistReducer: import('@reduxjs/toolkit').Reducer<WatchlistState>;
  export default watchlistReducer;
}

declare module '*/store/slices/uiSlice' {
  interface UiState {
    darkMode: boolean;
    sidebarCollapsed: boolean;
    currentPage: string;
    notifications: any[];
  }
  
  const uiReducer: import('@reduxjs/toolkit').Reducer<UiState>;
  export default uiReducer;
}

declare module '*/store/slices/stockSlice' {
  import { StockInfo, StockAnalysis, BacktestResult, StockSearchResult } from '../index';
  
  interface StockState {
    currentStock: string | null;
    stockInfo: Record<string, StockInfo>;
    analysis: Record<string, StockAnalysis>;
    backtestResults: Record<string, BacktestResult>;
    searchResults: StockSearchResult[];
    loading: boolean;
    error: string | null;
  }
  
  const stockReducer: import('@reduxjs/toolkit').Reducer<StockState>;
  export default stockReducer;
}

declare module '*/store/hooks' {
  import { TypedUseSelectorHook } from 'react-redux';
  import { RootState, AppDispatch } from '../store/index';
  
  export const useAppDispatch: () => AppDispatch;
  export const useAppSelector: TypedUseSelectorHook<RootState>;
} 