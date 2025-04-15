import { createSlice, createAsyncThunk, PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../index';
import { StockGroup } from '../../types';

// Types
interface Stock {
  symbol: string;
  name?: string;
}

interface WatchlistState {
  groups: Record<string, StockGroup>;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: WatchlistState = {
  groups: {},
  loading: false,
  error: null,
};

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002/api/v1';

// Async thunks
export const fetchWatchlist = createAsyncThunk(
  'watchlist/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(`${API_URL}/watchlist`, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch watchlist');
    }
  }
);

export const addStockToWatchlist = createAsyncThunk(
  'watchlist/addStock',
  async (data: { symbol: string; group: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.post(`${API_URL}/watchlist/add`, data, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to add stock to watchlist');
    }
  }
);

export const removeStockFromWatchlist = createAsyncThunk(
  'watchlist/removeStock',
  async (data: { symbol: string; group: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.delete(`${API_URL}/watchlist/${data.group}/${data.symbol}`, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to remove stock from watchlist');
    }
  }
);

export const addGroup = createAsyncThunk(
  'watchlist/addGroup',
  async (data: { name: string; description?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.post(`${API_URL}/watchlist/groups`, data, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to add group');
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'watchlist/deleteGroup',
  async (groupPath: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.delete(`${API_URL}/watchlist/groups/${groupPath}`, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete group');
    }
  }
);

// Slice
const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<WatchlistState>) => {
    builder
      // Fetch watchlist
      .addCase(fetchWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action: PayloadAction<{ groups: Record<string, StockGroup> }>) => {
        state.loading = false;
        state.groups = action.payload.groups;
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add stock to watchlist
      .addCase(addStockToWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addStockToWatchlist.fulfilled, (state, action: PayloadAction<{ groups: Record<string, StockGroup> }>) => {
        state.loading = false;
        state.groups = action.payload.groups;
      })
      .addCase(addStockToWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Remove stock from watchlist
      .addCase(removeStockFromWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeStockFromWatchlist.fulfilled, (state, action: PayloadAction<{ groups: Record<string, StockGroup> }>) => {
        state.loading = false;
        state.groups = action.payload.groups;
      })
      .addCase(removeStockFromWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add group
      .addCase(addGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addGroup.fulfilled, (state, action: PayloadAction<{ groups: Record<string, StockGroup> }>) => {
        state.loading = false;
        state.groups = action.payload.groups;
      })
      .addCase(addGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete group
      .addCase(deleteGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action: PayloadAction<{ groups: Record<string, StockGroup> }>) => {
        state.loading = false;
        state.groups = action.payload.groups;
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = watchlistSlice.actions;
export default watchlistSlice.reducer; 