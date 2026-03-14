import os
import requests
import gdown

def download_model_if_missing(model_path: str, model_url: str):
    """
    Downloads the model from a cloud URL if it doesn't already exist locally.
    This bypasses GitHub's 100MB limit for deployment.
    """
    if not os.path.exists(model_path):
        print(f"Model not found locally at {model_path}. Starting download from cloud...")
        try:
            if "drive.google.com" in model_url:
                print("Detected Google Drive link. Using gdown...")
                # fuzzy=True helps gdown extract the file ID even from viewer links
                gdown.download(url=model_url, output=model_path, quiet=False, fuzzy=True)
            else:
                # Stream the download so we don't load a huge file into RAM at once
                response = requests.get(model_url, stream=True)
                response.raise_for_status() # Check if the URL is valid

                with open(model_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
            print("Model downloaded successfully!")
        except Exception as e:
            print(f"Failed to download the model: {e}")
            print("Please ensure the MODEL_URL is correct and publicly accessible.")
    else:
        print(f"Model already exists at {model_path}. Skipping download.")
