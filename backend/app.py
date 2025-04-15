from flask import Flask
from flask_cors import CORS
import logging
from routes.stock import stock_bp
from routes.watchlist import watchlist_bp
from routes.analysis import analysis_bp
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if os.getenv("FLASK_ENV") == "development" else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)

    # Configure CORS
    CORS(app, 
        origins=["http://localhost:3000", "http://localhost:3001"],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "Accept"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Register blueprints
    app.register_blueprint(stock_bp, url_prefix='/api/stock')
    app.register_blueprint(watchlist_bp, url_prefix='/api/watchlist')
    app.register_blueprint(analysis_bp, url_prefix='/api/analysis')

    # Root endpoint
    @app.route("/", methods=["GET"])
    def root():
        return {"message": "Stock Master API", "version": "1.0.0"}

    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8002))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"Starting Flask server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug) 