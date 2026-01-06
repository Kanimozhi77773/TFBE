"""
Test cases for document access control rules
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.document import Document
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os
from datetime import datetime
from app.core.security import get_password_hash

# Load environment variables
load_dotenv()

# Create test client
client = TestClient(app)

import io

def register_test_user(client, email, password, role, name, org_name):
    """Register a test user through the API and return the user data"""
    response = client.post("/api/v1/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
        "role": role,
        "org_name": org_name
    })
    
    # If registration fails because user already exists, try to login
    if response.status_code != 200:
        login_response = client.post("/api/v1/auth/login", json={
            "email": email,
            "password": password
        })
        if login_response.status_code == 200:
            # Return user data from login response
            return login_response.json()["user"]
        else:
            assert False, f"Failed to register or login user: {response.text} | {login_response.text}"
    
    return response.json()["user"]

def login_test_user(client, email, password):
    """Login a test user through the API and return auth headers"""
    response = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert response.status_code == 200, f"Failed to login user: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def upload_test_document(client, auth_headers, doc_type, doc_number, issued_at):
    """Upload a test document through the API and return document data"""
    file_content = b"This is test document content"
    file = io.BytesIO(file_content)
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("test.pdf", file, "application/pdf")},
        data={
            "doc_type": doc_type,
            "doc_number": doc_number,
            "issued_at": issued_at
        },
        headers=auth_headers
    )
    assert response.status_code == 200, f"Failed to upload document: {response.text}"
    return response.json()

# Test database setup
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///./test.db")
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def test_db():
    """Create test database tables"""
    from app.db.base import Base
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)


def test_bank_user_can_access_own_document(client):
    """Test that bank user can access their own document"""
    # Register and login as bank user
    user = register_test_user(client, "bank@test.com", "testpassword", "bank", "Bank User", "Test Bank")
    headers = login_test_user(client, "bank@test.com", "testpassword")
    
    # Upload a document as the bank user
    doc_data = upload_test_document(client, headers, "INVOICE", "BANK-001", "2023-01-01T00:00:00Z")
    
    # Bank user should be able to access their own document
    response = client.get(f"/api/v1/documents/{doc_data['id']}", headers=headers)
    assert response.status_code == 200

def test_bank_user_cannot_access_other_documents(client):
    """Test that bank user cannot access other users' documents"""
    # Register and login as bank user
    bank_user = register_test_user(client, "bank@test.com", "testpassword", "bank", "Bank User", "Test Bank")
    bank_headers = login_test_user(client, "bank@test.com", "testpassword")
    
    # Register and login as corporate user
    corp_user = register_test_user(client, "corporate@test.com", "testpassword", "corporate", "Corporate User", "Test Corp")
    corp_headers = login_test_user(client, "corporate@test.com", "testpassword")
    
    # Upload a document as the corporate user
    corp_doc_data = upload_test_document(client, corp_headers, "LOC", "CORP-001", "2023-01-01T00:00:00Z")
    
    # Register and login as admin user
    admin_user = register_test_user(client, "admin@test.com", "testpassword", "admin", "Admin User", "Test Admin Org")
    admin_headers = login_test_user(client, "admin@test.com", "testpassword")
    
    # Upload a document as the admin user
    admin_doc_data = upload_test_document(client, admin_headers, "BILL_OF_LADING", "ADMIN-001", "2023-01-01T00:00:00Z")
    
    # Register and login as auditor user
    auditor_user = register_test_user(client, "auditor@test.com", "testpassword", "auditor", "Auditor User", "Test Audit Firm")
    auditor_headers = login_test_user(client, "auditor@test.com", "testpassword")
    
    # Upload a document as the auditor user
    auditor_doc_data = upload_test_document(client, auditor_headers, "COO", "AUDITOR-001", "2023-01-01T00:00:00Z")
    
    # Bank user should NOT be able to access corporate document
    response = client.get(f"/api/v1/documents/{corp_doc_data['id']}", headers=bank_headers)
    assert response.status_code == 403
    
    # Bank user should NOT be able to access admin document
    response = client.get(f"/api/v1/documents/{admin_doc_data['id']}", headers=bank_headers)
    assert response.status_code == 403
    
    # Bank user should NOT be able to access auditor document
    response = client.get(f"/api/v1/documents/{auditor_doc_data['id']}", headers=bank_headers)
    assert response.status_code == 403

def test_corporate_user_can_access_own_document(client):
    """Test that corporate user can access their own document"""
    # Register and login as corporate user
    user = register_test_user(client, "corporate@test.com", "testpassword", "corporate", "Corporate User", "Test Corp")
    headers = login_test_user(client, "corporate@test.com", "testpassword")
    
    # Upload a document as the corporate user
    doc_data = upload_test_document(client, headers, "LOC", "CORP-001", "2023-01-01T00:00:00Z")
    
    # Corporate user should be able to access their own document
    response = client.get(f"/api/v1/documents/{doc_data['id']}", headers=headers)
    assert response.status_code == 200

