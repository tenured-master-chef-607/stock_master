// Export all slice reducers from a single file
import authReducer from './authSlice';
import watchlistReducer from './watchlistSlice';
import uiReducer from './uiSlice';
import stockReducer from './stockSlice';

export {
  authReducer,
  watchlistReducer,
  uiReducer,
  stockReducer
}; 