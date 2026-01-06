# Module 2 Enhancement Summary

This document summarizes all the enhancements made to Module 2 of the Trade Finance Blockchain Explorer application to meet the new requirements.

## Overview of Changes

We've enhanced Module 2 with the following new features:

1. Updated Document schema to match exact specifications
2. Extended upload flow with additional metadata fields
3. Implemented refined access control rules
4. Added filtering/search capabilities
5. Enhanced dashboard UX/UI
6. Updated all document display components with new metadata

## Backend Changes

### 1. Database Schema Updates

#### New Documents Table Schema
```sql
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Key Changes:
- Replaced `uploaded_by` with `owner_id` (FK to users.id)
- Added `doc_type` ENUM field
- Added `doc_number` field
- Renamed `file_path` to `file_url`
- Renamed `sha256_hash` to `hash`
- Added `issued_at` timestamp field
- Kept `created_at` timestamp field

### 2. Model Updates (`app/models/document.py`)

Updated the SQLAlchemy model to match the new schema with proper field mappings and the DocumentType enum.

### 3. Schema Updates (`app/schemas/document_schema.py`)

Created new Pydantic schemas for:
- DocumentUploadRequest
- DocumentUploadResponse
- DocumentDetailsResponse
- DocumentListResponse
- DocumentEditRequest
- DocumentFilterRequest

### 4. Service Layer Updates (`app/services/document_service.py`)

Implemented new access control rules:
- **Bank users**: Can only view/edit their own documents
- **Corporate users**: Can only view/edit their own documents
- **Admin users**: Can view/edit their own documents + documents from bank, corporate, or auditor users
- **Auditor users**: Can view/edit their own documents + documents from bank, corporate, or admin users

Added new methods:
- `edit_document()` for metadata editing
- `get_filtered_documents()` for filtered document listing

### 5. API Routes Updates (`app/api/v1/routes_documents.py`)

Added new endpoints:
- PUT `/api/v1/documents/{document_id}` for editing document metadata
- Enhanced GET `/api/v1/documents/my` with filtering parameters

Modified existing endpoints:
- POST `/api/v1/documents/upload` now accepts additional form fields
- GET `/api/v1/documents/{document_id}/download` updated to use new field names

## Frontend Changes

### 1. Upload Document Page (`src/pages/UploadDocument.jsx`)

Added form fields for:
- Document Type dropdown (LOC, INVOICE, BILL_OF_LADING, PO, COO, INSURANCE_CERT)
- Document Number text input
- Issue Date datetime picker

### 2. Documents List Page (`src/pages/DocumentsList.jsx`)

Added comprehensive filtering capabilities:
- Document Type filter
- Document Number filter (partial match)
- Issue Date range filters
- Created Date range filters

### 3. Document Details Page (`src/pages/DocumentDetails.jsx`)

Added:
- Edit functionality for document metadata
- Display of all new fields (doc_type, doc_number, issued_at)
- Improved UI with better organization of information

### 4. Document Card Component (`src/components/DocumentCard.jsx`)

Updated to display:
- Document type with proper labeling
- Document number
- Issue date
- Creation date
- Hash information

### 5. Dashboard Page (`src/pages/Dashboard.jsx`)

Enhanced with:
- Document count display
- Improved navigation buttons
- Better visual hierarchy

### 6. API Utility (`src/utils/documentApi.js`)

Updated methods to handle:
- New upload parameters
- Document editing
- Filtered document listing

## Access Control Rules Implementation

The new access control rules have been implemented exactly as specified:

| Role | View Own Docs | Edit Own Docs | View Others' Docs | Edit Others' Docs |
|------|---------------|---------------|-------------------|-------------------|
| Bank | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Corporate | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Admin | ✅ Yes | ✅ Yes | ✅ Bank/Corporate/Auditor | ✅ Bank/Corporate/Auditor |
| Auditor | ✅ Yes | ✅ Yes | ✅ Bank/Corporate/Admin | ✅ Bank/Corporate/Admin |

## Filtering Features

The document listing endpoint now supports the following optional query parameters:
- `doc_type`: Exact match on document type
- `doc_number`: Partial match on document number
- `issued_from`/`issued_to`: Date range for issued_at
- `created_from`/`created_to`: Date range for created_at

## Migration Notes

A migration script has been provided to update existing databases from the old schema to the new one. The migration handles data transformation where possible, though some fields may require manual review.

## Testing Recommendations

1. Test document upload with all new fields
2. Verify access control rules for each user role
3. Test document editing functionality
4. Validate filtering across all parameters
5. Ensure backward compatibility with existing documents