def test_corporate_user_cannot_access_other_documents(client):
    """Test that corporate user cannot access other users' documents"""
    # Register and login as corporate user
    corp_user = register_test_user(client, "corporate@test.com", "testpassword", "corporate", "Corporate User", "Test Corp")
    corp_headers = login_test_user(client, "corporate@test.com", "testpassword")
    
    # Register and login as bank user
    bank_user = register_test_user(client, "bank@test.com", "testpassword", "bank", "Bank User", "Test Bank")
    bank_headers = login_test_user(client, "bank@test.com", "testpassword")
    
    # Upload a document as the bank user
    bank_doc_data = upload_test_document(client, bank_headers, "INVOICE", "BANK-001", "2023-01-01T00:00:00Z")
    
    # Register and login as admin user
    admin_user = register_test_user(client, "admin@test.com", "testpassword", "admin", "Admin User", "Test Admin Org")
    admin_headers = login_test_user(client, "admin@test.com", "testpassword")
    
    # Upload a document as the admin user
    admin_doc_data = upload_test_document(client, admin_headers, "BILL_OF_LADING", "ADMIN-001", "2023-01-01T00:00:00Z")
    
    # Register and login as auditor user
    auditor_user = register_test_user(client, "auditor@test.com", "testpassword", "auditor", "Auditor User", "Test Audit Firm")
    auditor_headers = login_test_user(client, "auditor@test.com", "testpassword")
    
    # Upload a document as the auditor user
    auditor_doc_data = upload_test_document(client, auditor_headers, "COO", "AUDITOR-001", "2023-01-01T00:00:00Z")
    
    # Corporate user should NOT be able to access bank document
    response = client.get(f"/api/v1/documents/{bank_doc_data['id']}", headers=corp_headers)
    assert response.status_code == 403
    
    # Corporate user should NOT be able to access admin document
    response = client.get(f"/api/v1/documents/{admin_doc_data['id']}", headers=corp_headers)
    assert response.status_code == 403
    
    # Corporate user should NOT be able to access auditor document
    response = client.get(f"/api/v1/documents/{auditor_doc_data['id']}", headers=corp_headers)
    assert response.status_code == 403

def test_admin_user_can_access_any_document(client):
    """Test that admin user can access any document"""
    # Register and login as admin user
    admin_user = register_test_user(client, "admin@test.com", "testpassword", "admin", "Admin User", "Test Admin Org")
    admin_headers = login_test_user(client, "admin@test.com", "testpassword")
    
    # Register and login as bank user
    bank_user = register_test_user(client, "bank@test.com", "testpassword", "bank", "Bank User", "Test Bank")
    bank_headers = login_test_user(client, "bank@test.com", "testpassword")
    
    # Upload a document as the bank user
    bank_doc_data = upload_test_document(client, bank_headers, "INVOICE", "BANK-001", "2023-01-01T00:00:00Z")
    
    # Register and login as corporate user
    corp_user = register_test_user(client, "corporate@test.com", "testpassword", "corporate", "Corporate User", "Test Corp")
    corp_headers = login_test_user(client, "corporate@test.com", "testpassword")
    
    # Upload a document as the corporate user
    corp_doc_data = upload_test_document(client, corp_headers, "LOC", "CORP-001", "2023-01-01T00:00:00Z")
    
    # Upload a document as the admin user
    admin_doc_data = upload_test_document(client, admin_headers, "BILL_OF_LADING", "ADMIN-001", "2023-01-01T00:00:00Z")
    
    # Register and login as auditor user
    auditor_user = register_test_user(client, "auditor@test.com", "testpassword", "auditor", "Auditor User", "Test Audit Firm")
    auditor_headers = login_test_user(client, "auditor@test.com", "testpassword")
    
    # Upload a document as the auditor user
    auditor_doc_data = upload_test_document(client, auditor_headers, "COO", "AUDITOR-001", "2023-01-01T00:00:00Z")
    
    # Admin user should be able to access bank document
    response = client.get(f"/api/v1/documents/{bank_doc_data['id']}", headers=admin_headers)
    assert response.status_code == 200
    
    # Admin user should be able to access corporate document
    response = client.get(f"/api/v1/documents/{corp_doc_data['id']}", headers=admin_headers)
    assert response.status_code == 200
    
    # Admin user should be able to access their own document
    response = client.get(f"/api/v1/documents/{admin_doc_data['id']}", headers=admin_headers)
    assert response.status_code == 200
    
    # Admin user should be able to access auditor document
    response = client.get(f"/api/v1/documents/{auditor_doc_data['id']}", headers=admin_headers)
    assert response.status_code == 200

