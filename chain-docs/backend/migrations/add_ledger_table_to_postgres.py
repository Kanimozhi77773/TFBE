"""
Migration script to add the ledger_entries table to the existing PostgreSQL database
"""
import os
import sys
from sqlalchemy import create_engine, text

# Add the backend directory to the path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import DATABASE_URL

def migrate_ledger_table():
    """Add the ledger_entries table to the PostgreSQL database"""
    
    # Create a new engine for direct SQL execution
    engine = create_engine(DATABASE_URL)
    
    # SQL to create the ledger_entries table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS "LedgerEntries" (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        actor_id INTEGER NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_ledger_entries_document_id ON "LedgerEntries"(document_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_entries_actor_id ON "LedgerEntries"(actor_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_entries_action ON "LedgerEntries"(action);
    CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at ON "LedgerEntries"(created_at);
    """
    
    try:
        print("Connecting to database...")
        
        with engine.connect() as conn:
            # Execute the table creation SQL
            print("Creating ledger_entries table...")
            conn.execute(text(create_table_sql))
            conn.commit()
            
        print("Ledger entries table created successfully!")
        
        # Verify the table was created
        with engine.connect() as conn:
            result = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'LedgerEntries');"))
            table_exists = result.scalar()
            
            if table_exists:
                print("✓ Verification: LedgerEntries table exists in the database")
                
                # Check the table structure
                result = conn.execute(text("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'LedgerEntries' 
                    ORDER BY ordinal_position;
                """))
                
                print("\nTable structure:")
                for row in result:
                    print(f"  - {row[0]}: {row[1]}")
            else:
                print("✗ Error: ledger_entries table was not created properly")
                return False
                
        return True
        
    except Exception as e:
        print(f"Error creating ledger_entries table: {e}")
        return False

if __name__ == "__main__":
    print("Starting ledger table migration...")
    success = migrate_ledger_table()
    if success:
        print("\nMigration completed successfully!")
        print("The ledger_entries table has been added to your PostgreSQL database.")
    else:
        print("\nMigration failed!")
        print("Please check your database connection and credentials.")