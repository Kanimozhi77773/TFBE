from app.db.session import engine
from app.db.base import Base
from app.models.user import User
from app.models.document import Document
from app.models.ledger import LedgerEntry

# Create all tables
Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")