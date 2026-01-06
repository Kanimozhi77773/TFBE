import requests
import json

# Test the root endpoint
try:
    response = requests.get('http://localhost:8000/')
    print(f"Root endpoint response: {response.status_code}")
    print(f"Response data: {response.json()}")
except Exception as e:
    print(f"Error accessing root endpoint: {e}")

# Test the register endpoint
try:
    register_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "pass123",  # Short password
        "role": "bank",
        "org_name": "Test Org"
    }
    
    response = requests.post(
        'http://localhost:8000/api/v1/auth/register',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(register_data)
    )
    
    print(f"Register endpoint response: {response.status_code}")
    print(f"Response data: {response.text}")
except Exception as e:
    print(f"Error accessing register endpoint: {e}")

# Test the login endpoint
try:
    login_data = {
        "email": "test@example.com",
        "password": "pass123"
    }
    
    response = requests.post(
        'http://localhost:8000/api/v1/auth/login',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(login_data)
    )
    
    print(f"Login endpoint response: {response.status_code}")
    print(f"Response data: {response.text}")
except Exception as e:
    print(f"Error accessing login endpoint: {e}")