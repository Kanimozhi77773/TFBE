from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime, timezone
import enum

class DocumentType(str, enum.Enum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PO = "PO"
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))  # FK to users.id
    doc_type = Column(ENUM(DocumentType, name='document_type'))
    doc_number = Column(String)
    file_url = Column(String)  # stored path or URL
    hash = Column(String)  # SHA-256 hash
    issued_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationship to ledger entries
    ledger_entries = relationship("LedgerEntry", back_populates="document")