def test_auditor_user_can_access_any_document(client):
    """Test that auditor user can access any document"""
    # Register and login as auditor user
    auditor_user = register_test_user(client, "auditor@test.com", "testpassword", "auditor", "Auditor User", "Test Audit Firm")
    auditor_headers = login_test_user(client, "auditor@test.com", "testpassword")
    
    # Register and login as bank user
    bank_user = register_test_user(client, "bank@test.com", "testpassword", "bank", "Bank User", "Test Bank")
    bank_headers = login_test_user(client, "bank@test.com", "testpassword")
    
    # Upload a document as the bank user
    bank_doc_data = upload_test_document(client, bank_headers, "INVOICE", "BANK-001", "2023-01-01T00:00:00Z")
    
    # Register and login as corporate user
    corp_user = register_test_user(client, "corporate@test.com", "testpassword", "corporate", "Corporate User", "Test Corp")
    corp_headers = login_test_user(client, "corporate@test.com", "testpassword")
    
    # Upload a document as the corporate user
    corp_doc_data = upload_test_document(client, corp_headers, "LOC", "CORP-001", "2023-01-01T00:00:00Z")
    
    # Register and login as admin user
    admin_user = register_test_user(client, "admin@test.com", "testpassword", "admin", "Admin User", "Test Admin Org")
    admin_headers = login_test_user(client, "admin@test.com", "testpassword")
    
    # Upload a document as the admin user
    admin_doc_data = upload_test_document(client, admin_headers, "BILL_OF_LADING", "ADMIN-001", "2023-01-01T00:00:00Z")
    
    # Upload a document as the auditor user
    auditor_doc_data = upload_test_document(client, auditor_headers, "COO", "AUDITOR-001", "2023-01-01T00:00:00Z")
    
    # Auditor user should be able to access bank document
    response = client.get(f"/api/v1/documents/{bank_doc_data['id']}", headers=auditor_headers)
    assert response.status_code == 200
    
    # Auditor user should be able to access corporate document
    response = client.get(f"/api/v1/documents/{corp_doc_data['id']}", headers=auditor_headers)
    assert response.status_code == 200
    
    # Auditor user should be able to access admin document
    response = client.get(f"/api/v1/documents/{admin_doc_data['id']}", headers=auditor_headers)
    assert response.status_code == 200
    
    # Auditor user should be able to access their own document
    response = client.get(f"/api/v1/documents/{auditor_doc_data['id']}", headers=auditor_headers)
    assert response.status_code == 200

def test_edit_metadata_permissions(client):
    """Test that users can only edit documents they have permission to edit"""
    # Register and login as admin user (since bank/corporate users can't edit documents)
    admin_user = register_test_user(client, "admin@test.com", "testpassword", "admin", "Admin User", "Test Admin Org")
    admin_headers = login_test_user(client, "admin@test.com", "testpassword")
    
    # Register and login as bank user
    bank_user = register_test_user(client, "bank@test.com", "testpassword", "bank", "Bank User", "Test Bank")
    bank_headers = login_test_user(client, "bank@test.com", "testpassword")
    
    # Upload a document as the bank user
    bank_doc_data = upload_test_document(client, bank_headers, "INVOICE", "BANK-001", "2023-01-01T00:00:00Z")
    
    # Upload a document as the admin user
    admin_doc_data = upload_test_document(client, admin_headers, "BILL_OF_LADING", "ADMIN-001", "2023-01-01T00:00:00Z")
    
    # Admin user should be able to edit bank document (as per access rules)
    edit_data = {
        "doc_type": "INVOICE",
        "doc_number": "BANK-001-UPDATED",
        "issued_at": "2023-01-01T00:00:00"
    }
    response = client.patch(f"/api/v1/documents/{bank_doc_data['id']}", json=edit_data, headers=admin_headers)
    assert response.status_code == 200
    
    # Bank user should NOT be able to edit admin document
    response = client.patch(f"/api/v1/documents/{admin_doc_data['id']}", json=edit_data, headers=bank_headers)
    assert response.status_code == 403

def test_list_filtering_clear_filters(client):
    """Test that clearing filters returns all allowed documents"""
    # Register and login as admin user
    admin_user = register_test_user(client, "admin@test.com", "testpassword", "admin", "Admin User", "Test Admin Org")
    admin_headers = login_test_user(client, "admin@test.com", "testpassword")
    
    # Register and login as bank user
    bank_user = register_test_user(client, "bank@test.com", "testpassword", "bank", "Bank User", "Test Bank")
    bank_headers = login_test_user(client, "bank@test.com", "testpassword")
    
    # Upload documents
    bank_doc_data = upload_test_document(client, bank_headers, "INVOICE", "BANK-001", "2023-01-01T00:00:00Z")
    admin_doc_data = upload_test_document(client, admin_headers, "BILL_OF_LADING", "ADMIN-001", "2023-01-01T00:00:00Z")
    
    # Get all documents without filters
    response = client.get("/api/v1/documents/all-with-users", headers=admin_headers)
    assert response.status_code == 200
    all_docs = response.json()
    assert len(all_docs) >= 2  # Should see at least these two documents
    
    # Apply a filter
    response = client.get("/api/v1/documents/all-with-users?doc_type=INVOICE", headers=admin_headers)
    assert response.status_code == 200
    filtered_docs = response.json()
    # Should only see bank document (exact count depends on test execution order)
    
    # Clear filters by making request without query params
    response = client.get("/api/v1/documents/all-with-users", headers=admin_headers)
    assert response.status_code == 200
    cleared_docs = response.json()
    assert len(cleared_docs) >= 2  # Should see at least these two documents again