from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes_auth import router as auth_router
from app.api.v1.routes_documents import router as documents_router
from app.api.v1.routes_ledger import router as ledger_router
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI(title="Trade Finance Blockchain Explorer", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = error.get('loc', [])[-1] if error.get('loc') else None
        if field == 'email':
            message = error.get('msg', 'Invalid email')
            location = 'whole'
            
            # Determine the specific location based on the error message
            if 'Local part' in message:
                location = 'local_part'
            elif 'Domain' in message and ('cannot start' in message or 'cannot end' in message or 'contain' in message):
                location = 'domain'
            elif 'Top-level domain' in message:
                location = 'tld'
            
            errors.append({
                "field": "email",
                "message": message,
                "location": location
            })
        else:
            errors.append({
                "field": field,
                "message": error.get('msg', 'Invalid value'),
                "location": "whole"
            })
    
    return JSONResponse(
        status_code=422,
        content={"detail": errors}
    )

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(documents_router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(ledger_router, prefix="/api/v1/ledger", tags=["ledger"])

# Test endpoint to verify the server is running
@app.get("/test")
async def test():
    return {"message": "Server is running"}

@app.get("/")
async def root():
    return {"message": "Welcome to the Trade Finance Blockchain Explorer API"}