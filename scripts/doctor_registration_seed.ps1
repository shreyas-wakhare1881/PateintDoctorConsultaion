#Requires -Version 5.1
<#
.SYNOPSIS
    Phase 1 - Doctor Registration Seed
    Registers 30 realistic Indian doctors via the real application API.

.DESCRIPTION
    - Calls POST /api/auth/register for each doctor.
    - Validates every response before proceeding.
    - Retries failed registrations up to 3 times.
    - Logs all results to doctor_seed_registration.log
    - Generates doctor_credentials.csv

.NOTES
    DO NOT run Phase 2 until this script exits reporting 30/30 success.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ===========================================================================
# CONFIGURATION
# ===========================================================================
$BASE_URL     = "http://localhost:5053"
$REGISTER_URL = "$BASE_URL/api/auth/register"
$SCRIPTS_DIR  = $PSScriptRoot
$CSV_PATH     = Join-Path $SCRIPTS_DIR "doctor_credentials.csv"
$XLSX_PATH    = Join-Path $SCRIPTS_DIR "doctor_credentials.xlsx"
$LOG_PATH     = Join-Path $SCRIPTS_DIR "doctor_seed_registration.log"
$MAX_RETRIES  = 3
$RETRY_DELAY  = 3

# ===========================================================================
# LOGGING
# ===========================================================================
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    $ts   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] [$Level] $Message"
    $line | Add-Content -Path $LOG_PATH -Encoding UTF8
    switch ($Level) {
        "INFO"    { Write-Host $line -ForegroundColor Cyan }
        "SUCCESS" { Write-Host $line -ForegroundColor Green }
        "WARN"    { Write-Host $line -ForegroundColor Yellow }
        "ERROR"   { Write-Host $line -ForegroundColor Red }
        default   { Write-Host $line }
    }
}

