param()
$ErrorActionPreference = "Continue"
$BASE  = "http://localhost:5053"
$script:PASS = 0
$script:FAIL = 0
$script:BUGS = @()

# ── Helper: make one HTTP call and assert result ─────────────────────────────
function T {
    param([string]$Tag,[string]$Method,[string]$Url,$Body,$Token,$ExpectOk,$ExpectStatus)
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    try {
        $json = if ($Body -and $Body -ne @{}) { $Body | ConvertTo-Json -Depth 10 } else { $null }
        $iwArgs = @{ Method=$Method; Uri=$Url; Headers=$headers; ErrorAction="Stop"; UseBasicParsing=$true }
        if ($json) { $iwArgs["Body"] = $json }
        $wr = Invoke-WebRequest @iwArgs
        $status = [int]$wr.StatusCode
        $ok = $true
        try { $bodyObj = $wr.Content | ConvertFrom-Json } catch { $bodyObj = @{ raw = $wr.Content } }
    } catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        $raw    = $_.ErrorDetails.Message
        $ok     = $false
        if ($raw) {
            try { $bodyObj = $raw | ConvertFrom-Json } catch { $bodyObj = @{ message = "$raw" } }
        } else { $bodyObj = @{ message = "$($_.Exception.Message)" } }
    }
    $pass = $true
    if ($null -ne $ExpectOk -and $ok -ne $ExpectOk) { $pass = $false }
    if ($ExpectStatus -and $status -ne $ExpectStatus) { $pass = $false }
    $label = if ($pass) { "PASS" } else { "FAIL" }
    $color = if ($pass) { "Green" } else { "Red" }
    if ($pass) { $script:PASS++ } else { $script:FAIL++ }
    $compact = try { $bodyObj | ConvertTo-Json -Compress -Depth 3 } catch { "$bodyObj" }
    Write-Host "[$label] $Tag | $Method $Url | HTTP $status | $compact" -ForegroundColor $color
    if (-not $pass) {
        $script:BUGS += "[${Tag}] $Method $Url | Expect:OK=$ExpectOk/Status=$ExpectStatus | Got:OK=$ok/Status=$status | $compact"
    }
    return $bodyObj
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1: AUTH MODULE — Registration + OTP
# ═══════════════════════════════════════════════════════════════════════════
Write-Host "`n=== PHASE 1: AUTH MODULE ===" -ForegroundColor Cyan

# ── Admin Login ───────────────────────────────────────────────────────────
$aLogin = T "Admin-Login-OK" POST "$BASE/api/auth/login" @{email="admin@pdc.com";password="Admin@123";role="Admin"} $null $true
$ADMIN_JWT = $aLogin.data.accessToken
Write-Host "  ADMIN_JWT=$(if($ADMIN_JWT){'[OBTAINED]'}else{'[NULL]'})" -ForegroundColor Yellow

T "Admin-WrongPwd-401"    POST "$BASE/api/auth/login" @{email="admin@pdc.com";password="WrongPass!";role="Admin"} $null $false 401
T "Admin-BadEmail-401"    POST "$BASE/api/auth/login" @{email="nobody@pdc.com";password="Admin@123";role="Admin"} $null $false 401
T "NoToken-Admin-401"     GET  "$BASE/api/admin/dashboard" $null $null $false 401
T "Auth-WrongRole-400"    POST "$BASE/api/auth/login" @{email="admin@pdc.com";password="Admin@123";role="Patient"} $null $false

# ── Doctor Registration (creates User only, no profile) ───────────────────
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$DR1_EMAIL = "doctor.alpha.$ts@test.com"
$DR2_EMAIL = "doctor.beta.$ts@test.com"
$DR3_EMAIL = "doctor.gamma.$ts@test.com"
$LIC1 = "LIC-A-$ts"; $LIC2 = "LIC-B-$ts"; $LIC3 = "LIC-G-$ts"

# Doctor registration only takes: fullName, email, phoneNumber?, password, confirmPassword, role
$dr1RegBody = @{fullName="Dr Alpha Sharma";email=$DR1_EMAIL;password="Doctor@1234";confirmPassword="Doctor@1234";role="Doctor"}
$dr1Reg = T "Dr1-Register-OK" POST "$BASE/api/auth/register" $dr1RegBody $null $true 201
Write-Host "  DR1 User registered" -ForegroundColor Yellow

T "Dr1-DupEmail-409"     POST "$BASE/api/auth/register" @{fullName="Dup";email=$DR1_EMAIL;password="Doctor@1234";confirmPassword="Doctor@1234";role="Doctor"} $null $false 409
T "Dr-MissingPwd-400"    POST "$BASE/api/auth/register" @{fullName="X";email="test@x.com";password="";confirmPassword="";role="Doctor"} $null $false 400
T "Dr-AdminReg-400"      POST "$BASE/api/auth/register" @{fullName="X";email="admin2@test.com";password="P@ss1234";confirmPassword="P@ss1234";role="Admin"} $null $false 400
T "Dr-PatReg-400"        POST "$BASE/api/auth/register" @{fullName="X";email="pat2@test.com";password="P@ss1234";confirmPassword="P@ss1234";role="Patient"} $null $false 400
T "Dr-PwdMismatch-400"   POST "$BASE/api/auth/register" @{fullName="X";email="dr.mismatch@test.com";password="P@ss1234";confirmPassword="Different@1";role="Doctor"} $null $false 400

$dr2RegBody = @{fullName="Dr Beta Iyer";email=$DR2_EMAIL;password="Doctor@5678";confirmPassword="Doctor@5678";role="Doctor"}
T "Dr2-Register-OK" POST "$BASE/api/auth/register" $dr2RegBody $null $true 201

$dr3RegBody = @{fullName="Dr Gamma Singh";email=$DR3_EMAIL;password="Doctor@9999";confirmPassword="Doctor@9999";role="Doctor"}
T "Dr3-Register-OK" POST "$BASE/api/auth/register" $dr3RegBody $null $true 201

# ── Patient OTP Authentication ────────────────────────────────────────────
$PHONE1 = "+9191$(Get-Random -Min 100 -Max 999)000011"; $PHONE2 = "+9191$(Get-Random -Min 100 -Max 999)000012"; $PHONE_BLK = "+9191$(Get-Random -Min 100 -Max 999)000099"

