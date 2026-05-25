param()
$BASE  = "http://localhost:5053"
$script:PASS = 0
$script:FAIL = 0
$script:BUGS = @()

function T {
    param([string]$Tag,[string]$Method,[string]$Url,$Body,$Token,$ExpectOk,$ExpectStatus)
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    try {
        $json = if ($Body) { $Body | ConvertTo-Json -Depth 10 } else { $null }
        if ($json) { $resp = Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -Body $json -ErrorAction Stop }
        else        { $resp = Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -ErrorAction Stop }
        $status = 200; $ok = $true; $bodyObj = $resp
    } catch {
        $status = [int]$_.Exception.Response.StatusCode
        $raw    = $_.ErrorDetails.Message
        $ok     = $false
        try { $bodyObj = $raw | ConvertFrom-Json } catch { $bodyObj = @{ message = "$($_.Exception.Message)" } }
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
        $script:BUGS += "[$Tag] $Method $Url | Expect:OK=$ExpectOk/Status=$ExpectStatus | Got:OK=$ok/Status=$status | $compact"
    }
    return $bodyObj
}

Write-Host "=== PHASE 1: AUTH MODULE ===" -ForegroundColor Cyan

$aLogin = T "Admin-Login-OK" POST "$BASE/api/auth/login" @{email="admin@pdc.com";password="Admin@123";role="Admin"} $null $true
$ADMIN_JWT = $aLogin.data.accessToken

T "Admin-WrongPwd-401"    POST "$BASE/api/auth/login" @{email="admin@pdc.com";password="WrongPass!";role="Admin"} $null $false 401
T "Admin-WrongRole"       POST "$BASE/api/auth/login" @{email="admin@pdc.com";password="Admin@123";role="Patient"} $null $false
T "Admin-BadEmail-401"    POST "$BASE/api/auth/login" @{email="nobody@pdc.com";password="Admin@123";role="Admin"} $null $false 401
T "NoToken-Admin-401"     GET  "$BASE/api/admin/dashboard" $null $null $false 401

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$dr1Body = @{fullName="Dr Alpha Sharma";email="doctor.alpha.$ts@test.com";password="Doctor@1234"
    phoneNumber="+919010$($ts.ToString().Substring(5,5))";specialization="Cardiologist"
    licenseNumber="LIC-A-$ts";qualification="MBBS, MD";experienceYears=8
    bio="Experienced cardiologist";city="Mumbai";consultationFee=800}
$dr1Reg = T "Dr1-Register-OK" POST "$BASE/api/auth/register/doctor" $dr1Body $null $true
$DR1_EMAIL = $dr1Body.email

T "Dr1-DupEmail-409"      POST "$BASE/api/auth/register/doctor" $dr1Body $null $false 409
$dupLicBody = @{fullName="Dup";email="dup.$ts@test.com";password="Doctor@1234"
    phoneNumber="+919011$($ts.ToString().Substring(5,5))";specialization="Cardio"
    licenseNumber="LIC-A-$ts";qualification="MBBS";experienceYears=1;bio="dup";city="X";consultationFee=100}
T "Dr1-DupLicense-409"    POST "$BASE/api/auth/register/doctor" $dupLicBody $null $false 409
T "Dr-MissingFields-400"  POST "$BASE/api/auth/register/doctor" @{email="x@x.com"} $null $false 400

$dr2Body = @{fullName="Dr Beta Iyer";email="doctor.beta.$ts@test.com";password="Doctor@5678"
    phoneNumber="+919012$($ts.ToString().Substring(5,5))";specialization="Neurologist"
    licenseNumber="LIC-B-$ts";qualification="MBBS, DM";experienceYears=5
    bio="Neurology specialist";city="Delhi";consultationFee=1000}
$dr2Reg = T "Dr2-Register-OK" POST "$BASE/api/auth/register/doctor" $dr2Body $null $true
$DR2_EMAIL = $dr2Body.email

$dr3Body = @{fullName="Dr Gamma Singh";email="doctor.gamma.$ts@test.com";password="Doctor@9999"
    phoneNumber="+919013$($ts.ToString().Substring(5,5))";specialization="Dermatologist"
    licenseNumber="LIC-G-$ts";qualification="MBBS";experienceYears=3
    bio="Skin specialist";city="Bangalore";consultationFee=600}
T "Dr3-Register-OK"        POST "$BASE/api/auth/register/doctor" $dr3Body $null $true
$DR3_EMAIL = $dr3Body.email

$drL1  = T "Dr1-Login-Pending-OK" POST "$BASE/api/auth/login" @{email=$DR1_EMAIL;password="Doctor@1234";role="Doctor"} $null $true
$DR1_JWT = $drL1.data.accessToken

