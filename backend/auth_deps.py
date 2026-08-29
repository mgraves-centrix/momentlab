import os
import secrets
from fastapi import HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_reviewer(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    raw_env = os.environ.get("REVIEWER_TOKENS")
    if not raw_env or not raw_env.strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reviewer authentication service unavailable: REVIEWER_TOKENS not configured."
        )
    
    valid_tokens = [t.strip() for t in raw_env.split(",") if t.strip()]
    if not valid_tokens:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reviewer authentication service unavailable: no valid tokens configured."
        )
    
    if not any(secrets.compare_digest(token, t) for t in valid_tokens):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization token."
        )
    return f"reviewer_{token[:8]}"