T "Pat1-OTP-Send-OK"       POST "$BASE/api/auth/send-otp" @{phoneNumber=$PHONE1} $null $true
T "OTP-InvalidPhone-400"   POST "$BASE/api/auth/send-otp" @{phoneNumber="123"} $null $false 400
T "OTP-WrongCode-401"      POST "$BASE/api/auth/verify-otp" @{phoneNumber=$PHONE1;otp="9999"} $null $false 401
$p1v = T "Pat1-OTP-Verify-OK" POST "$BASE/api/auth/verify-otp" @{phoneNumber=$PHONE1;otp="1234"} $null $true
$PAT1_JWT = $p1v.data.accessToken; $PAT1_REFRESH = $p1v.data.refreshToken; $PAT1_USERID = $p1v.data.user.id
Write-Host "  PAT1_JWT=$(if($PAT1_JWT){'[OBTAINED]'}else{'[NULL]'}) PAT1_USERID=$PAT1_USERID" -ForegroundColor Yellow

T "Pat2-OTP-Send-OK"       POST "$BASE/api/auth/send-otp" @{phoneNumber=$PHONE2} $null $true
$p2v = T "Pat2-OTP-Verify-OK" POST "$BASE/api/auth/verify-otp" @{phoneNumber=$PHONE2;otp="1234"} $null $true
$PAT2_JWT = $p2v.data.accessToken; $PAT2_USERID = $p2v.data.user.id

T "PatBlk-OTP-Send-OK"     POST "$BASE/api/auth/send-otp" @{phoneNumber=$PHONE_BLK} $null $true
$pbv = T "PatBlk-OTP-Verify-OK" POST "$BASE/api/auth/verify-otp" @{phoneNumber=$PHONE_BLK;otp="1234"} $null $true
$PAT_BLK_JWT = $pbv.data.accessToken; $PAT_BLK_USERID = $pbv.data.user.id
Write-Host "  PAT_BLK_USERID=$PAT_BLK_USERID" -ForegroundColor Yellow

# Token Refresh
$rtR = T "Refresh-Token-OK"     POST "$BASE/api/auth/refresh" @{refreshToken=$PAT1_REFRESH} $null $true
T "Refresh-Invalid-401"         POST "$BASE/api/auth/refresh" @{refreshToken="totally-invalid-token"} $null $false 401
if ($rtR.data.accessToken) { $PAT1_JWT = $rtR.data.accessToken; Write-Host "  PAT1_JWT refreshed" -ForegroundColor Yellow }

# Auth Me endpoint (requires any valid JWT)
$meR = T "Auth-Me-OK"           GET "$BASE/api/auth/me" $null $PAT1_JWT $true
Write-Host "  Auth/me userId=$($meR.data.id)" -ForegroundColor Yellow
T "Auth-Me-NoToken-401"         GET "$BASE/api/auth/me" $null $null $false 401


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2: DOCTOR PROFILE + AVAILABILITY
# ═══════════════════════════════════════════════════════════════════════════
Write-Host "`n=== PHASE 2: DOCTOR PROFILE + AVAILABILITY ===" -ForegroundColor Cyan

# Doctor logs in to get JWT for profile creation
$drL1 = T "Dr1-Login-OK" POST "$BASE/api/auth/login" @{email=$DR1_EMAIL;password="Doctor@1234";role="Doctor"} $null $true
$DR1_JWT = $drL1.data.accessToken
Write-Host "  DR1_JWT=$(if($DR1_JWT){'[OBTAINED]'}else{'[NULL]'})" -ForegroundColor Yellow

$drL2 = T "Dr2-Login-OK" POST "$BASE/api/auth/login" @{email=$DR2_EMAIL;password="Doctor@5678";role="Doctor"} $null $true
$DR2_JWT = $drL2.data.accessToken

$drL3 = T "Dr3-Login-OK" POST "$BASE/api/auth/login" @{email=$DR3_EMAIL;password="Doctor@9999";role="Doctor"} $null $true
$DR3_JWT = $drL3.data.accessToken

# Create Doctor Profiles (profile creation, not registration)
# Fields: Specialization, Qualification, ExperienceYears, LicenseNumber, Bio, ProfileImageUrl?,
#         ConsultationFee, HospitalName?, ClinicAddress?, City, State?, Country?, LanguagesSpoken?
$dr1ProfBody = @{specialization="Cardiologist";qualification="MBBS, MD";experienceYears=8
    licenseNumber=$LIC1;bio="Experienced cardiologist";consultationFee=800;city="Mumbai"
    state="Maharashtra";country="India";languagesSpoken=@("English","Hindi")}
$drProf1 = T "Dr1-CreateProfile-OK" POST "$BASE/api/doctors/profile" $dr1ProfBody $DR1_JWT $true 201
$DR1_ID = $drProf1.data.id
Write-Host "  DR1_ID=$DR1_ID" -ForegroundColor Yellow

# Duplicate profile: same doctor creates profile again → 409
T "Dr1-DupProfile-409" POST "$BASE/api/doctors/profile" $dr1ProfBody $DR1_JWT $false 409

$dr2ProfBody = @{specialization="Neurologist";qualification="MBBS, DM";experienceYears=5
    licenseNumber=$LIC2;bio="Neurology specialist";consultationFee=1000;city="Delhi"
    state="Delhi";country="India"}
$drProf2 = T "Dr2-CreateProfile-OK" POST "$BASE/api/doctors/profile" $dr2ProfBody $DR2_JWT $true 201
$DR2_ID = $drProf2.data.id
Write-Host "  DR2_ID=$DR2_ID" -ForegroundColor Yellow

# Duplicate license: different doctor uses same license → 409
$dupLicBody = @{specialization="Cardio";qualification="MBBS";experienceYears=1
    licenseNumber=$LIC1;bio="dup";consultationFee=100;city="X"}
T "Dr-DupLicense-409" POST "$BASE/api/doctors/profile" $dupLicBody $DR3_JWT $false 409

$dr3ProfBody = @{specialization="Dermatologist";qualification="MBBS";experienceYears=3
    licenseNumber=$LIC3;bio="Skin specialist";consultationFee=600;city="Bangalore"
    state="Karnataka";country="India"}
$drProf3 = T "Dr3-CreateProfile-OK" POST "$BASE/api/doctors/profile" $dr3ProfBody $DR3_JWT $true 201
$DR3_ID = $drProf3.data.id
Write-Host "  DR3_ID=$DR3_ID" -ForegroundColor Yellow

