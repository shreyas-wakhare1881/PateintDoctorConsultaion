param()

$ErrorActionPreference = 'Stop'
$BASE = 'http://localhost:5053'

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    $Body,
    [string]$Token
  )

  $headers = @{ 'Content-Type' = 'application/json' }
  if ($Token) { $headers['Authorization'] = "Bearer $Token" }

  try {
    $json = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 12 -Compress } else { $null }
    $args = @{ Method = $Method; Uri = "$BASE$Path"; Headers = $headers; ErrorAction = 'Stop'; UseBasicParsing = $true }
    if ($json) { $args['Body'] = $json }
    $r = Invoke-WebRequest @args
    $parsed = $null
    try { $parsed = $r.Content | ConvertFrom-Json } catch { $parsed = @{ raw = $r.Content } }
    return [pscustomobject]@{ Ok = $true; Status = [int]$r.StatusCode; Body = $parsed }
  }
  catch {
    $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    $raw = $_.ErrorDetails.Message
    $parsed = $null
    if ($raw) {
      try { $parsed = $raw | ConvertFrom-Json } catch { $parsed = @{ raw = $raw } }
    }
    return [pscustomobject]@{ Ok = $false; Status = $status; Body = $parsed }
  }
}

function Assert {
  param(
    [string]$Name,
    [bool]$Condition,
    [string]$Detail
  )

  if ($Condition) {
    Write-Host "[PASS] $Name | $Detail" -ForegroundColor Green
  }
  else {
    Write-Host "[FAIL] $Name | $Detail" -ForegroundColor Red
    throw "Assertion failed: $Name"
  }
}

Write-Host '=== Focused Regression: Step 5-8 + Security + LiveKit Access ===' -ForegroundColor Cyan

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$doctorEmail = "reg.doctor.$ts@test.com"
$doctorPassword = 'Doctor@1234'
$doctorLicense = "REG-LIC-$ts"

$patPhone1 = "+91" + (Get-Random -Minimum 9200000000 -Maximum 9299999999)
$patPhone2 = "+91" + (Get-Random -Minimum 9300000000 -Maximum 9399999999)

# Admin login
$adminLogin = Invoke-Api -Method POST -Path '/api/auth/login' -Body @{ email = 'admin@pdc.com'; password = 'Admin@123'; role = 'Admin' }
Assert 'Admin login' ($adminLogin.Ok -and $adminLogin.Status -eq 200) "HTTP $($adminLogin.Status)"
$adminToken = $adminLogin.Body.data.accessToken
Assert 'Admin token issued' (-not [string]::IsNullOrWhiteSpace($adminToken)) 'accessToken present'

# Doctor register/login/create profile
$drReg = Invoke-Api -Method POST -Path '/api/auth/register' -Body @{ fullName='Regression Doctor'; email=$doctorEmail; password=$doctorPassword; confirmPassword=$doctorPassword; role='Doctor' }
Assert 'Doctor register' ($drReg.Ok -and $drReg.Status -eq 201) "HTTP $($drReg.Status)"

$drLogin = Invoke-Api -Method POST -Path '/api/auth/login' -Body @{ email=$doctorEmail; password=$doctorPassword; role='Doctor' }
Assert 'Doctor login' ($drLogin.Ok -and $drLogin.Status -eq 200) "HTTP $($drLogin.Status)"
$doctorToken = $drLogin.Body.data.accessToken
Assert 'Doctor token issued' (-not [string]::IsNullOrWhiteSpace($doctorToken)) 'accessToken present'

$drProfile = Invoke-Api -Method POST -Path '/api/doctors/profile' -Token $doctorToken -Body @{
  specialization = 'General Medicine'
  qualification = 'MBBS'
  experienceYears = 7
  licenseNumber = $doctorLicense
  bio = 'Regression test doctor'
  consultationFee = 750
  city = 'Pune'
  state = 'Maharashtra'
  country = 'India'
}
Assert 'Doctor profile create' ($drProfile.Ok -and $drProfile.Status -eq 201) "HTTP $($drProfile.Status)"
$doctorId = $drProfile.Body.data.id

$approve = Invoke-Api -Method PATCH -Path "/api/admin/doctors/$doctorId/approve" -Token $adminToken -Body @{ reason='Regression approve' }
Assert 'Doctor approve' ($approve.Ok -and $approve.Status -eq 200) "HTTP $($approve.Status)"