$PHONE1 = "+919100000011"; $PHONE2 = "+919100000012"; $PHONE_BLK = "+919100000099"
T "Pat1-OTP-Send-OK"       POST "$BASE/api/auth/otp/send" @{phoneNumber=$PHONE1} $null $true
T "OTP-InvalidPhone-400"   POST "$BASE/api/auth/otp/send" @{phoneNumber="123"} $null $false 400
T "OTP-WrongCode-401"      POST "$BASE/api/auth/otp/verify" @{phoneNumber=$PHONE1;otp="9999"} $null $false 401
$p1v = T "Pat1-OTP-Verify-OK"   POST "$BASE/api/auth/otp/verify" @{phoneNumber=$PHONE1;otp="1234"} $null $true
$PAT1_JWT = $p1v.data.accessToken; $PAT1_REFRESH = $p1v.data.refreshToken

T "Pat2-OTP-Send-OK"       POST "$BASE/api/auth/otp/send" @{phoneNumber=$PHONE2} $null $true
$p2v = T "Pat2-OTP-Verify-OK"   POST "$BASE/api/auth/otp/verify" @{phoneNumber=$PHONE2;otp="1234"} $null $true
$PAT2_JWT = $p2v.data.accessToken

T "PatBlk-OTP-Send-OK"     POST "$BASE/api/auth/otp/send" @{phoneNumber=$PHONE_BLK} $null $true
$pbv = T "PatBlk-OTP-Verify-OK" POST "$BASE/api/auth/otp/verify" @{phoneNumber=$PHONE_BLK;otp="1234"} $null $true
$PAT_BLK_JWT = $pbv.data.accessToken; $PAT_BLK_USERID = $pbv.data.user.id

$rtR = T "Refresh-Token-OK"     POST "$BASE/api/auth/refresh" @{refreshToken=$PAT1_REFRESH} $null $true
T "Refresh-Invalid-401"         POST "$BASE/api/auth/refresh" @{refreshToken="totally-invalid-token"} $null $false 401
if ($rtR.data.accessToken) { $PAT1_JWT = $rtR.data.accessToken }

Write-Host "=== PHASE 2: PATIENT MODULE ===" -ForegroundColor Cyan

$profBody = @{gender="Male";dateOfBirth="1995-06-15";bloodGroup="O+";heightCm=175;weightKg=72
    allergies="None";chronicDiseases="None";emergencyContactName="Mom"
    emergencyContactPhone="+919000000001";address="123 MG Road";city="Mumbai"
    state="Maharashtra";country="India"}
T "Pat1-CreateProfile-OK"  POST "$BASE/api/patients/profile" $profBody $PAT1_JWT $true
T "Pat1-GetProfile-OK"     GET  "$BASE/api/patients/profile" $null $PAT1_JWT $true
T "Pat1-DupProfile-409"    POST "$BASE/api/patients/profile" $profBody $PAT1_JWT $false 409
T "Pat-NoToken-401"        GET  "$BASE/api/patients/profile" $null $null $false 401
T "Dr-PatProfile-403"      GET  "$BASE/api/patients/profile" $null $DR1_JWT $false 403
T "Pat1-Update-OK"         PUT  "$BASE/api/patients/profile" @{city="Pune";weightKg=74} $PAT1_JWT $true

$profBlk = @{gender="Female";dateOfBirth="1990-01-01";bloodGroup="B+";heightCm=160;weightKg=55
    emergencyContactName="Dad";emergencyContactPhone="+919000000099";city="Chennai";state="TN";country="India"}
T "PatBlk-CreateProfile-OK" POST "$BASE/api/patients/profile" $profBlk $PAT_BLK_JWT $true

$p2prof = @{gender="Female";dateOfBirth="1992-03-20";bloodGroup="A+";heightCm=160;weightKg=55
    emergencyContactName="Husband";emergencyContactPhone="+919000000002";city="Delhi";state="Delhi";country="India"}
T "Pat2-CreateProfile-OK"  POST "$BASE/api/patients/profile" $p2prof $PAT2_JWT $true

$s0 = T "DocSearch-PreApproval" GET "$BASE/api/patients/doctors" $null $PAT1_JWT $true
Write-Host "  Doctors visible pre-approval: $($s0.data.items.Count)" -ForegroundColor Yellow

