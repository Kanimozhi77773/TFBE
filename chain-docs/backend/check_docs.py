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
    
    print("Checking documents in the database...")
    
    # Count documents
    cur.execute("SELECT COUNT(*) FROM documents")
    count = cur.fetchone()[0]
    print(f"Total documents: {count}")
    
    # Show sample documents
    if count > 0:
        cur.execute("SELECT id, owner_id, doc_type, doc_number, file_url, hash, issued_at, created_at FROM documents LIMIT 5")
        documents = cur.fetchall()
        print("\nSample documents:")
        for doc in documents:
            print(f"- ID: {doc[0]}, Owner: {doc[1]}, Type: {doc[2]}, Number: {doc[3]}")
            print(f"  File: {doc[4]}, Hash: {doc[5]}")
            print(f"  Issued: {doc[6]}, Created: {doc[7]}\n")
    
    # Close connections
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error checking documents: {e}")