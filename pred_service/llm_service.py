import os
import requests
import json

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash"

def get_medicine_advice(plant: str, disease: str, is_healthy: bool, suggestions: list = None) -> dict:
    """
    Calls Google Gemini API directly to get medical advice and precautions for a plant disease.
    Enhanced to handle multiple suggestions from external APIs for better accuracy.
    """
    if not GEMINI_API_KEY:
        return {
            "medicine": "Gemini API Key not configured.",
            "precaution": "Please check your environment variables."
        }

    if is_healthy:
        return {
            "medicine": "No medicine needed for a healthy plant.",
            "precaution": f"Continue standard care for your {plant}."
        }

    # Prepare context if multiple suggestions are provided
    context = ""
    if suggestions:
        context = "The identification service provided these top possibilities:\n"
        for s in suggestions[:3]:  # Top 3
            context += f"- {s.get('name')} (Probability: {s.get('probability', 0)*100:.1f}%)\n"
    
    prompt = f"""
    You are an expert plant pathologist. I have a {plant} plant.
    {context if context else f"It has been diagnosed with '{disease}'."}
    
    Based on this information, please provide the most likely diagnosis and:
    1. 'medicine': A concise list of treatments, fungicides, or organic remedies.
    2. 'precaution': Key steps to prevent spread or future occurrences.
    
    Format your response as a JSON object with these two keys: 'medicine' and 'precaution'. 
    Keep the descriptions concise but informative (max 2-3 sentences per field).
    """

    payload = {
        "system_instruction": {
            "parts": { "text": "You are a helpful agricultural assistant." }
        },
        "contents": [
            {
                "role": "user",
                "parts": [
                    { "text": prompt }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "maxOutputTokens": 500
        }
    }

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        response = requests.post(url, json=payload, timeout=15)
        
        if response.status_code != 200:
            error_detail = response.text[:200]
            print(f"Gemini API Error: {response.status_code} - {error_detail}")
            return {
                "medicine": f"Consult a local agricultural expert or nursery for specific {disease} treatments.",
                "precaution": f"Isolate the {plant} plant. Ensure proper watering, improve air circulation, and monitor frequently."
            }

        res_data = response.json()
        content = res_data['candidates'][0]['content']['parts'][0]['text']
        advice = json.loads(content)
        
        return {
            "medicine": advice.get("medicine", "No specific medicine information returned."),
            "precaution": advice.get("precaution", "No specific precautions returned.")
        }

    except Exception as e:
        print(f"Gemini Exception: {str(e)}")
        return {
            "medicine": f"Consult a local agricultural expert or nursery for specific {disease} treatments.",
            "precaution": f"Isolate the {plant} plant. Ensure proper watering, improve air circulation, and monitor frequently."
        }