T "DocSearch-CityFilter"   GET "$BASE/api/patients/doctors?city=Mumbai" $null $PAT1_JWT $true
T "DocSearch-SpecFilter"   GET "$BASE/api/patients/doctors?specialization=Cardiologist" $null $PAT1_JWT $true
T "DocSearch-FeeFilter"    GET "$BASE/api/patients/doctors?minFee=500&maxFee=1200" $null $PAT1_JWT $true
T "DocSearch-NoToken-401"  GET "$BASE/api/patients/doctors" $null $null $false 401

Write-Host "=== PHASE 3: DOCTOR MODULE ===" -ForegroundColor Cyan

$dp1 = T "Dr1-GetProfile-OK"   GET "$BASE/api/doctors/profile" $null $DR1_JWT $true
$DR1_PROF_ID = $dp1.data.id
T "Dr1-UpdateProfile-OK"        PUT "$BASE/api/doctors/profile" @{bio="Updated bio";city="Pune";consultationFee=900} $DR1_JWT $true
T "Pat-DrProfile-403"           GET "$BASE/api/doctors/profile" $null $PAT1_JWT $false 403
T "DrProfile-NoToken-401"       GET "$BASE/api/doctors/profile" $null $null $false 401

$av1 = @{dayOfWeek="Monday";startTime="09:00:00";endTime="10:00:00";slotDurationMinutes=30;isAvailable=$true}
$avR = T "Dr1-AddAvail-OK"      POST "$BASE/api/doctors/availability" $av1 $DR1_JWT $true
$AVAIL_ID = $avR.data.id
$av2Ov = @{dayOfWeek="Monday";startTime="09:30:00";endTime="10:30:00";slotDurationMinutes=30;isAvailable=$true}
T "Dr1-OverlapAvail-409"        POST "$BASE/api/doctors/availability" $av2Ov $DR1_JWT $false 409
$av3 = @{dayOfWeek="Wednesday";startTime="14:00:00";endTime="16:00:00";slotDurationMinutes=30;isAvailable=$true}
T "Dr1-AddAvail2-OK"            POST "$BASE/api/doctors/availability" $av3 $DR1_JWT $true
T "Dr1-GetAvail-OK"             GET  "$BASE/api/doctors/availability" $null $DR1_JWT $true
T "Pat-AddAvail-403"            POST "$BASE/api/doctors/availability" $av1 $PAT1_JWT $false 403

Write-Host "=== PHASE 4: ADMIN MODULE ===" -ForegroundColor Cyan

$dash = T "Admin-Dashboard-OK"  GET "$BASE/api/admin/dashboard" $null $ADMIN_JWT $true
Write-Host "  pendingDoctors=$($dash.data.pendingDoctors) totalDoctors=$($dash.data.totalDoctors) totalPatients=$($dash.data.totalPatients)" -ForegroundColor Yellow
T "Admin-Dash-NoToken-401"  GET "$BASE/api/admin/dashboard" $null $null $false 401
T "Admin-Dash-Pat-403"      GET "$BASE/api/admin/dashboard" $null $PAT1_JWT $false 403
T "Admin-Dash-Dr-403"       GET "$BASE/api/admin/dashboard" $null $DR1_JWT $false 403

$dList = T "Admin-ListDoctors-OK" GET "$BASE/api/admin/doctors" $null $ADMIN_JWT $true
Write-Host "  Admin sees $($dList.data.totalCount) total doctors" -ForegroundColor Yellow
$DR1_ID = ($dList.data.items | Where-Object { $_.email -eq $DR1_EMAIL } | Select-Object -First 1).id
$DR2_ID = ($dList.data.items | Where-Object { $_.email -eq $DR2_EMAIL } | Select-Object -First 1).id
$DR3_ID = ($dList.data.items | Where-Object { $_.email -eq $DR3_EMAIL } | Select-Object -First 1).id
Write-Host "  DR1_ID=$DR1_ID | DR2_ID=$DR2_ID | DR3_ID=$DR3_ID" -ForegroundColor Yellow

T "Admin-RejectNoReason-400"     PATCH "$BASE/api/admin/doctors/$DR1_ID/reject" @{reason=""} $ADMIN_JWT $false 400
T "Admin-SuspendPending-409"     PATCH "$BASE/api/admin/doctors/$DR1_ID/suspend" @{reason="test"} $ADMIN_JWT $false 409
T "Admin-Approve-NotExist-404"   PATCH "$BASE/api/admin/doctors/00000000-0000-0000-0000-000000000001/approve" @{reason="test"} $ADMIN_JWT $false 404

