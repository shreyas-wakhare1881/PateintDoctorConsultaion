# Setup Guide

## Prerequisites
- .NET 10 SDK
- Node.js 20+
- PostgreSQL 16+
- Python 3.11+
- Ollama (https://ollama.com) with BioMistral pulled: `ollama pull biomistral`
- LiveKit server (optional for local dev)

## Quick Start

```powershell
# From repo root
.\scripts\setup.ps1
```

## Manual Steps

### Backend
```powershell
cd backend\PatientDoctorConsultation
dotnet restore
dotnet ef database update --project API
dotnet run --project API
```
API runs at: https://localhost:5001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at: http://localhost:3000

### AI Services
```bash
cd ai-services
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
AI API runs at: http://localhost:8000
