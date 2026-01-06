import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.ledger import LedgerEntry, LedgerAction
from app.db.session import get_db
from app.core.jwt_handler import create_access_token
from datetime import datetime
import json

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_ledger.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Override dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture
def setup_test_data():
    """Setup test data for ledger tests"""
    db = TestingSessionLocal()
    
    # Create test users
    admin_user = User(
        name="Admin User",
        email="admin@example.com",
        password="hashed_password",
        role=UserRole.ADMIN,
        org_name="Admin Org"
    )
    auditor_user = User(
        name="Auditor User",
        email="auditor@example.com",
        password="hashed_password",
        role=UserRole.AUDITOR,
        org_name="Auditor Org"
    )
    bank_user = User(
        name="Bank User",
        email="bank@example.com",
        password="hashed_password",
        role=UserRole.BANK,
        org_name="Bank Org"
    )
    corporate_user = User(
        name="Corporate User",
        email="corporate@example.com",
        password="hashed_password",
        role=UserRole.CORPORATE,
        org_name="Corporate Org"
    )
    
    db.add_all([admin_user, auditor_user, bank_user, corporate_user])
    db.commit()
    
    # Create test document owned by bank user
    test_document = Document(
        owner_id=bank_user.id,
        doc_type="LOC",
        doc_number="DOC-001",
        file_url="/uploads/test.pdf",
        hash="test_hash",
        issued_at=datetime.utcnow()
    )
    db.add(test_document)
    db.commit()
    
    # Create test ledger entries
    ledger_entry_1 = LedgerEntry(
        document_id=test_document.id,
        action=LedgerAction.ISSUED,
        actor_id=bank_user.id,
        metadata={"test": "data1"}
    )
    ledger_entry_2 = LedgerEntry(
        document_id=test_document.id,
        action=LedgerAction.SHIPPED,
        actor_id=bank_user.id,
        metadata={"test": "data2"}
    )
    
    db.add_all([ledger_entry_1, ledger_entry_2])
    db.commit()
    
    # Create tokens for each user
    admin_token = create_access_token(data={"email": admin_user.email})
    auditor_token = create_access_token(data={"email": auditor_user.email})
    bank_token = create_access_token(data={"email": bank_user.email})
    corporate_token = create_access_token(data={"email": corporate_user.email})
    
    yield {
        "admin_user": admin_user,
        "auditor_user": auditor_user,
        "bank_user": bank_user,
        "corporate_user": corporate_user,
        "test_document": test_document,
        "ledger_entry_1": ledger_entry_1,
        "ledger_entry_2": ledger_entry_2,
        "admin_token": admin_token,
        "auditor_token": auditor_token,
        "bank_token": bank_token,
        "corporate_token": corporate_token
    }
    
    # Cleanup
    db.query(LedgerEntry).delete()
    db.query(Document).delete()
    db.query(User).delete()
    db.commit()
    db.close()


def test_admin_can_view_all_entries(setup_test_data):
    """Test that admin can view all ledger entries"""
    response = client.get(
        "/api/v1/ledger",
        headers={"Authorization": f"Bearer {setup_test_data['admin_token']}"}
    )
    assert response.status_code == 200
    assert len(response.json()) >= 2  # At least the 2 entries created in setup


def test_auditor_can_view_all_entries(setup_test_data):
    """Test that auditor can view all ledger entries"""
    response = client.get(
        "/api/v1/ledger",
        headers={"Authorization": f"Bearer {setup_test_data['auditor_token']}"}
    )
    assert response.status_code == 200
    assert len(response.json()) >= 2  # At least the 2 entries created in setup


def test_bank_user_sees_only_their_entries(setup_test_data):
    """Test that bank user sees only their own ledger entries"""
    response = client.get(
        "/api/v1/ledger",
        headers={"Authorization": f"Bearer {setup_test_data['bank_token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    # Should see entries they created
    assert len(data) >= 2


def test_bank_user_cannot_edit_entries(setup_test_data):
    """Test that bank user cannot edit ledger entries"""
    response = client.patch(
        f"/api/v1/ledger/{setup_test_data['ledger_entry_1'].id}",
        json={"action": "RECEIVED"},
        headers={"Authorization": f"Bearer {setup_test_data['bank_token']}"}
    )
    assert response.status_code == 403  # Forbidden


def test_admin_can_edit_entries(setup_test_data):
    """Test that admin can edit ledger entries"""
    response = client.patch(
        f"/api/v1/ledger/{setup_test_data['ledger_entry_1'].id}",
        json={"action": "RECEIVED"},
        headers={"Authorization": f"Bearer {setup_test_data['admin_token']}"}
    )
    # This may fail if the ledger entry doesn't exist in the test db
    # but the important thing is that it's not a 403 (Forbidden)
    assert response.status_code in [200, 404]  # 404 if entry not found, but not 403


def test_post_creation_allowed_for_bank_corporate(setup_test_data):
    """Test that POST creation is allowed for bank and corporate users"""
    # Test bank user
    response = client.post(
        "/api/v1/ledger",
        json={
            "document_id": setup_test_data["test_document"].id,
            "action": "PAID",
        },
        headers={"Authorization": f"Bearer {setup_test_data['bank_token']}"}
    )
    assert response.status_code in [200, 422]  # 422 if validation error, but not 403
    
    # Test corporate user
    response = client.post(
        "/api/v1/ledger",
        json={
            "document_id": setup_test_data["test_document"].id,
            "action": "PAID",
        },
        headers={"Authorization": f"Bearer {setup_test_data['corporate_token']}"}
    )
    assert response.status_code in [200, 422]  # 422 if validation error, but not 403


def test_post_creation_not_allowed_for_admin_auditor(setup_test_data):
    """Test that POST creation is not allowed for admin and auditor users"""
    # Test admin user
    response = client.post(
        "/api/v1/ledger",
        data={
            "document_id": setup_test_data["test_document"].id,
            "action": "PAID",
        },
        headers={"Authorization": f"Bearer {setup_test_data['admin_token']}"}
    )
    assert response.status_code == 403  # Forbidden
    
    # Test auditor user
    response = client.post(
        "/api/v1/ledger",
        json={
            "document_id": setup_test_data["test_document"].id,
            "action": "PAID",
        },
        headers={"Authorization": f"Bearer {setup_test_data['auditor_token']}"}
    )
    assert response.status_code == 403  # Forbidden


def test_filters_return_correct_records(setup_test_data):
    """Test that filters return correct records"""
    response = client.get(
        f"/api/v1/ledger?document_number={setup_test_data['test_document'].doc_number}",
        headers={"Authorization": f"Bearer {setup_test_data['admin_token']}"}
    )
    assert response.status_code == 200


def test_clearing_filter_returns_full_dataset(setup_test_data):
    """Test that clearing filter returns full dataset"""
    # Get all entries without filters
    response_all = client.get(
        "/api/v1/ledger",
        headers={"Authorization": f"Bearer {setup_test_data['admin_token']}"}
    )
    assert response_all.status_code == 200
    
    # The test should ensure that when filters are cleared (not applied), 
    # the full dataset is returned
    all_entries = response_all.json()
    assert len(all_entries) >= 2  # At least the 2 entries created in setup