# ===========================================================================
# 30 DOCTORS MASTER DATA
# Validation constraints (from RegisterRequestValidator):
#   FullName  : letters, spaces, hyphens, apostrophes, periods only (^[a-zA-Z\s\.\-']+$)
#   Email     : valid format, unique
#   Phone     : E.164 format (^\+[1-9]\d{1,14}$), unique
#   Password  : >=8 chars, 1 upper, 1 lower, 1 digit, 1 special char
#   Role      : "Doctor"
# ===========================================================================
$DOCTORS = @(
    # --- Ophthalmology (3) ---
    [PSCustomObject]@{
        FullName              = "Dr. Ananya Sharma"
        Email                 = "ananya.sharma@healthconsult.in"
        PhoneNumber           = "+919811001001"
        Password              = "Doctor@2024SecA1"
        ConfirmPassword       = "Doctor@2024SecA1"
        Role                  = "Doctor"
        PlannedSpecialization = "Ophthalmology"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Vikram Nair"
        Email                 = "vikram.nair@healthconsult.in"
        PhoneNumber           = "+919811001002"
        Password              = "Doctor@2024SecA2"
        ConfirmPassword       = "Doctor@2024SecA2"
        Role                  = "Doctor"
        PlannedSpecialization = "Ophthalmology"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Priya Menon"
        Email                 = "priya.menon@healthconsult.in"
        PhoneNumber           = "+919811001003"
        Password              = "Doctor@2024SecA3"
        ConfirmPassword       = "Doctor@2024SecA3"
        Role                  = "Doctor"
        PlannedSpecialization = "Ophthalmology"
    },
    # --- Cardiology (3) ---
    [PSCustomObject]@{
        FullName              = "Dr. Rajesh Iyer"
        Email                 = "rajesh.iyer@healthconsult.in"
        PhoneNumber           = "+919811001004"
        Password              = "Doctor@2024SecB1"
        ConfirmPassword       = "Doctor@2024SecB1"
        Role                  = "Doctor"
        PlannedSpecialization = "Cardiology"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Sunita Kulkarni"
        Email                 = "sunita.kulkarni@healthconsult.in"
        PhoneNumber           = "+919811001005"
        Password              = "Doctor@2024SecB2"
        ConfirmPassword       = "Doctor@2024SecB2"
        Role                  = "Doctor"
        PlannedSpecialization = "Cardiology"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Arun Pillai"
        Email                 = "arun.pillai@healthconsult.in"
        PhoneNumber           = "+919811001006"
        Password              = "Doctor@2024SecB3"
        ConfirmPassword       = "Doctor@2024SecB3"
        Role                  = "Doctor"
        PlannedSpecialization = "Cardiology"
    },
    # --- Dermatology (3) ---
    [PSCustomObject]@{
        FullName              = "Dr. Meera Joshi"
        Email                 = "meera.joshi@healthconsult.in"
        PhoneNumber           = "+919811001007"
        Password              = "Doctor@2024SecC1"
        ConfirmPassword       = "Doctor@2024SecC1"
        Role                  = "Doctor"
        PlannedSpecialization = "Dermatology"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Suresh Patel"
        Email                 = "suresh.patel@healthconsult.in"
        PhoneNumber           = "+919811001008"
        Password              = "Doctor@2024SecC2"
        ConfirmPassword       = "Doctor@2024SecC2"
        Role                  = "Doctor"
        PlannedSpecialization = "Dermatology"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Kavitha Reddy"
        Email                 = "kavitha.reddy@healthconsult.in"
        PhoneNumber           = "+919811001009"
        Password              = "Doctor@2024SecC3"
        ConfirmPassword       = "Doctor@2024SecC3"
        Role                  = "Doctor"
        PlannedSpecialization = "Dermatology"
    },
    # --- Pediatrics (3) ---
    [PSCustomObject]@{
        FullName              = "Dr. Neeraj Gupta"
        Email                 = "neeraj.gupta@healthconsult.in"
        PhoneNumber           = "+919811001010"
        Password              = "Doctor@2024SecD1"
        ConfirmPassword       = "Doctor@2024SecD1"
        Role                  = "Doctor"
        PlannedSpecialization = "Pediatrics"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Anjali Singh"
        Email                 = "anjali.singh@healthconsult.in"
        PhoneNumber           = "+919811001011"
        Password              = "Doctor@2024SecD2"
        ConfirmPassword       = "Doctor@2024SecD2"
        Role                  = "Doctor"
        PlannedSpecialization = "Pediatrics"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Ravi Kumar"
        Email                 = "ravi.kumar@healthconsult.in"
        PhoneNumber           = "+919811001012"
        Password              = "Doctor@2024SecD3"
        ConfirmPassword       = "Doctor@2024SecD3"
        Role                  = "Doctor"
        PlannedSpecialization = "Pediatrics"
    },
    # --- Neurology (3) ---
    [PSCustomObject]@{
        FullName              = "Dr. Deepak Verma"
        Email                 = "deepak.verma@healthconsult.in"
        PhoneNumber           = "+919811001013"
        Password              = "Doctor@2024SecE1"
        ConfirmPassword       = "Doctor@2024SecE1"
        Role                  = "Doctor"
        PlannedSpecialization = "Neurology"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Sneha Bhatt"
        Email                 = "sneha.bhatt@healthconsult.in"
        PhoneNumber           = "+919811001014"
        Password              = "Doctor@2024SecE2"
        ConfirmPassword       = "Doctor@2024SecE2"
        Role                  = "Doctor"
        PlannedSpecialization = "Neurology"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Mohan Das"
        Email                 = "mohan.das@healthconsult.in"
        PhoneNumber           = "+919811001015"
        Password              = "Doctor@2024SecE3"
        ConfirmPassword       = "Doctor@2024SecE3"
        Role                  = "Doctor"
        PlannedSpecialization = "Neurology"
    },
    # --- Orthopedics (3) ---
    [PSCustomObject]@{
        FullName              = "Dr. Harish Rao"
        Email                 = "harish.rao@healthconsult.in"
        PhoneNumber           = "+919811001016"
        Password              = "Doctor@2024SecF1"
        ConfirmPassword       = "Doctor@2024SecF1"
        Role                  = "Doctor"
        PlannedSpecialization = "Orthopedics"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Pooja Chauhan"
        Email                 = "pooja.chauhan@healthconsult.in"
        PhoneNumber           = "+919811001017"
        Password              = "Doctor@2024SecF2"
        ConfirmPassword       = "Doctor@2024SecF2"
        Role                  = "Doctor"
        PlannedSpecialization = "Orthopedics"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Sanjay Mishra"
        Email                 = "sanjay.mishra@healthconsult.in"
        PhoneNumber           = "+919811001018"
        Password              = "Doctor@2024SecF3"
        ConfirmPassword       = "Doctor@2024SecF3"
        Role                  = "Doctor"
        PlannedSpecialization = "Orthopedics"
    },
    # --- ENT (3) ---
    [PSCustomObject]@{
        FullName              = "Dr. Lakshmi Nambiar"
        Email                 = "lakshmi.nambiar@healthconsult.in"
        PhoneNumber           = "+919811001019"
        Password              = "Doctor@2024SecG1"
        ConfirmPassword       = "Doctor@2024SecG1"
        Role                  = "Doctor"
        PlannedSpecialization = "ENT"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Ashok Trivedi"
        Email                 = "ashok.trivedi@healthconsult.in"
        PhoneNumber           = "+919811001020"
        Password              = "Doctor@2024SecG2"
        ConfirmPassword       = "Doctor@2024SecG2"
        Role                  = "Doctor"
        PlannedSpecialization = "ENT"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Divya Pandey"
        Email                 = "divya.pandey@healthconsult.in"
        PhoneNumber           = "+919811001021"
        Password              = "Doctor@2024SecG3"
        ConfirmPassword       = "Doctor@2024SecG3"
        Role                  = "Doctor"
        PlannedSpecialization = "ENT"
    },
    # --- Gynecology (3) ---
    [PSCustomObject]@{
        FullName              = "Dr. Rekha Agarwal"
        Email                 = "rekha.agarwal@healthconsult.in"
        PhoneNumber           = "+919811001022"
        Password              = "Doctor@2024SecH1"
        ConfirmPassword       = "Doctor@2024SecH1"
        Role                  = "Doctor"
        PlannedSpecialization = "Gynecology"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Padma Krishnan"
        Email                 = "padma.krishnan@healthconsult.in"
        PhoneNumber           = "+919811001023"
        Password              = "Doctor@2024SecH2"
        ConfirmPassword       = "Doctor@2024SecH2"
        Role                  = "Doctor"
        PlannedSpecialization = "Gynecology"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Geeta Malhotra"
        Email                 = "geeta.malhotra@healthconsult.in"
        PhoneNumber           = "+919811001024"
        Password              = "Doctor@2024SecH3"
        ConfirmPassword       = "Doctor@2024SecH3"
        Role                  = "Doctor"
        PlannedSpecialization = "Gynecology"
    },
    # --- Psychiatry (3) ---
    [PSCustomObject]@{
        FullName              = "Dr. Kiran Desai"
        Email                 = "kiran.desai@healthconsult.in"
        PhoneNumber           = "+919811001025"
        Password              = "Doctor@2024SecI1"
        ConfirmPassword       = "Doctor@2024SecI1"
        Role                  = "Doctor"
        PlannedSpecialization = "Psychiatry"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Nitin Jain"
        Email                 = "nitin.jain@healthconsult.in"
        PhoneNumber           = "+919811001026"
        Password              = "Doctor@2024SecI2"
        ConfirmPassword       = "Doctor@2024SecI2"
        Role                  = "Doctor"
        PlannedSpecialization = "Psychiatry"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Shweta Bansal"
        Email                 = "shweta.bansal@healthconsult.in"
        PhoneNumber           = "+919811001027"
        Password              = "Doctor@2024SecI3"
        ConfirmPassword       = "Doctor@2024SecI3"
        Role                  = "Doctor"
        PlannedSpecialization = "Psychiatry"
    },
    # --- General Medicine (3) ---
    [PSCustomObject]@{
        FullName              = "Dr. Ramesh Tiwari"
        Email                 = "ramesh.tiwari@healthconsult.in"
        PhoneNumber           = "+919811001028"
        Password              = "Doctor@2024SecJ1"
        ConfirmPassword       = "Doctor@2024SecJ1"
        Role                  = "Doctor"
        PlannedSpecialization = "General Medicine"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Vijaya Srinivasan"
        Email                 = "vijaya.srinivasan@healthconsult.in"
        PhoneNumber           = "+919811001029"
        Password              = "Doctor@2024SecJ2"
        ConfirmPassword       = "Doctor@2024SecJ2"
        Role                  = "Doctor"
        PlannedSpecialization = "General Medicine"
    },
    [PSCustomObject]@{
        FullName              = "Dr. Aditya Chandra"
        Email                 = "aditya.chandra@healthconsult.in"
        PhoneNumber           = "+919811001030"
        Password              = "Doctor@2024SecJ3"
        ConfirmPassword       = "Doctor@2024SecJ3"
        Role                  = "Doctor"
        PlannedSpecialization = "General Medicine"
    }
)

