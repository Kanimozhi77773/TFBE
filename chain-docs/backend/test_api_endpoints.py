import requests
import json

# Test the backend API endpoints
BASE_URL = "http://localhost:8002"

def test_api_endpoints():
    print("Testing API endpoints...")
    
    # Test the root endpoint
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Root endpoint status: {response.status_code}")
        print(f"Root endpoint response: {response.json()}")
    except Exception as e:
        print(f"Error accessing root endpoint: {e}")
    
    # Test the test endpoint
    try:
        response = requests.get(f"{BASE_URL}/test")
        print(f"Test endpoint status: {response.status_code}")
        print(f"Test endpoint response: {response.json()}")
    except Exception as e:
        print(f"Error accessing test endpoint: {e}")
    
    # Test documents endpoints (without authentication)
    try:
        response = requests.get(f"{BASE_URL}/api/v1/documents/my")
        print(f"Documents list endpoint status (no auth): {response.status_code}")
        if response.status_code == 401:
            print("Expected: Authentication required")
        else:
            print(f"Unexpected response: {response.text}")
    except Exception as e:
        print(f"Error accessing documents list endpoint: {e}")

if __name__ == "__main__":
    test_api_endpoints()