from datetime import datetime

from pydantic import BaseModel, Field


class HospitalPublicResponse(BaseModel):
    id: int
    hospital_name: str
    hospital_address: str
    latitude: float
    longitude: float
    total_icu_beds: int
    available_icu_beds: int
    specialties: list[str]


class HospitalDashboardResponse(HospitalPublicResponse):
    contact_number: str
    email: str
    created_at: datetime


class ICUUpdateRequest(BaseModel):
    mode: str = Field(description="set/add/remove/occupy/release")
    count: int = Field(default=1, ge=0)


class HospitalAlertsQueryResponse(BaseModel):
    id: int
    ambulance_request_id: int
    status: str
    eta: float
    reserved_until: datetime
    severity: str
    blood_group: str
    oxygen_level: float
    patient_condition_notes: str
    ambulance_latitude: float
    ambulance_longitude: float
    created_at: datetime
