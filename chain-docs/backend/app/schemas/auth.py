from pydantic import BaseModel
from typing import Optional
from app.schemas.user import User

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserCreateResponse(BaseModel):
    message: str
    user: User

class UserLoginResponse(Token):
    user: User