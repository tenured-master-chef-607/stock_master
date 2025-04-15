import os
import sys
import uvicorn

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath("."))

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8002, reload=True) 