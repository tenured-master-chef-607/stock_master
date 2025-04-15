import os
import sys
import uvicorn
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Add parent directory to Python path
    parent_dir = os.path.dirname(current_dir)
    if parent_dir not in sys.path:
        sys.path.append(parent_dir)
    
    logger.info("Starting FastAPI server...")
    
    # Determine the import path based on execution directory
    if os.path.basename(os.getcwd()) == "backend":
        # If running from backend directory
        app_module = "main:app"
    else:
        # If running from project root
        app_module = "backend.main:app"
    
    # Run the FastAPI server
    uvicorn.run(
        app_module,
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )