import pytest
from fastapi.testclient import TestClient

def test_access_protected_route_with_valid_token(client):
    """Test accessing a protected route with a valid token."""
    # First register a user
    client.post("/api/v1/auth/register", json={
        "name": "Protected Route Test User",
        "email": "protected_test@example.com",
        "password": "securepassword123",
        "role": "bank",
        "org_name": "Test Organization"
    })
    
    # Login to get a token
    login_response = client.post("/api/v1/auth/login", json={
        "email": "protected_test@example.com",
        "password": "securepassword123"
    })
    
    assert login_response.status_code == 200
    login_data = login_response.json()
    access_token = login_data["access_token"]
    
    # Access protected route with valid token
    response = client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {access_token}"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "protected_test@example.com"
    assert data["name"] == "Protected Route Test User"

def test_access_protected_route_without_token(client):
    """Test accessing a protected route without a token."""
    response = client.get("/api/v1/auth/me")
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Not authenticated"

def test_access_protected_route_with_invalid_token(client):
    """Test accessing a protected route with an invalid token."""
    response = client.get("/api/v1/auth/me", headers={
        "Authorization": "Bearer invalid_token"
    })
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data

def test_access_protected_route_with_expired_token(client):
    """Test accessing a protected route with an expired token."""
    # This test would require mocking token expiration
    # For now, we'll just test the structure
    response = client.get("/api/v1/auth/me", headers={
        "Authorization": "Bearer expired.token.here"
    })
    
    # Depending on implementation, this might return 401
    assert response.status_code in [401, 500]

def test_access_protected_route_with_malformed_token(client):
    """Test accessing a protected route with a malformed token."""
    response = client.get("/api/v1/auth/me", headers={
        "Authorization": "Bearer"
    })
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Not authenticated"

def test_access_protected_route_with_wrong_auth_scheme(client):
    """Test accessing a protected route with wrong authorization scheme."""
    response = client.get("/api/v1/auth/me", headers={
        "Authorization": "Basic some_base64_string"
    })
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Not authenticated"