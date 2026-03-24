import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

from fastapi import FastAPI
import pathlib

# Import routes
from routers import home, upload, predict, auth, info, apikey
from local_db.database import engine
from local_db import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(docs_url=None, redoc_url=None)

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
    uvicorn.run(app, host="127.0.0.1", port=8000)
