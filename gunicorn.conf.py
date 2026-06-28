import multiprocessing
import os

# Gunicorn configuration for FastAPI on Render
# This file acts as a fallback if the command line arguments are missing or ignored

bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"
workers = 1
worker_class = "uvicorn.workers.UvicornWorker"
wsgi_app = "main:app"
loglevel = "info"
timeout = 120
keepalive = 5
