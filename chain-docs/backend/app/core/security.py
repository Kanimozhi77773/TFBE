from passlib.context import CryptContext

# Use argon2 as the primary hashing algorithm
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    default="argon2",
    deprecated="auto"
)
def verify_password(plain_password, hashed_password):
    # Make sure we're passing a string
    if isinstance(plain_password, bytes):
        plain_password = plain_password.decode('utf-8')
    
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Make sure we're passing a string
    if isinstance(password, bytes):
        password = password.decode('utf-8')
    
    return pwd_context.hash(password)