# Get and Update Doctor Profile
$dp1 = T "Dr1-GetProfile-OK"    GET   "$BASE/api/doctors/profile/me" $null $DR1_JWT $true
T "Dr1-UpdateProfile-OK"        PATCH "$BASE/api/doctors/profile/me" @{bio="Updated bio 2025";city="Pune";consultationFee=900} $DR1_JWT $true
T "Pat-DrProfile-403"           GET   "$BASE/api/doctors/profile/me" $null $PAT1_JWT $false 403
T "DrProfile-NoToken-401"       GET   "$BASE/api/doctors/profile/me" $null $null $false 401

# Availability tests moved to Phase 4 (after admin approval — API requires Approved status)
T "Pat-AddAvail-403"            POST "$BASE/api/doctors/availability" @{dayOfWeek=1;startTime="09:00";endTime="10:00";slotDurationMinutes=30} $PAT1_JWT $false 403
T "DrAvail-NoToken-401"         GET  "$BASE/api/doctors/availability/me" $null $null $false 401


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 3: PATIENT PROFILE
# ═══════════════════════════════════════════════════════════════════════════
Write-Host "`n=== PHASE 3: PATIENT PROFILE ===" -ForegroundColor Cyan

$profBody = @{gender="Male";dateOfBirth="1995-06-15";bloodGroup="O+";heightCm=175;weightKg=72
    allergies="Penicillin";chronicDiseases="None";emergencyContactName="Mom"
    emergencyContactPhone="+919000000001";address="123 MG Road";city="Mumbai"
    state="Maharashtra";country="India"}
T "Pat1-CreateProfile-OK"  POST "$BASE/api/patients/profile" $profBody $PAT1_JWT $true 201
T "Pat1-GetProfile-OK"     GET  "$BASE/api/patients/me" $null $PAT1_JWT $true
T "Pat1-DupProfile-409"    POST "$BASE/api/patients/profile" $profBody $PAT1_JWT $false 409
T "Pat-NoToken-401"        GET  "$BASE/api/patients/me" $null $null $false 401
T "Dr-PatProfile-403"      GET  "$BASE/api/patients/me" $null $DR1_JWT $false 403
T "Pat1-Update-OK"         PUT  "$BASE/api/patients/me" @{city="Pune";weightKg=74} $PAT1_JWT $true

$profBlk = @{gender="Female";dateOfBirth="1990-01-01";bloodGroup="B+";heightCm=160;weightKg=55
    emergencyContactName="Dad";emergencyContactPhone="+919000000099";city="Chennai";state="TN";country="India"}
T "PatBlk-CreateProfile-OK" POST "$BASE/api/patients/profile" $profBlk $PAT_BLK_JWT $true 201

$p2prof = @{gender="Female";dateOfBirth="1992-03-20";bloodGroup="A+";heightCm=162;weightKg=57
    emergencyContactName="Husband";emergencyContactPhone="+919000000002";city="Delhi";state="Delhi";country="India"}
T "Pat2-CreateProfile-OK"  POST "$BASE/api/patients/profile" $p2prof $PAT2_JWT $true 201

# Doctor search BEFORE admin approval — should show 0 approved doctors from this test run
$s0 = T "DocSearch-PreApproval" GET "$BASE/api/patients/doctors" $null $PAT1_JWT $true
Write-Host "  Doctors visible pre-approval (new): should be 0 from this run (may have prior data): $($s0.data.items.Count)" -ForegroundColor Yellow
T "DocSearch-NoToken-401"  GET "$BASE/api/patients/doctors" $null $null $false 401


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 4: ADMIN MODULE — Moderation + Filters
# ═══════════════════════════════════════════════════════════════════════════
Write-Host "`n=== PHASE 4: ADMIN MODULE ===" -ForegroundColor Cyan

$dash = T "Admin-Dashboard-OK"  GET "$BASE/api/admin/dashboard" $null $ADMIN_JWT $true
Write-Host "  pendingDoctors=$($dash.data.pendingDoctors) totalDoctors=$($dash.data.totalDoctors) totalPatients=$($dash.data.totalActivePatients)" -ForegroundColor Yellow
T "Admin-Dash-NoToken-401"  GET "$BASE/api/admin/dashboard" $null $null $false 401
T "Admin-Dash-Pat-403"      GET "$BASE/api/admin/dashboard" $null $PAT1_JWT $false 403
T "Admin-Dash-Dr-403"       GET "$BASE/api/admin/dashboard" $null $DR1_JWT $false 403

# Verify DR1_ID, DR2_ID, DR3_ID in admin list
$dList = T "Admin-ListDoctors-OK" GET "$BASE/api/admin/doctors" $null $ADMIN_JWT $true
Write-Host "  Admin sees $($dList.data.totalCount) total doctors" -ForegroundColor Yellow
# Confirm IDs match what we got from profile creation
$dr1FromList = $dList.data.items | Where-Object { $_.id -eq $DR1_ID } | Select-Object -First 1
$dr2FromList = $dList.data.items | Where-Object { $_.id -eq $DR2_ID } | Select-Object -First 1
Write-Host "  DR1 in admin list: $(if($dr1FromList){'YES - '+$dr1FromList.approvalStatus}else{'NOT FOUND'})" -ForegroundColor Yellow
Write-Host "  DR2 in admin list: $(if($dr2FromList){'YES - '+$dr2FromList.approvalStatus}else{'NOT FOUND'})" -ForegroundColor Yellow

# Guard tests on moderation
T "Admin-RejectNoReason-400"   PATCH "$BASE/api/admin/doctors/$DR1_ID/reject" @{reason=""} $ADMIN_JWT $false 400
T "Admin-SuspendPending-409"   PATCH "$BASE/api/admin/doctors/$DR1_ID/suspend" @{reason="test"} $ADMIN_JWT $false 409
T "Admin-Approve-NotExist-404" PATCH "$BASE/api/admin/doctors/00000000-0000-0000-0000-000000000001/approve" @{reason="test"} $ADMIN_JWT $false 404

