"""
Thin client around the Open-Meteo historical weather API.

Open-Meteo's archive endpoint doesn't require an API key, which is why
it was picked for this case study - no credentials to manage, no cost.
"""

from datetime import date

import requests

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

DAILY_VARIABLES = [
    "temperature_2m_max",
    "temperature_2m_min",
    "apparent_temperature_max",
    "apparent_temperature_min",
]


class WeatherAPIError(Exception):
    """Raised when the upstream Open-Meteo call fails or times out."""

    def __init__(self, message: str, status_code: int = 502):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def fetch_historical_weather(
    latitude: float, longitude: float, start_date: date, end_date: date, timeout: int = 15
) -> dict:
    """Call Open-Meteo's daily historical archive and return the raw JSON.

    We deliberately return the *full* API response (not a trimmed
    version) because the spec asks us to store the raw JSON as-is -
    trimming here would lose data the storage layer is supposed to keep.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily": ",".join(DAILY_VARIABLES),
        "timezone": "UTC",
    }

    try:
        response = requests.get(OPEN_METEO_ARCHIVE_URL, params=params, timeout=timeout)
    except requests.RequestException as exc:
        raise WeatherAPIError(f"failed to reach Open-Meteo: {exc}", status_code=502)

    if response.status_code != 200:
        raise WeatherAPIError(
            f"Open-Meteo returned {response.status_code}: {response.text[:300]}",
            status_code=502,
        )

    return response.json()