$appr1 = T "Admin-Approve-DR1-OK"   PATCH "$BASE/api/admin/doctors/$DR1_ID/approve" @{reason="Verified"} $ADMIN_JWT $true
Write-Host "  DR1 after approve: status=$($appr1.data.approvalStatus) visible=$($appr1.data.isPubliclyVisible)" -ForegroundColor Yellow
T "Admin-Approve-DR2-OK"             PATCH "$BASE/api/admin/doctors/$DR2_ID/approve" @{reason="Verified"} $ADMIN_JWT $true
T "Admin-DoubleApprove-409"          PATCH "$BASE/api/admin/doctors/$DR1_ID/approve" @{reason="again"} $ADMIN_JWT $false 409

T "Admin-Reject-DR3-OK"             PATCH "$BASE/api/admin/doctors/$DR3_ID/reject" @{reason="Incomplete"} $ADMIN_JWT $true
T "Admin-RejectApproved-409"        PATCH "$BASE/api/admin/doctors/$DR1_ID/reject" @{reason="test"} $ADMIN_JWT $false 409

$s1 = T "DocSearch-AfterApproval"   GET "$BASE/api/patients/doctors" $null $PAT1_JWT $true
Write-Host "  Doctors visible after approval: $($s1.data.items.Count)" -ForegroundColor Yellow

$susp1 = T "Admin-Suspend-DR1-OK"   PATCH "$BASE/api/admin/doctors/$DR1_ID/suspend" @{reason="Complaints"} $ADMIN_JWT $true
Write-Host "  DR1 after suspend: status=$($susp1.data.approvalStatus) visible=$($susp1.data.isPubliclyVisible)" -ForegroundColor Yellow
T "Admin-DoubleSuspend-409"          PATCH "$BASE/api/admin/doctors/$DR1_ID/suspend" @{reason="again"} $ADMIN_JWT $false 409
T "Admin-ApproveWhileSusp-409"       PATCH "$BASE/api/admin/doctors/$DR1_ID/approve" @{reason="test"} $ADMIN_JWT $false 409

$s2 = T "DocSearch-SuspendHidden"   GET "$BASE/api/patients/doctors" $null $PAT1_JWT $true
$visIds = $s2.data.items | ForEach-Object { $_.id }
if ($DR1_ID -and ($visIds -contains $DR1_ID)) {
    Write-Host "  [BUG] Suspended DR1 STILL visible in search!" -ForegroundColor Red
    $script:BUGS += "[CRITICAL] Suspended doctor DR1 ($DR1_ID) visible in patient search after suspension!"
    $script:FAIL++
} else { Write-Host "  [PASS] Suspended DR1 correctly hidden" -ForegroundColor Green; $script:PASS++ }

if ($DR3_ID -and ($visIds -contains $DR3_ID)) {
    Write-Host "  [BUG] Rejected DR3 STILL visible in search!" -ForegroundColor Red
    $script:BUGS += "[CRITICAL] Rejected doctor DR3 ($DR3_ID) visible in patient search!"
    $script:FAIL++
} else { Write-Host "  [PASS] Rejected DR3 correctly hidden" -ForegroundColor Green; $script:PASS++ }

$sdL = T "SuspendedDr-Login-OK"     POST "$BASE/api/auth/login" @{email=$DR1_EMAIL;password="Doctor@1234";role="Doctor"} $null $true

T "Admin-Reactivate-DR1-OK"         PATCH "$BASE/api/admin/doctors/$DR1_ID/reactivate" @{reason="Cleared"} $ADMIN_JWT $true
T "Admin-ReactNonSusp-409"          PATCH "$BASE/api/admin/doctors/$DR2_ID/reactivate" @{reason="test"} $ADMIN_JWT $false 409

$pList = T "Admin-ListPatients-OK"  GET "$BASE/api/admin/patients" $null $ADMIN_JWT $true
Write-Host "  Total patients: $($pList.data.totalCount)" -ForegroundColor Yellow
if (-not $PAT_BLK_USERID) {
    $blkUser = $pList.data.items | Where-Object { $_.phoneNumber -eq $PHONE_BLK } | Select-Object -First 1
    $PAT_BLK_USERID = $blkUser.id
}
Write-Host "  PatBlk UserId=$PAT_BLK_USERID" -ForegroundColor Yellow

T "Admin-BlockPat-OK"               PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/block" @{reason="Spamming"} $ADMIN_JWT $true
T "Admin-BlockPat-Double-409"       PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/block" @{reason="again"} $ADMIN_JWT $false 409
T "BlkPat-OTP-Send-OK"              POST "$BASE/api/auth/otp/send" @{phoneNumber=$PHONE_BLK} $null $true
T "BlkPat-OTP-Verify-401"           POST "$BASE/api/auth/otp/verify" @{phoneNumber=$PHONE_BLK;otp="1234"} $null $false 401
T "BlkPat-StaleJWT-401"             GET  "$BASE/api/patients/profile" $null $PAT_BLK_JWT $false 401
T "Admin-UnblockPat-OK"             PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/unblock" @{reason="Appeal"} $ADMIN_JWT $true
T "Admin-UnblockPat-Double-409"     PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/unblock" @{reason="again"} $ADMIN_JWT $false 409
T "Admin-BlockPat-Again"            PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/block" @{reason="Re-block for test"} $ADMIN_JWT $true

