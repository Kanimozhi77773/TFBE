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
    
    print("Resetting document ID sequence...")
    
    # Get the sequence name
    cur.execute("""
        SELECT pg_get_serial_sequence('documents', 'id')
    """)
    sequence_name = cur.fetchone()[0]
    print(f"Sequence name: {sequence_name}")
    
    # Reset the sequence for the documents table
    cur.execute(f"""
        SELECT setval('{sequence_name}', 
                     (SELECT COALESCE(MAX(id), 0) FROM documents))
    """)
    
    # Commit changes
    conn.commit()
    
    print("Document ID sequence reset successfully!")
    
    # Check the current sequence value
    cur.execute(f"SELECT last_value FROM {sequence_name}")
    last_value = cur.fetchone()[0]
    print(f"Current sequence value: {last_value}")
    
    # Close connections
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error resetting document sequence: {e}")
    if 'conn' in locals():
        conn.rollback()
        conn.close()