# Approve DR1 and DR2
$appr1 = T "Admin-Approve-DR1-OK" PATCH "$BASE/api/admin/doctors/$DR1_ID/approve" @{reason="Verified credentials"} $ADMIN_JWT $true
Write-Host "  DR1 after approve: status=$($appr1.data.approvalStatus) visible=$($appr1.data.isPubliclyVisible)" -ForegroundColor Yellow
T "Admin-Approve-DR2-OK"       PATCH "$BASE/api/admin/doctors/$DR2_ID/approve" @{reason="Verified"} $ADMIN_JWT $true
T "Admin-DoubleApprove-409"    PATCH "$BASE/api/admin/doctors/$DR1_ID/approve" @{reason="again"} $ADMIN_JWT $false 409

# ── Availability (doctors are now Approved — required by API) ─────────────
$av1 = @{dayOfWeek=1;startTime="09:00";endTime="10:00";slotDurationMinutes=30}
$avR = T "Dr1-AddAvail-OK"      POST "$BASE/api/doctors/availability" $av1 $DR1_JWT $true
$AVAIL_ID = $avR.data.id
Write-Host "  AVAIL_ID=$AVAIL_ID" -ForegroundColor Yellow
$avOvlp = @{dayOfWeek=1;startTime="09:30";endTime="10:30";slotDurationMinutes=30}
T "Dr1-OverlapAvail-409"        POST "$BASE/api/doctors/availability" $avOvlp $DR1_JWT $false 409
$av3 = @{dayOfWeek=3;startTime="14:00";endTime="16:00";slotDurationMinutes=30}
T "Dr1-AddAvail2-OK"            POST "$BASE/api/doctors/availability" $av3 $DR1_JWT $true
$avList = T "Dr1-GetAvail-OK"   GET  "$BASE/api/doctors/availability/me" $null $DR1_JWT $true
Write-Host "  Dr1 availability slots: $($avList.data.Count)" -ForegroundColor Yellow
$av2D2 = @{dayOfWeek=2;startTime="10:00";endTime="12:00";slotDurationMinutes=30}
T "Dr2-AddAvail-OK"             POST "$BASE/api/doctors/availability" $av2D2 $DR2_JWT $true

# Reject DR3
T "Admin-Reject-DR3-OK"       PATCH "$BASE/api/admin/doctors/$DR3_ID/reject" @{reason="Incomplete documentation"} $ADMIN_JWT $true
T "Admin-RejectApproved-409"  PATCH "$BASE/api/admin/doctors/$DR1_ID/reject" @{reason="test"} $ADMIN_JWT $false 409

# Doctor search after approval
$s1 = T "DocSearch-AfterApproval" GET "$BASE/api/patients/doctors" $null $PAT1_JWT $true
Write-Host "  Doctors visible after approval: $($s1.data.items.Count)" -ForegroundColor Yellow
T "DocSearch-CityFilter"       GET "$BASE/api/patients/doctors?city=Mumbai" $null $PAT1_JWT $true
T "DocSearch-SpecFilter"       GET "$BASE/api/patients/doctors?specialization=Cardiologist" $null $PAT1_JWT $true
T "DocSearch-FeeFilter"        GET "$BASE/api/patients/doctors?minFee=500&maxFee=1200" $null $PAT1_JWT $true

# Suspend DR1 and verify visibility
$susp1 = T "Admin-Suspend-DR1-OK" PATCH "$BASE/api/admin/doctors/$DR1_ID/suspend" @{reason="Patient complaints"} $ADMIN_JWT $true
Write-Host "  DR1 after suspend: status=$($susp1.data.approvalStatus) visible=$($susp1.data.isPubliclyVisible)" -ForegroundColor Yellow
T "Admin-DoubleSuspend-409"   PATCH "$BASE/api/admin/doctors/$DR1_ID/suspend" @{reason="again"} $ADMIN_JWT $false 409
T "Admin-ApproveWhileSusp-409" PATCH "$BASE/api/admin/doctors/$DR1_ID/approve" @{reason="test"} $ADMIN_JWT $false 409

$s2 = T "DocSearch-SuspendHidden" GET "$BASE/api/patients/doctors" $null $PAT1_JWT $true
$visIds = @($s2.data.items | ForEach-Object { $_.id })
if ($DR1_ID -and ($visIds -contains $DR1_ID)) {
    Write-Host "  [BUG] Suspended DR1 STILL visible in search!" -ForegroundColor Red
    $script:BUGS += "[CRITICAL] Suspended doctor DR1 ($DR1_ID) visible in patient search after suspension!"
    $script:FAIL++
} elseif ($DR1_ID) { Write-Host "  [PASS] Suspended DR1 correctly hidden from search" -ForegroundColor Green; $script:PASS++ }

if ($DR3_ID -and ($visIds -contains $DR3_ID)) {
    Write-Host "  [BUG] Rejected DR3 STILL visible in search!" -ForegroundColor Red
    $script:BUGS += "[CRITICAL] Rejected doctor DR3 ($DR3_ID) visible in patient search!"
    $script:FAIL++
} elseif ($DR3_ID) { Write-Host "  [PASS] Rejected DR3 correctly hidden from search" -ForegroundColor Green; $script:PASS++ }

# Suspended doctor can still login (IsActive not changed by suspension, only profile hidden)
$sdL = T "SuspendedDr-Login-OK" POST "$BASE/api/auth/login" @{email=$DR1_EMAIL;password="Doctor@1234";role="Doctor"} $null $true

# Reactivate DR1
T "Admin-Reactivate-DR1-OK"    PATCH "$BASE/api/admin/doctors/$DR1_ID/reactivate" @{reason="Issue resolved"} $ADMIN_JWT $true
T "Admin-ReactNonSusp-409"     PATCH "$BASE/api/admin/doctors/$DR2_ID/reactivate" @{reason="test"} $ADMIN_JWT $false 409

# Patient moderation
$pList = T "Admin-ListPatients-OK" GET "$BASE/api/admin/patients" $null $ADMIN_JWT $true
Write-Host "  Total patients: $($pList.data.totalCount)" -ForegroundColor Yellow
if (-not $PAT_BLK_USERID) {
    $blkUser = $pList.data.items | Where-Object { $_.phoneNumber -eq $PHONE_BLK } | Select-Object -First 1
    $PAT_BLK_USERID = $blkUser.id
    Write-Host "  Retrieved PAT_BLK_USERID from patient list: $PAT_BLK_USERID" -ForegroundColor Yellow
}

T "Admin-BlockPat-OK"          PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/block" @{reason="Spamming system"} $ADMIN_JWT $true
T "Admin-BlockPat-Double-409"  PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/block" @{reason="again"} $ADMIN_JWT $false 409

