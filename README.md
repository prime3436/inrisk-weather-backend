# InRisk Weather Explorer — Backend

FastAPI backend that fetches historical daily weather from Open-Meteo,
stores the raw JSON in Google Cloud Storage, and exposes it to a
frontend dashboard.

## Tech stack

- **Python 3.12 + FastAPI** — async, built-in request validation hooks, easy to containerize.
- **Google Cloud Storage** — chosen over S3 because GCS's free tier (5GB, always-free, not time-limited)
  pairs naturally with Cloud Run, so the whole backend stays on one provider with no credit card commitment.
- **Open-Meteo Historical Weather API** — no API key required, which avoids secret management for a case study.
- **Cloud Run** — scales to zero, so the free tier isn't burned while idle.

## Project structure

```
app/
  main.py            # FastAPI app, CORS, startup wiring
  routes.py           # HTTP layer only — validates via validation.py, delegates to storage/weather_client
  validation.py       # Pure functions, framework-free, fully unit tested
  weather_client.py   # Open-Meteo HTTP client
  storage.py           # GCS wrapper (list/upload/read)
tests/
  test_validation.py  # Unit tests, no network or GCS needed
requirements.txt
Dockerfile
.env.example
```

**Design approach:** each concern lives in its own module so routes.py stays thin —
it only translates between HTTP and the pure Python functions underneath. This means
validation and the Open-Meteo client can be unit tested without mocking FastAPI or GCS at all
(see `tests/test_validation.py`). Errors are modeled as typed exceptions
(`ValidationError`, `WeatherAPIError`, `StorageError`, `FileNotFoundInBucket`) that carry
their own HTTP status code, so the route handlers don't need if/else chains to decide
what status to return.

## Setup — local

1. **Create a GCS bucket** (free tier, no billing beyond storage of a few MB of JSON):
   ```bash
   gcloud storage buckets create gs://YOUR_BUCKET_NAME --location=us-central1
   ```

2. **Authenticate locally** so the `google-cloud-storage` SDK can find credentials:
   ```bash
   gcloud auth application-default login
   ```
   (Alternative: create a service account key with `Storage Object Admin` on the bucket,
   download it, and set `GOOGLE_APPLICATION_CREDENTIALS` in `.env` — see `.env.example`.)

3. **Install dependencies:**
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # edit .env and set GCS_BUCKET_NAME
   ```

5. **Run:**
   ```bash
   uvicorn app.main:app --reload --port 8080
   ```

6. **Test:**
   ```bash
   pytest tests/ -v
   ```

## Setup — deploy to Cloud Run (free tier)

```bash
gcloud run deploy inrisk-weather-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCS_BUCKET_NAME=YOUR_BUCKET_NAME
```

Cloud Run's service account needs `Storage Object Admin` on the bucket:
```bash
gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET_NAME \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/store-weather-data` | Validate input, fetch from Open-Meteo, store raw JSON in the bucket |
| GET | `/list-weather-files` | List stored files (name, size, created_at) |
| GET | `/weather-file-content/{file}` | Return the stored JSON for one file, 404 if missing |
| GET | `/` | Health check |

### Validation rules

- `latitude` ∈ [-90, 90], `longitude` ∈ [-180, 180]
- `start_date` ≤ `end_date`, both valid `YYYY-MM-DD`
- Date range ≤ 31 days (inclusive of both endpoints)
- Any failure → `400` with `{"status": "error", "message": "<reason>"}`

### Notes / assumptions

- File names embed the raw lat/lon/date values as given (e.g. `weather_12.9716_77.5946_2024-01-01_2024-01-05_20240115T103000Z.json`),
  which keeps them human-readable in the bucket browser and avoids needing a separate index.
- `list-weather-files` uses the SDK's `list_blobs` (server-side, paginated by the client library)
  rather than downloading objects to inspect them — satisfies the "avoid brute scans" requirement.
- CORS defaults to `*` for ease of local development; set `ALLOWED_ORIGINS` to your deployed
  frontend's origin before treating this as production-ready.
- The Open-Meteo call requests exactly the four required daily variables, no more — keeps
  stored payloads small and avoids unnecessary upstream load.
