# Project Report

**Project Title:** Phyto-Scan — Plant Disease Detection API

**Group Member Details:**

| S.No | Name | Roll No |
| :--- | :--- | :--- |
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |

**GitHub/Online Platform Link for the Project:**
[Link to Project Repository]

---

### 1. Abstract
The Phyto-Scan Plant Disease Detection system is an AI-powered cloud platform designed to diagnose leaf diseases from uploaded images. Utilizing a custom Convolutional Neural Network (CNN) based on the EfficientNet architecture, the system provides accurate classifications of plant health. In addition to detection, it integrates with Large Language Models (LLM) via the OpenRouter API to supply context-aware medicine recommendations and precautions. The backend API is authenticated, scalable, and includes usage quota limits, making it a robust service-based solution for modern precision agriculture.

### 2. Introduction
Plant diseases pose a significant threat to global agricultural yield, often requiring expert pathology to diagnose correctly. Phyto-Scan aims to bridge this gap by bringing automated deep-learning computer vision to everyday farming. The platform is capable of identifying anomalies across 38 core agricultural categories, including apples, tomatoes, and corn. By providing instant diagnostic results, recovery protocols, and precautionary measures directly through an interactive web-interface and a programmable API, Phyto-Scan empowers farmers and developers to intervene early and mitigate crop loss.

### 3. Objectives
*   To develop a highly accurate, deep learning-based image classification workflow capable of distinguishing between healthy and diseased plant leaves.
*   To provide actionable textual advice, including specific treatments and preventative care, by supplementing model predictions with generative AI technology.
*   To create a secure, RESTful API backend using FastAPI, ensuring scalable integration with frontend applications or third-party platforms via API key authentication.
*   To design a fallback mechanism utilizing external prediction APIs to maintain continuous service accuracy in edge cases (e.g., low confidence predictions or non-leaf images).

### 4. Flowchart
1.  **Image Upload:** User interacts with the UI or API Endpoint (`/api/predict`) by uploading an image.
2.  **File Validation:** The system verifies the image format and ensures the file size is under the 5MB limit.
3.  **Local AI Inference:** The system resizes and preprocesses the image, feeding it into the TensorFlow/Keras EfficientNet `.h5` model.
4.  **Confidence Evaluation:**
    *   If prediction confidence < 40% or no leaf is detected $\rightarrow$ Trigger External Fallback API.
    *   If prediction confidence $\ge$ 40% $\rightarrow$ Proceed to results.
5.  **Recommendation Generation:** The system passes the plant and disease nomenclature to an LLM service to dynamically generate custom medicine and precaution protocols.
6.  **Database Logging:** API key usage limits are updated, and prediction history is saved using SQLite/SQLAlchemy.
7.  **Response Payload:** A rich JSON payload encompassing the disease name, confidence probability, and recommendations is delivered to the client.

### 5. Methodology
The project follows a multi-tier backend architecture:
*   **Framework:** Built entirely on FastAPI to handle secure and rapid routing of HTTP requests, supported by security HTTP headers and CORS middlewares.
*   **Deep Learning Pipeline:** A TensorFlow/Keras EfficientNet model is automatically downloaded from cloud storage if missing and is loaded dynamically to ensure server startup efficiency. Images converted to targeted arrays undergo prediction for the highest probability label.
*   **LLM Integration:** Contextual advice generation relies on an OpenRouter LLM module, intelligently prompting an AI instance using plant and disease names to abstract separate medicine and precaution data formats.
*   **Database Management:** SQLAlchemy acts as an Object-Relational Mapper (ORM), wrapping a lightweight SQLite database (`plantcare.db`). It robustly manages users, authenticates API keys, enforces usage limits, and tracks prediction history.
*   **Frontend Interactivity:** A vanilla HTML/CSS and JavaScript front-end features a glassmorphic aesthetic with an interactive scanner simulation, parsing API JSON responses for user-friendly data display without page reloads.

### 6. Results / Output
The resulting platform is an easily deployable backend web service mapped directly to a polished graphical interface. When testing with leaf images, users immediately receive:
*   `disease_name`: String combinations associating the identified crop logic to its specific pathology (e.g., "Apple - Apple scab").
*   `confidence`: Floating-point probabilities detailing the AI certainty metric.
*   `medicine` & `precaution`: Extensive bespoke textual advice ensuring practical steps can be taken for agricultural rehabilitation.
Additionally, the robust SQLite rate-limiting integration prevents abuse of the API endpoints, returning standard HTTP errors (`429 Quota Exhausted`) when designated usage levels are breached. 

### 7. Conclusion
In conclusion, Phyto-Scan successfully modernizes plant pathology via precision Artificial Intelligence. By fusing conventional deep learning image classification architectures with the contextual depth achievable by modern Large Language Models, the system actively serves both as an analytical detection tool and a virtual agricultural consultant. The dedicated REST API ensures the technology integrates organically into independent software ecosystems, thereby improving capabilities to limit potential crop failures worldwide.

### 8. References
1.  FastAPI Framework Documentation: Secure Backend Operations and API routing.
2.  TensorFlow Core & Keras Documentation: Implementations of modern EfficientNet CNN models.
3.  OpenRouter LLM API: Remote procedural logic for Generative AI handling.
4.  SQLAlchemy Core/ORM: Guidelines on relational mapping and database connections.
