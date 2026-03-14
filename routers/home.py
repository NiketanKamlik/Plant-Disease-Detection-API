from fastapi import APIRouter
from fastapi.responses import HTMLResponse
import pathlib

router = APIRouter()
frontend_dir = pathlib.Path("frontend")

@router.get("/", response_class=HTMLResponse)
def read_root():
    html_path = frontend_dir / "index.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text('utf-8'), status_code=200)
    return {"Hello": "Frontend not found"}
