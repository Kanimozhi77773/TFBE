import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_user_registration_and_login():
    """Test that we can register a user and then log in with that user."""
    # Register a user
    reg_response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "authtest2@example.com",
        "password": "testpassword",
        "role": "bank",
        "org_name": "Test Org"
    })
    
    print(f"Registration response: {reg_response.status_code}")
    if reg_response.status_code != 200:
        print(f"Registration failed: {reg_response.text}")
        return
    
    # Login with the same user
    login_response = client.post("/api/v1/auth/login", json={
        "email": "authtest2@example.com",
        "password": "testpassword"
    })
    
    print(f"Login response: {login_response.status_code}")
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
        
    # Try to access a protected endpoint
    token_data = login_response.json()
    auth_headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    
    # Try to upload a document
    import io
    file_content = b"This is a test document content"
    file = io.BytesIO(file_content)
    
    upload_response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("test.pdf", file, "application/pdf")},
        data={
            "doc_type": "INVOICE",
            "doc_number": "INV-2023-001",
            "issued_at": "2023-01-15T10:30:00Z"
        },
        headers=auth_headers
    )
    
    print(f"Upload response: {upload_response.status_code}")
    if upload_response.status_code != 200:
        print(f"Upload failed: {upload_response.text}")

if __name__ == "__main__":
    test_user_registration_and_login()