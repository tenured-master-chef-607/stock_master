import React from 'react';
import './App.css';
import StockDashboard from './components/StockDashboard';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock Master Prototype</h1>
      </header>
      <main>
        <StockDashboard />
      </main>
    </div>
  );
}

export default App;
