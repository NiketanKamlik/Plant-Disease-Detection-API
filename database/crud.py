from sqlalchemy.orm import Session
from . import models, schemas
import bcrypt
import uuid
from datetime import datetime, timedelta, timezone

def get_password_hash(password: str) -> str:
    # bcrypt requires bytes, so we encode the string
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# API Key Operations
def get_api_keys(db: Session, user_id: int):
    return db.query(models.APIKey).filter(models.APIKey.user_id == user_id).all()

def count_active_keys(db: Session, user_id: int):
    return db.query(models.APIKey).filter(
        models.APIKey.user_id == user_id,
        models.APIKey.is_active == True
    ).count()

def create_api_key(db: Session, user_id: int, user_name: str, key_name: str):
    # Generate a unique key
    new_key = str(uuid.uuid4()).replace("-", "")
    
    # Default expiry to 6 MONTHS (180 days) for all user keys to ensure rotation.
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=180)
    
    db_key = models.APIKey(
        key=new_key,
        name=key_name,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(db_key)
    db.commit()
    db.refresh(db_key)
    return db_key

def validate_api_key(db: Session, key: str):
    db_key = db.query(models.APIKey).filter(models.APIKey.key == key).first()
    if not db_key or not db_key.is_active:
        return None
    
    # Check if expired
    if db_key.expires_at and db_key.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        return None
        
    return db_key.owner

def increment_key_usage(db: Session, db_key: models.APIKey):
    db_key.usage_count += 1
    db_key.last_used = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(db_key)
    return db_key

# History Operations
def get_user_history(db: Session, user_id: int):
    return db.query(models.PredictionHistory).filter(models.PredictionHistory.user_id == user_id).order_by(models.PredictionHistory.created_at.desc()).all()

def create_history_entry(db: Session, history: schemas.HistoryCreate):
    db_history = models.PredictionHistory(**history.dict())
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

# Profile Operations
def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user
