"""
Input validation for the weather explorer API.

Kept as plain functions (no framework dependency) so they're easy to
unit test in isolation and easy to explain line-by-line.
"""

from datetime import date, datetime


class ValidationError(Exception):
    """Raised when incoming request data fails validation.

    Carries a plain message that the route layer turns into a
    400 response, so validation logic doesn't need to know anything
    about HTTP.
    """

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


MAX_RANGE_DAYS = 31


def validate_latitude(latitude: float) -> None:
    if not isinstance(latitude, (int, float)):
        raise ValidationError("latitude must be a number")
    if latitude < -90 or latitude > 90:
        raise ValidationError("latitude must be between -90 and 90")


def validate_longitude(longitude: float) -> None:
    if not isinstance(longitude, (int, float)):
        raise ValidationError("longitude must be a number")
    if longitude < -180 or longitude > 180:
        raise ValidationError("longitude must be between -180 and 180")


def parse_date(value: str, field_name: str) -> date:
    """Parse a YYYY-MM-DD string into a date, or raise ValidationError."""
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise ValidationError(f"{field_name} must be a valid date in YYYY-MM-DD format")


def validate_date_range(start_date: str, end_date: str) -> tuple[date, date]:
    """Validate that start_date <= end_date and the span is <= MAX_RANGE_DAYS.

    Returns the parsed (start, end) date objects so callers don't have
    to re-parse them.
    """
    start = parse_date(start_date, "start_date")
    end = parse_date(end_date, "end_date")

    if start > end:
        raise ValidationError("start_date must be on or before end_date")

    span_days = (end - start).days + 1
    if span_days > MAX_RANGE_DAYS:
        raise ValidationError(
            f"date range cannot exceed {MAX_RANGE_DAYS} days (got {span_days} days)"
        )

    return start, end


def validate_store_request(payload: dict) -> tuple[float, float, date, date]:
    """Validate the full /store-weather-data request body.

    Returns the validated (latitude, longitude, start_date, end_date)
    ready for use by the weather client and storage layer.
    """
    required_fields = ["latitude", "longitude", "start_date", "end_date"]
    missing = [f for f in required_fields if f not in payload]
    if missing:
        raise ValidationError(f"missing required field(s): {', '.join(missing)}")

    latitude = payload["latitude"]
    longitude = payload["longitude"]

    validate_latitude(latitude)
    validate_longitude(longitude)
    start, end = validate_date_range(payload["start_date"], payload["end_date"])

    return float(latitude), float(longitude), start, end
