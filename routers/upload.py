from fastapi import APIRouter
from fastapi.responses import HTMLResponse
import pathlib

router = APIRouter()
frontend_dir = pathlib.Path("frontend")

@router.get("/upload", response_class=HTMLResponse)
def get_upload_page():
    html_path = frontend_dir / "upload.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text('utf-8'), status_code=200)
    return {"Error": "Upload page not found"}
