# PatientDoctorConsultation - Setup Script
# Run once to bootstrap the development environment

Write-Host "==> Setting up PatientDoctorConsultation..." -ForegroundColor Cyan

# 1. Restore .NET backend dependencies
Write-Host "`n[1/4] Restoring .NET packages..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend\PatientDoctorConsultation"
dotnet restore

# 2. Apply EF Core migrations
Write-Host "`n[2/4] Applying EF Core migrations..." -ForegroundColor Yellow
dotnet ef database update --project API

# 3. Install frontend dependencies
Write-Host "`n[3/4] Installing frontend packages..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\frontend"
npm install

# 4. Install AI services dependencies
Write-Host "`n[4/4] Installing AI service packages..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\ai-services"
pip install -r requirements.txt

Write-Host "`n==> Setup complete!" -ForegroundColor Green
Write-Host "Start backend  : cd backend\PatientDoctorConsultation && dotnet run --project API"
Write-Host "Start frontend : cd frontend && npm run dev"
Write-Host "Start AI       : cd ai-services && uvicorn app.main:app --reload"
