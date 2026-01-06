import requests
import json
from datetime import datetime
import time

# Test the backend API endpoints with authentication
BASE_URL = "http://localhost:8002"
API_PREFIX = "/api/v1"

def register_user(email, password, role, name, org_name):
    """Register a new user"""
    url = f"{BASE_URL}{API_PREFIX}/auth/register"
    payload = {
        "email": email,
        "password": password,
        "role": role,
        "name": name,
        "org_name": org_name
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Registration status: {response.status_code}")
        if response.status_code == 200:
            print("Registration successful!")
            return response.json()
        else:
            print(f"Registration failed: {response.text}")
            return None
    except Exception as e:
        print(f"Error during registration: {e}")
        return None

def login_user(email, password):
    """Login user and get tokens"""
    url = f"{BASE_URL}{API_PREFIX}/auth/login"
    payload = {
        "email": email,
        "password": password
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Login status: {response.status_code}")
        if response.status_code == 200:
            print("Login successful!")
            return response.json()
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Error during login: {e}")
        return None

def get_my_documents(access_token):
    """Get documents for the current user"""
    url = f"{BASE_URL}{API_PREFIX}/documents/my"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    try:
        response = requests.get(url, headers=headers)
        print(f"Get documents status: {response.status_code}")
        if response.status_code == 200:
            print("Successfully retrieved documents!")
            return response.json()
        else:
            print(f"Failed to get documents: {response.text}")
            return None
    except Exception as e:
        print(f"Error getting documents: {e}")
        return None

def upload_document(access_token, file_path, doc_type, doc_number, issued_at):
    """Upload a document"""
    url = f"{BASE_URL}{API_PREFIX}/documents/upload"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        with open(file_path, 'rb') as f:
            files = {
                'file': (file_path.split('/')[-1], f, 'application/pdf')
            }
            data = {
                'doc_type': doc_type,
                'doc_number': doc_number,
                'issued_at': issued_at
            }
            
            response = requests.post(url, headers=headers, files=files, data=data)
            print(f"Upload status: {response.status_code}")
            if response.status_code == 200:
                print("Document uploaded successfully!")
                return response.json()
            else:
                print(f"Upload failed: {response.text}")
                return None
    except Exception as e:
        print(f"Error uploading document: {e}")
        return None

def test_document_functionality():
    print("=== Comprehensive Document Functionality Test ===\n")
    
    # Register a new test user
    print("1. Registering new user...")
    email = f"test_{int(time.time())}@example.com"
    password = "testpassword123"
    role = "corporate"
    name = "Test User"
    org_name = "Test Organization"
    
    reg_result = register_user(email, password, role, name, org_name)
    if not reg_result:
        print("Failed to register user. Exiting.")
        return
    
    # Login the user
    print("\n2. Logging in user...")
    login_result = login_user(email, password)
    if not login_result:
        print("Failed to login user. Exiting.")
        return
    
    access_token = login_result.get('access_token')
    if not access_token:
        print("No access token received. Exiting.")
        return
    
    print(f"Access token: {access_token[:20]}...")
    
    # Get documents (should be empty for new user)
    print("\n3. Getting documents for new user...")
    docs = get_my_documents(access_token)
    if docs is not None:
        print(f"Found {len(docs)} documents for new user")
    
    # Try to upload a document
    print("\n4. Uploading a test document...")
    # Create a simple test PDF file
    test_file_path = "test_upload.pdf"
    with open(test_file_path, 'wb') as f:
        # Write a simple PDF header
        f.write(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
        f.write(b'1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n')
        f.write(b'2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n')
        f.write(b'3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n/Resources <<\n/ProcSet [/PDF /Text]\n>>\n>>\nendobj\n')
        f.write(b'4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Document) Tj\nET\nendstream\nendobj\n')
        f.write(b'5 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n')
        f.write(b'6 0 obj\n<<\n/Producer (Test PDF Generator)\n/CreationDate (D:20251210120000)\n>>\nendobj\n')
        f.write(b'xref\n0 7\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000120 00000 n \n0000000273 00000 n \n0000000356 00000 n \n0000000420 00000 n \ntrailer\n<<\n/Size 7\n/Root 1 0 R\n/Info 6 0 R\n>>\nstartxref\n521\n%%EOF')
    
    doc_type = "INVOICE"
    doc_number = "TEST-001"
    issued_at = datetime.now().isoformat() + "Z"
    
    upload_result = upload_document(access_token, test_file_path, doc_type, doc_number, issued_at)
    if upload_result:
        print("Document upload completed!")
        print(f"Uploaded document ID: {upload_result.get('id')}")
    
    # Get documents again (should now have 1 document)
    print("\n5. Getting documents after upload...")
    docs = get_my_documents(access_token)
    if docs is not None:
        print(f"Found {len(docs)} documents after upload")
        if len(docs) > 0:
            doc = docs[0]
            print(f"Document details: ID={doc.get('id')}, Type={doc.get('doc_type')}, Number={doc.get('doc_number')}")
    
    print("\n=== Test completed ===")

if __name__ == "__main__":
    test_document_functionality()