# ============================================================
# NLP Intent Parser - 7-Level Integration Test Suite
# Tests every query complexity level end-to-end against the
# running API at http://localhost:5053
# ============================================================

$BASE_URL = "http://localhost:5053/api/discovery"
$NLP_URL  = "$BASE_URL/nlp-search"

$pass = 0
$fail = 0
$results = [System.Collections.Generic.List[PSObject]]::new()

# ──────────────────────────────────────────────────────────────
# Helper: Run one NLP search and validate expectations
# ──────────────────────────────────────────────────────────────
function Test-NlpQuery {
    param(
        [string]$Level,
        [string]$TestName,
        [string]$Query,
        [hashtable]$Expect   # key = ParsedIntent field, value = expected value (or $null to just check non-null)
    )



    try {
        $uri = "$NLP_URL" + "?query=" + [Uri]::EscapeDataString($Query) + "&page=1&pageSize=5"
        $response = Invoke-RestMethod -Uri $uri `
                        -Method GET `
                        -TimeoutSec 10

        $intent = $response.data.parsedIntent
        $passed = $true
        $failures = [System.Collections.Generic.List[string]]::new()

        foreach ($key in $Expect.Keys) {
            $expected = $Expect[$key]
            $actual   = $intent.$key

            if ($null -eq $expected) {
                # Just check that the field is non-null / non-empty
                if ($null -eq $actual -or $actual -eq "") {
                    $passed = $false
                    $failures.Add("  [$key] expected non-null, got null/empty")
                }
            } elseif ($expected -eq "__null__") {
                # Explicitly expect null
                if ($null -ne $actual) {
                    $passed = $false
                    $failures.Add("  [$key] expected null, got '$actual'")
                }
            } elseif ($expected -is [string]) {
                if ($actual -ne $expected) {
                    $passed = $false
                    $failures.Add("  [$key] expected '$expected', got '$actual'")
                }
            } elseif ($expected -is [decimal] -or $expected -is [int] -or $expected -is [double]) {
                if ($actual -ne $expected) {
                    $passed = $false
                    $failures.Add("  [$key] expected $expected, got $actual")
                }
            }
        }

        $score = [math]::Round($intent.confidenceScore, 2)
        $status = if ($passed) { "PASS" } else { "FAIL" }

        $results.Add([PSCustomObject]@{
            Level    = $Level
            Test     = $TestName
            Status   = $status
            Query    = $Query
            Spec     = $intent.specialization
            City     = $intent.city
            Lang     = $intent.language
            MaxFee   = $intent.maxConsultationFee
            MinFee   = $intent.minConsultationFee
            MinExp   = $intent.minExperience
            MaxExp   = $intent.maxExperience
            Gender   = $intent.gender
            Score    = $score
            Failures = ($failures -join "; ")
        })

        if ($passed) { $script:pass++ } else { $script:fail++ }

    } catch {
        $results.Add([PSCustomObject]@{
            Level    = $Level
            Test     = $TestName
            Status   = "ERROR"
            Query    = $Query
            Spec     = ""
            City     = ""
            Lang     = ""
            MaxFee   = ""
            MinFee   = ""
            MinExp   = ""
            MaxExp   = ""
            Gender   = ""
            Score    = ""
            Failures = $_.Exception.Message
        })
        $script:fail++
    }
}

# ============================================================
# LEVEL 1 — Simple specialty synonyms (no location/filters)
# Expected: specialization resolved, no city/fee/exp
# ============================================================
Write-Host "`n=== LEVEL 1: Simple Specialty Synonyms ===" -ForegroundColor Cyan

Test-NlpQuery -Level "L1" -TestName "heart doctor synonym" -Query "heart doctor" `
    -Expect @{ specialization = "Cardiology" }

Test-NlpQuery -Level "L1" -TestName "skin doctor synonym" -Query "skin doctor" `
    -Expect @{ specialization = "Dermatology" }

Test-NlpQuery -Level "L1" -TestName "eye doctor synonym" -Query "eye doctor" `
    -Expect @{ specialization = "Ophthalmology" }

Test-NlpQuery -Level "L1" -TestName "bone doctor synonym" -Query "bone doctor" `
    -Expect @{ specialization = "Orthopedics" }

Test-NlpQuery -Level "L1" -TestName "child doctor synonym" -Query "child doctor" `
    -Expect @{ specialization = "Pediatrics" }

Test-NlpQuery -Level "L1" -TestName "plural specialist form" -Query "cardiologists" `
    -Expect @{ specialization = "Cardiology" }

Test-NlpQuery -Level "L1" -TestName "dermatologists plural" -Query "dermatologists" `
    -Expect @{ specialization = "Dermatology" }

# ============================================================
# LEVEL 2 — Specialty + City
# Expected: specialization + city resolved
# ============================================================
Write-Host "`n=== LEVEL 2: Specialty + City ===" -ForegroundColor Cyan

