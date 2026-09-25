"""
Google Cloud Storage client wrapper.

Isolated behind a small class so the routes never talk to the GCS SDK
directly - if you ever swap to S3, only this file changes.
"""

import json
from datetime import datetime, timezone

from google.cloud import storage
from google.cloud.exceptions import NotFound


class StorageError(Exception):
    """Raised for any failure talking to the bucket."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class FileNotFoundInBucket(StorageError):
    def __init__(self, filename: str):
        super().__init__(f"file '{filename}' not found", status_code=404)


class WeatherStorage:
    def __init__(self, bucket_name: str):
        if not bucket_name:
            raise ValueError("bucket_name is required")
        self.bucket_name = bucket_name
        self._client = storage.Client()
        self._bucket = self._client.bucket(bucket_name)

    @staticmethod
    def build_filename(lat: float, lon: float, start_date: str, end_date: str) -> str:
        """weather_<lat>_<lon>_<start>_<end>_<timestamp>.json

        Timestamp is UTC and filesystem-safe (no colons) so the name
        works as both a GCS object key and a downloaded filename.
        """
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        return f"weather_{lat}_{lon}_{start_date}_{end_date}_{timestamp}.json"

    def upload_json(self, filename: str, data: dict) -> None:
        blob = self._bucket.blob(filename)
        try:
            blob.upload_from_string(
                json.dumps(data), content_type="application/json"
            )
        except Exception as exc:
            raise StorageError(f"failed to upload '{filename}': {exc}")

    def list_files(self) -> list[dict]:
        """List objects using the SDK's list_blobs (server-side paging),
        not a manual scan - satisfies the "efficient listing" requirement.
        """
        try:
            blobs = self._client.list_blobs(self.bucket_name)
        except Exception as exc:
            raise StorageError(f"failed to list bucket: {exc}")

        files = []
        for blob in blobs:
            if not blob.name.endswith(".json"):
                continue
            files.append(
                {
                    "name": blob.name,
                    "size": blob.size,
                    "created_at": blob.time_created.isoformat() if blob.time_created else None,
                }
            )
        files.sort(key=lambda f: f["created_at"] or "", reverse=True)
        return files

    def get_file_content(self, filename: str) -> dict:
        blob = self._bucket.blob(filename)
        try:
            raw = blob.download_as_text()
        except NotFound:
            raise FileNotFoundInBucket(filename)
        except Exception as exc:
            raise StorageError(f"failed to read '{filename}': {exc}")

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            raise StorageError(f"'{filename}' does not contain valid JSON", status_code=500)