# ===========================================================================
# PRE-FLIGHT CHECKS
# ===========================================================================
Write-Log "INFO" "=== Phase 1 - Doctor Registration Seed ==="
Write-Log "INFO" "Target: $BASE_URL"
Write-Log "INFO" "Total doctors to register: $($DOCTORS.Count)"

Write-Log "INFO" "Checking backend connectivity..."
try {
    $null = Invoke-WebRequest -Uri "$BASE_URL/api/health" -Method GET -TimeoutSec 5
    Write-Log "SUCCESS" "Backend reachable."
} catch {
    $sc = 0
    if ($_.Exception.Response -ne $null) { $sc = [int]$_.Exception.Response.StatusCode }
    if ($sc -eq 404 -or $sc -eq 401) {
        Write-Log "INFO" "Backend running (got HTTP $sc from health endpoint)."
    } else {
        Write-Log "WARN" "Could not verify backend (HTTP $sc). Proceeding anyway."
    }
}

$emailSet = @{}
$phoneSet = @{}
foreach ($doc in $DOCTORS) {
    if ($emailSet.ContainsKey($doc.Email)) {
        Write-Log "ERROR" "DUPLICATE EMAIL in seed data: $($doc.Email)"
        exit 1
    }
    if ($phoneSet.ContainsKey($doc.PhoneNumber)) {
        Write-Log "ERROR" "DUPLICATE PHONE in seed data: $($doc.PhoneNumber)"
        exit 1
    }
    $emailSet[$doc.Email]       = $true
    $phoneSet[$doc.PhoneNumber] = $true
}
Write-Log "INFO" "Pre-flight passed: no duplicates in seed data."

