import sys
import os
# Add backend directory to PYTHONPATH
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BACKEND_DIR)
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.db.session import get_db
from app.main import app
import tempfile
import shutil

# Create a temporary directory for our test database
TEST_DB_DIR = tempfile.mkdtemp()

# Override the database URL to use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(TEST_DB_DIR, 'test.db')}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables in the test database
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override the database dependency
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def client():
    """Create a TestClient for testing the FastAPI application."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def db_session():
    """Create a database session for testing."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="session", autouse=True)
def cleanup(request):
    """Clean up the temporary directory after all tests are done."""
    def clean_up():
        shutil.rmtree(TEST_DB_DIR, ignore_errors=True)
    
    request.addfinalizer(clean_up)