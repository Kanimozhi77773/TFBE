import pytest
from fastapi.testclient import TestClient

def test_successful_login(client):
    """Test successful user login."""
    # First register a user
    client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "login_test@example.com",
        "password": "securepassword123",
        "role": "bank",
        "org_name": "Test Organization"
    })
    
    # Then login
    response = client.post("/api/v1/auth/login", json={
        "email": "login_test@example.com",
        "password": "securepassword123"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login_test@example.com"

def test_login_with_wrong_password(client):
    """Test login with incorrect password."""
    # First register a user
    client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "wrong_password_test@example.com",
        "password": "securepassword123",
        "role": "bank",
        "org_name": "Test Organization"
    })
    
    # Try to login with wrong password
    response = client.post("/api/v1/auth/login", json={
        "email": "wrong_password_test@example.com",
        "password": "wrongpassword"
    })
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Incorrect email or password"

def test_login_with_nonexistent_email(client):
    """Test login with an email that doesn't exist."""
    response = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "somepassword"
    })
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Incorrect email or password"

def test_login_missing_fields(client):
    """Test login with missing required fields."""
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com"
        # Missing password
    })
    
    assert response.status_code == 422

def test_login_empty_fields(client):
    """Test login with empty fields."""
    response = client.post("/api/v1/auth/login", json={
        "email": "",
        "password": ""
    })
    
    # Empty fields should result in authentication failure
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Incorrect email or password"