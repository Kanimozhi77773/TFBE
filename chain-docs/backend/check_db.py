import psycopg2

try:
    # Connect to the database
    conn = psycopg2.connect(
        host="localhost",
        database="trade_finance_db",
        user="app_user",
        password="appuser"
    )
    
    # Create a cursor
    cur = conn.cursor()
    
    # Get all tables
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    tables = cur.fetchall()
    
    print("Tables in database:")
    for table in tables:
        print(f"- {table[0]}")
    
    # Check if documents table exists
    cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents')")
    exists = cur.fetchone()[0]
    
    if exists:
        print("\nDocuments table exists!")
        # Show table structure
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'documents' 
            ORDER BY ordinal_position
        """)
        columns = cur.fetchall()
        print("\nDocuments table structure:")
        for column in columns:
            print(f"- {column[0]} ({column[1]})")
    else:
        print("\nDocuments table does not exist!")
    
    # Close connections
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error connecting to database: {e}")