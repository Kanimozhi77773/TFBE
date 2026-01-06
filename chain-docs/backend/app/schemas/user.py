from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    BANK = "bank"
    CORPORATE = "corporate"
    AUDITOR = "auditor"
    ADMIN = "admin"

class UserBase(BaseModel):
    name: str
    email: str
    role: UserRole
    org_name: str

    @validator('email')
    def validate_email(cls, v):
        import re
        # Rule 1: The email must contain exactly one @
        if v.count('@') != 1:
            raise ValueError("Email must contain exactly one '@' symbol")
        
        local_part, domain_part = v.split('@')
        
        # Rule 2: Local Part Rules (before '@')
        # must not be empty
        if not local_part:
            raise ValueError("Local part (before '@') cannot be empty")
        
        # must not start or end with .
        if local_part.startswith('.') or local_part.endswith('.'):
            raise ValueError("Local part (before '@') cannot start or end with '.'")
        
        # Local part must match: ^[A-Za-z0-9._-]+$
        if not re.match(r'^[A-Za-z0-9._-]+$', local_part):
            raise ValueError("Local part contains invalid characters. Allowed: letters, digits, '.', '_', '-'")
        
        # Rule 3: The part after @ (domain part)
        # must not be empty
        if not domain_part:
            raise ValueError("Domain part (after '@') cannot be empty")
        
        # must contain at least one . (e.g. example.com)
        if '.' not in domain_part:
            raise ValueError("Domain part (after '@') must contain at least one '.'")
        
        # Split domain into name and TLD
        domain_parts = domain_part.split('.')
        domain_name = '.'.join(domain_parts[:-1])
        tld = domain_parts[-1]
        
        # For domain name (everything before last dot), check each part
        domain_name_parts = domain_name.split('.')
        for part in domain_name_parts:
            if not part:  # Empty part
                raise ValueError("Domain contains invalid characters")
            # Domain name must match: ^[A-Za-z0-9-]+$
            if not re.match(r'^[A-Za-z0-9-]+$', part):
                raise ValueError("Domain contains invalid characters")
            # Cannot begin with -
            if part.startswith('-'):
                raise ValueError("Domain cannot start with '-'" if part == domain_name_parts[0] else "Domain contains invalid characters")
            # Cannot end with -
            if part.endswith('-'):
                raise ValueError("Domain cannot end with '-'" if part == domain_name_parts[-1] else "Domain contains invalid characters")
            # No underscores
            if '_' in part:
                raise ValueError("Domain cannot contain '_'" if part == domain_name_parts[0] else "Domain contains invalid characters")
        
        # TLD Rules (after last '.')
        # Must be only letters: ^[A-Za-z]+$
        if not re.match(r'^[A-Za-z]+$', tld):
            raise ValueError("Top-level domain must be at least 2 letters and contain only A–Z characters")
        # Must be at least 2 characters
        if len(tld) < 2:
            raise ValueError("Top-level domain must be at least 2 letters and contain only A–Z characters")
        
        # Rule 4: Disallow consecutive dots .. anywhere in the email
        if '..' in v:
            raise ValueError("Email cannot contain consecutive dots '..'")
        
        # Rule 5: Disallow spaces anywhere in the email
        if ' ' in v:
            raise ValueError("Email cannot contain spaces")
        
        return v

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    org_name: Optional[str] = None