# STEP 5 — Availability create/edit/delete + duplicate/invalid
$createAvail = Invoke-Api -Method POST -Path '/api/doctors/availability' -Token $doctorToken -Body @{ dayOfWeek = 1; startTime='10:00'; endTime='11:00'; slotDurationMinutes = 30 }
Assert 'Availability create' ($createAvail.Ok -and $createAvail.Status -eq 201) "HTTP $($createAvail.Status)"
$slotId = $createAvail.Body.data.id

$dupAvail = Invoke-Api -Method POST -Path '/api/doctors/availability' -Token $doctorToken -Body @{ dayOfWeek = 1; startTime='10:00'; endTime='11:00'; slotDurationMinutes = 30 }
Assert 'Duplicate slot blocked' ((-not $dupAvail.Ok) -and $dupAvail.Status -eq 409) "HTTP $($dupAvail.Status)"

$invalidAvail = Invoke-Api -Method POST -Path '/api/doctors/availability' -Token $doctorToken -Body @{ dayOfWeek = 1; startTime='11:00'; endTime='10:00'; slotDurationMinutes = 30 }
Assert 'Invalid time blocked' ((-not $invalidAvail.Ok) -and ($invalidAvail.Status -eq 400 -or $invalidAvail.Status -eq 422)) "HTTP $($invalidAvail.Status)"

$editAvail = Invoke-Api -Method PATCH -Path "/api/doctors/availability/$slotId" -Token $doctorToken -Body @{ dayOfWeek = 1; startTime='11:00'; endTime='12:00'; slotDurationMinutes = 30; isAvailable = $true }
Assert 'Availability edit' ($editAvail.Ok -and $editAvail.Status -eq 200) "HTTP $($editAvail.Status)"

# Keep edited slot for booking flow

# STEP 6 — Patient booking flow
$sendOtp1 = Invoke-Api -Method POST -Path '/api/auth/send-otp' -Body @{ phoneNumber = $patPhone1 }
Assert 'Patient1 send OTP' ($sendOtp1.Ok -and $sendOtp1.Status -eq 200) "HTTP $($sendOtp1.Status)"
$verifyOtp1 = Invoke-Api -Method POST -Path '/api/auth/verify-otp' -Body @{ phoneNumber = $patPhone1; otp = '1234' }
Assert 'Patient1 verify OTP' ($verifyOtp1.Ok -and $verifyOtp1.Status -eq 200) "HTTP $($verifyOtp1.Status)"
$pat1Token = $verifyOtp1.Body.data.accessToken
$pat1UserId = $verifyOtp1.Body.data.user.id
Assert 'Patient1 token issued' (-not [string]::IsNullOrWhiteSpace($pat1Token)) 'accessToken present'

$pat1Profile = Invoke-Api -Method POST -Path '/api/patients/profile' -Token $pat1Token -Body @{
  gender='Male'; dateOfBirth='1990-01-01'; bloodGroup='O+'; heightCm=170; weightKg=70
  emergencyContactName='EC1'; emergencyContactPhone='+919000000111'; city='Pune'; state='MH'; country='India'
}
Assert 'Patient1 profile create' ($pat1Profile.Ok -and $pat1Profile.Status -eq 201) "HTTP $($pat1Profile.Status)"
$pat1ProfileId = $pat1Profile.Body.data.id

$searchDoc = Invoke-Api -Method GET -Path '/api/patients/doctors?specialization=General%20Medicine&page=1&pageSize=100' -Token $pat1Token
Assert 'Patient search doctors' ($searchDoc.Ok -and $searchDoc.Status -eq 200) "HTTP $($searchDoc.Status)"
$docFound = @($searchDoc.Body.data.items | Where-Object { $_.id -eq $doctorId }).Count -gt 0
Assert 'Doctor visible in search' $docFound "doctorId=$doctorId"

$docDetail = Invoke-Api -Method GET -Path "/api/doctors/$doctorId" -Token $pat1Token
Assert 'Open doctor profile detail' ($docDetail.Ok -and $docDetail.Status -eq 200) "HTTP $($docDetail.Status)"
Assert 'Doctor availability visible' (@($docDetail.Body.data.availability).Count -gt 0) "availabilityCount=$(@($docDetail.Body.data.availability).Count)"

$futDate = (Get-Date).AddDays(3).ToString('yyyy-MM-dd')

