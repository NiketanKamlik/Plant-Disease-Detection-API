from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    plan_type = Column(String, default="Free") # Free, Pro, Enterprise

    api_keys = relationship("APIKey", back_populates="owner")
    history = relationship("PredictionHistory", back_populates="user")

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    name = Column(String, index=True, nullable=True) # Optional name for the key
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    expires_at = Column(DateTime, nullable=True) # Null means lifetime (for admin)
    last_used = Column(DateTime, nullable=True)
    usage_count = Column(Integer, default=0)
    usage_limit = Column(Integer, default=1000) # Monthly limit
    is_active = Column(Boolean, default=True)

    owner = relationship("User", back_populates="api_keys")

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=True)
    disease_name = Column(String)
    confidence = Column(Integer)
    recommendation = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    user = relationship("User", back_populates="history")
