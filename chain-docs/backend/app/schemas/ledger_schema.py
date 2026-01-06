from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class LedgerAction(str, Enum):
    ISSUED = "ISSUED"
    AMENDED = "AMENDED"
    SHIPPED = "SHIPPED"
    RECEIVED = "RECEIVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    VERIFIED = "VERIFIED"


class LedgerEntryCreateRequest(BaseModel):
    document_id: int
    action: LedgerAction
    metadata_json: Optional[Dict[str, Any]] = None


class LedgerEntryUpdateRequest(BaseModel):
    action: Optional[LedgerAction] = None


class LedgerEntryResponse(BaseModel):
    id: int
    document_id: int
    document_number: str  # From the document relationship
    action: LedgerAction
    actor_id: int
    actor_name: str  # From the user relationship
    metadata_json: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class LedgerEntryListResponse(BaseModel):
    id: int
    document_id: int
    document_number: str  # From the document relationship
    action: LedgerAction
    actor_id: int
    actor_name: str  # From the user relationship
    created_at: datetime

    class Config:
        from_attributes = True