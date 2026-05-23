from fastapi import FastAPI
from app.routes import summary, health

app = FastAPI(
    title="PatientDoctorConsultation AI Services",
    version="1.0.0",
    description="BioMistral-powered clinical AI services via Ollama",
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(summary.router, prefix="/ai/summary", tags=["AI Summary"])