# ===========================================================================
# REGISTRATION LOOP
# ===========================================================================
$results      = New-Object System.Collections.ArrayList
$successCount = 0
$failCount    = 0

foreach ($doctor in $DOCTORS) {
    $registered = $false
    $attempt    = 0
    $lastError  = "unknown"

    while ((-not $registered) -and ($attempt -lt $MAX_RETRIES)) {
        $attempt++
        Write-Log "INFO" "Registering [$($doctor.FullName)] - attempt $attempt of $MAX_RETRIES"

        $bodyJson = ([ordered]@{
            fullName        = $doctor.FullName
            email           = $doctor.Email
            phoneNumber     = $doctor.PhoneNumber
            password        = $doctor.Password
            confirmPassword = $doctor.ConfirmPassword
            role            = $doctor.Role
        }) | ConvertTo-Json

        $regSuccess = $false
        $regResult  = $null
        $regError   = $null
        $regStatus  = 0

        try {
            $regResult  = Invoke-RestMethod -Uri $REGISTER_URL -Method POST -Body $bodyJson -ContentType "application/json" -TimeoutSec 15
            $regSuccess = $true
        } catch {
            $regError = $_
            if ($regError.Exception.Response -ne $null) {
                $regStatus = [int]$regError.Exception.Response.StatusCode
            }
        }

        if ($regSuccess) {
            if ($regResult.success -eq $true) {
                Write-Log "SUCCESS" "Registered: $($doctor.FullName) | UserId: $($regResult.data.id)"
                $null = $results.Add([PSCustomObject]@{
                    DoctorName            = $doctor.FullName
                    Email                 = $doctor.Email
                    Password              = $doctor.Password
                    PhoneNumber           = $doctor.PhoneNumber
                    PlannedSpecialization = $doctor.PlannedSpecialization
                    UserId                = $regResult.data.id
                    Status                = "REGISTERED"
                    FailureReason         = ""
                })
                $successCount++
                $registered = $true
            } else {
                $lastError = "API returned success=false: $($regResult.message)"
                Write-Log "WARN" $lastError
            }
        } else {
            $errMsg = $regError.ToString()
            try {
                if ($regError.ErrorDetails.Message) {
                    $parsed = $regError.ErrorDetails.Message | ConvertFrom-Json
                    if ($parsed.message) { $errMsg = $parsed.message }
                }
            } catch { }
            $lastError = $errMsg

            if ($regStatus -eq 409) {
                Write-Log "WARN" "[$($doctor.FullName)] already registered (409). Treating as success."
                $null = $results.Add([PSCustomObject]@{
                    DoctorName            = $doctor.FullName
                    Email                 = $doctor.Email
                    Password              = $doctor.Password
                    PhoneNumber           = $doctor.PhoneNumber
                    PlannedSpecialization = $doctor.PlannedSpecialization
                    UserId                = "ALREADY_EXISTS"
                    Status                = "ALREADY_REGISTERED"
                    FailureReason         = "409 already exists"
                })
                $successCount++
                $registered = $true
            } elseif ($regStatus -eq 400) {
                Write-Log "ERROR" "Validation error for [$($doctor.FullName)]: $lastError - no more retries"
                $attempt = $MAX_RETRIES
            } else {
                Write-Log "WARN" "Attempt $attempt failed for [$($doctor.FullName)]: $lastError"
                if ($attempt -lt $MAX_RETRIES) {
                    Write-Log "INFO" "Waiting $RETRY_DELAY seconds before retry..."
                    Start-Sleep -Seconds $RETRY_DELAY
                }
            }
        }
    }

    if (-not $registered) {
        Write-Log "ERROR" "FAILED after $MAX_RETRIES attempts: $($doctor.FullName) | $lastError"
        $null = $results.Add([PSCustomObject]@{
            DoctorName            = $doctor.FullName
            Email                 = $doctor.Email
            Password              = $doctor.Password
            PhoneNumber           = $doctor.PhoneNumber
            PlannedSpecialization = $doctor.PlannedSpecialization
            UserId                = ""
            Status                = "FAILED"
            FailureReason         = $lastError
        })
        $failCount++
    }
}

