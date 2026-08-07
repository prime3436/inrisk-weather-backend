"""
API routes. Kept thin on purpose - each handler validates input,
delegates to weather_client / storage, and shapes the HTTP response.
Business logic lives in those other modules so it can be tested
without spinning up FastAPI.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.storage import FileNotFoundInBucket, StorageError, WeatherStorage
from app.validation import ValidationError, validate_store_request
from app.weather_client import WeatherAPIError, fetch_historical_weather

router = APIRouter()


def get_storage(request: Request) -> WeatherStorage:
    # Storage client is created once at app startup and attached to
    # app.state (see main.py) - avoids reconnecting on every request.
    return request.app.state.storage


@router.post("/store-weather-data")
async def store_weather_data(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(
            status_code=400, content={"status": "error", "message": "request body must be valid JSON"}
        )

    try:
        lat, lon, start, end = validate_store_request(payload)
    except ValidationError as exc:
        return JSONResponse(status_code=400, content={"status": "error", "message": exc.message})

    try:
        weather_json = fetch_historical_weather(lat, lon, start, end)
    except WeatherAPIError as exc:
        return JSONResponse(status_code=exc.status_code, content={"status": "error", "message": exc.message})

    storage = get_storage(request)
    filename = storage.build_filename(lat, lon, start.isoformat(), end.isoformat())

    try:
        storage.upload_json(filename, weather_json)
    except StorageError as exc:
        return JSONResponse(status_code=exc.status_code, content={"status": "error", "message": exc.message})

    return {"status": "ok", "file": filename}


@router.get("/list-weather-files")
async def list_weather_files(request: Request):
    storage = get_storage(request)
    try:
        files = storage.list_files()
    except StorageError as exc:
        return JSONResponse(status_code=exc.status_code, content={"status": "error", "message": exc.message})

    return {"files": files}


@router.get("/weather-file-content/{file}")
async def weather_file_content(file: str, request: Request):
    storage = get_storage(request)
    try:
        content = storage.get_file_content(file)
    except FileNotFoundInBucket:
        return JSONResponse(status_code=404, content={"status": "error", "message": "not found"})
    except StorageError as exc:
        return JSONResponse(status_code=exc.status_code, content={"status": "error", "message": exc.message})

    return content
