from fastapi import APIRouter
from fastapi.responses import HTMLResponse
import pathlib
from typing import List

router = APIRouter()
frontend_dir = pathlib.Path("frontend")

@router.get("/login", response_class=HTMLResponse)
def get_login_page():
    html_path = frontend_dir / "login.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text('utf-8'), status_code=200)
    return {"Error": "Login page not found"}

@router.get("/register", response_class=HTMLResponse)
def get_register_page():
    html_path = frontend_dir / "register.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text('utf-8'), status_code=200)
    return {"Error": "Register page not found"}

# --- API Endpoints for Authenticaton ---
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from local_db.database import get_db
from local_db import crud, schemas, models

@router.post("/api/auth/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.post("/api/auth/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not crud.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # For local testing, we just verify matching credentials and return success.
    return {"success": True, "message": "Login successful", "user": {"id": db_user.id, "name": db_user.name, "email": db_user.email}}

@router.get("/api/auth/profile/{user_id}", response_model=schemas.UserOut)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/api/auth/profile/{user_id}", response_model=schemas.UserOut)
def update_profile(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = crud.update_user(db, user_id, user_update)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/api/auth/history/{user_id}", response_model=List[schemas.HistoryOut])
def get_history(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_history(db, user_id)