# ===========================================================================
# SAVE CSV
# ===========================================================================
Write-Log "INFO" "Saving credentials CSV: $CSV_PATH"
$results | Export-Csv -Path $CSV_PATH -NoTypeInformation -Encoding UTF8
Write-Log "SUCCESS" "Credentials CSV saved: $CSV_PATH"

# ===========================================================================
# SAVE XLSX (optional)
# ===========================================================================
if (Get-Module -ListAvailable -Name ImportExcel -ErrorAction SilentlyContinue) {
    try {
        Import-Module ImportExcel
        $results | Export-Excel -Path $XLSX_PATH -WorksheetName "DoctorCredentials" -AutoSize -FreezeTopRow -BoldTopRow -TableStyle Medium9
        Write-Log "SUCCESS" "Credentials XLSX saved: $XLSX_PATH"
    } catch {
        Write-Log "WARN" "XLSX export failed (ImportExcel error). CSV is available."
    }
} else {
    Write-Log "INFO" "To also create .xlsx: Install-Module ImportExcel -Scope CurrentUser -Force"
}

# ===========================================================================
# SUMMARY
# ===========================================================================
Write-Log "INFO" "============================================================"
Write-Log "INFO" "PHASE 1 SUMMARY"
Write-Log "INFO" "  Total    : $($DOCTORS.Count)"
Write-Log "INFO" "  Success  : $successCount"
Write-Log "INFO" "  Failed   : $failCount"
Write-Log "INFO" "============================================================"

if ($failCount -gt 0) {
    Write-Log "ERROR" "PHASE 1 INCOMPLETE - $failCount failure(s). Fix and re-run before Phase 2."
    exit 1
} else {
    Write-Log "SUCCESS" "PHASE 1 COMPLETE - $successCount / $($DOCTORS.Count) doctors registered."
    Write-Log "INFO" "Credentials: $CSV_PATH"
    Write-Log "INFO" "Next: run doctor_profile_completion_seed.ps1"
    exit 0
}
