import math
from time import monotonic

import httpx
from sqlalchemy.orm import Session

from core.config import settings
from database.crud.common import cleanup_expired_reservations, parse_specialties
from database.models import AmbulanceRequest, Hospital

SEVERITY_WEIGHTS = {
    "Critical": {"eta": 0.55, "icu": 0.35, "specialty": 0.10},
    "Serious": {"eta": 0.45, "icu": 0.35, "specialty": 0.20},
    "Moderate": {"eta": 0.30, "icu": 0.40, "specialty": 0.30},
}

_HOSPITAL_COORD_CACHE: dict[str, object] = {"timestamp": 0.0, "items": []}
_CACHE_TTL_SECONDS = 30.0


def invalidate_hospital_cache() -> None:
    _HOSPITAL_COORD_CACHE["timestamp"] = 0.0
    _HOSPITAL_COORD_CACHE["items"] = []


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return 2 * radius * math.asin(math.sqrt(a))


async def _eta_minutes_with_fallback(origin_lat: float, origin_lng: float, hospital: Hospital) -> tuple[float, float]:
    distance_km = _haversine_km(origin_lat, origin_lng, hospital.latitude, hospital.longitude)
    if not settings.GOOGLE_MAPS_API_KEY:
        eta_minutes = max((distance_km / 35.0) * 60.0, 1.0)
        return eta_minutes, distance_km

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": f"{origin_lat},{origin_lng}",
        "destinations": f"{hospital.latitude},{hospital.longitude}",
        "departure_time": "now",
        "key": settings.GOOGLE_MAPS_API_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()
            row = payload["rows"][0]["elements"][0]
            duration_seconds = row["duration_in_traffic"]["value"] if "duration_in_traffic" in row else row["duration"]["value"]
            distance_km = row["distance"]["value"] / 1000.0
            return max(duration_seconds / 60.0, 1.0), distance_km
    except Exception:
        eta_minutes = max((distance_km / 35.0) * 60.0, 1.0)
        return eta_minutes, distance_km


def _get_candidate_hospitals(db: Session) -> list[Hospital]:
    now = monotonic()
    if now - float(_HOSPITAL_COORD_CACHE["timestamp"]) < _CACHE_TTL_SECONDS:
        return _HOSPITAL_COORD_CACHE["items"]  # type: ignore[return-value]

    hospitals = db.query(Hospital).filter(Hospital.is_active.is_(True), Hospital.available_icu_beds > 0).all()
    _HOSPITAL_COORD_CACHE["timestamp"] = now
    _HOSPITAL_COORD_CACHE["items"] = hospitals
    return hospitals


async def recommend_hospitals(db: Session, request: AmbulanceRequest) -> list[dict]:
    cleanup_expired_reservations(db)
    hospitals = _get_candidate_hospitals(db)
    weights = SEVERITY_WEIGHTS.get(request.severity, SEVERITY_WEIGHTS["Serious"])

    ranked: list[dict] = []
    for hospital in hospitals:
        eta_minutes, distance_km = await _eta_minutes_with_fallback(request.latitude, request.longitude, hospital)
        eta_score = 1.0 / max(eta_minutes, 1.0)
        icu_score = 0.0 if hospital.total_icu_beds <= 0 else hospital.available_icu_beds / hospital.total_icu_beds
        hospital_specialties = parse_specialties(hospital.specialties)
        specialty_score = 0
        if request.required_specialty:
            specialty_score = 1 if request.required_specialty in hospital_specialties else 0

        score = (
            (weights["eta"] * eta_score)
            + (weights["icu"] * icu_score)
            + (weights["specialty"] * specialty_score)
        )
        ranked.append(
            {
                "hospital_id": hospital.id,
                "hospital_name": hospital.hospital_name,
                "latitude": hospital.latitude,
                "longitude": hospital.longitude,
                "hospital_address": hospital.hospital_address,
                "available_icu_beds": hospital.available_icu_beds,
                "total_icu_beds": hospital.total_icu_beds,
                "eta_minutes": round(eta_minutes, 2),
                "distance_km": round(distance_km, 2),
                "specialty_match": specialty_score,
                "score": round(score, 6),
            }
        )
    ranked.sort(key=lambda row: row["score"], reverse=True)
    return ranked
