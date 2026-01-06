from app.models.document import Document
from app.models.user import User
from app.schemas.document_schema import DocumentUploadResponse, DocumentDetailsResponse, DocumentListResponse, DocumentEditRequest
from app.db.session import get_db
from sqlalchemy.orm import Session
from typing import List, Tuple
from fastapi import HTTPException, status
import os
from sqlalchemy import and_, or_

class DocumentService:
    def __init__(self, db: Session):
        self.db = db
    
    def upload_document(self, file, current_user, db) -> DocumentUploadResponse:
        """
        Upload a document
        """
        # This method will be implemented in the routes
        pass
    
    def get_all_documents_with_users(self, current_user, db) -> List[Tuple[Document, User]]:
        """
        Get all documents with user information (admin only)
        """
        # Only admins can access this
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
        
        # Get all documents with user information
        documents_with_users = db.query(Document, User).join(User, Document.owner_id == User.id).all()
        return documents_with_users
    
    def get_document_by_id(self, document_id: int, current_user, db) -> DocumentDetailsResponse:
        """
        Get document by ID with access control
        """
        document = db.query(Document).filter(Document.id == document_id).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check access control
        if not self._can_access_document(document, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return document
    
    def _can_access_document(self, document, current_user) -> bool:
        """
        Check if user can access document based on role and access control rules
        
        Roles: bank, corporate, auditor, admin
        
        bank: may view details and download documents only that they themselves uploaded. 
        They cannot view, download, or edit any other user's documents.
        
        corporate: same as bank — may view details and download documents only that they 
        themselves uploaded.
        
        admin: may view details, download, and edit:
        - their own documents, and
        - any document uploaded by any other role (i.e., admin has access to documents 
        uploaded by bank, corporate, auditor, or other admins).
        
        auditor: may view details, download, and edit:
        - their own documents, and
        - any document uploaded by any other role (i.e., auditor has access to documents 
        uploaded by bank, corporate, admin, or other auditors).
        """
        # Everyone can access their own documents
        if document.owner_id == current_user.id:
            return True
        
        # Bank users can only access their own documents
        if current_user.role == "bank":
            return False
            
        # Corporate users can only access their own documents
        if current_user.role == "corporate":
            return False
            
        # Admin can access:
        # - Their own uploaded documents
        # - All documents uploaded by any other role (bank, corporate, auditor, admin)
        if current_user.role == "admin":
            return True
            
        # Auditor can access:
        # - Their own uploaded documents
        # - All documents uploaded by any other role (bank, corporate, admin, auditor)
        if current_user.role == "auditor":
            return True
        
        # All others → 403 Forbidden
        return False
    
    def _can_edit_document(self, document, current_user) -> bool:
        """
        Check if user can edit document
        
        Users can edit their own documents EXCEPT bank and corporate users
        Admins can edit any document
        Auditors can edit any document
        """
        # Everyone can edit their own documents EXCEPT bank and corporate users
        if document.owner_id == current_user.id:
            # Bank and corporate users cannot edit any documents (even their own)
            if current_user.role in ["bank", "corporate"]:
                return False
            return True
        
        # Admin can edit any document
        if current_user.role == "admin":
            return True
            
        # Auditor can edit any document
        if current_user.role == "auditor":
            return True
        
        # All others → 403 Forbidden
        return False
    
    def edit_document(self, document_id: int, edit_request: DocumentEditRequest, current_user, db):
        """
        Edit document metadata with access control
        """
        document = db.query(Document).filter(Document.id == document_id).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check edit permissions
        if not self._can_edit_document(document, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Update document metadata
        document.doc_type = edit_request.doc_type
        document.doc_number = edit_request.doc_number
        document.issued_at = edit_request.issued_at
        
        db.commit()
        db.refresh(document)
        
        return document
    
    def get_filtered_documents(self, current_user, db, doc_type=None, doc_number=None, 
                              issued_from=None, issued_to=None, created_from=None, created_to=None):
        """
        Get filtered documents based on criteria
        """
        query = db.query(Document)
        
        # Apply filters based on user role
        if current_user.role in ["bank", "corporate"]:
            # These roles can only see their own documents
            query = query.filter(Document.owner_id == current_user.id)
        elif current_user.role == "admin":
            # Admin can see their own documents + all documents from any role
            query = query  # No filter needed, admin can see all documents
        elif current_user.role == "auditor":
            # Auditor can see their own documents + all documents from any role
            query = query  # No filter needed, auditor can see all documents
        
        # Apply document filters
        if doc_type:
            query = query.filter(Document.doc_type == doc_type)
        if doc_number:
            query = query.filter(Document.doc_number.contains(doc_number))
        if issued_from:
            query = query.filter(Document.issued_at >= issued_from)
        if issued_to:
            query = query.filter(Document.issued_at <= issued_to)
        if created_from:
            query = query.filter(Document.created_at >= created_from)
        if created_to:
            query = query.filter(Document.created_at <= created_to)
        
        return query.all()
    
    def delete_document(self, document_id: int, current_user, db) -> bool:
        """
        Delete document with access control
        """
        document = db.query(Document).filter(Document.id == document_id).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check edit permissions (same as delete permissions)
        if not self._can_edit_document(document, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Delete file from storage
        if os.path.exists(document.file_url):
            os.remove(document.file_url)
        
        # Delete from database
        db.delete(document)
        db.commit()
        
        return True