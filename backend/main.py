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

# Serve uploaded media files - use DATA_DIR env var for persistent volume in production
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR", BASE_DIR)
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- Frontend Unification ---
# 1. Mount the Vite 'dist' folder for static assets (js, css, images)
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

# 2. Catch-all route to serve the React index.html for any other route
# This must be LAST so it doesn't intercept API calls
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Skip if it's an API route (FastAPI handles those first, but just in case)
    if full_path.startswith("api") or full_path.startswith("docs"):
        return JSONResponse(status_code=404, content={"message": "Not Found"})
    
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return JSONResponse(status_code=404, content={"message": "Frontend build not found. Run 'npm run build' first."})


@app.get("/", tags=["health"])
def root():
    return {
        "service": "AI Shield",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