$book1 = Invoke-Api -Method POST -Path '/api/consultations' -Token $pat1Token -Body @{
  doctorId = $doctorId
  scheduledDate = $futDate
  startTime = '11:00:00'
  endTime = '11:30:00'
  timeZone = 'Asia/Kolkata'
  consultationType = 'Video'
  symptoms = 'Regression booking flow'
  isFollowUp = $false
}
Assert 'Patient books slot' ($book1.Ok -and $book1.Status -eq 201) "HTTP $($book1.Status)"
$consultationId = $book1.Body.data.id
Assert 'Booking status Pending' ($book1.Body.data.status -eq 'Pending') "status=$($book1.Body.data.status)"
Assert 'Booking doctorId correct' ($book1.Body.data.doctorId -eq $doctorId) "doctorId=$($book1.Body.data.doctorId)"
Assert 'Booking patientId correct' ($book1.Body.data.patientId -eq $pat1ProfileId) "patientId=$($book1.Body.data.patientId)"

$getConsult = Invoke-Api -Method GET -Path "/api/consultations/$consultationId" -Token $pat1Token
Assert 'Consultation fetch by patient' ($getConsult.Ok -and $getConsult.Status -eq 200) "HTTP $($getConsult.Status)"
Assert 'Consultation time linked to booked slot' ($getConsult.Body.data.startTime -eq '11:00:00' -and $getConsult.Body.data.endTime -eq '11:30:00') "time=$($getConsult.Body.data.startTime)-$($getConsult.Body.data.endTime)"

# STEP 7 — Double booking (2 tabs style)
$sendOtp2 = Invoke-Api -Method POST -Path '/api/auth/send-otp' -Body @{ phoneNumber = $patPhone2 }
Assert 'Patient2 send OTP' ($sendOtp2.Ok -and $sendOtp2.Status -eq 200) "HTTP $($sendOtp2.Status)"
$verifyOtp2 = Invoke-Api -Method POST -Path '/api/auth/verify-otp' -Body @{ phoneNumber = $patPhone2; otp = '1234' }
Assert 'Patient2 verify OTP' ($verifyOtp2.Ok -and $verifyOtp2.Status -eq 200) "HTTP $($verifyOtp2.Status)"
$pat2Token = $verifyOtp2.Body.data.accessToken
Assert 'Patient2 token issued' (-not [string]::IsNullOrWhiteSpace($pat2Token)) 'accessToken present'

$pat2Profile = Invoke-Api -Method POST -Path '/api/patients/profile' -Token $pat2Token -Body @{
  gender='Female'; dateOfBirth='1992-02-02'; bloodGroup='A+'; heightCm=165; weightKg=60
  emergencyContactName='EC2'; emergencyContactPhone='+919000000222'; city='Pune'; state='MH'; country='India'
}
Assert 'Patient2 profile create' ($pat2Profile.Ok -and $pat2Profile.Status -eq 201) "HTTP $($pat2Profile.Status)"

$slotBody = @{ doctorId=$doctorId; scheduledDate=$futDate; startTime='11:30:00'; endTime='12:00:00'; timeZone='Asia/Kolkata'; consultationType='Video'; symptoms='Concurrent booking'; isFollowUp=$false } | ConvertTo-Json -Depth 8 -Compress

$job1 = Start-Job -ScriptBlock {
  param($base,$body,$token)
  try {
    $r = Invoke-WebRequest -Method POST -Uri "$base/api/consultations" -Headers @{ Authorization="Bearer $token"; 'Content-Type'='application/json' } -Body $body -UseBasicParsing -ErrorAction Stop
    [pscustomobject]@{ ok=$true; status=[int]$r.StatusCode }
  } catch {
    $st = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    [pscustomobject]@{ ok=$false; status=$st }
  }
} -ArgumentList $BASE, $slotBody, $pat1Token

$job2 = Start-Job -ScriptBlock {
  param($base,$body,$token)
  try {
    $r = Invoke-WebRequest -Method POST -Uri "$base/api/consultations" -Headers @{ Authorization="Bearer $token"; 'Content-Type'='application/json' } -Body $body -UseBasicParsing -ErrorAction Stop
    [pscustomobject]@{ ok=$true; status=[int]$r.StatusCode }
  } catch {
    $st = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    [pscustomobject]@{ ok=$false; status=$st }
  }
} -ArgumentList $BASE, $slotBody, $pat2Token

