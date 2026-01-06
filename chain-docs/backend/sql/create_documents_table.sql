-- CREATE TABLE statement for Documents table in PostgreSQL
-- This matches the SQLAlchemy model in app/models/document.py

CREATE TYPE document_type AS ENUM (
    'LOC',
    'INVOICE',
    'BILL_OF_LADING',
    'PO',
    'COO',
    'INSURANCE_CERT'
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    doc_type document_type NOT NULL,
    doc_number VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    hash VARCHAR(64) NOT NULL,  -- SHA-256 hash is 64 characters
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better query performance
    INDEX idx_documents_owner_id (owner_id),
    INDEX idx_documents_doc_type (doc_type),
    INDEX idx_documents_doc_number (doc_number),
    INDEX idx_documents_issued_at (issued_at),
    INDEX idx_documents_created_at (created_at)
);