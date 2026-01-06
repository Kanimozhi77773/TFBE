from app.core.security import get_password_hash, verify_password

# Test password hashing with a very short password
try:
    password = "pass"
    hashed = get_password_hash(password)
    print(f"Password hashed successfully: {hashed}")
    
    # Test verification
    is_valid = verify_password(password, hashed)
    print(f"Password verification: {is_valid}")
except Exception as e:
    print(f"Error in password hashing: {e}")
    import traceback
    print(traceback.format_exc())