Wait-Job -Job $job1, $job2 | Out-Null
$res1 = Receive-Job $job1
$res2 = Receive-Job $job2
Remove-Job $job1, $job2

$successCount = @($res1, $res2 | Where-Object { $_.ok -eq $true -and $_.status -eq 201 }).Count
$conflictCount = @($res1, $res2 | Where-Object { $_.ok -eq $false -and $_.status -eq 409 }).Count
Assert 'Double booking single winner' ($successCount -eq 1 -and $conflictCount -eq 1) "success=$successCount conflict=$conflictCount"

# STEP 8 — Consultation status lifecycle + invalid transition check + history
$drReq = Invoke-Api -Method GET -Path '/api/consultations/doctor/requests' -Token $doctorToken
Assert 'Doctor sees requests' ($drReq.Ok -and $drReq.Status -eq 200) "HTTP $($drReq.Status)"

$confirm = Invoke-Api -Method PUT -Path "/api/consultations/$consultationId/confirm" -Token $doctorToken -Body $null
Assert 'Status Pending -> Confirmed' ($confirm.Ok -and $confirm.Status -eq 200 -and $confirm.Body.data.status -eq 'Confirmed') "status=$($confirm.Body.data.status)"

$start = Invoke-Api -Method PUT -Path "/api/consultations/$consultationId/start" -Token $doctorToken -Body $null
Assert 'Status Confirmed -> InProgress' ($start.Ok -and $start.Status -eq 200 -and $start.Body.data.status -eq 'InProgress') "status=$($start.Body.data.status)"

$complete = Invoke-Api -Method PUT -Path "/api/consultations/$consultationId/complete" -Token $doctorToken -Body @{ notes = 'Completed in regression flow' }
Assert 'Status InProgress -> Completed' ($complete.Ok -and $complete.Status -eq 200 -and $complete.Body.data.status -eq 'Completed') "status=$($complete.Body.data.status)"

$invalidTransition = Invoke-Api -Method PUT -Path "/api/consultations/$consultationId/confirm" -Token $doctorToken -Body $null
Assert 'Invalid transition blocked (Completed -> Confirmed)' ((-not $invalidTransition.Ok) -and $invalidTransition.Status -eq 409) "HTTP $($invalidTransition.Status)"

$history = Invoke-Api -Method GET -Path "/api/consultations/$consultationId/history" -Token $pat1Token
Assert 'Status history exists' ($history.Ok -and $history.Status -eq 200 -and @($history.Body.data).Count -ge 4) "historyCount=$(@($history.Body.data).Count)"

# Security checks
$noJwt = Invoke-Api -Method GET -Path '/api/patients/me' -Body $null -Token $null
Assert 'JWT missing => 401' ((-not $noJwt.Ok) -and $noJwt.Status -eq 401) "HTTP $($noJwt.Status)"

$roleBypass = Invoke-Api -Method GET -Path '/api/consultations/doctor/requests' -Token $pat1Token -Body $null
Assert 'Patient role bypass blocked on doctor API' ((-not $roleBypass.Ok) -and $roleBypass.Status -eq 403) "HTTP $($roleBypass.Status)"

# LiveKit / video-token unauthorized access check
$adminVideoToken = Invoke-Api -Method POST -Path "/api/consultations/$consultationId/video-token" -Token $adminToken -Body $null
Assert 'Video token unauthorized for admin' ((-not $adminVideoToken.Ok) -and ($adminVideoToken.Status -eq 403 -or $adminVideoToken.Status -eq 401)) "HTTP $($adminVideoToken.Status)"

# Finish availability delete scenario now
$deleteAvail = Invoke-Api -Method DELETE -Path "/api/doctors/availability/$slotId" -Token $doctorToken -Body $null
Assert 'Availability delete' ($deleteAvail.Ok -and $deleteAvail.Status -eq 200) "HTTP $($deleteAvail.Status)"

$availAfterDelete = Invoke-Api -Method GET -Path '/api/doctors/availability/me' -Token $doctorToken -Body $null
$deletedAbsent = @($availAfterDelete.Body.data | Where-Object { $_.id -eq $slotId }).Count -eq 0
Assert 'Deleted slot not returned' ($availAfterDelete.Ok -and $deletedAbsent) "HTTP $($availAfterDelete.Status)"

Write-Host '=== Focused Regression Completed Successfully ===' -ForegroundColor Cyan
