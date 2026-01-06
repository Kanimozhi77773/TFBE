from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from app.schemas.ledger_schema import (
    LedgerEntryCreateRequest, 
    LedgerEntryUpdateRequest, 
    LedgerEntryResponse, 
    LedgerEntryListResponse
)
from app.services.ledger_service import LedgerService
from app.db.session import get_db
from app.core.jwt_handler import verify_token
from app.services.auth_service import get_user_by_email
from app.models.user import User
from sqlalchemy.orm import Session
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


@router.get("", response_model=List[LedgerEntryListResponse])
async def list_ledger_entries(
    limit: int = 10,
    offset: int = 0,
    document_number: Optional[str] = None,
    action: Optional[str] = None,
    actor_name: Optional[str] = None,
    issued_from: Optional[datetime] = None,
    issued_to: Optional[datetime] = None,
    created_from: Optional[datetime] = None,
    created_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List ledger entries with pagination and filtering
    Admin and auditor can view all entries
    Bank and corporate can view only their own entries
    """
    ledger_service = LedgerService(db)
    
    entries, total_count = ledger_service.get_ledger_entries(
        current_user=current_user,
        limit=limit,
        offset=offset,
        document_number=document_number,
        action=action,
        actor_name=actor_name,
        issued_from=issued_from,
        issued_to=issued_to,
        created_from=created_from,
        created_to=created_to
    )
    
    # Add pagination info to response headers
    response = []
    for entry in entries:
        response.append(LedgerEntryListResponse(
            id=entry["id"],
            document_id=entry["document_id"],
            document_number=entry["document_number"],
            action=entry["action"],
            actor_id=entry["actor_id"],
            actor_name=entry["actor_name"],
            created_at=entry["created_at"]
        ))
    
    return response


@router.post("", response_model=LedgerEntryResponse)
async def create_ledger_entry(
    ledger_entry_request: LedgerEntryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new ledger entry
    Only bank and corporate users can create entries
    """
    ledger_service = LedgerService(db)
    return ledger_service.create_ledger_entry(current_user, ledger_entry_request)


@router.patch("/{entry_id}", response_model=LedgerEntryResponse)
async def update_ledger_entry(
    entry_id: int,
    request: LedgerEntryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a ledger entry (only action field)
    Only admin and auditor can update entries
    """
    ledger_service = LedgerService(db)
    return ledger_service.update_ledger_entry(entry_id, current_user, request)


@router.delete("/{entry_id}")
async def delete_ledger_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a ledger entry
    Only admin and auditor can delete entries
    """
    ledger_service = LedgerService(db)
    return ledger_service.delete_ledger_entry(entry_id, current_user)