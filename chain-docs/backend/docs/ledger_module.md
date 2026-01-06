# Ledger Explorer & Verification Module

## Overview
The Ledger Explorer & Verification module provides a blockchain-style ledger system for tracking document-related actions and events in the trade finance system. This module allows users to create, view, and manage ledger entries that represent various actions performed on documents.

## Database Schema

### LedgerEntries Table
- `id` (INT, PK): Unique identifier for the ledger entry
- `document_id` (FK → Documents.id): Foreign key to the associated document
- `action` (ENUM): Action type (ISSUED, AMENDED, SHIPPED, RECEIVED, PAID, CANCELLED, VERIFIED)
- `actor_id` (FK → Users.id): Foreign key to the user who performed the action
- `metadata` (JSONB): Additional metadata associated with the action
- `created_at` (TIMESTAMP): Timestamp when the entry was created

## Role-Based Access Control

### Admin Users (admin + auditor roles)
- Can view **all ledger entries** in the database
- Can **edit** ledger entries (only the `action` field)
- Can **delete** ledger entries
- Have access to all filters and search options

### Bank Users (bank + corporate roles)
- Can view **only their own ledger entries** (entries where actor_id = their user.id)
- Can **create** new ledger entries
- Cannot edit or delete any ledger entries
- Can only create entries for documents they own

## API Endpoints

### GET /api/v1/ledger
- **Permissions**: All users
- **Function**: List ledger entries with pagination and filtering
- **Query Parameters**:
  - `limit` (int): Number of entries per page (default: 10)
  - `offset` (int): Offset for pagination (default: 0)
  - `document_number` (string): Filter by document number
  - `action` (string): Filter by action type
  - `actor_name` (string): Filter by actor name
  - `issued_from` (datetime): Filter by issued date from
  - `issued_to` (datetime): Filter by issued date to
  - `created_from` (datetime): Filter by creation date from
  - `created_to` (datetime): Filter by creation date to

### POST /api/v1/ledger
- **Permissions**: Bank and corporate users only (admin and auditor NOT allowed)
- **Function**: Create a new ledger entry
- **Request Body**:
  - `document_id` (int): ID of the document
  - `action` (string): Action type (ISSUED, AMENDED, etc.)
  - `metadata` (JSON): Optional metadata

### PATCH /api/v1/ledger/{id}
- **Permissions**: Admin and auditor users only
- **Function**: Update a ledger entry (only action field)
- **Request Body**:
  - `action` (string): New action type

### DELETE /api/v1/ledger/{id}
- **Permissions**: Admin and auditor users only
- **Function**: Delete a ledger entry

## Frontend Components

### Dashboard Integration
- Added "Ledger Explorer" card to the main dashboard
- Provides direct access to the ledger explorer page

### Ledger List Page
- Paginated view of ledger entries
- Filter functionality for all user roles
- Role-based visibility (admin/auditor see all, bank/corporate see own)
- Clear filters functionality

## Permissions Summary

| Action | Admin | Auditor | Bank | Corporate |
|--------|-------|---------|------|-----------|
| View All Entries | ✅ | ✅ | ❌* | ❌* |
| View Own Entries | ✅ | ✅ | ✅ | ✅ |
| Create Entries | ❌ | ❌ | ✅ | ✅ |
| Edit Entries | ✅ | ✅ | ❌ | ❌ |
| Delete Entries | ✅ | ✅ | ❌ | ❌ |

*Bank and corporate users can only view entries where they are the actor

## Usage Examples

### Creating a Ledger Entry
Bank and corporate users can create ledger entries to track document actions:
1. Navigate to the ledger section
2. Use the "Create Ledger Entry" form
3. Select a document they own
4. Choose an action type
5. Add optional metadata
6. Submit the entry

### Viewing Ledger Entries
All users can view ledger entries based on their role:
- Admin/auditor: All entries in the system
- Bank/corporate: Only entries where they are the actor

### Filtering
All users can apply filters to narrow down the ledger entries displayed:
- Document number
- Action type
- Actor name
- Date ranges for issued and created dates