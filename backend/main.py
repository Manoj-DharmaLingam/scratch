from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import engine
from database.models import Base
from modules.alerts.router import router as alerts_router
from modules.ambulance.router import router as ambulance_router
from modules.auth.router import router as auth_router
from modules.hospital.router import router as hospital_router

app = FastAPI(
    title="Emergency ICU Routing Platform API",
    version="1.0.0",
    description="Unified backend for hospital and ambulance operations with ICU routing.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(auth_router)
app.include_router(hospital_router)
app.include_router(ambulance_router)
app.include_router(alerts_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Emergency ICU Routing Platform API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
