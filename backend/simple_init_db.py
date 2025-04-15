import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, Boolean, Column, Integer, String, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import bcrypt

# Load environment variables
load_dotenv()

def get_db_url():
    """Get database URL from environment or user input"""
    # Try to get from .env file first
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        # Ask user for database connection details
        print("PostgreSQL database connection details:")
        host = input("Host [localhost]: ") or "localhost"
        port = input("Port [5432]: ") or "5432"
        dbname = input("Database name [stock_master]: ") or "stock_master"
        user = input("Username [postgres]: ") or "postgres"
        password = input("Password: ")
        
        # Construct connection string
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
    
    print(f"Connecting to database: {db_url}")
    return db_url

# Get database URL
DATABASE_URL = get_db_url()

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create base class for models
Base = declarative_base()

# Define models directly in this file to avoid import issues
class User(Base):
    """Model for user accounts"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

# Association table for many-to-many relationship between StockGroup and Stock
group_stock_association = Table(
    'group_stock_association',
    Base.metadata,
    Column('group_id', Integer, ForeignKey('stock_groups.id')),
    Column('stock_id', Integer, ForeignKey('stocks.id'))
)

class StockGroup(Base):
    """Model for stock groups (watchlists)"""
    __tablename__ = "stock_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    parent_id = Column(Integer, ForeignKey('stock_groups.id'), nullable=True)
    
    # Relationships
    stocks = relationship("Stock", secondary=group_stock_association, back_populates="groups")
    subgroups = relationship("StockGroup", back_populates="parent", cascade="all, delete-orphan")
    parent = relationship("StockGroup", back_populates="subgroups", remote_side=[id])

class Stock(Base):
    """Model for stocks"""
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    note = Column(String, nullable=True)
    
    # Relationships
    groups = relationship("StockGroup", secondary=group_stock_association, back_populates="stocks")

# Password hashing function
def get_password_hash(password):
    """Generate password hash"""
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')

def init_db():
    """Initialize the database with tables and initial data"""
    print("Creating database tables...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
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
                hashed_password=get_password_hash("adminpassword"),
                is_active=True,
                is_superuser=True
            )
            db.add(admin_user)
            
            # Create test user
            test_user = User(
                email="user@example.com",
                username="testuser",
                hashed_password=get_password_hash("userpassword"),
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