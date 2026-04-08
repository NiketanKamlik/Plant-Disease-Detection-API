from fastapi import APIRouter, UploadFile, File, Header, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pred_service import process_image_and_predict
from database import database, crud, schemas
import io

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/api/predict")
async def predict_disease(
    file: UploadFile = File(...),
    x_api_key: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    API Router handling leaf disease prediction.
    Supports authenticated access via X-API-KEY header.
    """
    user_name = "Guest"
    if x_api_key:
        user = crud.validate_api_key(db, x_api_key)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired API Key")
        
        # Get the key object to check usage
        db_key = db.query(database.models.APIKey).filter(database.models.APIKey.key == x_api_key).first()
        if db_key and db_key.usage_count >= db_key.usage_limit:
            raise HTTPException(status_code=429, detail="API Quota Exhausted. Please upgrade your plan.")
        
        user_name = user.name

    # 1. File Type Validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    # 2. File Size Validation (5MB Limit)
    MAX_FILE_SIZE = 5 * 1024 * 1024 # 5MB
    
    try:
        # Read the uploaded image bytes
        contents = await file.read()
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")
        
        # Delegate task to the prediction service
        result = process_image_and_predict(contents)
        
        # Save to history & Increment usage if user is authenticated
        if x_api_key and db_key:
            # Increment usage
            crud.increment_key_usage(db, db_key)
            
            # Combine recommendation with medicine and precaution for history DB
            rec_full = result.get("recommendation", "No data")
            if "medicine" in result and "precaution" in result:
                rec_full += f" | Medicine: {result['medicine']} | Precaution: {result['precaution']}"

            # Save history linked to key
            crud.create_history_entry(db, schemas.HistoryCreate(
                user_id=db_key.user_id,
                api_key_id=db_key.id,
                disease_name=result.get("disease_name", "Unknown"),
                confidence=int(result.get("confidence", 0)),
                recommendation=rec_full
            ))

        # Return standardized JSON response
        return JSONResponse(content={
            "success": True,
            "disease_name": result.get("disease_name", "Unknown"),
            "confidence": round(float(result.get("confidence", 0)), 2),
            "recommendation": result.get("recommendation", "No data"),
            "medicine": result.get("medicine", ""),
            "precaution": result.get("precaution", ""),
            "is_healthy": result.get("is_healthy", False),
            "source": user_name,
            "prediction_source": result.get("prediction_source", "Unknown")
        })
            
    except Exception as e:
        return JSONResponse(content={"success": False, "error": str(e)}, status_code=500)