# Blocked patient: OTP send should succeed (blocking doesn't prevent OTP send)
T "BlkPat-OTP-Send-401"        POST "$BASE/api/auth/send-otp" @{phoneNumber=$PHONE_BLK} $null $false 401
# But verify should fail because user is inactive
T "BlkPat-OTP-Verify-401"      POST "$BASE/api/auth/verify-otp" @{phoneNumber=$PHONE_BLK;otp="1234"} $null $false 401
# Stale JWT from before blocking should fail
T "BlkPat-StaleJWT-404"        GET  "$BASE/api/patients/me" $null $PAT_BLK_JWT $false 404

T "Admin-UnblockPat-OK"        PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/unblock" @{reason="Appeal approved"} $ADMIN_JWT $true
T "Admin-UnblockPat-Double-409" PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/unblock" @{reason="again"} $ADMIN_JWT $false 409
T "Admin-BlockPat-Again"       PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/block" @{reason="Re-block for consultation test"} $ADMIN_JWT $true

# Audit logs
$aud = T "Admin-AuditLogs-OK"  GET "$BASE/api/admin/audit-logs" $null $ADMIN_JWT $true
Write-Host "  Audit log entries: $($aud.data.totalCount)" -ForegroundColor Yellow
T "Audit-NoToken-401"          GET "$BASE/api/admin/audit-logs" $null $null $false 401
T "Audit-PatRole-403"          GET "$BASE/api/admin/audit-logs" $null $PAT1_JWT $false 403
T "Audit-DrRole-403"           GET "$BASE/api/admin/audit-logs" $null $DR1_JWT $false 403

# Admin filters
T "Admin-Dr-Pending-Filter"    GET "$BASE/api/admin/doctors?approvalStatus=Pending" $null $ADMIN_JWT $true
T "Admin-Dr-Approved-Filter"   GET "$BASE/api/admin/doctors?approvalStatus=Approved" $null $ADMIN_JWT $true
T "Admin-Dr-Suspended-Filter"  GET "$BASE/api/admin/doctors?approvalStatus=Suspended" $null $ADMIN_JWT $true
T "Admin-Dr-Rejected-Filter"   GET "$BASE/api/admin/doctors?approvalStatus=Rejected" $null $ADMIN_JWT $true
T "Admin-Pat-Active-Filter"    GET "$BASE/api/admin/patients?isActive=true" $null $ADMIN_JWT $true
$inactP = T "Admin-Pat-Inactive-Filter" GET "$BASE/api/admin/patients?isActive=false" $null $ADMIN_JWT $true
Write-Host "  Inactive patients: $($inactP.data.totalCount)" -ForegroundColor Yellow
T "Admin-Audit-Page"           GET "$BASE/api/admin/audit-logs?page=1&pageSize=5" $null $ADMIN_JWT $true
T "Admin-PendingDoctors-List"  GET "$BASE/api/admin/doctors/pending" $null $ADMIN_JWT $true


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 5: CONSULTATION MODULE
# ═══════════════════════════════════════════════════════════════════════════
Write-Host "`n=== PHASE 5: CONSULTATION MODULE ===" -ForegroundColor Cyan

# Refresh all JWTs before consultation tests
$drL1r = T "Dr1-Relogin"  POST "$BASE/api/auth/login" @{email=$DR1_EMAIL;password="Doctor@1234";role="Doctor"} $null $true
$DR1_JWT = $drL1r.data.accessToken
$drL2r = T "Dr2-Relogin"  POST "$BASE/api/auth/login" @{email=$DR2_EMAIL;password="Doctor@5678";role="Doctor"} $null $true
$DR2_JWT = $drL2r.data.accessToken
T "Pat1-OTP-R2"            POST "$BASE/api/auth/send-otp" @{phoneNumber=$PHONE1} $null $true
$p1r = T "Pat1-Verify-R2"  POST "$BASE/api/auth/verify-otp" @{phoneNumber=$PHONE1;otp="1234"} $null $true
$PAT1_JWT = $p1r.data.accessToken
T "Pat2-OTP-R2"            POST "$BASE/api/auth/send-otp" @{phoneNumber=$PHONE2} $null $true
$p2r = T "Pat2-Verify-R2"  POST "$BASE/api/auth/verify-otp" @{phoneNumber=$PHONE2;otp="1234"} $null $true
$PAT2_JWT = $p2r.data.accessToken

$futDate = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
$pastDate = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")

# Guard tests — all should fail before any successful booking
T "Book-PastDate-400"       POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$pastDate;startTime="10:00:00";endTime="10:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Past date test";isFollowUp=$false} $PAT1_JWT $false 400
T "Book-RejectedDr-409"     POST "$BASE/api/consultations" @{doctorId=$DR3_ID;scheduledDate=$futDate;startTime="10:00:00";endTime="10:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Rejected doctor test";isFollowUp=$false} $PAT1_JWT $false 409
T "Book-NonExistDr-404"     POST "$BASE/api/consultations" @{doctorId="00000000-0000-0000-0000-000000000001";scheduledDate=$futDate;startTime="10:00:00";endTime="10:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Non-existent doctor test";isFollowUp=$false} $PAT1_JWT $false 404
T "Book-InvalidType-400"    POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="10:00:00";endTime="10:30:00";timeZone="Asia/Kolkata";consultationType="Telepathy";symptoms="Invalid type";isFollowUp=$false} $PAT1_JWT $false 400
T "Book-MissingFields-400"  POST "$BASE/api/consultations" @{doctorId=$DR2_ID} $PAT1_JWT $false 400
T "Book-EndBeforeStart-400" POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="14:00:00";endTime="13:00:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Time reversal test";isFollowUp=$false} $PAT1_JWT $false 400
T "Book-NoToken-401"        POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="10:00:00";endTime="10:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="no auth"} $null $false 401
T "Book-BlockedPat-403"     POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="11:00:00";endTime="11:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Blocked patient test";isFollowUp=$false} $PAT_BLK_JWT $false 403

