"""
Simple test script to verify ledger API endpoints work correctly
"""
import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1"

def test_ledger_endpoints():
    print("Testing Ledger API endpoints...")
    
    # This test assumes you have a valid JWT token
    # You would need to register/login first to get a valid token
    headers = {
        "Authorization": "Bearer YOUR_VALID_JWT_TOKEN_HERE",
        "Content-Type": "application/json"
    }
    
    # Test 1: GET /ledger - List ledger entries
    print("\n1. Testing GET /ledger (list ledger entries)")
    try:
        response = requests.get(f"{BASE_URL}/ledger", headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: Found {len(data)} ledger entries")
        else:
            print(f"Error: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: POST /ledger - Create ledger entry (for bank/corporate users)
    print("\n2. Testing POST /ledger (create ledger entry)")
    try:
        payload = {
            "document_id": 1,  # Replace with a valid document ID
            "action": "ISSUED",
            "metadata": {"test": "data"}
        }
        response = requests.post(f"{BASE_URL}/ledger", json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: Created ledger entry with ID {data.get('id')}")
        else:
            print(f"Error: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\nNote: To run these tests properly, you need:")
    print("- A running backend server on port 8000")
    print("- Valid JWT tokens for different user roles")
    print("- Existing documents to associate with ledger entries")

if __name__ == "__main__":
    test_ledger_endpoints()