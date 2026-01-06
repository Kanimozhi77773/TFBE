from pydantic import BaseModel, field_serializer
from typing import Optional
from datetime import datetime
from enum import Enum

class DocumentType(str, Enum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PO = "PO"
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"

class DocumentUploadRequest(BaseModel):
    doc_type: DocumentType
    doc_number: str
    issued_at: datetime

class DocumentUploadResponse(BaseModel):
    id: int
    doc_type: DocumentType
    doc_number: str
    file_url: str
    hash: str
    issued_at: datetime
    created_at: datetime
    
    @field_serializer('issued_at')
    def serialize_issued_at(self, issued_at: datetime):
        return issued_at.isoformat()
    
    @field_serializer('created_at')
    def serialize_created_at(self, created_at: datetime):
        return created_at.isoformat()
    
    class Config:
        orm_mode = True

class DocumentDetailsResponse(BaseModel):
    id: int
    owner_id: int
    doc_type: DocumentType
    doc_number: str
    file_url: str
    hash: str
    issued_at: datetime
    created_at: datetime
    
    @field_serializer('issued_at')
    def serialize_issued_at(self, issued_at: datetime):
        return issued_at.isoformat()
    
    @field_serializer('created_at')
    def serialize_created_at(self, created_at: datetime):
        return created_at.isoformat()
    
    class Config:
        orm_mode = True

class DocumentListResponse(BaseModel):
    id: int
    doc_type: DocumentType
    doc_number: str
    file_url: str
    hash: str
    issued_at: datetime
    created_at: datetime
    
    @field_serializer('issued_at')
    def serialize_issued_at(self, issued_at: datetime):
        return issued_at.isoformat()
    
    @field_serializer('created_at')
    def serialize_created_at(self, created_at: datetime):
        return created_at.isoformat()
    
    class Config:
        orm_mode = True

class DocumentEditRequest(BaseModel):
    doc_type: DocumentType
    doc_number: str
    issued_at: datetime

class DocumentFilterRequest(BaseModel):
    doc_type: Optional[DocumentType] = None
    doc_number: Optional[str] = None
    issued_from: Optional[datetime] = None
    issued_to: Optional[datetime] = None
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None