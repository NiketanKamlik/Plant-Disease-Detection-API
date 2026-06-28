import os
import requests
import json

def _get_openrouter_api_key() -> str | None:
    raw_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not raw_key:
        return None

    # Some .env files accidentally concatenate two keys; keep the first token only.
    if raw_key.count("sk-or-v1-") > 1:
        raw_key = raw_key.split("sk-or-v1-", 2)[1]
        raw_key = "sk-or-v1-" + raw_key.split("sk-or-v1-", 1)[0].strip()

    return raw_key


OPENROUTER_API_KEY = _get_openrouter_api_key()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")

def get_medicine_advice(plant: str, disease: str, is_healthy: bool, suggestions: list = None) -> dict:
    """
    Calls OpenRouter to get medical advice and precautions for a plant disease.
    Enhanced to handle multiple suggestions from external APIs for better accuracy.
    """
    if not OPENROUTER_API_KEY:
        return {
            "medicine": "OpenRouter API Key not configured.",
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

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/niketankamlik-commits/Plant-Disease-Detection-API"
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "max_tokens": 500,
        "messages": [
            {"role": "system", "content": "You are a helpful agricultural assistant."},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=15
        )
        
        if response.status_code != 200:
            error_detail = response.text[:200]
            print(f"OpenRouter Error: {response.status_code} - {error_detail}")
            return {
                "medicine": f"Consult a local agricultural expert or nursery for specific {disease} treatments.",
                "precaution": f"Isolate the {plant} plant. Ensure proper watering, improve air circulation, and monitor frequently."
            }

        res_data = response.json()
        content = res_data['choices'][0]['message']['content']
        advice = json.loads(content)
        
        return {
            "medicine": advice.get("medicine", "No specific medicine information returned."),
            "precaution": advice.get("precaution", "No specific precautions returned.")
        }

    except Exception as e:
        return {
            "medicine": "Failed to fetch AI advice.",
            "precaution": str(e)
        }
