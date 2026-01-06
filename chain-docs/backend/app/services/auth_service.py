from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.core.security import verify_password, get_password_hash
from app.core.jwt_handler import create_access_token, create_refresh_token
from app.schemas.user import UserCreate
from datetime import timedelta
from app.core.config import settings

def get_user_by_email(db: Session, email: str):
    # Case-insensitive email lookup
    return db.query(User).filter(User.email.ilike(email)).first()

def create_user(db: Session, user: UserCreate):
    db_user = User(
        name=user.name,
        email=user.email.lower(),  # Store email in lowercase
        password=get_password_hash(user.password),
        role=user.role,
        org_name=user.org_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    # Case-insensitive email lookup for authentication
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

def create_tokens_for_user(user):
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role, "org_name": user.org_name}, 
        expires_delta=access_token_expires
    )
    
    refresh_token = create_refresh_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=refresh_token_expires
    )
    
    return access_token, refresh_token