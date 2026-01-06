# Trade Finance Blockchain Explorer - Module 1 & Module 2

## Project Structure

```
Backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   └── v1/
│   │       ├── routes_auth.py
│   │       └── routes_documents.py
│   ├── core/
│   │   ├── config.py
│   │   ├── jwt_handler.py
│   │   └── security.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   ├── user.py
│   │   └── document.py
│   ├── schemas/
│   │   ├── auth.py
│   │   └── document_schema.py
│   ├── services/
│   │   ├── auth_service.py
│   │   └── document_service.py
│   └── ...
├── tests/
│   ├── conftest.py
│   ├── test_register.py
│   ├── test_login.py
│   └── test_users.py
├── requirements.txt
└── .env

Frontend/
├── src/
│   ├── pages/
│   │   ├── Register.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── UploadDocument.jsx
│   │   ├── DocumentsList.jsx
│   │   └── DocumentDetails.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   ├── DocumentCard.jsx
│   │   └── FileUploadBox.jsx
│   ├── utils/
│   │   ├── axiosInstance.js
│   │   └── documentApi.js
│   ├── App.jsx
│   └── main.jsx
└── ...
```

## Features Implemented

### Backend (FastAPI + PostgreSQL)

1. **Database - Users Table**
   - Schema with id, name, email, password, role, org_name, created_at
   - Role ENUM: 'bank' | 'corporate' | 'auditor' | 'admin'

2. **Auth API with JWT**
   - Config with SECRET_KEY, ALGORITHM, token expiry times (15 min for access, 7 days for refresh)
   - Password handling with Argon2 (more secure than bcrypt)
   - Endpoints:
     - POST /api/v1/auth/register
     - POST /api/v1/auth/login
     - POST /api/v1/auth/refresh
     - POST /api/v1/auth/logout
     - GET /api/v1/auth/me (protected)

3. **JWT Utilities**
   - create_access_token and create_refresh_token functions
   - Token verification middleware

4. **Database - Documents Table** (Module 2 Enhancement)
   - Schema with id, owner_id, doc_type, doc_number, file_url, hash, issued_at, created_at
   - Document types: 'LOC' | 'INVOICE' | 'BILL_OF_LADING' | 'PO' | 'COO' | 'INSURANCE_CERT'
   - SHA-256 hashing for document integrity verification
   - Secure file storage with role-based access control

5. **Document API** (Module 2 Enhancement)
   - Endpoints:
     - POST /api/v1/documents/upload (with metadata)
     - GET /api/v1/documents/my (with filtering)
     - GET /api/v1/documents/{document_id}
     - PUT /api/v1/documents/{document_id} (metadata editing)
     - GET /api/v1/documents/{document_id}/download

### Frontend (React + Tailwind CSS)

1. **Pages/Routes**
   - /register
   - /login
   - /dashboard (protected)
   - /upload (protected)
   - /documents (protected)
   - /documents/:id (protected)

2. **Register Page**
   - Form with name, email, password, role dropdown, org_name
   - Validation and error handling
   - API integration

3. **Login Page**
   - Form with email, password
   - "Remember me" and "Forgot password" features
   - API integration

4. **Dashboard Page**
   - Protected route
   - Auto-fetches user info with token
   - Handles token refresh
   - Logout functionality
   - Document management quick links

5. **Upload Document Page** (Module 2 Enhancement)
   - Form with file selection, document type, document number, and issue date
   - File validation (PDF, JPG, PNG up to 5MB)
   - SHA-256 hashing for document integrity verification

6. **Documents List Page** (Module 2 Enhancement)
   - Grid view of uploaded documents
   - Filtering by document type, number, and date ranges
   - Quick access to document details

7. **Document Details Page** (Module 2 Enhancement)
   - Detailed view of document metadata
   - Download functionality
   - Edit metadata capability

8. **Global Auth Handling**
   - Auth context with user, tokens
   - ProtectedRoute component
   - Auto-redirect for unauthorized access

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd chain-docs/backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up PostgreSQL database:
   - Install PostgreSQL on your system
   - Create a new database: `CREATE DATABASE trade_finance_db;`
   - Create a new user: `CREATE USER username WITH PASSWORD 'password';`
   - Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE trade_finance_db TO username;`
   - Update the .env file with your PostgreSQL credentials

4. Run database initialization:
   ```
   python init_db.py
   ```

5. Start the server:
   ```
   python start_server.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd chain-docs/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Running Tests

1. Navigate to the backend directory:
   ```
   cd chain-docs/backend
   ```

2. Run all tests:
   ```
   python -m pytest tests/ -v
   ```

3. Run specific test file:
   ```
   python -m pytest tests/test_register.py -v
   ```

4. Run tests with coverage:
   ```
   python -m pytest tests/ --cov=app --cov-report=html
   ```

## Usage

1. Register a new user at `/register`
2. Login at `/login`
3. Access the protected dashboard at `/dashboard`
4. Upload documents at `/upload`
5. View and manage documents at `/documents`
6. Use the logout button to securely log out

## Module 2 Enhancements

The following enhancements have been made to Module 2:

1. **Extended Document Schema**: Added doc_type, doc_number, issued_at fields
2. **Enhanced Upload Flow**: Collect additional metadata during upload
3. **Refined Access Control**: Implemented role-based permissions for viewing/editing documents
4. **Filtering Capabilities**: Added search and filter functionality to document listings
5. **Dashboard Improvements**: Enhanced dashboard with document statistics and navigation
6. **Metadata Editing**: Added ability to edit document metadata without re-uploading files

## Module 3 Enhancements - Ledger Explorer & Verification

The following enhancements have been made to Module 3:

1. **Ledger Database Schema**: Added ledger_entries table with document_id, action, actor_id, metadata, and created_at fields
2. **Role-Based Access Control**: Implemented permissions for ledger entries (admin/auditor can view all, bank/corporate can only view their own)
3. **Ledger API Endpoints**: Created GET, POST, PATCH, and DELETE endpoints for ledger management
4. **Frontend Integration**: Added ledger explorer page accessible from the dashboard
5. **Filtering and Pagination**: Added comprehensive filtering and pagination for ledger entries
6. **Dashboard Card**: Added "Ledger Explorer" card to the main dashboard for easy access

For detailed implementation information, see `Module2_Enhancement_Summary.md`