import os
import uuid
from typing import BinaryIO
import mimetypes

def validate_file_type(uploaded_file) -> bool:
    """
    Validate file type - only allow PDF, JPG, PNG
    """
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png']
    content_type = uploaded_file.content_type if hasattr(uploaded_file, 'content_type') else mimetypes.guess_type(uploaded_file.filename)[0]
    return content_type in allowed_types

def generate_safe_filename(original_name: str) -> str:
    """
    Generate a safe filename with UUID to avoid conflicts
    """
    name, ext = os.path.splitext(original_name)
    safe_name = f"{uuid.uuid4()}_{name}{ext}"
    return safe_name

def upload_to_s3(file_path: str, bucket_name: str, object_name: str = None) -> bool:
    """
    Upload file to S3 (placeholder)
    """
    # TODO: Implement S3 upload
    return False