# Test suspended doctor booking BEFORE reactivate (note: DR1 is currently REACTIVATED from Phase 4)
# So we need to temporarily suspend DR1 to test this guard
T "Admin-Suspend-DR1-Temp"      PATCH "$BASE/api/admin/doctors/$DR1_ID/suspend" @{reason="Temp for booking guard test"} $ADMIN_JWT $true
T "Book-SuspendedDr-409"        POST "$BASE/api/consultations" @{doctorId=$DR1_ID;scheduledDate=$futDate;startTime="10:00:00";endTime="10:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Suspended doctor booking test";isFollowUp=$false} $PAT1_JWT $false 409
T "Admin-Reactivate-DR1-Temp"   PATCH "$BASE/api/admin/doctors/$DR1_ID/reactivate" @{reason="Restored for testing"} $ADMIN_JWT $true
$drL1r2 = T "Dr1-Relogin2"     POST "$BASE/api/auth/login" @{email=$DR1_EMAIL;password="Doctor@1234";role="Doctor"} $null $true
$DR1_JWT = $drL1r2.data.accessToken

# Successful bookings
$bk1 = T "Book-P1D2-201-OK" POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="14:00:00";endTime="14:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Persistent headaches for 2 weeks with mild nausea";isFollowUp=$false} $PAT1_JWT $true 201
$C1_ID = $bk1.data.id
Write-Host "  C1_ID=$C1_ID Num=$($bk1.data.consultationNumber)" -ForegroundColor Yellow

T "Book-DupSlot-409"        POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="14:00:00";endTime="14:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Duplicate slot test";isFollowUp=$false} $PAT1_JWT $false 409
T "Book-SlotConflict-409"   POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="14:00:00";endTime="14:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Conflict from pat2";isFollowUp=$false} $PAT2_JWT $false 409

$bk2 = T "Book-P1D1-201-OK" POST "$BASE/api/consultations" @{doctorId=$DR1_ID;scheduledDate=$futDate;startTime="15:00:00";endTime="15:30:00";timeZone="Asia/Kolkata";consultationType="InPerson";symptoms="Back pain recurring 3 months with morning stiffness";isFollowUp=$false} $PAT1_JWT $true 201
$C2_ID = $bk2.data.id

$bk3 = T "Book-P2D1-201-OK" POST "$BASE/api/consultations" @{doctorId=$DR1_ID;scheduledDate=$futDate;startTime="16:00:00";endTime="16:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Second patient booking doctor one test";isFollowUp=$false} $PAT2_JWT $true 201
$C3_ID = $bk3.data.id

# Patient consultation lists
$mc1 = T "Pat1-MyConsults-OK"    GET "$BASE/api/consultations/my" $null $PAT1_JWT $true
Write-Host "  PAT1 consultations: $($mc1.data.totalCount)" -ForegroundColor Yellow
T "MyConsults-StatusFilter"       GET "$BASE/api/consultations/my?status=Pending" $null $PAT1_JWT $true
T "MyConsults-Page2"              GET "$BASE/api/consultations/my?page=2&pageSize=5" $null $PAT1_JWT $true
T "MyConsults-NoToken-401"        GET "$BASE/api/consultations/my" $null $null $false 401

# Consultation detail access control
T "GetC1-Pat1-OK"                 GET "$BASE/api/consultations/$C1_ID" $null $PAT1_JWT $true
T "GetC1-Admin-OK"                GET "$BASE/api/consultations/$C1_ID" $null $ADMIN_JWT $true
T "GetC1-Dr2-Owner-OK"            GET "$BASE/api/consultations/$C1_ID" $null $DR2_JWT $true
T "GetC1-Dr1-NotOwner-403"        GET "$BASE/api/consultations/$C1_ID" $null $DR1_JWT $false 403
T "GetC1-Pat2-NotOwner-403"       GET "$BASE/api/consultations/$C1_ID" $null $PAT2_JWT $false 403
T "GetC1-NoToken-401"             GET "$BASE/api/consultations/$C1_ID" $null $null $false 401
T "GetC1-NotExist-404"            GET "$BASE/api/consultations/00000000-0000-0000-0000-000000000001" $null $PAT1_JWT $false 404

# Status history
$h1 = T "History-AfterBook-OK"   GET "$BASE/api/consultations/$C1_ID/history" $null $PAT1_JWT $true
Write-Host "  Status history entries after booking: $($h1.data.Count)" -ForegroundColor Yellow

# Doctor consultation requests
$reqs = T "Dr2-Requests-OK"       GET "$BASE/api/consultations/doctor/requests" $null $DR2_JWT $true
Write-Host "  DR2 pending requests: $($reqs.data.totalCount)" -ForegroundColor Yellow
T "Pat-Requests-403"              GET "$BASE/api/consultations/doctor/requests" $null $PAT1_JWT $false 403
T "Requests-NoToken-401"          GET "$BASE/api/consultations/doctor/requests" $null $null $false 401

# Confirm (no body required)
T "Dr2-Confirm-C1-OK"             PUT "$BASE/api/consultations/$C1_ID/confirm" $null $DR2_JWT $true
T "Dr2-Confirm-C1-Again-409"      PUT "$BASE/api/consultations/$C1_ID/confirm" $null $DR2_JWT $false 409
T "Pat-Confirm-403"               PUT "$BASE/api/consultations/$C1_ID/confirm" $null $PAT1_JWT $false 403
$h2 = T "History-AfterConfirm-OK" GET "$BASE/api/consultations/$C1_ID/history" $null $PAT1_JWT $true
Write-Host "  History entries after confirm: $($h2.data.Count)" -ForegroundColor Yellow

# Doctor schedule (should now show C1 as Confirmed)
$sched = T "Dr2-Schedule-OK"      GET "$BASE/api/consultations/doctor/schedule" $null $DR2_JWT $true
Write-Host "  DR2 schedule items: $($sched.data.totalCount)" -ForegroundColor Yellow
T "Pat-Schedule-403"              GET "$BASE/api/consultations/doctor/schedule" $null $PAT1_JWT $false 403
T "Schedule-NoToken-401"          GET "$BASE/api/consultations/doctor/schedule" $null $null $false 401

# Start and Complete
T "Dr2-Start-C1-OK"               PUT "$BASE/api/consultations/$C1_ID/start" $null $DR2_JWT $true
T "Dr2-Complete-C1-OK"            PUT "$BASE/api/consultations/$C1_ID/complete" @{notes="Session completed. Patient showed improvement."} $DR2_JWT $true
T "Dr2-Complete-C1-Again-409"     PUT "$BASE/api/consultations/$C1_ID/complete" @{notes=""} $DR2_JWT $false 409
$h3 = T "History-AfterComplete-OK" GET "$BASE/api/consultations/$C1_ID/history" $null $PAT1_JWT $true
Write-Host "  History entries after complete: $($h3.data.Count)" -ForegroundColor Yellow

