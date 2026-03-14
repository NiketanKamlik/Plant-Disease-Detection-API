from fastapi import APIRouter, UploadFile, File
from pred_service import process_image_and_predict

router = APIRouter()

@router.post("/api/predict")
async def predict_disease(file: UploadFile = File(...)):
    """
    API Router specifically handling the standard HTTP upload and JSON response formatting.
    All heavy lifting and modeling is offloaded to the pred_service.
    """
    try:
        # Read the uploaded image bytes
        contents = await file.read()
        
        # Delegate task to the prediction service
        result_json = process_image_and_predict(contents)
        
        return result_json
            
    except Exception as e:
        return {"success": False, "error": str(e)}
