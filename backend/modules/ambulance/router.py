from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import require_role
from database import crud
from database.models import AmbulanceRequest
from database.schemas import (
    AmbulanceProfileResponse,
    AmbulanceRequestCreate,
    AmbulanceRequestResponse,
    HospitalRecommendationResponse,
)
from modules.routing.service import recommend_hospitals

router = APIRouter(prefix="/ambulance", tags=["ambulance"])


@router.get("/me", response_model=AmbulanceProfileResponse)
async def get_ambulance_me(
    db: Session = Depends(get_db),
    user=Depends(require_role("ambulance")),
):
    ambulance = crud.get_ambulance_by_user(db, user)
    return AmbulanceProfileResponse(
        id=ambulance.id,
        ambulance_id=ambulance.ambulance_id,
        driver_name=ambulance.driver_name,
        driver_phone=ambulance.driver_phone,
        ambulance_registration_number=ambulance.ambulance_registration_number,
        email=user.email,
    )


@router.post("/request", response_model=AmbulanceRequestResponse, status_code=201)
async def create_request(
    payload: AmbulanceRequestCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role("ambulance")),
):
    ambulance = crud.get_ambulance_by_user(db, user)
    request = crud.create_ambulance_request(
        db,
        ambulance=ambulance,
        latitude=payload.latitude,
        longitude=payload.longitude,
        blood_group=payload.blood_group,
        oxygen_level=payload.oxygen_level,
        patient_condition_notes=payload.patient_condition_notes,
        severity=payload.severity_level,
        required_specialty=payload.required_specialty,
    )
    return AmbulanceRequestResponse(
        id=request.id,
        ambulance_id=request.ambulance_id,
        latitude=request.latitude,
        longitude=request.longitude,
        blood_group=request.blood_group,
        oxygen_level=request.oxygen_level,
        patient_condition_notes=request.patient_condition_notes,
        severity=request.severity,
        required_specialty=request.required_specialty,
        timestamp=request.timestamp,
    )


@router.get("/recommend-hospital", response_model=list[HospitalRecommendationResponse])
async def recommend(
    request_id: int | None = Query(default=None),
    latitude: float | None = Query(default=None),
    longitude: float | None = Query(default=None),
    severity: str | None = Query(default=None),
    required_specialty: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(require_role("ambulance")),
):
    ambulance = crud.get_ambulance_by_user(db, user)
    if request_id is not None:
        request = db.query(AmbulanceRequest).filter(AmbulanceRequest.id == request_id).first()
        if not request or request.ambulance_id != ambulance.id:
            raise HTTPException(status_code=404, detail="Request not found for this ambulance")
    else:
        if latitude is None or longitude is None or severity is None:
            raise HTTPException(status_code=400, detail="Provide request_id or latitude, longitude, and severity")
        normalized = severity.capitalize()
        if normalized not in {"Critical", "Serious", "Moderate"}:
            raise HTTPException(status_code=400, detail="severity must be Critical, Serious, or Moderate")
        request = AmbulanceRequest(
            ambulance_id=ambulance.id,
            latitude=latitude,
            longitude=longitude,
            blood_group="unknown",
            oxygen_level=0,
            patient_condition_notes="preview",
            severity=normalized,
            required_specialty=required_specialty.lower() if required_specialty else None,
        )
    ranked = await recommend_hospitals(db, request)
    return [HospitalRecommendationResponse(**row) for row in ranked]
