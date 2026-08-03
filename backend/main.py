import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

import models
from database import engine
from routes import auth, messages, reports, moderation, analytics, posts, chat, calling, users, reels, owner

# Create all tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="POV API",
    description="POV – AI-powered social media protection system for detecting and reducing cyberbullying",
    version="2.0.0"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"message": "Internal Server Error", "details": str(exc)})


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


@app.get("/api/info", tags=["health"])
def api_info():
    return {
        "service": "POV API",
        "status": "running",
        "version": "2.0.0"
    }


# Register routers
app.include_router(auth.router)
app.include_router(messages.router)
app.include_router(reports.router)
app.include_router(moderation.router)
app.include_router(analytics.router)
app.include_router(posts.router)
app.include_router(chat.router)
app.include_router(calling.router)
app.include_router(users.router)
app.include_router(reels.router)
app.include_router(owner.router)

# Serve uploaded media files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR", BASE_DIR)
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- Frontend Unification ---
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))
if os.path.exists(os.path.join(FRONTEND_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

# Catch-all route to serve the React index.html or dist files for SPA routing
# This MUST be the last handler in main.py
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Exclude system API, Swagger docs, and schema paths
    if full_path in ["docs", "redoc", "openapi.json"] or full_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"message": "Not Found"})
    
    # Check if a static file exists in frontend/dist (e.g. favicon.svg)
    requested_file = os.path.join(FRONTEND_DIR, full_path)
    if full_path and os.path.isfile(requested_file):
        return FileResponse(requested_file)

    # Fallback to index.html for client-side React routes
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return JSONResponse(status_code=404, content={"message": "Frontend build not found."})

