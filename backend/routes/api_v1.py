from fastapi import APIRouter
from backend.routes.v1 import auth, watchlist, stock

# Create the main API v1 router
api_v1_router = APIRouter(prefix="/api/v1")

# Include all v1 routers
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(watchlist.router, prefix="/watchlist", tags=["Watchlist"])
api_v1_router.include_router(stock.router, prefix="/stock", tags=["Stock"]) 