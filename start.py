import os
import sys
import subprocess
import threading
import time
import signal
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables for the processes
frontend_process = None
backend_process = None

def start_backend():
    """Start the backend server"""
    logger.info("Starting backend server...")
    os.chdir("backend")
    
    # Use python app.py for Flask or python run.py for FastAPI
    try:
        # Try Flask app first
        if os.path.exists("app.py"):
            cmd = [sys.executable, "app.py"]
            logger.info("Starting Flask backend...")
        else:
            # Otherwise try FastAPI
            cmd = [sys.executable, "run.py"]
            logger.info("Starting FastAPI backend...")
            
        return subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
    except Exception as e:
        logger.error(f"Failed to start backend: {e}")
        return None
        
def start_frontend():
    """Start the frontend development server"""
    logger.info("Starting frontend server...")
    os.chdir("frontend")
    
    try:
        # Check if npm is available
        try:
            subprocess.check_output(["npm", "--version"])
        except:
            logger.error("npm not found. Make sure Node.js is installed and in your PATH.")
            return None
            
        # Run npm start
        return subprocess.Popen(
            ["npm", "start"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
    except Exception as e:
        logger.error(f"Failed to start frontend: {e}")
        return None

def log_output(process, prefix):
    """Log the output from a subprocess"""
    for line in iter(process.stdout.readline, ''):
        logger.info(f"{prefix}: {line.strip()}")
        
def signal_handler(sig, frame):
    """Handle Ctrl+C to gracefully shut down both servers"""
    logger.info("Shutting down servers...")
    
    if frontend_process:
        logger.info("Terminating frontend...")
        frontend_process.terminate()
        
    if backend_process:
        logger.info("Terminating backend...")
        backend_process.terminate()
        
    logger.info("Cleanup complete")
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Store current directory to return to later
    root_dir = os.getcwd()
    
    # Start backend
    os.chdir(root_dir)
    backend_process = start_backend()
    
    if not backend_process:
        logger.error("Failed to start backend. Exiting...")
        sys.exit(1)
        
    # Create a thread to log backend output
    backend_thread = threading.Thread(target=log_output, args=(backend_process, "Backend"), daemon=True)
    backend_thread.start()
    
    # Wait a moment for backend to start
    time.sleep(2)
    
    # Start frontend
    os.chdir(root_dir)
    frontend_process = start_frontend()
    
    if not frontend_process:
        logger.error("Failed to start frontend. Exiting...")
        backend_process.terminate()
        sys.exit(1)
        
    # Create a thread to log frontend output
    frontend_thread = threading.Thread(target=log_output, args=(frontend_process, "Frontend"), daemon=True)
    frontend_thread.start()
    
    logger.info("Both servers are running. Press Ctrl+C to stop.")
    
    try:
        # Keep the main thread alive to allow signal handling
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None) 
import sys
import subprocess
import threading
import time
import signal
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables for the processes
frontend_process = None
backend_process = None

def start_backend():
    """Start the backend server"""
    logger.info("Starting backend server...")
    os.chdir("backend")
    
    # Use python app.py for Flask or python run.py for FastAPI
    try:
        # Try Flask app first
        if os.path.exists("app.py"):
            cmd = [sys.executable, "app.py"]
            logger.info("Starting Flask backend...")
        else:
            # Otherwise try FastAPI
            cmd = [sys.executable, "run.py"]
            logger.info("Starting FastAPI backend...")
            
        return subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
    except Exception as e:
        logger.error(f"Failed to start backend: {e}")
        return None
        
def start_frontend():
    """Start the frontend development server"""
    logger.info("Starting frontend server...")
    os.chdir("frontend")
    
    try:
        # Check if npm is available
        try:
            subprocess.check_output(["npm", "--version"])
        except:
            logger.error("npm not found. Make sure Node.js is installed and in your PATH.")
            return None
            
        # Run npm start
        return subprocess.Popen(
            ["npm", "start"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
    except Exception as e:
        logger.error(f"Failed to start frontend: {e}")
        return None

def log_output(process, prefix):
    """Log the output from a subprocess"""
    for line in iter(process.stdout.readline, ''):
        logger.info(f"{prefix}: {line.strip()}")
        
def signal_handler(sig, frame):
    """Handle Ctrl+C to gracefully shut down both servers"""
    logger.info("Shutting down servers...")
    
    if frontend_process:
        logger.info("Terminating frontend...")
        frontend_process.terminate()
        
    if backend_process:
        logger.info("Terminating backend...")
        backend_process.terminate()
        
    logger.info("Cleanup complete")
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Store current directory to return to later
    root_dir = os.getcwd()
    
    # Start backend
    os.chdir(root_dir)
    backend_process = start_backend()
    
    if not backend_process:
        logger.error("Failed to start backend. Exiting...")
        sys.exit(1)
        
    # Create a thread to log backend output
    backend_thread = threading.Thread(target=log_output, args=(backend_process, "Backend"), daemon=True)
    backend_thread.start()
    
    # Wait a moment for backend to start
    time.sleep(2)
    
    # Start frontend
    os.chdir(root_dir)
    frontend_process = start_frontend()
    
    if not frontend_process:
        logger.error("Failed to start frontend. Exiting...")
        backend_process.terminate()
        sys.exit(1)
        
    # Create a thread to log frontend output
    frontend_thread = threading.Thread(target=log_output, args=(frontend_process, "Frontend"), daemon=True)
    frontend_thread.start()
    
    logger.info("Both servers are running. Press Ctrl+C to stop.")
    
    try:
        # Keep the main thread alive to allow signal handling
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None) 
import sys
import subprocess
import threading
import time
import signal
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables for the processes
frontend_process = None
backend_process = None

def start_backend():
    """Start the backend server"""
    logger.info("Starting backend server...")
    os.chdir("backend")
    
    # Use python app.py for Flask or python run.py for FastAPI
    try:
        # Try Flask app first
        if os.path.exists("app.py"):
            cmd = [sys.executable, "app.py"]
            logger.info("Starting Flask backend...")
        else:
            # Otherwise try FastAPI
            cmd = [sys.executable, "run.py"]
            logger.info("Starting FastAPI backend...")
            
        return subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
    except Exception as e:
        logger.error(f"Failed to start backend: {e}")
        return None
        
def start_frontend():
    """Start the frontend development server"""
    logger.info("Starting frontend server...")
    os.chdir("frontend")
    
    try:
        # Check if npm is available
        try:
            subprocess.check_output(["npm", "--version"])
        except:
            logger.error("npm not found. Make sure Node.js is installed and in your PATH.")
            return None
            
        # Run npm start
        return subprocess.Popen(
            ["npm", "start"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
    except Exception as e:
        logger.error(f"Failed to start frontend: {e}")
        return None

def log_output(process, prefix):
    """Log the output from a subprocess"""
    for line in iter(process.stdout.readline, ''):
        logger.info(f"{prefix}: {line.strip()}")
        
def signal_handler(sig, frame):
    """Handle Ctrl+C to gracefully shut down both servers"""
    logger.info("Shutting down servers...")
    
    if frontend_process:
        logger.info("Terminating frontend...")
        frontend_process.terminate()
        
    if backend_process:
        logger.info("Terminating backend...")
        backend_process.terminate()
        
    logger.info("Cleanup complete")
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Store current directory to return to later
    root_dir = os.getcwd()
    
    # Start backend
    os.chdir(root_dir)
    backend_process = start_backend()
    
    if not backend_process:
        logger.error("Failed to start backend. Exiting...")
        sys.exit(1)
        
    # Create a thread to log backend output
    backend_thread = threading.Thread(target=log_output, args=(backend_process, "Backend"), daemon=True)
    backend_thread.start()
    
    # Wait a moment for backend to start
    time.sleep(2)
    
    # Start frontend
    os.chdir(root_dir)
    frontend_process = start_frontend()
    
    if not frontend_process:
        logger.error("Failed to start frontend. Exiting...")
        backend_process.terminate()
        sys.exit(1)
        
    # Create a thread to log frontend output
    frontend_thread = threading.Thread(target=log_output, args=(frontend_process, "Frontend"), daemon=True)
    frontend_thread.start()
    
    logger.info("Both servers are running. Press Ctrl+C to stop.")
    
    try:
        # Keep the main thread alive to allow signal handling
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None) 