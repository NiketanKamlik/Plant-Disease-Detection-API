import io
import os
import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.efficientnet import preprocess_input
from .constants import IMG_SIZE, CLASS_NAMES
from .disease_info import DISEASE_INFO
from .downloader import download_model_if_missing
from .external_api import get_external_prediction

# Try to load the model. We expect the user to place the .h5 file in this pred_service folder
model_path = os.path.join(os.path.dirname(__file__), "plant_disease_recog_model_pwp.h5")

# --- CLOUD DEPLOYMENT URL ---
# Replace this with your Google Drive direct link, AWS S3 link, or Hugging Face model link!
MODEL_URL = "https://drive.google.com/file/d/14y3Jp8-hB7v3q1HosU0cxOP9TM2e7h1j/view?usp=drive_link"

# If the file is missing (e.g. during a fresh deployment online), try to download it first
download_model_if_missing(model_path, MODEL_URL)

# We defer failing until the prediction is called in case the file isn't there right at app startup
model = None
try:
    if os.path.exists(model_path):
        model = tf.keras.models.load_model(model_path)
        print(f"Successfully loaded model from {model_path}")
    else:
        print(f"Warning: Model file not found at {model_path}. Please place it there.")
except Exception as e:
    print(f"Error loading model: {e}")


def process_image_and_predict(image_bytes: bytes) -> dict:
    """
    Dedicated function to handle prediction logic using the custom loaded model.
    Accepts raw image bytes, performs inference, and returns a JSON-serializable dict.
    """
    global model
    
    if model is None:
        # Try loading one more time if it was missing initially 
        try:
            if os.path.exists(model_path):
                model = tf.keras.models.load_model(model_path)
        except Exception:
            pass
            
    if model is None:
        return {
            "success": False,
            "error": "The Machine Learning model is not loaded. Please ensure plant_disease_recog_model_pwp.h5 is inside the pred_service folder."
        }

    try:
        # Use the exact Keras logic provided by the user
        # We wrap image_bytes in io.BytesIO so image.load_img can read it directly from memory
        img = image.load_img(io.BytesIO(image_bytes), target_size=IMG_SIZE)
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)

        img_array = preprocess_input(img_array)

        # Optimization: Calling the model directly is significantly faster than model.predict() 
        # for single image arrays, as it skips all the overhead of setting up training/batch batches.
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

        # Get extra mapping if available
        # The predicted_class matches keys in DISEASE_INFO
        info = DISEASE_INFO.get(predicted_class, {})
        medicine_text = info.get("medicine", "No specific medicine available.")
        precaution_text = info.get("precaution", "No specific precaution available.")

        # Recommendation logic mapping
        if is_healthy:
            rec_text = "Great job! Your plant shows no signs of disease. Continue with your current watering and light schedule."
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
        # If the model detects 'No Leaf' (Background_without_leaves) OR confidence is very low,
        # we consult the "legit" external API for a more accurate second opinion.
        is_background = (predicted_class == 'Background_without_leaves')
        
        if is_background or confidence < 40:
             print(f"Triggering External Fallback (Reason: {'Non-leaf detected' if is_background else f'Low confidence {confidence:.1f}%'})")
             external_res = get_external_prediction(image_bytes)
             if external_res.get("success"):
                 return external_res

        return result_dict
        
    except Exception as e:
        return {"success": False, "error": str(e)}
