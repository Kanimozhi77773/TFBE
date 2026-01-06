import requests
import json
from io import BytesIO

# Test the full document workflow
BASE_URL = "http://localhost:8001/api/v1"

def register_user():
    """Register a test user"""
    user_data = {
        "name": "Test User",
        "email": "test2@example.com",
        "password": "testpassword123",
        "role": "bank",
        "org_name": "Test Organization"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        print(f"Register user - Status: {response.status_code}")
        if response.status_code == 200:
            print("  User registered successfully")
            return response.json()
        else:
            print(f"  Error: {response.text}")
            return None
    except Exception as e:
        print(f"Error registering user: {e}")
        return None

def login_user(email="test2@example.com"):
    """Login the test user"""
    login_data = {
        "email": email,
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login user - Status: {response.status_code}")
        if response.status_code == 200:
            print("  User logged in successfully")
            return response.json()
        else:
            print(f"  Error: {response.text}")
            return None
    except Exception as e:
        print(f"Error logging in user: {e}")
        return None

def upload_document(token):
    """Upload a test document"""
    # Create a simple PNG file content (minimal PNG header)
    png_header = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa75\x81\x8f\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # Prepare the form data
    files = {
        'file': ('test_document.png', png_header, 'image/png')
    }
    
    data = {
        'doc_type': 'INVOICE',
        'doc_number': 'INV-2023-001',
        'issued_at': '2023-01-15T10:30:00Z'
    }
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/documents/upload",
            files=files,
            data=data,
            headers=headers
        )
        print(f"Upload document - Status: {response.status_code}")
        if response.status_code == 200:
            print("  Document uploaded successfully")
            return response.json()
        else:
            print(f"  Error: {response.text}")
            return None
    except Exception as e:
        print(f"Error uploading document: {e}")
        return None

def list_documents(token):
    """List user documents"""
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.get(f"{BASE_URL}/documents/my", headers=headers)
        print(f"List documents - Status: {response.status_code}")
        if response.status_code == 200:
            documents = response.json()
            print(f"  Found {len(documents)} documents")
            return documents
        else:
            print(f"  Error: {response.text}")
            return None
    except Exception as e:
        print(f"Error listing documents: {e}")
        return None

def main():
    print("Starting comprehensive document test...")
    
    # Register a user
    user_response = register_user()
    if not user_response:
        print("Failed to register user, trying to login with existing user...")
        # Try to login with existing user
        login_response = login_user("test@example.com")
    else:
        # Login the newly registered user
        login_response = login_user()
    
    if not login_response:
        print("Failed to login user, exiting...")
        return
    
    token = login_response.get('access_token')
    if not token:
        print("No access token found, exiting...")
        return
    
    # Upload a document
    document_response = upload_document(token)
    if not document_response:
        print("Failed to upload document")
        return
    
    # List documents
    documents = list_documents(token)
    if documents is not None:
        print("Document test completed successfully!")
    else:
        print("Failed to list documents")

if __name__ == "__main__":
    main()