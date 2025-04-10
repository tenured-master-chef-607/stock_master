# Stock Master

A modern, full-stack stock analysis and portfolio management application built with React, Flask, and TradingView charts.

![Stock Master Dashboard](https://via.placeholder.com/1200x600/1f1f1f/1890ff?text=Stock+Master+Dashboard)

## Features

- **Interactive Stock Dashboard**: Monitor your favorite stocks with advanced TradingView charts
- **Watchlists Management**: Organize stocks into custom groups and categories
- **Technical Analysis**: Automatic calculation of key technical indicators
- **Stock Screening**: Find stocks based on specific technical and fundamental criteria
- **Customizable Alerts**: Get notified when stocks hit specific targets
- **Responsive Design**: Fully responsive UI with light and dark mode support

## Tech Stack

### Frontend
- React with TypeScript
- Ant Design component library
- TradingView charting widgets
- Recharts for data visualization
- Axios for API communication

### Backend
- Flask API server
- Yahoo Finance for stock data
- Pandas for data processing
- SQLite for data storage
- Modular architecture with service-based design

## Getting Started

### Prerequisites
- Node.js (v14+)
- Python 3.8+
- pip & npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/stock_master.git
cd stock_master
```

2. Set up the backend
```bash
# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (copy .env.example to .env and fill in values)
cp backend/.env.example backend/.env
```

3. Set up the frontend
```bash
# Install dependencies
npm install

# Configure environment variables
cp frontend/.env.example frontend/.env
```

4. Run the application
```bash
# Start the backend server (from the project root)
cd backend
flask run --port=8002

# Start the frontend server (in a new terminal, from the project root)
cd frontend
npm start
```

5. Access the application at http://localhost:3000

## Project Structure

```
stock_master/
├── backend/               # Python Flask backend
│   ├── data/              # Data storage
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic & services
│   ├── app.py             # Flask application entry point
│   └── requirements.txt   # Python dependencies
│
├── frontend/              # React frontend
│   ├── public/            # Static files
│   └── src/               # Source code
│       ├── components/    # React components
│       ├── pages/         # Page components
│       ├── types/         # TypeScript type definitions
│       └── App.tsx        # Main application component
│
└── README.md              # Project documentation
```

## API Endpoints

### Stock Data
- `GET /api/stock/search/:query` - Search for stocks
- `GET /api/stock/validate/:symbol` - Validate stock symbol
- `GET /api/stock/info/:symbol` - Get stock information
- `GET /api/stock/note/:symbol` - Get notes for a stock
- `POST /api/stock/note` - Update stock notes

### Analysis
- `GET /api/analysis/stock/:symbol` - Get stock analysis report
- `GET /api/analysis/backtest/:symbol` - Run backtest analysis
- `GET /api/analysis/indicators/:symbol` - Get technical indicators
- `POST /api/analysis/screening` - Screen stocks based on criteria

### Watchlist
- `GET /api/watchlist` - Get all watchlists
- `POST /api/watchlist/add` - Add stock to watchlist
- `DELETE /api/watchlist/:group/:symbol` - Remove stock from watchlist
- `POST /api/watchlist/move` - Move stock between groups
- `POST /api/watchlist/reorder` - Reorder stocks within a group

## Customization

Stock Master is designed to be highly customizable. Key areas for customization include:

1. **Chart Settings**: Modify chart styles, timeframes, and indicators
2. **Alert Conditions**: Define custom alert triggers and notification methods
3. **Screening Criteria**: Add custom screening criteria and logic
4. **UI Themes**: Customize the look and feel of the application

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Copyright

© 2023 Tianjie Qiu. All rights reserved.

## Acknowledgments

- [TradingView](https://www.tradingview.com/) for their charting library
- [Yahoo Finance](https://finance.yahoo.com/) for financial data
- [Ant Design](https://ant.design/) for the UI components 