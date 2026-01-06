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
    
    print("Starting migration of documents table...")
    
    # Step 1: Rename the old table
    print("Renaming old documents table...")
    cur.execute("ALTER TABLE documents RENAME TO documents_old")
    
    # Step 2: Create the new documents table with the correct schema
    print("Creating new documents table...")
    cur.execute("""
        CREATE TYPE document_type AS ENUM (
            'LOC',
            'INVOICE',
            'BILL_OF_LADING',
            'PO',
            'COO',
            'INSURANCE_CERT'
        )
    """)
    
    cur.execute("""
        CREATE TABLE documents (
            id SERIAL PRIMARY KEY,
            owner_id INTEGER NOT NULL REFERENCES users(id),
            doc_type document_type NOT NULL,
            doc_number VARCHAR(255) NOT NULL,
            file_url VARCHAR(500) NOT NULL,
            hash VARCHAR(64) NOT NULL,
            issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Step 3: Migrate existing data (with default values for new fields)
    print("Migrating existing data...")
    cur.execute("""
        INSERT INTO documents (
            id, owner_id, doc_type, doc_number, file_url, hash, issued_at, created_at
        )
        SELECT 
            id,
            COALESCE(uploaded_by, 1) as owner_id,
            'INVOICE' as doc_type,
            COALESCE(filename, 'unknown') as doc_number,
            COALESCE(file_path, '') as file_url,
            COALESCE(sha256_hash, '') as hash,
            CURRENT_TIMESTAMP as issued_at,
            COALESCE(created_at, CURRENT_TIMESTAMP)
        FROM documents_old
    """)
    
    # Step 4: Drop the old table
    print("Dropping old table...")
    cur.execute("DROP TABLE documents_old")
    
    # Commit changes
    conn.commit()
    
    print("Migration completed successfully!")
    
    # Verify the new structure
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'documents' 
        ORDER BY ordinal_position
    """)
    columns = cur.fetchall()
    print("\nNew documents table structure:")
    for column in columns:
        print(f"- {column[0]} ({column[1]})")
    
    # Close connections
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error during migration: {e}")
    if 'conn' in locals():
        conn.rollback()
        conn.close()