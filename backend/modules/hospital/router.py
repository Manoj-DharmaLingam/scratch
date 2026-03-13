from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import require_role
from database import crud
from database.schemas import HospitalAlertsQueryResponse, HospitalDashboardResponse, HospitalPublicResponse, ICUUpdateRequest
from modules.routing.service import invalidate_hospital_cache

router = APIRouter(tags=["hospital"])


@router.get("/public/hospitals", response_model=list[HospitalPublicResponse])
async def get_public_hospitals(db: Session = Depends(get_db)):
    hospitals = crud.list_public_hospitals(db)
    return [HospitalPublicResponse(**crud.hospital_to_dict(h)) for h in hospitals]


@router.get("/hospital/me", response_model=HospitalDashboardResponse)
async def get_hospital_me(
    db: Session = Depends(get_db),
    user=Depends(require_role("hospital")),
):
    hospital = crud.get_hospital_by_user(db, user)
    return HospitalDashboardResponse(**crud.hospital_to_dict(hospital))


@router.post("/hospital/update-icu", response_model=HospitalDashboardResponse)
async def update_hospital_icu(
    payload: ICUUpdateRequest,
    db: Session = Depends(get_db),
    user=Depends(require_role("hospital")),
):
    hospital = crud.get_hospital_by_user(db, user)
    updated = crud.update_hospital_icu(db, hospital, payload.mode.lower(), payload.count)
    invalidate_hospital_cache()
    return HospitalDashboardResponse(**crud.hospital_to_dict(updated))


@router.get("/hospital/alerts", response_model=list[HospitalAlertsQueryResponse])
async def get_hospital_alerts(
    db: Session = Depends(get_db),
    user=Depends(require_role("hospital")),
):
    hospital = crud.get_hospital_by_user(db, user)
    return crud.list_hospital_alerts(db, hospital)
