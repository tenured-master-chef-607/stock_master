import React from 'react';

interface StockDebugInfoProps {
  stocks: string[];
}

export const StockDebugInfo: React.FC<StockDebugInfoProps> = ({ stocks }) => {
  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
      <div>已加载股票: {stocks.join(', ')}</div>
    </div>
  );
}; 