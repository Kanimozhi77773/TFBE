import pytest
from fastapi.testclient import TestClient

def test_successful_registration(client):
    """Test successful user registration."""
    response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123",
        "role": "bank",
        "org_name": "Test Organization"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "User registered successfully"
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["name"] == "Test User"
    assert "id" in data["user"]
    assert "created_at" in data["user"]

def test_registration_with_invalid_email(client):
    """Test registration with invalid email formats."""
    # Test missing @ symbol
    response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "invalid.email",
        "password": "securepassword123",
        "role": "bank",
        "org_name": "Test Organization"
    })
    
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert len(data["detail"]) > 0
    assert data["detail"][0]["field"] == "email"
    
    # Test empty local part
    response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "@example.com",
        "password": "securepassword123",
        "role": "bank",
        "org_name": "Test Organization"
    })
    
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert len(data["detail"]) > 0
    assert data["detail"][0]["field"] == "email"

def test_duplicate_email_registration(client):
    """Test registration with an email that already exists."""
    # First registration
    response1 = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "duplicate@example.com",
        "password": "securepassword123",
        "role": "bank",
        "org_name": "Test Organization"
    })
    
    assert response1.status_code == 200
    
    # Second registration with same email
    response2 = client.post("/api/v1/auth/register", json={
        "name": "Another User",
        "email": "duplicate@example.com",
        "password": "anotherpassword123",
        "role": "corporate",
        "org_name": "Another Organization"
    })
    
    assert response2.status_code == 400
    data = response2.json()
    assert "detail" in data
    assert data["detail"] == "Email already registered"

def test_registration_missing_fields(client):
    """Test registration with missing required fields."""
    response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com"
        # Missing password, role, org_name
    })
    
    assert response.status_code == 422

def test_registration_invalid_role(client):
    """Test registration with invalid role."""
    response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123",
        "role": "invalid_role",
        "org_name": "Test Organization"
    })
    
    assert response.status_code == 422