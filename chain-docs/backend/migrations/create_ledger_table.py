"""
Migration script to create the ledger_entries table
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.ledger import LedgerEntry, LedgerAction
from app.db.session import engine
from datetime import datetime, timezone

def create_ledger_table():
    """Create the ledger_entries table in the database"""
    try:
        # Create all tables defined in models
        Base.metadata.create_all(bind=engine)
        print("Ledger entries table created successfully!")
        
        # Verify the table was created by checking if we can create a session
        from app.db.session import get_db
        db = next(get_db())
        
        # Check if the table exists by trying a simple query
        try:
            count = db.query(LedgerEntry).count()
            print(f"Ledger entries table is accessible. Current count: {count}")
        except Exception as e:
            print(f"Error accessing ledger entries table: {e}")
        finally:
            db.close()
        
    except Exception as e:
        print(f"Error creating ledger entries table: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Starting ledger table creation...")
    success = create_ledger_table()
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed!")