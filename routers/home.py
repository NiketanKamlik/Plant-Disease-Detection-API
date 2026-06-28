from fastapi import APIRouter
from fastapi.responses import HTMLResponse
import pathlib

router = APIRouter()
frontend_dir = pathlib.Path("frontend")

@router.get("/", response_class=HTMLResponse)
@router.head("/", response_class=HTMLResponse)
def read_root():
    html_path = frontend_dir / "index.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text('utf-8'), status_code=200)
    return {"Hello": "Frontend not found"}

@router.get("/dashboard", response_class=HTMLResponse)
def get_dashboard_page():
    html_path = frontend_dir / "dashboard.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text('utf-8'), status_code=200)
    return {"Error": "Dashboard page not found"}

@router.get("/pricing", response_class=HTMLResponse)
def get_pricing_page():
    html_path = frontend_dir / "pricing.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text('utf-8'), status_code=200)
    return {"Error": "Pricing page not found"}

@router.get("/docs", response_class=HTMLResponse)
def get_docs_page():
    html_path = frontend_dir / "docs.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text('utf-8'), status_code=200)
    return {"Error": "Docs page not found"}