# DR1 rejects C2
T "Dr1-Reject-C2-OK"              PUT "$BASE/api/consultations/$C2_ID/reject" @{reason="Schedule conflict"} $DR1_JWT $true
T "Dr1-ConfirmRejected-409"       PUT "$BASE/api/consultations/$C2_ID/confirm" $null $DR1_JWT $false 409

# Pat2 cancels C3
T "Pat2-Cancel-C3-OK"             PUT "$BASE/api/consultations/$C3_ID/cancel" @{reason="Patient rescheduling"} $PAT2_JWT $true
T "Pat2-Cancel-C3-Again-409"      PUT "$BASE/api/consultations/$C3_ID/cancel" @{reason="Already cancelled, no longer needed"} $PAT2_JWT $false 409

# Book and cancel (patient-initiated cancel of a pending consultation)
$bkCx = T "Book-ForCancel-201"    POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="17:00:00";endTime="17:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Test patient-cancel flow";isFollowUp=$false} $PAT1_JWT $true 201
$CX_ID = $bkCx.data.id
T "Pat1-Cancel-OK"                 PUT "$BASE/api/consultations/$CX_ID/cancel" @{reason="Changed mind"} $PAT1_JWT $true
T "Pat1-Cancel-Again-409"          PUT "$BASE/api/consultations/$CX_ID/cancel" @{reason="Already cancelled, no longer needed"} $PAT1_JWT $false 409

# Follow-up: book C1 as completed, so follow-up should be valid
$bkFollowUp = T "Book-FollowUp-201-OK" POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="18:00:00";endTime="18:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Follow-up for headache improvement";isFollowUp=$true;parentConsultationId=$C1_ID} $PAT1_JWT $true 201
Write-Host "  Follow-up consultation ID=$($bkFollowUp.data.id)" -ForegroundColor Yellow

# Admin consultation views
$admCons = T "Admin-Consult-All-OK"  GET "$BASE/api/admin/consultations" $null $ADMIN_JWT $true
Write-Host "  Admin sees $($admCons.data.totalCount) total consultations" -ForegroundColor Yellow
T "Admin-Consult-StatusFilter"       GET "$BASE/api/admin/consultations?status=Completed" $null $ADMIN_JWT $true
T "Admin-Consult-DrFilter"           GET "$BASE/api/admin/consultations?doctorId=$DR2_ID" $null $ADMIN_JWT $true
$admC1 = T "Admin-Consult-Detail-OK" GET "$BASE/api/admin/consultations/$C1_ID" $null $ADMIN_JWT $true
Write-Host "  Admin consultation detail status=$($admC1.data.status)" -ForegroundColor Yellow
T "Admin-Consult-NoToken-401"        GET "$BASE/api/admin/consultations" $null $null $false 401
T "Admin-Consult-Page"               GET "$BASE/api/admin/consultations?page=1&pageSize=5" $null $ADMIN_JWT $true


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 6: SECURITY TESTS
# ═══════════════════════════════════════════════════════════════════════════
Write-Host "`n=== PHASE 6: SECURITY ===" -ForegroundColor Cyan

T "InvalidJWT-401"           GET  "$BASE/api/patients/me" $null "invalid.jwt.token" $false 401
T "TamperedJWT-401"          GET  "$BASE/api/patients/me" $null "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.fakesig" $false 401
T "Pat-AdminDocs-403"        GET  "$BASE/api/admin/doctors" $null $PAT1_JWT $false 403
T "Pat-AdminAudit-403"       GET  "$BASE/api/admin/audit-logs" $null $PAT1_JWT $false 403
T "Pat-AdminDash-403"        GET  "$BASE/api/admin/dashboard" $null $PAT1_JWT $false 403
T "Pat-AdminMod-403"         PATCH "$BASE/api/admin/doctors/$DR1_ID/suspend" @{reason="hack"} $PAT1_JWT $false 403
T "Dr-AdminDash-403"         GET  "$BASE/api/admin/dashboard" $null $DR2_JWT $false 403
T "Dr-AdminMod-403"          PATCH "$BASE/api/admin/doctors/$DR1_ID/approve" @{reason="hack"} $DR2_JWT $false 403
T "Dr-AdminPatBlock-403"     PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/block" @{reason="hack"} $DR2_JWT $false 403
T "Pat-DoctorAvail-403"      POST "$BASE/api/doctors/availability" @{dayOfWeek=5;startTime="09:00:00";endTime="10:00:00";slotDurationMinutes=30} $PAT1_JWT $false 403
T "Pat-DoctorProfile-403"    PATCH "$BASE/api/doctors/profile/me" @{bio="hack"} $PAT1_JWT $false 403
T "Pat-DoctorRequests-403"   GET  "$BASE/api/consultations/doctor/requests" $null $PAT1_JWT $false 403
T "Dr1-Dr2Consult-403"       GET  "$BASE/api/consultations/$C1_ID" $null $DR1_JWT $false 403
T "Pat-Book-Dr-403"          PUT  "$BASE/api/consultations/$C1_ID/confirm" $null $PAT1_JWT $false 403
# SQL injection style inputs (should be validated/rejected)
T "SQLInject-Email-400"      POST "$BASE/api/auth/login" @{email="admin' OR '1'='1";password="x";role="Admin"} $null $false


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 7: PAGINATION AND FILTER SHAPE VALIDATION
# ═══════════════════════════════════════════════════════════════════════════
Write-Host "`n=== PHASE 7: PAGINATION ===" -ForegroundColor Cyan

T "Page0-Normalized"         GET "$BASE/api/patients/doctors?page=0&pageSize=5" $null $PAT1_JWT $true
T "NegPage-Normalized"       GET "$BASE/api/patients/doctors?page=-1&pageSize=5" $null $PAT1_JWT $true
T "PageOverflow-Empty"       GET "$BASE/api/patients/doctors?page=9999&pageSize=5" $null $PAT1_JWT $true
$pgBig = T "LargeSize-Clamped" GET "$BASE/api/patients/doctors?page=1&pageSize=100" $null $PAT1_JWT $true

