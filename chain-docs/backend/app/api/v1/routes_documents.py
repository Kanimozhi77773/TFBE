from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status, Request, Form
from typing import List, Optional
from app.schemas.document_schema import DocumentUploadResponse, DocumentDetailsResponse, DocumentListResponse, DocumentEditRequest, DocumentFilterRequest, DocumentType
from app.services.document_service import DocumentService
from app.db.session import get_db
from app.core.jwt_handler import verify_token
from app.services.auth_service import get_user_by_email
from app.models.user import User
from app.models.document import Document
from app.models.user import User
from app.utils.hash_utils import compute_sha256
from app.utils.file_handler import validate_file_type, generate_safe_filename
from app.utils.storage import save_file_locally
from sqlalchemy.orm import Session
import os
from fastapi.responses import FileResponse
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency to get current user
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    
    # Verify token
    token_data = verify_token(token)
    if not token_data or not token_data.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = get_user_by_email(db, email=token_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    doc_type: DocumentType = Form(...),
    doc_number: str = Form(...),
    issued_at: str = Form(...),  # Will be parsed as datetime
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document with metadata
    Only bank and corporate users can upload documents
    """
    # Only bank and corporate users can upload documents
    if current_user.role not in ["bank", "corporate"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only bank and corporate users can upload documents."
        )
    
    # Validate file type
    if not validate_file_type(file):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF, JPG, and PNG files are allowed."
        )
    
    # Parse issued_at as datetime
    try:
        issued_at_dt = datetime.fromisoformat(issued_at.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid issued_at format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)."
        )
    
    # Read file content
    file_content = await file.read()
    
    # Compute SHA256 hash
    file_hash = compute_sha256(file_content)
    
    # Generate safe filename
    safe_filename = generate_safe_filename(file.filename)
    
    # Save file locally
    file_path = save_file_locally(file_content, safe_filename)
    
    # Create document record
    db_document = Document(
        owner_id=current_user.id,
        doc_type=doc_type,
        doc_number=doc_number,
        file_url=file_path,
        hash=file_hash,
        issued_at=issued_at_dt,
    )
    
    # Save to database
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return db_document

@router.get("/all-with-users", response_model=List[dict])
async def list_all_documents_with_users(
    doc_type: Optional[DocumentType] = None,
    doc_number: Optional[str] = None,
    issued_from: Optional[str] = None,
    issued_to: Optional[str] = None,
    created_from: Optional[str] = None,
    created_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all documents with user information (admin and auditor only)
    """
    # Only admins and auditors can access this
    if current_user.role not in ["admin", "auditor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admins and auditors only."
        )
    
    # Parse datetime strings if provided
    issued_from_dt = None
    issued_to_dt = None
    created_from_dt = None
    created_to_dt = None
    
    if issued_from:
        try:
            issued_from_dt = datetime.fromisoformat(issued_from.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid issued_from format")
    
    if issued_to:
        try:
            issued_to_dt = datetime.fromisoformat(issued_to.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid issued_to format")
    
    if created_from:
        try:
            created_from_dt = datetime.fromisoformat(created_from.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid created_from format")
    
    if created_to:
        try:
            created_to_dt = datetime.fromisoformat(created_to.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid created_to format")
    
    # Get all documents with user information based on access rules
    query = db.query(Document, User).join(User, Document.owner_id == User.id)
    
    # Apply document filters
    if doc_type:
        query = query.filter(Document.doc_type == doc_type)
    if doc_number:
        query = query.filter(Document.doc_number.contains(doc_number))
    if issued_from_dt:
        query = query.filter(Document.issued_at >= issued_from_dt)
    if issued_to_dt:
        query = query.filter(Document.issued_at <= issued_to_dt)
    if created_from_dt:
        query = query.filter(Document.created_at >= created_from_dt)
    if created_to_dt:
        query = query.filter(Document.created_at <= created_to_dt)
    
    documents_with_users = query.all()
    
    # Format the response
    result = []
    for document, user in documents_with_users:
        doc_dict = {
            "id": document.id,
            "owner_id": document.owner_id,
            "doc_type": document.doc_type,
            "doc_number": document.doc_number,
            "file_url": document.file_url,
            "hash": document.hash,
            "issued_at": document.issued_at,
            "created_at": document.created_at,
            "owner": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "org_name": user.org_name
            }
        }
        result.append(doc_dict)
    
    return result

@router.get("/my", response_model=List[DocumentListResponse])
async def list_documents(
    doc_type: Optional[DocumentType] = None,
    doc_number: Optional[str] = None,
    issued_from: Optional[str] = None,
    issued_to: Optional[str] = None,
    created_from: Optional[str] = None,
    created_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List documents uploaded by the logged-in user with optional filtering
    """
    # Parse datetime strings if provided
    issued_from_dt = None
    issued_to_dt = None
    created_from_dt = None
    created_to_dt = None
    
    if issued_from:
        try:
            issued_from_dt = datetime.fromisoformat(issued_from.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid issued_from format")
    
    if issued_to:
        try:
            issued_to_dt = datetime.fromisoformat(issued_to.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid issued_to format")
    
    if created_from:
        try:
            created_from_dt = datetime.fromisoformat(created_from.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid created_from format")
    
    if created_to:
        try:
            created_to_dt = datetime.fromisoformat(created_to.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid created_to format")
    
    document_service = DocumentService(db)
    return document_service.get_filtered_documents(
        current_user, db, doc_type, doc_number, 
        issued_from_dt, issued_to_dt, created_from_dt, created_to_dt
    )

@router.get("/{document_id}", response_model=DocumentDetailsResponse)
async def get_document_details(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return metadata
    Enforce access control
    """
    document_service = DocumentService(db)
    return document_service.get_document_by_id(document_id, current_user, db)

@router.patch("/{document_id}", response_model=DocumentDetailsResponse)
async def edit_document(
    document_id: int,
    edit_request: DocumentEditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Edit document metadata
    """
    document_service = DocumentService(db)
    try:
        return document_service.edit_document(document_id, edit_request, current_user, db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to edit document: {str(e)}"
        )

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a document with access control
    """
    document_service = DocumentService(db)
    try:
        result = document_service.delete_document(document_id, current_user, db)
        if result:
            return {"message": "Document deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete document"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )

@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return the file
    Enforce access control
    """
    logger.info(f"Download request for document ID: {document_id}")
    
    # Get document
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        logger.warning(f"Document not found for ID: {document_id}")
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )
    
    # Check access control
    document_service = DocumentService(db)
    if not document_service._can_access_document(document, current_user):
        logger.warning(f"Access denied for user {current_user.id} to document {document_id}")
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )
    
    # Check if file exists
    if not os.path.exists(document.file_url):
        logger.warning(f"File not found at path: {document.file_url}")
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )
    
    logger.info(f"Serving file: {document.file_url}")
    
    # Use FileResponse for better file handling
    return FileResponse(
        path=document.file_url,
        filename=f"{document.doc_number}_{document.doc_type}.pdf",  # Updated filename
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename=\"{document.doc_number}_{document.doc_type}.pdf\""
        }
    )