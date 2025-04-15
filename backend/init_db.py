import os
import sys
from dotenv import load_dotenv

# Add the parent directory to the system path
sys.path.insert(0, os.path.abspath("."))

# Import models and database
from models import User, Stock, StockGroup
from database import engine, Base, SessionLocal
from services.auth import auth_service

# Load environment variables
load_dotenv()

def init_db():
    """Initialize the database with tables and initial data"""
    print("Creating database tables...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if we already have users
        user_count = db.query(User).count()
        
        if user_count == 0:
            print("Creating admin user...")
            # Create admin user
            admin_user = User(
                email="admin@example.com",
                username="admin",
                hashed_password=auth_service.get_password_hash("adminpassword"),
                is_active=True,
                is_superuser=True
            )
            db.add(admin_user)
            
            # Create test user
            test_user = User(
                email="user@example.com",
                username="testuser",
                hashed_password=auth_service.get_password_hash("userpassword"),
                is_active=True,
                is_superuser=False
            )
            db.add(test_user)
            
            db.commit()
            print("Admin user created successfully!")
        else:
            print(f"Database already has {user_count} users, skipping creation of admin user.")
        
        # Check if default stock group exists
        default_group = db.query(StockGroup).filter(StockGroup.name == "Default").first()
        
        if not default_group:
            print("Creating default stock group...")
            # Create default group
            default_group = StockGroup(
                name="Default",
                description="Default stock group"
            )
            db.add(default_group)
            
            # Create technology group
            tech_group = StockGroup(
                name="Technology",
                description="Technology stocks",
                parent=default_group
            )
            db.add(tech_group)
            
            # Add some stocks
            apple_stock = Stock(
                symbol="AAPL",
                name="Apple Inc."
            )
            db.add(apple_stock)
            
            microsoft_stock = Stock(
                symbol="MSFT",
                name="Microsoft Corporation"
            )
            db.add(microsoft_stock)
            
            # Associate stocks with groups
            tech_group.stocks.append(apple_stock)
            tech_group.stocks.append(microsoft_stock)
            
            db.commit()
            print("Default stock groups and stocks created successfully!")
        else:
            print("Default stock group already exists, skipping creation.")
            
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
    finally:
        db.close()
    
    print("Database initialization completed!")

if __name__ == "__main__":
    init_db() 