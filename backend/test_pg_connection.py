import psycopg2
import getpass

print("Testing PostgreSQL connection:")
print("------------------------------")

try:
    # Get connection details
    host = input("Host [localhost]: ") or "localhost"
    port = input("Port [5432]: ") or "5432"
    dbname = input("Database name [postgres]: ") or "postgres"  # Use the default postgres database
    user = input("Username [postgres]: ") or "postgres"
    password = getpass.getpass("Password: ")
    
    # Construct connection string
    conn_string = f"host={host} port={port} dbname={dbname} user={user} password={password}"
    
    print(f"\nAttempting to connect to PostgreSQL...\n")
    
    # Try to connect
    conn = psycopg2.connect(conn_string)
    
    # Get server version
    cursor = conn.cursor()
    cursor.execute('SELECT version();')
    version = cursor.fetchone()[0]
    cursor.close()
    
    print("Connection successful!")
    print(f"PostgreSQL version: {version}")
    
    # List databases
    cursor = conn.cursor()
    cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
    databases = cursor.fetchall()
    cursor.close()
    
    print("\nAvailable databases:")
    for db in databases:
        print(f"- {db[0]}")
    
    # Check if stock_master database exists
    stock_master_exists = any(db[0] == 'stock_master' for db in databases)
    
    if not stock_master_exists:
        create_db = input("\nDatabase 'stock_master' does not exist. Create it? [y/N]: ")
        if create_db.lower() == 'y':
            conn.autocommit = True
            cursor = conn.cursor()
            try:
                cursor.execute("CREATE DATABASE stock_master;")
                print("Database 'stock_master' created successfully!")
            except Exception as e:
                print(f"Error creating database: {e}")
            finally:
                cursor.close()
    
    conn.close()
    
    # Create .env file with correct connection details
    print("\nUpdating .env file with connection details...")
    with open('.env', 'r') as f:
        lines = f.readlines()
    
    with open('.env', 'w') as f:
        for line in lines:
            if line.startswith('DATABASE_URL='):
                f.write(f'DATABASE_URL=postgresql://{user}:{password}@{host}:{port}/stock_master\n')
            else:
                f.write(line)
    
    print("Connection details saved to .env file.")
    print("\nYou can now run the database initialization script:")
    print("python simple_init_db.py")
    
except Exception as e:
    print(f"Connection failed: {e}")
    print("\nPossible solutions:")
    print("1. Make sure PostgreSQL is running")
    print("2. Verify your username and password")
    print("3. Check if PostgreSQL is installed:")
    print("   - On Windows: Look for PostgreSQL in the Start menu or Control Panel")
    print("   - You can download PostgreSQL from: https://www.postgresql.org/download/")
    print("\nFor PostgreSQL installation:")
    print("1. Download and install PostgreSQL from https://www.postgresql.org/download/")
    print("2. During installation, set a password for the 'postgres' user")
    print("3. After installation, run this script again with the correct credentials") 