from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from local_db import crud, models, schemas, database, auth_utils
from typing import List

router = APIRouter(prefix="/api/keys", tags=["API Keys"])

# Simple dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/generate", response_model=schemas.APIKeyOut)
def generate_key(
    key_name: str, 
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a new API key for the authenticated user.
    Users are limited to 5 active API keys.
    """
    # Enforce limit for all users based on plan_type if needed, 
    # but here we standardize to 5 for now.
    active_count = crud.count_active_keys(db, user_id=current_user.id)
    if active_count >= 5 and current_user.plan_type != "Enterprise":
        raise HTTPException(
            status_code=403, 
            detail="Key limit reached. Please upgrade your plan for more keys."
        )
            
    return crud.create_api_key(db, user_id=current_user.id, user_name=current_user.name, key_name=key_name)

@router.get("/", response_model=List[schemas.APIKeyOut])
def list_keys(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists all API keys for the authenticated user.
    """
    return crud.get_api_keys(db, user_id=current_user.id)
