import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import models
from database import engine
from routes import auth, messages, reports, moderation, analytics, posts, chat, calling, users

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

# Serve uploaded media files
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


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
