import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchWatchlist } from '../store/slices/watchlistSlice';
import StockDashboard from '../components/StockDashboard';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWatchlist());
    }
  }, [isAuthenticated, dispatch]);

  return <StockDashboard />;
};

export default Dashboard; 