$aud = T "Admin-AuditLogs-OK"       GET "$BASE/api/admin/audit-logs" $null $ADMIN_JWT $true
Write-Host "  Audit log entries: $($aud.data.totalCount)" -ForegroundColor Yellow
T "Audit-DocFilter"                  GET "$BASE/api/admin/audit-logs?entityType=Doctor" $null $ADMIN_JWT $true
T "Audit-PatFilter"                  GET "$BASE/api/admin/audit-logs?entityType=Patient" $null $ADMIN_JWT $true
T "Audit-NoToken-401"                GET "$BASE/api/admin/audit-logs" $null $null $false 401
T "Audit-PatRole-403"                GET "$BASE/api/admin/audit-logs" $null $PAT1_JWT $false 403

Write-Host "=== PHASE 5: CONSULTATION MODULE ===" -ForegroundColor Cyan

$drL1r = T "Dr1-Relogin"            POST "$BASE/api/auth/login" @{email=$DR1_EMAIL;password="Doctor@1234";role="Doctor"} $null $true
$DR1_JWT = $drL1r.data.accessToken
$drL2  = T "Dr2-Login"              POST "$BASE/api/auth/login" @{email=$DR2_EMAIL;password="Doctor@5678";role="Doctor"} $null $true
$DR2_JWT = $drL2.data.accessToken

T "Pat1-OTP-Send-R2"                POST "$BASE/api/auth/otp/send" @{phoneNumber=$PHONE1} $null $true
$p1r = T "Pat1-OTP-Verify-R2"       POST "$BASE/api/auth/otp/verify" @{phoneNumber=$PHONE1;otp="1234"} $null $true
$PAT1_JWT = $p1r.data.accessToken

$futDate = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
$pastDate = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")

T "Book-PastDate-400"               POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$pastDate;startTime="10:00:00";endTime="10:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Past date booking test";isFollowUp=$false} $PAT1_JWT $false 400
T "Book-RejectedDr-409"             POST "$BASE/api/consultations" @{doctorId=$DR3_ID;scheduledDate=$futDate;startTime="10:00:00";endTime="10:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Rejected doctor booking attempt";isFollowUp=$false} $PAT1_JWT $false 409

T "Admin-Suspend-DR1-Temp"          PATCH "$BASE/api/admin/doctors/$DR1_ID/suspend" @{reason="Temp for booking test"} $ADMIN_JWT $true
T "Book-SuspendedDr-409"            POST "$BASE/api/consultations" @{doctorId=$DR1_ID;scheduledDate=$futDate;startTime="10:00:00";endTime="10:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Suspended doctor booking test";isFollowUp=$false} $PAT1_JWT $false 409
T "Admin-Reactivate-DR1-Temp"       PATCH "$BASE/api/admin/doctors/$DR1_ID/reactivate" @{reason="Done"} $ADMIN_JWT $true
$drL1r2 = T "Dr1-Relogin2"         POST "$BASE/api/auth/login" @{email=$DR1_EMAIL;password="Doctor@1234";role="Doctor"} $null $true
$DR1_JWT = $drL1r2.data.accessToken

T "Book-BlockedPat-403"             POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="11:00:00";endTime="11:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Blocked patient booking test";isFollowUp=$false} $PAT_BLK_JWT $false 403
T "Book-InvalidType-400"            POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="11:00:00";endTime="11:30:00";timeZone="Asia/Kolkata";consultationType="Telepathy";symptoms="Invalid consultation type test";isFollowUp=$false} $PAT1_JWT $false 400
T "Book-MissingFields-400"          POST "$BASE/api/consultations" @{doctorId=$DR2_ID} $PAT1_JWT $false 400
T "Book-NonExistDr-404"             POST "$BASE/api/consultations" @{doctorId="00000000-0000-0000-0000-000000000001";scheduledDate=$futDate;startTime="11:00:00";endTime="11:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Non-existent doctor test";isFollowUp=$false} $PAT1_JWT $false 404
T "Book-EndBeforeStart-400"         POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="14:00:00";endTime="13:00:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="End before start timing test";isFollowUp=$false} $PAT1_JWT $false 400

