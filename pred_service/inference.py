import io
import os
import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.efficientnet import preprocess_input
from .constants import IMG_SIZE, CLASS_NAMES
from .downloader import download_model_if_missing
from .external_api import get_external_prediction
from .disease_advice import get_local_advice

# Configuration for the model
model_path = os.path.join(os.path.dirname(__file__), "plant_disease_recog_model_pwp.h5")
# --- CLOUD DEPLOYMENT URL ---
MODEL_URL = "https://drive.google.com/file/d/14y3Jp8-hB7v3q1HosU0cxOP9TM2e7h1j/view?usp=drive_link"

# We defer loading until the prediction is called to speed up server startup
model = None

def process_image_and_predict(image_bytes: bytes) -> dict:
    """
    Dedicated function to handle prediction logic using the custom loaded model.
    Accepts raw image bytes, performs inference, and returns a JSON-serializable dict.
    """
    global model
    
    if model is None:
        # Load the model only when needed
        try:
            # First, ensure the model exists (download if missing)
            download_model_if_missing(model_path, MODEL_URL)
            
            if os.path.exists(model_path):
                print(f"Loading model for the first time from {model_path}...")
                model = tf.keras.models.load_model(model_path)
                print("Model loaded successfully.")
            else:
                return {
                    "success": False,
                    "error": f"Model file not found at {model_path}."
                }
        except Exception as e:
            print(f"Error loading model: {e}")
            return {
                "success": False,
                "error": f"Failed to load the Machine Learning model: {str(e)}"
            }

    try:
        # Wrap image_bytes in io.BytesIO so image.load_img can read it from memory
        img = image.load_img(io.BytesIO(image_bytes), target_size=IMG_SIZE)
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)

        img_array = preprocess_input(img_array)

        # Prediction
        predictions = model(img_array, training=False).numpy()

        predicted_index = np.argmax(predictions[0])
        predicted_class = CLASS_NAMES[predicted_index]

        confidence = float(np.max(predictions[0]) * 100)

        # Safe split
        if "___" in predicted_class:
            plant, disease = predicted_class.split("___")
        else:
            plant = "Unknown"
            disease = predicted_class

        disease = disease.replace("_", " ")

        print("\nPrediction Result")
        print("------------------")
        print("Plant   :", plant)
        print("Disease :", disease)
        print(f"Confidence : {confidence:.2f}%")

        # Is the plant healthy?
        is_healthy = "healthy" in disease.lower()

        # Get local advice from deterministic guidance rules
        advice = get_local_advice(plant, disease, is_healthy)
        medicine_text = advice.get("medicine")
        precaution_text = advice.get("precaution")

        # Recommendation logic mapping
        if is_healthy:
            rec_text = f"Great job! Your {plant} shows no signs of disease. Continue with your current watering and light schedule."
        else:
            rec_text = f"Isolate the {plant} plant to prevent spread. Apply appropriate treatments for {disease} and monitor frequently."

        # Format and Return JSON
        result_dict = {
            "success": True,
            "is_healthy": is_healthy,
            "disease_name": f"{plant} - {disease}",
            "confidence": confidence,
            "recommendation": rec_text,
            "medicine": medicine_text,
            "precaution": precaution_text,
            "prediction_source": "Local Model"
        }

        # --- FALLBACK LOGIC ---
        is_background = (predicted_class == 'Background_without_leaves')
        
        if is_background or confidence < 40:
             print(f"Triggering External Fallback (Reason: {'Non-leaf detected' if is_background else f'Low confidence {confidence:.1f}%'})")
             external_res = get_external_prediction(image_bytes)
             if external_res.get("success"):
                 return external_res
             else:
                 print(f"External API failed: {external_res.get('error')}")
                 if is_background:
                     return {
                        "success": True,
                        "is_healthy": False,
                        "disease_name": "No Plant Leaf Detected",
                        "confidence": confidence,
                        "recommendation": "Please upload a clear, focused image of a plant leaf. The system detected something else and the external analysis API is out of quota.",
                        "medicine": "N/A",
                        "precaution": "N/A",
                        "prediction_source": "Local Model"
                     }
                 else:
                     result_dict["disease_name"] += " (Low Confidence)"
                     result_dict["recommendation"] += " Note: External analysis is currently unavailable."
                     return result_dict

        return result_dict
        
    except Exception as e:
        return {"success": False, "error": str(e)}
