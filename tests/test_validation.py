"""
Unit tests for app/validation.py.

Deliberately network-free and GCS-free: validation is pure logic, so
these run instantly and don't need any cloud credentials - useful to
point to when asked "how would you test this?".
"""

import pytest

from app.validation import (
    MAX_RANGE_DAYS,
    ValidationError,
    validate_date_range,
    validate_latitude,
    validate_longitude,
    validate_store_request,
)


def test_validate_latitude_accepts_boundary_values():
    validate_latitude(-90)
    validate_latitude(90)
    validate_latitude(0)


def test_validate_latitude_rejects_out_of_range():
    with pytest.raises(ValidationError):
        validate_latitude(90.1)
    with pytest.raises(ValidationError):
        validate_latitude(-90.1)


def test_validate_longitude_rejects_out_of_range():
    with pytest.raises(ValidationError):
        validate_longitude(180.1)
    with pytest.raises(ValidationError):
        validate_longitude(-200)


def test_validate_date_range_rejects_start_after_end():
    with pytest.raises(ValidationError):
        validate_date_range("2024-01-10", "2024-01-01")


def test_validate_date_range_rejects_range_over_max():
    with pytest.raises(ValidationError):
        validate_date_range("2024-01-01", "2024-02-15")


def test_validate_date_range_accepts_exactly_max_days():
    start, end = validate_date_range("2024-01-01", "2024-01-31")
    assert (end - start).days + 1 == MAX_RANGE_DAYS


def test_validate_store_request_reports_missing_fields():
    with pytest.raises(ValidationError, match="missing required field"):
        validate_store_request({"latitude": 12.9, "longitude": 77.6})


def test_validate_store_request_happy_path():
    lat, lon, start, end = validate_store_request(
        {
            "latitude": 12.9716,
            "longitude": 77.5946,
            "start_date": "2024-01-01",
            "end_date": "2024-01-05",
        }
    )
    assert lat == 12.9716
    assert lon == 77.5946
    assert start.isoformat() == "2024-01-01"
    assert end.isoformat() == "2024-01-05"