$bk1 = T "Book-P1D2-201-OK"         POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="14:00:00";endTime="14:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Persistent headaches for 2 weeks with mild nausea";isFollowUp=$false} $PAT1_JWT $true 201
$C1_ID = $bk1.data.id
Write-Host "  C1_ID=$C1_ID Num=$($bk1.data.consultationNumber)" -ForegroundColor Yellow

T "Book-DupSlot-409"                POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="14:00:00";endTime="14:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Duplicate booking attempt";isFollowUp=$false} $PAT1_JWT $false 409
T "Book-SlotConflict-409"           POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="14:00:00";endTime="14:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Slot conflict from pat2";isFollowUp=$false} $PAT2_JWT $false 409

$bk2 = T "Book-P1D1-201-OK"         POST "$BASE/api/consultations" @{doctorId=$DR1_ID;scheduledDate=$futDate;startTime="15:00:00";endTime="15:30:00";timeZone="Asia/Kolkata";consultationType="InPerson";symptoms="Back pain recurring for 3 months with morning stiffness";isFollowUp=$false} $PAT1_JWT $true 201
$C2_ID = $bk2.data.id

$bk3 = T "Book-P2D1-201-OK"         POST "$BASE/api/consultations" @{doctorId=$DR1_ID;scheduledDate=$futDate;startTime="16:00:00";endTime="16:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Second patient booking with doctor one test";isFollowUp=$false} $PAT2_JWT $true 201
$C3_ID = $bk3.data.id

$mc1 = T "Pat1-MyConsults-OK"        GET "$BASE/api/consultations/my" $null $PAT1_JWT $true
Write-Host "  PAT1 consultations: $($mc1.data.totalCount)" -ForegroundColor Yellow
T "MyConsults-Page2"                  GET "$BASE/api/consultations/my?page=2&pageSize=5" $null $PAT1_JWT $true
T "MyConsults-StatusFilter"           GET "$BASE/api/consultations/my?status=Pending" $null $PAT1_JWT $true
T "MyConsults-NoToken-401"            GET "$BASE/api/consultations/my" $null $null $false 401

T "GetC1-Pat1-OK"                     GET "$BASE/api/consultations/$C1_ID" $null $PAT1_JWT $true
T "GetC1-Admin-OK"                    GET "$BASE/api/consultations/$C1_ID" $null $ADMIN_JWT $true
T "GetC1-Dr2-Owner-OK"                GET "$BASE/api/consultations/$C1_ID" $null $DR2_JWT $true
T "GetC1-Dr1-NotOwner-403"            GET "$BASE/api/consultations/$C1_ID" $null $DR1_JWT $false 403
T "GetC1-Pat2-NotOwner-403"           GET "$BASE/api/consultations/$C1_ID" $null $PAT2_JWT $false 403
T "GetC1-NoToken-401"                 GET "$BASE/api/consultations/$C1_ID" $null $null $false 401
T "GetC1-NotExist-404"                GET "$BASE/api/consultations/00000000-0000-0000-0000-000000000001" $null $PAT1_JWT $false 404

$h1 = T "History-AfterBook-OK"        GET "$BASE/api/consultations/$C1_ID/history" $null $PAT1_JWT $true
Write-Host "  Status history entries after booking: $($h1.data.Count)" -ForegroundColor Yellow

$reqs = T "Dr2-Requests-OK"           GET "$BASE/api/consultations/requests" $null $DR2_JWT $true
Write-Host "  DR2 pending requests: $($reqs.data.totalCount)" -ForegroundColor Yellow
T "Pat-Requests-403"                   GET "$BASE/api/consultations/requests" $null $PAT1_JWT $false 403

T "Dr2-Confirm-C1-OK"                  PUT "$BASE/api/consultations/$C1_ID/confirm" @{notes="Confirmed"} $DR2_JWT $true
T "Dr2-Confirm-C1-Again-409"           PUT "$BASE/api/consultations/$C1_ID/confirm" @{} $DR2_JWT $false 409
$h2 = T "History-AfterConfirm-OK"     GET "$BASE/api/consultations/$C1_ID/history" $null $PAT1_JWT $true
Write-Host "  History entries after confirm: $($h2.data.Count)" -ForegroundColor Yellow

T "Dr2-Start-C1-OK"                    PUT "$BASE/api/consultations/$C1_ID/start" @{} $DR2_JWT $true
T "Dr2-Complete-C1-OK"                 PUT "$BASE/api/consultations/$C1_ID/complete" @{notes="Good session"} $DR2_JWT $true
T "Dr2-Complete-C1-Again-409"          PUT "$BASE/api/consultations/$C1_ID/complete" @{} $DR2_JWT $false 409
$h3 = T "History-AfterComplete-OK"    GET "$BASE/api/consultations/$C1_ID/history" $null $PAT1_JWT $true
Write-Host "  History entries after complete: $($h3.data.Count)" -ForegroundColor Yellow

