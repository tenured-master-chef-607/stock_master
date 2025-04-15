import os
import subprocess
import sys
import time
import signal
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] %(message)s",
)

PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

backend_process = None
frontend_process = None


def run_backend():
    """Run the backend FastAPI server."""
    global backend_process
    logging.info("Starting backend server...")

    cmd = "uvicorn backend.main:app --reload --port 8002"
    backend_process = subprocess.Popen(
        cmd,
        shell=True,
        cwd=PROJECT_ROOT
    )
    logging.info(f"Backend server started with PID {backend_process.pid}")


def run_frontend():
    """Run the frontend (npm start)."""
    global frontend_process
    logging.info("Starting frontend server...")

    cmd = "npm start"
    frontend_process = subprocess.Popen(
        cmd,
        shell=True,
        cwd=FRONTEND_DIR
    )
    logging.info(f"Frontend server started with PID {frontend_process.pid}")


def shutdown_services():
    """Shut down both services cleanly."""
    logging.info("Shutting down services...")

    for proc, name in [(backend_process, "Backend"), (frontend_process, "Frontend")]:
        if proc and proc.poll() is None:  # Still running
            try:
                if sys.platform == "win32":
                    proc.terminate()
                else:
                    proc.send_signal(signal.SIGTERM)
                proc.wait(timeout=10)
                logging.info(f"{name} service terminated.")
            except subprocess.TimeoutExpired:
                proc.kill()
                logging.warning(f"{name} service force killed.")
        else:
            logging.warning(f"{name} service was not running.")


def main():
    try:
        run_backend()
        time.sleep(2)  # Optional: Give backend time to start
        run_frontend()

        # Wait for subprocesses (block here)
        while True:
            if backend_process.poll() is not None:
                logging.warning("Backend process exited.")
                break
            if frontend_process.poll() is not None:
                logging.warning("Frontend process exited.")
                break
            time.sleep(1)

    except KeyboardInterrupt:
        logging.info("Interrupt received. Exiting...")

    except Exception as e:
        logging.error(f"An error occurred: {e}", exc_info=True)

    finally:
        shutdown_services()


if __name__ == "__main__":
    main()
