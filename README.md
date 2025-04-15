# Stock Master

A web application for analyzing stocks, tracking watchlists, and performing backtests.

## Features

- **Interactive Stock Dashboard**: Real-time monitoring with TradingView charts
- **Watchlists Management**: Organize stocks into custom categories
- **Technical Analysis**: Key indicators and analysis tools
- **Stock Screening**: Filter stocks based on technical and fundamental criteria
- **Customizable Alerts**: Price and indicator-based notifications
- **Responsive Design**: Full mobile and desktop support with dark/light modes

## Tech Stack

### Frontend
- React with TypeScript
- Ant Design components
- TradingView widgets
- Recharts for data visualization
- React Router for navigation
- Styled Components for styling

### Backend
- FastAPI/Flask API server
- Yahoo Finance for market data
- Pandas for data processing
- Python data analysis libraries

## Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL 12+

## Setup Instructions

### 1. Database Setup

Install PostgreSQL if you haven't already:

#### Windows
- Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- During installation, set the password for the postgres user
- The default port is 5432

#### Create Database
- Open pgAdmin (comes with PostgreSQL installation)
- Right-click on "Databases" and select "Create" > "Database"
- Name the database "stock_master"

Alternatively, you can use the command line:
```
psql -U postgres -c "CREATE DATABASE stock_master"
```

### 2. Backend Setup

1. Navigate to the backend directory:
```
cd backend
```

2. Install Python dependencies:
```
pip install -r requirements.txt
```

3. Install additional dependencies:
```
pip install python-jose[cryptography] passlib[bcrypt] python-multipart psycopg2-binary
```

4. Configure environment variables:
   - Create a `.env` file in the backend directory with the following content:
   ```
   # API Configuration
   PORT=8002
   FLASK_ENV=development
   
   # Frontend URL for CORS
   FRONTEND_URL=http://localhost:3000
   
   # Database Configuration
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stock_master
   
   # Secret Key for JWT
   SECRET_KEY=your-secret-key-change-in-production
   
   # Other configurations...
   ```
   - Replace the database connection string with your own credentials if needed

5. Initialize the database:
```
python init_db.py
```

6. Start the backend server:
```
python app.py
```

### 3. Frontend Setup

1. Navigate to the frontend directory:
```
cd frontend
```

2. Install Node.js dependencies:
```
npm install
```

3. Start the frontend development server:
```
npm start
```

## Usage

Once both the backend and frontend servers are running:

1. Access the frontend at [http://localhost:3000](http://localhost:3000)
2. Log in with the default credentials:
   - Username: `admin`
   - Password: `adminpassword`
   - Or create a new account

## Development

### Backend API Documentation

- API documentation is available at [http://localhost:8002/api/docs](http://localhost:8002/api/docs)

### Database Schema

The application uses the following main database models:

- **User**: Stores user account information
- **Stock**: Represents individual stocks
- **StockGroup**: Represents watchlists and their hierarchical organization

### Authentication

- The application uses JWT tokens for authentication
- Tokens are valid for 30 minutes

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:
1. Check if PostgreSQL is running
2. Verify your database credentials in the `.env` file
3. Ensure the database 'stock_master' exists
4. Check if the PostgreSQL port is not blocked by a firewall

## Project Structure

```
stock_master/
├── backend/               # Python API server
│   ├── routes/            # API endpoints
│   └── services/          # Business logic
├── frontend/              # React application
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # UI components
│       └── pages/         # Page layouts
└── requirements.txt       # Python dependencies
```

## API Endpoints

- `/api/stock/search/:query` - Stock search
- `/api/stock/info/:symbol` - Stock information
- `/api/analysis/indicators/:symbol` - Technical indicators
- `/api/watchlist` - Watchlist management

## Customization

Easily customize chart settings, alerts, screening criteria, and UI themes through the application settings.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add YourFeature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [TradingView](https://www.tradingview.com/) for charting library
- [Yahoo Finance](https://finance.yahoo.com/) for financial data
- [Ant Design](https://ant.design/) for UI components 