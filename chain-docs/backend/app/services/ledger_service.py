from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.models.ledger import LedgerEntry
from app.models.user import User, UserRole
from app.models.document import Document
from app.schemas.ledger_schema import LedgerEntryCreateRequest, LedgerEntryUpdateRequest
from app.schemas.document_schema import DocumentType
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime


class LedgerService:
    def __init__(self, db: Session):
        self.db = db

    def get_ledger_entries(
        self,
        current_user: User,
        limit: int = 10,
        offset: int = 0,
        document_number: Optional[str] = None,
        action: Optional[str] = None,
        actor_name: Optional[str] = None,
        issued_from: Optional[datetime] = None,
        issued_to: Optional[datetime] = None,
        created_from: Optional[datetime] = None,
        created_to: Optional[datetime] = None
    ):
        """
        Get ledger entries based on user role and filters
        Admin (admin + auditor) can view all entries
        Bank (bank + corporate) can view only their own entries
        """
        query = (
            self.db.query(LedgerEntry)
            .join(Document, LedgerEntry.document_id == Document.id)
            .join(User, LedgerEntry.actor_id == User.id)
        )

        # Apply role-based access control
        if current_user.role in [UserRole.BANK, UserRole.CORPORATE]:
            # Bank and corporate users can only see their own ledger entries
            query = query.filter(LedgerEntry.actor_id == current_user.id)
        elif current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
            # Only admin and auditor can view all entries
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only admin and auditor roles can view all ledger entries."
            )

        # Apply filters
        if document_number:
            query = query.filter(Document.doc_number.contains(document_number))

        if action:
            query = query.filter(LedgerEntry.action == action)

        if actor_name:
            query = query.filter(User.name.contains(actor_name))

        if issued_from:
            query = query.filter(Document.issued_at >= issued_from)

        if issued_to:
            query = query.filter(Document.issued_at <= issued_to)

        if created_from:
            query = query.filter(LedgerEntry.created_at >= created_from)

        if created_to:
            query = query.filter(LedgerEntry.created_at <= created_to)

        # Count total records for pagination
        total_count = query.count()

        # Apply pagination
        ledger_entries = query.offset(offset).limit(limit).all()

        # Format response with additional information
        result = []
        for entry in ledger_entries:
            result.append({
                "id": entry.id,
                "document_id": entry.document_id,
                "document_number": entry.document.doc_number,
                "action": entry.action,
                "actor_id": entry.actor_id,
                "actor_name": entry.actor.name,
                "metadata_json": entry.metadata_json,
                "created_at": entry.created_at
            })

        return result, total_count

    def create_ledger_entry(self, current_user: User, request: LedgerEntryCreateRequest):
        """
        Create a new ledger entry
        Only bank and corporate users can create entries
        """
        # Check role permissions
        if current_user.role not in [UserRole.BANK, UserRole.CORPORATE]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only bank and corporate users can create ledger entries."
            )

        # Verify that the document belongs to the current user (for bank/corporate)
        document = self.db.query(Document).filter(
            Document.id == request.document_id,
            Document.owner_id == current_user.id
        ).first()

        if not document:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only create ledger entries for your own documents."
            )

        # Create the ledger entry
        ledger_entry = LedgerEntry(
            document_id=request.document_id,
            action=request.action,
            actor_id=current_user.id,
            metadata_json=request.metadata_json
        )

        self.db.add(ledger_entry)
        self.db.commit()
        self.db.refresh(ledger_entry)

        # Return with additional information
        return {
            "id": ledger_entry.id,
            "document_id": ledger_entry.document_id,
            "document_number": document.doc_number,
            "action": ledger_entry.action,
            "actor_id": ledger_entry.actor_id,
            "actor_name": current_user.name,
            "metadata_json": ledger_entry.metadata_json,
            "created_at": ledger_entry.created_at
        }

    def update_ledger_entry(self, entry_id: int, current_user: User, request: LedgerEntryUpdateRequest):
        """
        Update a ledger entry (only action field)
        Only admin and auditor can update entries
        """
        # Check role permissions
        if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only admin and auditor roles can update ledger entries."
            )

        # Get the ledger entry
        ledger_entry = self.db.query(LedgerEntry).filter(LedgerEntry.id == entry_id).first()

        if not ledger_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ledger entry not found."
            )

        # Only allow updating the action field
        if request.action is not None:
            ledger_entry.action = request.action

        self.db.commit()
        self.db.refresh(ledger_entry)

        # Get related document and user info for response
        document = self.db.query(Document).filter(Document.id == ledger_entry.document_id).first()
        user = self.db.query(User).filter(User.id == ledger_entry.actor_id).first()

        return {
            "id": ledger_entry.id,
            "document_id": ledger_entry.document_id,
            "document_number": document.doc_number if document else "Unknown",
            "action": ledger_entry.action,
            "actor_id": ledger_entry.actor_id,
            "actor_name": user.name if user else "Unknown",
            "metadata_json": ledger_entry.metadata_json,
            "created_at": ledger_entry.created_at
        }

    def delete_ledger_entry(self, entry_id: int, current_user: User):
        """
        Delete a ledger entry
        Only admin and auditor can delete entries
        """
        # Check role permissions
        if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only admin and auditor roles can delete ledger entries."
            )

        # Get the ledger entry
        ledger_entry = self.db.query(LedgerEntry).filter(LedgerEntry.id == entry_id).first()

        if not ledger_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ledger entry not found."
            )

        self.db.delete(ledger_entry)
        self.db.commit()

        return {"message": "Ledger entry deleted successfully"}