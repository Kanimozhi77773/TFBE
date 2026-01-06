import psycopg2

try:
    # Connect to the database
    conn = psycopg2.connect(
        host='localhost',
        database='trade_finance_db',
        user='app_user',
        password='appuser',
        port=5432
    )
    
    print("Connected successfully to trade_finance_db!")
    
    # Create a cursor
    cur = conn.cursor()
    
    # Get all tables
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    tables = cur.fetchall()
    
    print("\nTables in the database:")
    for table in tables:
        print(f"- {table[0]}")
        
    # Close connection
    conn.close()
    print("\nConnection closed.")
    
except Exception as e:
    print(f"Error: {e}")