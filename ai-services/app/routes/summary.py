from fastapi import APIRouter
from pydantic import BaseModel
from app.services.summary_service import generate_summary

router = APIRouter()

class SummaryRequest(BaseModel):
    consultation_id: str
    transcript: str

class SummaryResponse(BaseModel):
    consultation_id: str
    summary: str

@router.post("/", response_model=SummaryResponse)
async def create_summary(request: SummaryRequest):
    summary = await generate_summary(request.transcript)
    return SummaryResponse(consultation_id=request.consultation_id, summary=summary)