T "Dr1-Reject-C2-OK"                   PUT "$BASE/api/consultations/$C2_ID/reject" @{reason="Not available"} $DR1_JWT $true
T "Dr1-ConfirmRejected-409"            PUT "$BASE/api/consultations/$C2_ID/confirm" @{} $DR1_JWT $false 409

T "Pat2-Cancel-C3-OK"                  PUT "$BASE/api/consultations/$C3_ID/cancel" @{reason="Rescheduling"} $PAT2_JWT $true
T "Pat2-Cancel-C3-Again-409"           PUT "$BASE/api/consultations/$C3_ID/cancel" @{} $PAT2_JWT $false 409

$bkCx = T "Book-ForCancel-201"         POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="17:00:00";endTime="17:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Test cancel flow booking patient initiated";isFollowUp=$false} $PAT1_JWT $true 201
$CX_ID = $bkCx.data.id
T "Pat1-Cancel-OK"                      PUT "$BASE/api/consultations/$CX_ID/cancel" @{reason="Changed mind"} $PAT1_JWT $true
T "Pat1-Cancel-Again-409"               PUT "$BASE/api/consultations/$CX_ID/cancel" @{} $PAT1_JWT $false 409

T "Dr2-Schedule-OK"                     GET "$BASE/api/consultations/schedule" $null $DR2_JWT $true
T "Pat-Schedule-403"                    GET "$BASE/api/consultations/schedule" $null $PAT1_JWT $false 403
T "Schedule-NoToken-401"                GET "$BASE/api/consultations/schedule" $null $null $false 401

$admCons = T "Admin-Consult-All-OK"    GET "$BASE/api/admin/consultations" $null $ADMIN_JWT $true
Write-Host "  Admin sees $($admCons.data.totalCount) total consultations" -ForegroundColor Yellow
T "Admin-Consult-StatusFilter"          GET "$BASE/api/admin/consultations?status=Completed" $null $ADMIN_JWT $true
T "Admin-Consult-DrFilter"              GET "$BASE/api/admin/consultations?doctorId=$DR2_ID" $null $ADMIN_JWT $true
T "Admin-Consult-NoToken-401"           GET "$BASE/api/admin/consultations" $null $null $false 401

Write-Host "=== PHASE 6: SECURITY ===" -ForegroundColor Cyan

T "InvalidJWT-401"           GET "$BASE/api/patients/profile" $null "invalid.jwt.token" $false 401
T "TamperedJWT-401"          GET "$BASE/api/patients/profile" $null "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.fakesig" $false 401
T "Pat-AdminDocs-403"        GET "$BASE/api/admin/doctors" $null $PAT1_JWT $false 403
T "Pat-AdminAudit-403"       GET "$BASE/api/admin/audit-logs" $null $PAT1_JWT $false 403
T "Pat-AdminDash-403"        GET "$BASE/api/admin/dashboard" $null $PAT1_JWT $false 403
T "Pat-AdminMod-403"         PATCH "$BASE/api/admin/doctors/$DR1_ID/suspend" @{reason="hack"} $PAT1_JWT $false 403
T "Dr-AdminDash-403"         GET "$BASE/api/admin/dashboard" $null $DR2_JWT $false 403
T "Dr-AdminMod-403"          PATCH "$BASE/api/admin/doctors/$DR1_ID/approve" @{reason="hack"} $DR2_JWT $false 403
T "Dr-AdminPatBlock-403"     PATCH "$BASE/api/admin/patients/$PAT_BLK_USERID/block" @{reason="hack"} $DR2_JWT $false 403
$av1s = @{dayOfWeek="Friday";startTime="09:00:00";endTime="10:00:00";slotDurationMinutes=30;isAvailable=$true}
T "Pat-DoctorAvail-403"      POST "$BASE/api/doctors/availability" $av1s $PAT1_JWT $false 403
T "Pat-DoctorProfile-403"    PUT  "$BASE/api/doctors/profile" @{bio="hack"} $PAT1_JWT $false 403
T "Pat-DoctorRequests-403"   GET  "$BASE/api/consultations/requests" $null $PAT1_JWT $false 403
T "Dr1-Dr2Consult-403"       GET  "$BASE/api/consultations/$C1_ID" $null $DR1_JWT $false 403

