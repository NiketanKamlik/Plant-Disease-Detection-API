import requests
import json
import io
import os
import base64

# Plant.id API Configuration (v3)
# Get your API key at https://admin.kindwise.com/
PLANT_ID_API_KEY = os.getenv("PLANT_ID_API_KEY") 
PLANT_ID_API_URL = os.getenv("PLANT_ID_API_URL", "https://api.plant.id/v3/health_assessment")

def get_external_prediction(image_bytes: bytes) -> dict:
    """
    Calls the Plant.id v3 API to identify plant species and health conditions.
    """
    try:
        # 1. Base64 encode the image (required for v3)
        encoded_image = base64.b64encode(image_bytes).decode('ascii')
        
        # 2. Prepare the payload
        payload = {
            "images": [encoded_image],
            "latitude": None,
            "longitude": None,
            "similar_images": True
        }
        
        # 3. Headers
        headers = {
            "Api-Key": PLANT_ID_API_KEY,
            "Content-Type": "application/json"
        }
        
        # 4. Send the request
        response = requests.post(PLANT_ID_API_URL, headers=headers, json=payload)
        
        if response.status_code != 201 and response.status_code != 200:
            return {
                "success": False, 
                "error": f"External API Error: {response.status_code}",
                "detail": response.text
            }
        
        data = response.json()
        result = data.get("result", {})
        
        # 5. Extract identification result
        classification = result.get("classification", {})
        suggestions = classification.get("suggestions", [])
        best_plant = suggestions[0] if suggestions else {}
        plant_name = best_plant.get("name", "Unknown Plant")
        
        # 6. Extract health result
        health = result.get("health", {})
        is_healthy_obj = health.get("is_healthy", {})
        is_healthy = is_healthy_obj.get("binary", True)
        
        health_suggestions = health.get("suggestions", []) # List of maps {name, probability}
        best_disease = health_suggestions[0] if health_suggestions else {}
        disease_name = best_disease.get("name", "Healthy")
        confidence = float(best_disease.get("probability", 0) * 100) if not is_healthy else float(best_plant.get("probability", 0) * 100)
        
        # 7. Get AI advice from OpenRouter (Passing all suggestions for better accuracy)
        from .llm_service import get_medicine_advice
        advice = get_medicine_advice(plant_name, disease_name, is_healthy, suggestions=health_suggestions)
        medicine_text = advice.get("medicine")
        precaution_text = advice.get("precaution")
        
        if not is_healthy:
            display_name = disease_name
            rec_text = f"The external API (Plant.id) detected symptoms of {disease_name} affecting {plant_name}. We recommend checking for specific care instructions."
        else:
            display_name = "Healthy"
            rec_text = f"The external API (Plant.id) identified this plant as {plant_name} and it appears to be healthy."

        return {
            "success": True,
            "is_healthy": is_healthy,
            "disease_name": f"{display_name} (External API)",
            "confidence": confidence,
            "recommendation": rec_text,
            "medicine": medicine_text,
            "precaution": precaution_text,
            "prediction_source": "External API (Plant.id)"
        }
        
    except Exception as e:
        return {"success": False, "error": f"External API Exception: {str(e)}"}