Test-NlpQuery -Level "L2" -TestName "heart doctor pune" -Query "heart doctor pune" `
    -Expect @{ specialization = "Cardiology"; city = "Pune" }

Test-NlpQuery -Level "L2" -TestName "skin doctor mumbai" -Query "skin doctor mumbai" `
    -Expect @{ specialization = "Dermatology"; city = "Mumbai" }

Test-NlpQuery -Level "L2" -TestName "eye specialist delhi" -Query "eye specialist delhi" `
    -Expect @{ specialization = "Ophthalmology"; city = "Delhi" }

Test-NlpQuery -Level "L2" -TestName "cardiologist in pune" -Query "cardiologist in pune" `
    -Expect @{ specialization = "Cardiology"; city = "Pune" }

# ============================================================
# LEVEL 3 — Specialty + City + Single Filter (fee or experience)
# ============================================================
Write-Host "`n=== LEVEL 3: Specialty + City + Single Filter ===" -ForegroundColor Cyan

Test-NlpQuery -Level "L3" -TestName "heart doctor pune under 3000" -Query "heart doctor pune under 3000" `
    -Expect @{ specialization = "Cardiology"; city = "Pune"; maxConsultationFee = 3000 }

Test-NlpQuery -Level "L3" -TestName "eye doctor pune 10 years experience" -Query "eye doctor pune with 10 years experience" `
    -Expect @{ specialization = "Ophthalmology"; city = "Pune"; minExperience = 10 }

Test-NlpQuery -Level "L3" -TestName "skin doctor fee below 1500" -Query "skin doctor fee below 1500" `
    -Expect @{ specialization = "Dermatology"; maxConsultationFee = 1500 }

Test-NlpQuery -Level "L3" -TestName "cardiologist more than 5 years exp" -Query "cardiologist more than 5 years experience" `
    -Expect @{ specialization = "Cardiology"; minExperience = 5 }

Test-NlpQuery -Level "L3" -TestName "fee range not confused with experience" -Query "cardiologist more than 8 years experience in pune" `
    -Expect @{ specialization = "Cardiology"; city = "Pune"; minExperience = 8; maxConsultationFee = "__null__" }

# ============================================================
# LEVEL 4 — Multi-filter (gender, language, city, fee, exp)
# ============================================================
Write-Host "`n=== LEVEL 4: Multi-Filter ===" -ForegroundColor Cyan

Test-NlpQuery -Level "L4" -TestName "female heart doctor pune" -Query "female heart doctor in pune" `
    -Expect @{ specialization = "Cardiology"; city = "Pune"; gender = "female" }

Test-NlpQuery -Level "L4" -TestName "marathi speaking skin doctor" -Query "marathi speaking skin doctor" `
    -Expect @{ specialization = "Dermatology"; language = "Marathi" }

Test-NlpQuery -Level "L4" -TestName "male dermatologist mumbai" -Query "male dermatologist mumbai" `
    -Expect @{ specialization = "Dermatology"; city = "Mumbai"; gender = "male" }

Test-NlpQuery -Level "L4" -TestName "hindi speaking female cardiologist" -Query "hindi speaking female cardiologist" `
    -Expect @{ specialization = "Cardiology"; language = "Hindi"; gender = "female" }

# ============================================================
# LEVEL 5 — Complex Natural Language sentences
# ============================================================
Write-Host "`n=== LEVEL 5: Complex Natural Language ===" -ForegroundColor Cyan

Test-NlpQuery -Level "L5" -TestName "marathi skin specialist mumbai under 1500" `
    -Query "looking for a skin specialist in mumbai who speaks marathi and charges less than 1500" `
    -Expect @{ specialization = "Dermatology"; city = "Mumbai"; language = "Marathi"; maxConsultationFee = 1500 }

Test-NlpQuery -Level "L5" -TestName "heart specialist pune 10yr exp under 3000" `
    -Query "i need a heart specialist in pune who has more than 10 years experience and charges less than 3000" `
    -Expect @{ specialization = "Cardiology"; city = "Pune"; minExperience = 10; maxConsultationFee = 3000 }

Test-NlpQuery -Level "L5" -TestName "best cardiologist bangalore hindi" `
    -Query "best cardiologist in bangalore who speaks hindi" `
    -Expect @{ specialization = "Cardiology"; city = "Bangalore"; language = "Hindi" }

Test-NlpQuery -Level "L5" -TestName "fee not mistaken for experience" `
    -Query "show me cardiologists with more than 15 years experience" `
    -Expect @{ specialization = "Cardiology"; minExperience = 15; maxConsultationFee = "__null__" }

# ============================================================
# LEVEL 6 — Symptom-based queries (symptom → specialization)
# ============================================================
Write-Host "`n=== LEVEL 6: Symptom-Based Queries ===" -ForegroundColor Cyan

Test-NlpQuery -Level "L6" -TestName "chest pain → Cardiology" `
    -Query "i have chest pain and need a specialist in pune" `
    -Expect @{ specialization = "Cardiology"; city = "Pune" }

