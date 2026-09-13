"""
DepLens Server Entrypoint.
FastAPI Application configuration with CORS and API routing.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.repositories import router as repositories_router

app = FastAPI(
    title="DepLens API",
    description="Backend API service for DepLens dependency visualization & intelligence",
    version="1.0.0",
)

# Enable CORS for local development and client integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(repositories_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "DepLens API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
