import io
import os
import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.efficientnet import preprocess_input
from .constants import IMG_SIZE, CLASS_NAMES
from .external_api import get_external_prediction
from .disease_advice import get_local_advice

# Use the lightweight TFLite model included in the repo
model_path = os.path.join(os.path.dirname(__file__), "plant_disease_recog_model_pwp.tflite")

interpreter = None
input_details = None
output_details = None

def process_image_and_predict(image_bytes: bytes) -> dict:
    global interpreter, input_details, output_details
    
    if interpreter is None:
        try:
            print(f"Loading TFLite model from {model_path}...")
            interpreter = tf.lite.Interpreter(model_path=model_path)
            interpreter.allocate_tensors()
            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()
            print("TFLite Model loaded successfully.")
        except Exception as e:
            print(f"Error loading TFLite model: {e}. Falling back to External API.")
            external_res = get_external_prediction(image_bytes)
            if external_res.get("success"):
                external_res["prediction_source"] = "External API (Local Model Fallback)"
                return external_res
            else:
                return {
                    "success": False,
                    "error": f"Local model failed ({str(e)}) AND External API failed ({external_res.get('error')}). Please configure PLANT_ID_API_KEY in Render."
                }

    try:
        # Wrap image_bytes in io.BytesIO so image.load_img can read it from memory
        img = image.load_img(io.BytesIO(image_bytes), target_size=IMG_SIZE)
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)

        img_array = preprocess_input(img_array)

        # Prediction using TFLite
        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke()
        predictions = interpreter.get_tensor(output_details[0]['index'])

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
