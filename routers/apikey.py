from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from local_db import crud, models, schemas, database
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
def generate_key(user_id: int, user_name: str, db: Session = Depends(get_db)):
    """
    Generates a new API key for the user.
    Admin 'niket' gets lifetime keys (no expiry).
    Others get 2-month expiry.
    """
    return crud.create_api_key(db, user_id=user_id, user_name=user_name)

@router.get("/", response_model=List[schemas.APIKeyOut])
def list_keys(user_id: int, db: Session = Depends(get_db)):
    return crud.get_api_keys(db, user_id=user_id)
