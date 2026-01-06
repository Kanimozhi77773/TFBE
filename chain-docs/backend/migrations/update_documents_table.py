"""
Migration script to update the documents table schema
This script adds the new columns and removes the old ones to match the new specification
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import ENUM
import enum
from datetime import datetime

# Define the DocumentType enum
class DocumentType(str, enum.Enum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PO = "PO"
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"

def upgrade(engine):
    """
    Upgrade the database schema to the new documents table structure
    """
    # Create the enum type
    doc_type_enum = ENUM(
        'LOC', 'INVOICE', 'BILL_OF_LADING', 'PO', 'COO', 'INSURANCE_CERT',
        name='document_type'
    )
    doc_type_enum.create(engine, checkfirst=True)
    
    # Get connection
    connection = engine.connect()
    
    # Begin transaction
    trans = connection.begin()
    
    try:
        # Rename old table temporarily
        connection.execute("ALTER TABLE documents RENAME TO documents_old;")
        
        # Create new table with updated schema
        connection.execute("""
            CREATE TABLE documents (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER NOT NULL REFERENCES users(id),
                doc_type document_type NOT NULL,
                doc_number VARCHAR NOT NULL,
                file_url VARCHAR NOT NULL,
                hash VARCHAR NOT NULL,
                issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Copy data from old table (mapping where possible)
        # Note: This is a simplified migration that preserves only compatible data
        connection.execute("""
            INSERT INTO documents (
                id, owner_id, doc_type, doc_number, file_url, hash, issued_at, created_at
            )
            SELECT 
                id, 
                COALESCE(uploaded_by, 0) as owner_id,
                'INVOICE' as doc_type,  -- Default value for existing records
                COALESCE(filename, '') as doc_number,  -- Using filename as doc_number
                COALESCE(file_path, '') as file_url,
                COALESCE(sha256_hash, '') as hash,
                CURRENT_TIMESTAMP as issued_at,  -- Default value for existing records
                COALESCE(created_at, CURRENT_TIMESTAMP)
            FROM documents_old;
        """)
        
        # Drop old table
        connection.execute("DROP TABLE documents_old;")
        
        # Commit transaction
        trans.commit()
        
        print("Documents table successfully updated to new schema")
        
    except Exception as e:
        # Rollback on error
        trans.rollback()
        print(f"Error during migration: {e}")
        raise e
    finally:
        connection.close()

def downgrade(engine):
    """
    Downgrade the database schema to the previous version
    """
    # Get connection
    connection = engine.connect()
    
    # Begin transaction
    trans = connection.begin()
    
    try:
        # Rename current table temporarily
        connection.execute("ALTER TABLE documents RENAME TO documents_new;")
        
        # Recreate old table structure
        connection.execute("""
            CREATE TABLE documents (
                id SERIAL PRIMARY KEY,
                filename VARCHAR,
                file_path VARCHAR,
                sha256_hash VARCHAR,
                content_type VARCHAR,
                uploaded_by INTEGER,
                uploader_role VARCHAR,
                uploader_org VARCHAR,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc')
            );
        """)
        
        # Copy data back (limited mapping)
        connection.execute("""
            INSERT INTO documents (
                id, filename, file_path, sha256_hash, content_type, 
                uploaded_by, uploader_role, uploader_org, created_at
            )
            SELECT 
                id,
                doc_number as filename,
                file_url as file_path,
                hash as sha256_hash,
                'application/pdf' as content_type,  -- Default assumption
                owner_id as uploaded_by,
                '' as uploader_role,
                '' as uploader_org,
                created_at
            FROM documents_new;
        """)
        
        # Drop new table
        connection.execute("DROP TABLE documents_new;")
        
        # Drop enum type
        connection.execute("DROP TYPE IF EXISTS document_type;")
        
        # Commit transaction
        trans.commit()
        
        print("Documents table successfully reverted to previous schema")
        
    except Exception as e:
        # Rollback on error
        trans.rollback()
        print(f"Error during rollback: {e}")
        raise e
    finally:
        connection.close()

if __name__ == "__main__":
    # This would typically be run through a migration framework
    # For manual execution, you would need to pass the engine
    print("This migration script should be run through your migration framework")
    print("Example usage with SQLAlchemy:")
    print("  from sqlalchemy import create_engine")
    print("  engine = create_engine('postgresql://user:password@localhost/trade_finance_db')")
    print("  upgrade(engine)")