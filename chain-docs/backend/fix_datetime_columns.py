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
    
    print("Checking datetime column types...")
    
    # Check the column types
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name IN ('issued_at', 'created_at')
        ORDER BY ordinal_position
    """)
    
    columns = cur.fetchall()
    print("\nDateTime columns in documents table:")
    for column in columns:
        print(f"- {column[0]}: {column[1]} (nullable: {column[2]}, default: {column[3]})")
    
    # Check if we need to alter the columns to use TIMESTAMP WITH TIME ZONE
    print("\nChecking if column modifications are needed...")
    
    # For issued_at column
    cur.execute("""
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'issued_at'
    """)
    issued_at_type = cur.fetchone()[0]
    
    if issued_at_type != 'timestamp with time zone':
        print("Modifying issued_at column to TIMESTAMP WITH TIME ZONE...")
        cur.execute("ALTER TABLE documents ALTER COLUMN issued_at TYPE TIMESTAMP WITH TIME ZONE USING issued_at AT TIME ZONE 'UTC'")
    
    # For created_at column
    cur.execute("""
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'created_at'
    """)
    created_at_type = cur.fetchone()[0]
    
    if created_at_type != 'timestamp with time zone':
        print("Modifying created_at column to TIMESTAMP WITH TIME ZONE...")
        cur.execute("ALTER TABLE documents ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC'")
        # Also ensure it has the default value
        cur.execute("ALTER TABLE documents ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP")
    
    # Commit changes
    conn.commit()
    
    print("DateTime columns fixed successfully!")
    
    # Verify the new structure
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name IN ('issued_at', 'created_at')
        ORDER BY ordinal_position
    """)
    
    columns = cur.fetchall()
    print("\nUpdated DateTime columns in documents table:")
    for column in columns:
        print(f"- {column[0]}: {column[1]} (nullable: {column[2]}, default: {column[3]})")
    
    # Close connections
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error fixing datetime columns: {e}")
    if 'conn' in locals():
        conn.rollback()
        conn.close()