Test-NlpQuery -Level "L6" -TestName "child fever → Pediatrics" `
    -Query "my child has fever and i need a doctor in mumbai" `
    -Expect @{ specialization = "Pediatrics"; city = "Mumbai" }

Test-NlpQuery -Level "L6" -TestName "skin rashes → Dermatology" `
    -Query "i am suffering from skin rashes and need a specialist" `
    -Expect @{ specialization = "Dermatology" }

Test-NlpQuery -Level "L6" -TestName "anxiety → Psychiatry" `
    -Query "i have anxiety and panic attacks" `
    -Expect @{ specialization = "Psychiatry" }

Test-NlpQuery -Level "L6" -TestName "back pain → Orthopedics" `
    -Query "suffering from back pain need a doctor" `
    -Expect @{ specialization = "Orthopedics" }

Test-NlpQuery -Level "L6" -TestName "eye problem → Ophthalmology" `
    -Query "having eye problem and blurred vision" `
    -Expect @{ specialization = "Ophthalmology" }

Test-NlpQuery -Level "L6" -TestName "tooth pain → Dentistry" `
    -Query "i have severe tooth pain" `
    -Expect @{ specialization = "Dentistry" }

# ============================================================
# LEVEL 7 — Full compound queries (all filters together)
# ============================================================
Write-Host "`n=== LEVEL 7: Full Compound Queries ===" -ForegroundColor Cyan

Test-NlpQuery -Level "L7" -TestName "female skin doctor mumbai marathi under 2000 5yr" `
    -Query "marathi speaking female skin doctor in mumbai under 2000 with more than 5 years experience" `
    -Expect @{ specialization = "Dermatology"; city = "Mumbai"; language = "Marathi"; gender = "female"; maxConsultationFee = 2000; minExperience = 5 }

Test-NlpQuery -Level "L7" -TestName "female child doctor pune hindi english" `
    -Query "female child doctor in pune speaking hindi and english" `
    -Expect @{ specialization = "Pediatrics"; city = "Pune"; language = "Hindi"; gender = "female" }

Test-NlpQuery -Level "L7" -TestName "chest pain pune below 3000 10yr" `
    -Query "doctor for chest pain in pune with fee below 3000 and more than 10 years experience" `
    -Expect @{ specialization = "Cardiology"; city = "Pune"; maxConsultationFee = 3000; minExperience = 10 }

Test-NlpQuery -Level "L7" -TestName "male orthopedic bangalore hindi 8yr 2500" `
    -Query "male orthopedic doctor in bangalore who speaks hindi with more than 8 years experience fee under 2500" `
    -Expect @{ specialization = "Orthopedics"; city = "Bangalore"; language = "Hindi"; gender = "male"; minExperience = 8; maxConsultationFee = 2500 }

# ============================================================
# RESULTS SUMMARY
# ============================================================
Write-Host ""
Write-Host ""
Write-Host "============================================================" -ForegroundColor White
Write-Host "  NLP INTENT PARSER - TEST RESULTS" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor White

# Detailed table
$results | Format-Table -AutoSize -Property Level, Status, Score, Spec, City, Lang, MaxFee, MinExp, Gender, Failures, Test

# Per-level summary
Write-Host ""
Write-Host "--- Per-Level Summary ---" -ForegroundColor Yellow
$results | Group-Object Level | ForEach-Object {
    $lvl     = $_.Name
    $total   = $_.Count
    $passed  = ($_.Group | Where-Object { $_.Status -eq "PASS" }).Count
    $color   = if ($passed -eq $total) { "Green" } else { "Red" }
    Write-Host ("  {0}  {1}/{2} passed" -f $lvl, $passed, $total) -ForegroundColor $color
}

Write-Host ""
Write-Host "--- Overall ---" -ForegroundColor Yellow
$total = $pass + $fail
$color = if ($fail -eq 0) { "Green" } else { "Red" }
Write-Host ("  PASSED: {0}/{1}   FAILED: {2}" -f $pass, $total, $fail) -ForegroundColor $color

# Failures detail
$failed = $results | Where-Object { $_.Status -ne "PASS" }
if ($failed.Count -gt 0) {
    Write-Host ""
Write-Host "--- Failed / Error Details ---" -ForegroundColor Red
    foreach ($f in $failed) {
        Write-Host "  [$($f.Level)] $($f.Test)" -ForegroundColor Red
        Write-Host "    Query: $($f.Query)" -ForegroundColor DarkRed
        Write-Host "    Got  : spec=$($f.Spec) city=$($f.City) lang=$($f.Lang) maxFee=$($f.MaxFee) minExp=$($f.MinExp) gender=$($f.Gender) score=$($f.Score)" -ForegroundColor DarkRed
        Write-Host "    Fail : $($f.Failures)" -ForegroundColor DarkRed
    }
}

Write-Host "============================================================" -ForegroundColor White
Write-Host ""

# Exit with non-zero if failures
if ($fail -gt 0) { exit 1 }