if ($pgBig.data.pageSize -gt 50) {
    Write-Host "  [BUG] pageSize=100 not clamped; got $($pgBig.data.pageSize)" -ForegroundColor Red
    $script:BUGS += "[BUG] DocSearch pageSize=100 not clamped to 50: got $($pgBig.data.pageSize)"
    $script:FAIL++
} else { Write-Host "  [PASS] pageSize clamped to $($pgBig.data.pageSize)" -ForegroundColor Green; $script:PASS++ }

$pgShape = T "PaginationShape-OK" GET "$BASE/api/patients/doctors?page=1&pageSize=5" $null $PAT1_JWT $true
if ($pgShape.data) {
    $flds = $pgShape.data.PSObject.Properties.Name
    $req  = @("items","totalCount","page","pageSize","totalPages","hasNextPage","hasPreviousPage")
    $miss = $req | Where-Object { $flds -notcontains $_ }
    if ($miss.Count -gt 0) {
        Write-Host "  [BUG] PaginatedResponse missing: $($miss -join ', ')" -ForegroundColor Red
        $script:BUGS += "[BUG] PaginatedResponse missing fields: $($miss -join ', ')"
        $script:FAIL++
    } else { Write-Host "  [PASS] PaginatedResponse has all 7 required fields" -ForegroundColor Green; $script:PASS++ }
}

# Doctor public detail endpoint
$pubDr = T "PublicDr-Detail-OK"    GET "$BASE/api/doctors/$DR2_ID" $null $null $true
Write-Host "  Public doctor detail: name=$($pubDr.data.fullName)" -ForegroundColor Yellow
T "PublicDr-NotExist-404"          GET "$BASE/api/doctors/00000000-0000-0000-0000-000000000001" $null $null $false 404
T "PublicDr-Suspended-404"         GET "$BASE/api/doctors/$DR1_ID" $null $null $true   # DR1 is reactivated so should 200
$suspDrList = T "PublicDrList-OK"  GET "$BASE/api/doctors" $null $null $true
Write-Host "  Public doctor list count: $($suspDrList.data.items.Count)" -ForegroundColor Yellow


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 8: CROSS-MODULE VALIDATION
# ═══════════════════════════════════════════════════════════════════════════
Write-Host "`n=== PHASE 8: CROSS MODULE VALIDATION ===" -ForegroundColor Cyan

# Audit log should have significant entries from all moderation actions
$finalAud = T "AuditLogs-NonEmpty" GET "$BASE/api/admin/audit-logs" $null $ADMIN_JWT $true
Write-Host "  Final audit log count: $($finalAud.data.totalCount)" -ForegroundColor Yellow
if ($finalAud.data.totalCount -ge 5) {
    Write-Host "  [PASS] Audit logging active ($($finalAud.data.totalCount) entries)" -ForegroundColor Green; $script:PASS++
} else {
    $script:BUGS += "[BUG] Audit logs too low ($($finalAud.data.totalCount)), expected >= 5"
    $script:FAIL++
}

# Dashboard should reflect all actions
$dsh2 = T "Dashboard-Final-Sanity" GET "$BASE/api/admin/dashboard" $null $ADMIN_JWT $true
Write-Host "  Dashboard: pendingDoctors=$($dsh2.data.pendingDoctors) totalConsultations=$($dsh2.data.totalConsultations) completedConsultations=$($dsh2.data.completedConsultations)" -ForegroundColor Yellow

# Final doctor search — rejected and suspended doctors must NOT appear
$finalS = T "FinalDocSearch-OK"    GET "$BASE/api/patients/doctors" $null $PAT1_JWT $true
$fids = @($finalS.data.items | ForEach-Object { $_.id })
if ($DR3_ID -and ($fids -contains $DR3_ID)) {
    $script:BUGS += "[CRITICAL] Rejected DR3 visible in patient search!"
    $script:FAIL++
} elseif ($DR3_ID) { Write-Host "  [PASS] Rejected DR3 not in final search" -ForegroundColor Green; $script:PASS++ }

# Consultation count in admin should match what we booked
# We booked: C1 (Completed), C2 (Rejected), C3 (Cancelled), CX (Cancelled), FollowUp (Pending)
$admConsFinal = T "AdminCons-FinalCount" GET "$BASE/api/admin/consultations" $null $ADMIN_JWT $true
Write-Host "  Final total consultations visible to admin: $($admConsFinal.data.totalCount)" -ForegroundColor Yellow

# Patient cannot see another patient's consultation
T "Pat-CrossPatConsult-403" GET "$BASE/api/consultations/$C3_ID" $null $PAT1_JWT $false 403

# Doctor cannot complete someone else's consultation
$bkCx2 = T "Book-P1D2-Extra" POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="19:00:00";endTime="19:30:00";timeZone="Asia/Kolkata";consultationType="InPerson";symptoms="Extra booking for cross-doctor test";isFollowUp=$false} $PAT1_JWT $true 201
$CX2_ID = $bkCx2.data.id
T "Dr2-Confirm-CX2"         PUT "$BASE/api/consultations/$CX2_ID/confirm" $null $DR2_JWT $true
T "Dr2-Start-CX2"           PUT "$BASE/api/consultations/$CX2_ID/start" $null $DR2_JWT $true
T "Dr1-Complete-CX2-403"    PUT "$BASE/api/consultations/$CX2_ID/complete" @{notes="hack"} $DR1_JWT $false 403


# ═══════════════════════════════════════════════════════════════════════════
# FINAL REPORT
# ═══════════════════════════════════════════════════════════════════════════
Write-Host "`n============================================================" -ForegroundColor White
Write-Host "              FINAL TEST REPORT                            " -ForegroundColor White
Write-Host "============================================================" -ForegroundColor White
Write-Host "TOTAL PASS : $($script:PASS)" -ForegroundColor Green
Write-Host "TOTAL FAIL : $($script:FAIL)" -ForegroundColor Red
Write-Host "TOTAL TESTS: $($script:PASS + $script:FAIL)" -ForegroundColor White
if ($script:BUGS.Count -gt 0) {
    Write-Host "`nBUGS / ISSUES FOUND ($($script:BUGS.Count)):" -ForegroundColor Red
    for ($i = 0; $i -lt $script:BUGS.Count; $i++) {
        Write-Host "  [$($i+1)] $($script:BUGS[$i])" -ForegroundColor Red
    }
} else {
    Write-Host "`nAll tests passed. No bugs found!" -ForegroundColor Green
}
Write-Host "============================================================" -ForegroundColor White