Write-Host "=== PHASE 7: PAGINATION AND FILTER ===" -ForegroundColor Cyan

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
$flds = $pgShape.data.PSObject.Properties.Name
$req  = @("items","totalCount","page","pageSize","totalPages","hasNextPage","hasPreviousPage")
$miss = $req | Where-Object { $flds -notcontains $_ }
if ($miss.Count -gt 0) {
    Write-Host "  [BUG] PaginatedResponse missing: $($miss -join ', ')" -ForegroundColor Red
    $script:BUGS += "[BUG] PaginatedResponse missing fields: $($miss -join ', ')"
    $script:FAIL++
} else { Write-Host "  [PASS] PaginatedResponse has all 7 fields" -ForegroundColor Green; $script:PASS++ }

T "Admin-Dr-Approved-Filter" GET "$BASE/api/admin/doctors?approvalStatus=Approved" $null $ADMIN_JWT $true
T "Admin-Dr-Suspended-Filter" GET "$BASE/api/admin/doctors?approvalStatus=Suspended" $null $ADMIN_JWT $true
T "Admin-Dr-Rejected-Filter" GET "$BASE/api/admin/doctors?approvalStatus=Rejected" $null $ADMIN_JWT $true
T "Admin-Pat-Active-Filter"  GET "$BASE/api/admin/patients?isActive=true" $null $ADMIN_JWT $true
T "Admin-Pat-Inactive-Filter" GET "$BASE/api/admin/patients?isActive=false" $null $ADMIN_JWT $true
T "Admin-Audit-Page"         GET "$BASE/api/admin/audit-logs?page=1&pageSize=5" $null $ADMIN_JWT $true
T "Admin-Consult-Page"       GET "$BASE/api/admin/consultations?page=1&pageSize=5" $null $ADMIN_JWT $true

Write-Host "=== PHASE 8: CROSS MODULE VALIDATION ===" -ForegroundColor Cyan

$finalAud = T "AuditLogs-NonEmpty"   GET "$BASE/api/admin/audit-logs" $null $ADMIN_JWT $true
Write-Host "  Final audit log count: $($finalAud.data.totalCount)" -ForegroundColor Yellow
if ($finalAud.data.totalCount -ge 5) { Write-Host "  [PASS] Audit logging active" -ForegroundColor Green; $script:PASS++ }
else { $script:BUGS += "[BUG] Audit logs too low ($($finalAud.data.totalCount))"; $script:FAIL++ }

$dsh2 = T "Dashboard-Final-Sanity"   GET "$BASE/api/admin/dashboard" $null $ADMIN_JWT $true
Write-Host "  Dashboard: pendingDoctors=$($dsh2.data.pendingDoctors) totalConsultations=$($dsh2.data.totalConsultations)" -ForegroundColor Yellow

$finalS = T "FinalDocSearch"         GET "$BASE/api/patients/doctors" $null $PAT1_JWT $true
$fids = $finalS.data.items | ForEach-Object { $_.id }
if ($DR3_ID -and ($fids -contains $DR3_ID)) {
    $script:BUGS += "[CRITICAL] Rejected DR3 visible in patient search!"; $script:FAIL++
} else { Write-Host "  [PASS] No rejected/suspended doctors in final search" -ForegroundColor Green; $script:PASS++ }

# Follow-up booking test
$fu = T "Book-FollowUp-OK"           POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="18:00:00";endTime="18:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Follow-up for completed consultation check";isFollowUp=$true;parentConsultationId=$C1_ID} $PAT1_JWT $true 201

$fuBad = T "Book-FollowUp-BadParent-400" POST "$BASE/api/consultations" @{doctorId=$DR2_ID;scheduledDate=$futDate;startTime="19:00:00";endTime="19:30:00";timeZone="Asia/Kolkata";consultationType="Video";symptoms="Follow-up with non-completed parent";isFollowUp=$true;parentConsultationId=$C2_ID} $PAT1_JWT $false 400

Write-Host "" 
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "                   FINAL TEST REPORT" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "TOTAL PASS : $($script:PASS)" -ForegroundColor Green
Write-Host "TOTAL FAIL : $($script:FAIL)" -ForegroundColor Red
$total = $script:PASS + $script:FAIL
Write-Host "TOTAL TESTS: $total" -ForegroundColor Cyan
Write-Host ""
if ($script:BUGS.Count -gt 0) {
    Write-Host "BUGS / ISSUES FOUND ($($script:BUGS.Count)):" -ForegroundColor Red
    $i = 1
    $script:BUGS | ForEach-Object { Write-Host "  [$i] $_" -ForegroundColor Red; $i++ }
} else {
    Write-Host "NO BUGS FOUND - ALL TESTS PASSED" -ForegroundColor Green
}
