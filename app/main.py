"""
App entrypoint. Responsible for:
  - reading config from environment variables
  - wiring up the storage client once at startup
  - enabling CORS for the frontend
  - mounting routes
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router
from app.storage import WeatherStorage

app = FastAPI(title="InRisk Weather Explorer API")

allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "*")
allowed_origins = ["*"] if allowed_origins_env == "*" else allowed_origins_env.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    bucket_name = os.environ.get("GCS_BUCKET_NAME")
    if not bucket_name:
        raise RuntimeError("GCS_BUCKET_NAME environment variable is required")
    app.state.storage = WeatherStorage(bucket_name)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "inrisk-weather-explorer"}


app.include_router(router)
