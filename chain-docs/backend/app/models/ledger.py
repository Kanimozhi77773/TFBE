from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime, timezone
import enum


class LedgerAction(str, enum.Enum):
    ISSUED = "ISSUED"
    AMENDED = "AMENDED"
    SHIPPED = "SHIPPED"
    RECEIVED = "RECEIVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    VERIFIED = "VERIFIED"


class LedgerEntry(Base):
    __tablename__ = "LedgerEntries"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    action = Column(Enum(LedgerAction), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # FK to users.id
    metadata_json = Column("metadata", JSONB)  # JSONB for PostgreSQL
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    document = relationship("Document", back_populates="ledger_entries")
    actor = relationship("User", back_populates="ledger_entries")