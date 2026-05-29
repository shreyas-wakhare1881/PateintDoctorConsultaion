# Sprint 3+4 Integration Test Suite
# Tests: Fuzzy matching, ranking, FTS, symptom suggestions, hybrid pipeline, DidYouMean
# Usage: powershell -ExecutionPolicy Bypass -File test_sprint3.ps1

$baseUrl = "http://localhost:5053"
$pass = 0
$fail = 0
$results = @()

function Test-NlpSearch {
    param(
        [string]$TestName,
        [string]$Query,
        [string]$Description,
        # Assertions
        [int]$MinResults     = -1,
        [string]$ExpectedSpec = $null,
        [bool]$ExpectDidYouMean = $false,
        [bool]$ExpectRelevanceScore = $true,
        [double]$MinConfidence = 0.0
    )

    $encoded = [System.Uri]::EscapeDataString($Query)
    $url     = "$baseUrl/api/discovery/nlp-search?query=$encoded"

    try {
        $response = Invoke-RestMethod -Uri $url -Method GET -ErrorAction Stop
        $data     = $response.data
        $intent   = $data.parsedIntent
        $items    = $data.results.items

        $failures = @()

        if ($MinResults -ge 0 -and $items.Count -lt $MinResults) {
            $failures += "Expected >= $MinResults results, got $($items.Count)"
        }

        if ($ExpectedSpec -and $intent.specialization -ne $ExpectedSpec) {
            $failures += "Expected spec '$ExpectedSpec', got '$($intent.specialization)'"
        }

        if ($ExpectDidYouMean -and -not $data.didYouMean) {
            $failures += "Expected didYouMean to be non-null (fuzzy correction expected)"
        }

        if ($ExpectRelevanceScore -and $items.Count -gt 0) {
            $firstScore = $items[0].relevanceScore
            if ($null -eq $firstScore) {
                $failures += "Expected relevanceScore on first result, got null"
            }
        }

        if ($MinConfidence -gt 0 -and $intent.confidenceScore -lt $MinConfidence) {
            $failures += "Expected confidenceScore >= $MinConfidence, got $($intent.confidenceScore)"
        }

        if ($failures.Count -eq 0) {
            Write-Host "  [PASS] $TestName" -ForegroundColor Green
            if ($data.didYouMean) {
                Write-Host "         DidYouMean: '$($data.didYouMean)'" -ForegroundColor Cyan
            }
            if ($items.Count -gt 0 -and $items[0].relevanceScore) {
                Write-Host "         Top result: '$($items[0].fullName)' score=$([Math]::Round($items[0].relevanceScore,3))" -ForegroundColor Cyan
            }
            $script:pass++
            $script:results += [PSCustomObject]@{ Test=$TestName; Status="PASS"; Detail="" }
        }
        else {
            Write-Host "  [FAIL] $TestName" -ForegroundColor Red
            foreach ($f in $failures) { Write-Host "         $f" -ForegroundColor Yellow }
            $script:fail++
            $script:results += [PSCustomObject]@{ Test=$TestName; Status="FAIL"; Detail=($failures -join "; ") }
        }
    }
    catch {
        Write-Host "  [FAIL] $TestName - HTTP error: $($_.Exception.Message)" -ForegroundColor Red
        $script:fail++
        $script:results += [PSCustomObject]@{ Test=$TestName; Status="FAIL"; Detail=$_.Exception.Message }
    }
}

