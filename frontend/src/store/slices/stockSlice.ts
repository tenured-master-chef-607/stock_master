import { createSlice, createAsyncThunk, PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../index';
import { StockInfo, StockAnalysis, BacktestResult, StockSearchResult } from '../../types';

// Define state interface
interface StockState {
  currentStock: string | null;
  stockInfo: Record<string, StockInfo>;
  analysis: Record<string, StockAnalysis>;
  backtestResults: Record<string, BacktestResult>;
  searchResults: StockSearchResult[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: StockState = {
  currentStock: null,
  stockInfo: {},
  analysis: {},
  backtestResults: {},
  searchResults: [],
  loading: false,
  error: null,
};

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002/api/v1';

// Async thunks
export const validateStock = createAsyncThunk<
  { valid: boolean; name: string; price: number },
  string,
  { rejectValue: string; state: RootState }
>(
  'stock/validate',
  async (symbol, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/stock/validate/${symbol}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to validate stock');
    }
  }
);

export const searchStocks = createAsyncThunk(
  'stock/search',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/stock/search/${query}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to search stocks');
    }
  }
);

export const fetchStockAnalysis = createAsyncThunk(
  'stock/analysis',
  async (symbol: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(`${API_URL}/stock/analysis/${symbol}`, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch stock analysis');
    }
  }
);

export const fetchBacktestResults = createAsyncThunk(
  'stock/backtest',
  async (
    { symbol, startDate, endDate }: { symbol: string; startDate: string; endDate: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(
        `${API_URL}/stock/backtest/${symbol}?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${state.auth.token}`,
          },
        }
      );
      return { symbol, data: response.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch backtest results');
    }
  }
);

export const updateStockNote = createAsyncThunk(
  'stock/updateNote',
  async ({ symbol, note }: { symbol: string; note: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.post(
        `${API_URL}/stock/note`,
        { symbol, note },
        {
          headers: {
            Authorization: `Bearer ${state.auth.token}`,
          },
        }
      );
      return { symbol, note, success: response.data.success };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update stock note');
    }
  }
);

// Slice
const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setCurrentStock: (state: StockState, action: PayloadAction<string>) => {
      state.currentStock = action.payload;
    },
    clearSearchResults: (state: StockState) => {
      state.searchResults = [];
    },
    clearError: (state: StockState) => {
      state.error = null;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<StockState>) => {
    builder
      // Validate stock
      .addCase(validateStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateStock.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.valid) {
          // Get the symbol from the argument used when dispatching this action
          const symbol = action.meta.arg;
          state.stockInfo[symbol] = {
            symbol,
            name: action.payload.name,
            price: action.payload.price,
          };
        }
      })
      .addCase(validateStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Search stocks
      .addCase(searchStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchStocks.fulfilled, (state, action: PayloadAction<StockSearchResult[]>) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch stock analysis
      .addCase(fetchStockAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockAnalysis.fulfilled, (state, action: PayloadAction<StockAnalysis>) => {
        state.loading = false;
        state.analysis[action.payload.symbol] = action.payload;
        // Also update basic info
        state.stockInfo[action.payload.symbol] = {
          symbol: action.payload.symbol,
          name: action.payload.name,
          price: action.payload.current_price,
        };
      })
      .addCase(fetchStockAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch backtest results
      .addCase(fetchBacktestResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBacktestResults.fulfilled, (state, action: PayloadAction<{ symbol: string; data: BacktestResult }>) => {
        state.loading = false;
        state.backtestResults[action.payload.symbol] = action.payload.data;
      })
      .addCase(fetchBacktestResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update stock note
      .addCase(updateStockNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStockNote.fulfilled, (state, action: PayloadAction<{ symbol: string; note: string; success: boolean }>) => {
        state.loading = false;
        if (action.payload.success && state.stockInfo[action.payload.symbol]) {
          state.stockInfo[action.payload.symbol].note = action.payload.note;
        }
      })
      .addCase(updateStockNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentStock, clearSearchResults, clearError } = stockSlice.actions;
export default stockSlice.reducer; 