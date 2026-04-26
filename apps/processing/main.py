from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

app = FastAPI(
    title="Print Sathi Processing Service",
    description="Image processing API for passport photos, document conversion, and more.",
    version="0.1.0",
)

# CORS — allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint — used by UptimeRobot to keep Render awake."""
    return {
        "status": "ok",
        "service": "print-sathi-processing",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/")
async def root():
    return {
        "service": "Print Sathi Processing API",
        "version": "0.1.0",
        "docs": "/docs",
    }
