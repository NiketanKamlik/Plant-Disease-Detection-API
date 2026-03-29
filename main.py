import os
import pathlib
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

os.environ["TF_ENABLE_ONEDNN_OPTS"] = os.getenv("TF_ENABLE_ONEDNN_OPTS", "0")
os.environ["TF_CPP_MIN_LOG_LEVEL"] = os.getenv("TF_CPP_MIN_LOG_LEVEL", "2")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# Register routers
from routers import home, upload, predict, auth, info, apikey
from local_db.database import engine
from local_db import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(docs_url=None, redoc_url=None)

# 1. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;"
    return response

# Make sure frontend dir exists conceptually
frontend_dir = pathlib.Path("frontend")

try:
    from fastapi.staticfiles import StaticFiles
    app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")
except ImportError:
    # Fallback if aiofiles / staticfiles isn't fully working in environment
    from fastapi.responses import Response
    import mimetypes
    @app.get("/frontend/{file_path:path}")
    def serve_frontend_fallback(file_path: str):
        file = frontend_dir / file_path
        if not file.exists():
            return Response(status_code=404)
        mime_type, _ = mimetypes.guess_type(file)
        return Response(content=file.read_bytes(), media_type=mime_type or "application/octet-stream")

# Register routers
app.include_router(home.router)
app.include_router(info.router)
app.include_router(upload.router)
app.include_router(predict.router)
app.include_router(auth.router)
app.include_router(apikey.router)

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("APP_HOST", "127.0.0.1")
    port = int(os.getenv("APP_PORT", 8000))
    uvicorn.run(app, host=host, port=port)
