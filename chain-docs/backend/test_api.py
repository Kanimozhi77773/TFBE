import requests
import json

# Test the documents API endpoints
BASE_URL = "http://localhost:8000/api/v1"

def test_documents_endpoints():
    print("Testing documents API endpoints...")
    
    # Test getting documents (this will fail without authentication)
    try:
        response = requests.get(f"{BASE_URL}/documents/my")
        print(f"GET /documents/my - Status: {response.status_code}")
        if response.status_code == 401:
            print("  Expected: Authentication required")
        else:
            print(f"  Unexpected response: {response.text}")
    except Exception as e:
        print(f"Error testing GET /documents/my: {e}")
    
    # Test uploading a document (this will also fail without authentication)
    try:
        response = requests.post(f"{BASE_URL}/documents/upload")
        print(f"POST /documents/upload - Status: {response.status_code}")
        if response.status_code == 422:
            print("  Expected: Validation error (no form data)")
        else:
            print(f"  Response: {response.text}")
    except Exception as e:
        print(f"Error testing POST /documents/upload: {e}")

if __name__ == "__main__":
    test_documents_endpoints()