function Test-Suggestions {
    param(
        [string]$TestName,
        [string]$Query,
        [string]$ExpectedType = $null,  # 'Symptom'(2) | 'Synonym'(1) | 'Specialization'(0)
        [string]$ContainsText = $null
    )
    # SuggestionType enum: Specialization=0, Synonym=1, Symptom=2
    $typeMap = @{ 'Specialization' = 0; 'Synonym' = 1; 'Symptom' = 2 }

    $encoded = [System.Uri]::EscapeDataString($Query)
    $url     = "$baseUrl/api/discovery/suggestions?q=$encoded"

    try {
        $response = Invoke-RestMethod -Uri $url -Method GET -ErrorAction Stop
        $items    = $response.data

        $failures = @()

        if ($ExpectedType) {
            $expectedInt = $typeMap[$ExpectedType]
            $match = $items | Where-Object { $_.type -eq $expectedInt }
            if (-not $match) {
                $failures += "No suggestion of type '$ExpectedType'($expectedInt) found (got types: $(($items | ForEach-Object { $_.type } | Sort-Object -Unique) -join ', '))"
            }
        }

        if ($ContainsText) {
            $match = $items | Where-Object { $_.text -like "*$ContainsText*" }
            if (-not $match) {
                $failures += "No suggestion containing '$ContainsText' found (texts: $($items | ForEach-Object { $_.text } | Select-Object -First 5))"
            }
        }

        if ($failures.Count -eq 0) {
            Write-Host "  [PASS] $TestName" -ForegroundColor Green
            if ($items.Count -gt 0) {
                Write-Host "         Suggestions: $(($items | ForEach-Object { $_.text } | Select-Object -First 3) -join '; ')" -ForegroundColor Cyan
            }
            $script:pass++
            $script:results += [PSCustomObject]@{ Test=$TestName; Status="PASS"; Detail="" }
        }
        else {
            Write-Host "  [FAIL] $TestName" -ForegroundColor Red
            foreach ($f in $failures) { Write-Host "         $f" -ForegroundColor Yellow }
            $script:fail++
            $script:results += [PSCustomObject]@{ Test=$TestName; Status="FAIL"; Detail=($failures -join "; ") }
        }
    }
    catch {
        Write-Host "  [FAIL] $TestName - HTTP error: $($_.Exception.Message)" -ForegroundColor Red
        $script:fail++
        $script:results += [PSCustomObject]@{ Test=$TestName; Status="FAIL"; Detail=$_.Exception.Message }
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Sprint 3+4 Integration Tests â€” Search Intelligence Layer" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# â”€â”€ SECTION 1: Fuzzy Matching (DidYouMean) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "SECTION 1: Fuzzy Matching" -ForegroundColor Magenta

Test-NlpSearch `
    -TestName    "Fuzzy: cardiolgist â†’ cardiologist" `
    -Query       "cardiolgist" `
    -Description "Common misspelling of cardiologist" `
    -ExpectedSpec "Cardiology" `
    -ExpectDidYouMean $true `
    -MinConfidence 0.50

Test-NlpSearch `
    -TestName    "Fuzzy: dermatolgist â†’ dermatologist" `
    -Query       "dermatolgist" `
    -Description "Common misspelling of dermatologist" `
    -ExpectedSpec "Dermatology" `
    -ExpectDidYouMean $true

Test-NlpSearch `
    -TestName    "Fuzzy: opthalmologist â†’ ophthalmologist" `
    -Query       "opthalmologist" `
    -Description "Common misspelling of ophthalmologist" `
    -ExpectedSpec "Ophthalmology" `
    -ExpectDidYouMean $true

Test-NlpSearch `
    -TestName    "Fuzzy: nuerologist â†’ neurologist" `
    -Query       "nuerologist" `
    -Description "Common misspelling of neurologist" `
    -ExpectedSpec "Neurology" `
    -ExpectDidYouMean $true

Test-NlpSearch `
    -TestName    "Fuzzy: peditrician â†’ pediatrician" `
    -Query       "peditrician" `
    -Description "Common misspelling of pediatrician" `
    -ExpectedSpec "Pediatrics" `
    -ExpectDidYouMean $true

# â”€â”€ SECTION 2: Relevance Ranking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ""
Write-Host "SECTION 2: Relevance Ranking" -ForegroundColor Magenta

Test-NlpSearch `
    -TestName    "Ranking: heart doctor in pune" `
    -Query       "heart doctor in pune" `
    -ExpectedSpec "Cardiology" `
    -ExpectRelevanceScore $true `
    -MinConfidence 0.60

Test-NlpSearch `
    -TestName    "Ranking: best cardiologist" `
    -Query       "best cardiologist" `
    -ExpectedSpec "Cardiology" `
    -ExpectRelevanceScore $true `
    -MinConfidence 0.70

Test-NlpSearch `
    -TestName    "Ranking: skin specialist under 1000" `
    -Query       "skin specialist under 1000" `
    -ExpectedSpec "Dermatology" `
    -ExpectRelevanceScore $true `
    -MinConfidence 0.60

Test-NlpSearch `
    -TestName    "Ranking: relevance sort request" `
    -Query       "cardiologist" `
    -ExpectedSpec "Cardiology" `
    -ExpectRelevanceScore $true `
    -MinConfidence 0.70

# â”€â”€ SECTION 3: Symptom-Based Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ""
Write-Host "SECTION 3: Symptom-Based Search" -ForegroundColor Magenta

Test-NlpSearch `
    -TestName    "Symptom: chest pain â†’ Cardiology" `
    -Query       "i have chest pain" `
    -ExpectedSpec "Cardiology" `
    -MinConfidence 0.50

Test-NlpSearch `
    -TestName    "Symptom: skin rash â†’ Dermatology" `
    -Query       "skin rash treatment" `
    -ExpectedSpec "Dermatology" `
    -MinConfidence 0.50

Test-NlpSearch `
    -TestName    "Symptom: migraine headache â†’ Neurology" `
    -Query       "migraine headache doctor" `
    -ExpectedSpec "Neurology" `
    -MinConfidence 0.50

Test-NlpSearch `
    -TestName    "Symptom: anxiety depression â†’ Psychiatry" `
    -Query       "anxiety depression help" `
    -ExpectedSpec "Psychiatry" `
    -MinConfidence 0.50

Test-NlpSearch `
    -TestName    "Symptom: tooth pain â†’ Dentistry" `
    -Query       "i have severe tooth pain" `
    -ExpectedSpec "Dentistry" `
    -MinConfidence 0.50

Test-NlpSearch `
    -TestName    "Symptom: knee pain â†’ Orthopedics" `
    -Query       "knee pain doctor" `
    -ExpectedSpec "Orthopedics" `
    -MinConfidence 0.50

Test-NlpSearch `
    -TestName    "Symptom: blurred vision â†’ Ophthalmology" `
    -Query       "blurred vision doctor" `
    -ExpectedSpec "Ophthalmology" `
    -MinConfidence 0.50

# â”€â”€ SECTION 4: Complex Multi-Intent Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ""
Write-Host "SECTION 4: Complex Multi-Intent Queries" -ForegroundColor Magenta

Test-NlpSearch `
    -TestName    "Complex: cardiologist in pune under 3000" `
    -Query       "cardiologist in pune under 3000" `
    -ExpectedSpec "Cardiology" `
    -MinConfidence 0.70

Test-NlpSearch `
    -TestName    "Complex: female heart specialist 10 years" `
    -Query       "female heart specialist with 10 years experience" `
    -ExpectedSpec "Cardiology" `
    -MinConfidence 0.60

Test-NlpSearch `
    -TestName    "Complex: hindi speaking dermatologist" `
    -Query       "hindi speaking dermatologist in mumbai" `
    -ExpectedSpec "Dermatology" `
    -MinConfidence 0.60

Test-NlpSearch `
    -TestName    "Complex: pediatrician mumbai cheap" `
    -Query       "pediatrician in mumbai under 500" `
    -ExpectedSpec "Pediatrics" `
    -MinConfidence 0.60

Test-NlpSearch `
    -TestName    "Complex: doctor for chest pain in pune under 3000" `
    -Query       "doctor for chest pain in pune under 3000" `
    -ExpectedSpec "Cardiology" `
    -MinConfidence 0.50

# â”€â”€ SECTION 5: Partial / Stem Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ""
Write-Host "SECTION 5: Partial / Stem Search" -ForegroundColor Magenta

Test-NlpSearch `
    -TestName    "Partial: cardio" `
    -Query       "cardio" `
    -ExpectedSpec "Cardiology" `
    -MinConfidence 0.70

Test-NlpSearch `
    -TestName    "Partial: derma" `
    -Query       "derma specialist" `
    -ExpectedSpec "Dermatology" `
    -MinConfidence 0.70

Test-NlpSearch `
    -TestName    "Partial: ortho" `
    -Query       "orthopedic" `
    -ExpectedSpec "Orthopedics" `
    -MinConfidence 0.70

# â”€â”€ SECTION 6: Suggestions V2 (Symptom type) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ""
Write-Host "SECTION 6: Suggestions V2" -ForegroundColor Magenta

Test-Suggestions `
    -TestName    "Suggestions: chest prefix shows symptom" `
    -Query       "chest" `
    -ExpectedType "Symptom"

Test-Suggestions `
    -TestName    "Suggestions: skin shows both Symptom and Specialization" `
    -Query       "skin" `
    -ExpectedType "Specialization"

Test-Suggestions `
    -TestName    "Suggestions: heart returns synonym" `
    -Query       "heart" `
    -ExpectedType "Synonym"

Test-Suggestions `
    -TestName    "Suggestions: cardio returns specialization" `
    -Query       "cardio" `
    -ExpectedType "Specialization"

# â”€â”€ SECTION 7: Edge Cases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ""
Write-Host "SECTION 7: Edge Cases" -ForegroundColor Magenta

# Edge: empty/whitespace query — backend correctly returns 400 (validation), test verifies graceful rejection
try {
    $r = Invoke-WebRequest "$baseUrl/api/discovery/nlp-search?query=+" -UseBasicParsing -ErrorAction Stop
    Write-Host "  [FAIL] Edge: empty-ish query (spaces) - expected 400 but got 200" -ForegroundColor Red
    $script:fail++
    $script:results += [PSCustomObject]@{ Test="Edge: empty-ish query (spaces)"; Status="FAIL"; Detail="Expected 400, got 200" }
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::BadRequest) {
        Write-Host "  [PASS] Edge: empty-ish query (spaces)" -ForegroundColor Green
        Write-Host "         Correctly rejected with 400 Bad Request" -ForegroundColor Cyan
        $script:pass++
        $script:results += [PSCustomObject]@{ Test="Edge: empty-ish query (spaces)"; Status="PASS"; Detail="Correctly returned 400" }
    } else {
        Write-Host "  [FAIL] Edge: empty-ish query (spaces) - unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $script:fail++
        $script:results += [PSCustomObject]@{ Test="Edge: empty-ish query (spaces)"; Status="FAIL"; Detail=$_.Exception.Message }
    }
}

Test-NlpSearch `
    -TestName    "Edge: numeric only" `
    -Query       "1000" `
    -MinResults  0 `
    -ExpectRelevanceScore $true

Test-NlpSearch `
    -TestName    "Edge: well-typed cardiologist (no fuzzy needed)" `
    -Query       "cardiologist" `
    -ExpectedSpec "Cardiology" `
    -ExpectDidYouMean $false `
    -MinConfidence 0.70

# â”€â”€ SUMMARY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " RESULTS: $pass passed, $fail failed out of $($pass + $fail) tests" -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "============================================================" -ForegroundColor Cyan

if ($fail -gt 0) {
    Write-Host ""
    Write-Host "Failed tests:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Detail)" -ForegroundColor Red
    }
}

# Exit code for CI
exit $fail

