#Requires -Version 5.1
<#
.SYNOPSIS
    Phase 2 - Doctor Profile Completion Seed
    Logs in each registered doctor and submits their full professional profile
    via the real application API.

.DESCRIPTION
    Prerequisites:
      - Phase 1 (doctor_registration_seed.ps1) must have completed with 0 failures.
      - doctor_credentials.csv must exist in the same directory.

    Flow per doctor:
      1. Read credentials from doctor_credentials.csv
      2. POST /api/auth/login  -> get accessToken
      3. POST /api/doctors/profile  -> submit full professional profile
      4. GET  /api/doctors/profile/me  -> verify IsProfileCompleted=true + ApprovalStatus=Pending

    Profile validation rules (from CreateDoctorProfileRequestValidator):
      - LicenseNumber  : ^[A-Za-z0-9\-/]+$  (alphanumeric, hyphen, slash only - NO SPACES)
      - ConsultationFee: 0 to 99999.99
      - ExperienceYears: 0 to 80
      - Specialization : required, max 256 chars
      - Qualification  : required, max 512 chars
      - City           : required, max 100 chars
      - Bio            : max 1000 chars
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ===========================================================================
# CONFIGURATION
# ===========================================================================
$BASE_URL       = "http://localhost:5053"
$LOGIN_URL      = "$BASE_URL/api/auth/login"
$PROFILE_URL    = "$BASE_URL/api/doctors/profile"
$PROFILE_ME_URL = "$BASE_URL/api/doctors/profile/me"
$SCRIPTS_DIR    = $PSScriptRoot
$CSV_PATH       = Join-Path $SCRIPTS_DIR "doctor_credentials.csv"
$LOG_PATH       = Join-Path $SCRIPTS_DIR "doctor_seed_profile.log"
$RESULTS_CSV    = Join-Path $SCRIPTS_DIR "doctor_profile_results.csv"
$MAX_RETRIES    = 3
$RETRY_DELAY    = 3

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
# PROFILE DATA (keyed by Email)
# All LicenseNumbers use only alphanumeric, hyphens, slashes (validator rule).
# Bio kept under 1000 chars.
# ConsultationFee is a decimal (no currency symbol).
# LanguagesSpoken is an array of strings, each under 50 chars.
# ===========================================================================
$PROFILES = @{}

$PROFILES["ananya.sharma@healthconsult.in"] = @{
    Specialization  = "Ophthalmology"
    Qualification   = "MBBS, MS Ophthalmology, FRCS"
    LicenseNumber   = "MCI-OPH-DL-2008-001"
    ExperienceYears = 16
    ConsultationFee = 900.00
    Bio             = "Senior ophthalmologist at AIIMS Delhi with 16 years of experience in cataract surgery, LASIK, and retinal disorders. Performed over 5000 successful cataract surgeries. Nationally recognised expert in paediatric ophthalmology and corneal diseases."
    HospitalName    = "AIIMS Delhi"
    ClinicAddress   = "Ansari Nagar East, New Delhi 110029"
    City            = "New Delhi"
    State           = "Delhi"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English", "Punjabi")
}

$PROFILES["vikram.nair@healthconsult.in"] = @{
    Specialization  = "Ophthalmology"
    Qualification   = "MBBS, DNB Ophthalmology, FICO"
    LicenseNumber   = "KMC-OPH-KL-2012-002"
    ExperienceYears = 12
    ConsultationFee = 750.00
    Bio             = "Consultant ophthalmologist at Amrita Institute of Medical Sciences Kochi. Specialises in glaucoma management, vitreoretinal surgery, and corneal transplantation. Fellow of the International Council of Ophthalmology with 18 peer-reviewed publications."
    HospitalName    = "Amrita Institute of Medical Sciences"
    ClinicAddress   = "AIMS Ponekkara, Kochi 682041"
    City            = "Kochi"
    State           = "Kerala"
    Country         = "India"
    LanguagesSpoken = @("Malayalam", "English", "Tamil")
}

$PROFILES["priya.menon@healthconsult.in"] = @{
    Specialization  = "Ophthalmology"
    Qualification   = "MBBS, MD Ophthalmology, MNAMS"
    LicenseNumber   = "TNMC-OPH-TN-2015-003"
    ExperienceYears = 9
    ConsultationFee = 600.00
    Bio             = "Ophthalmologist at Apollo Hospitals Chennai specialising in diabetic retinopathy, macular degeneration, and squint correction. Trained in advanced laser photocoagulation and anti-VEGF therapy for retinal diseases."
    HospitalName    = "Apollo Hospitals"
    ClinicAddress   = "21 Greams Lane, Thousand Lights, Chennai 600006"
    City            = "Chennai"
    State           = "Tamil Nadu"
    Country         = "India"
    LanguagesSpoken = @("Tamil", "English", "Telugu")
}

$PROFILES["rajesh.iyer@healthconsult.in"] = @{
    Specialization  = "Cardiology"
    Qualification   = "MBBS, MD Medicine, DM Cardiology"
    LicenseNumber   = "MCI-CARD-TN-2003-004"
    ExperienceYears = 21
    ConsultationFee = 1500.00
    Bio             = "Leading interventional cardiologist at Fortis Malar Hospital Chennai with 21 years of experience. Specialises in primary angioplasty, complex coronary interventions, and structural heart disease. Has performed over 8000 cardiac catheterisation procedures."
    HospitalName    = "Fortis Malar Hospital"
    ClinicAddress   = "52 First Main Road, Gandhi Nagar, Chennai 600020"
    City            = "Chennai"
    State           = "Tamil Nadu"
    Country         = "India"
    LanguagesSpoken = @("Tamil", "English", "Hindi")
}

$PROFILES["sunita.kulkarni@healthconsult.in"] = @{
    Specialization  = "Cardiology"
    Qualification   = "MBBS, MD Cardiology, FACC"
    LicenseNumber   = "MMC-CARD-MH-2007-005"
    ExperienceYears = 17
    ConsultationFee = 1200.00
    Bio             = "Non-invasive cardiologist at KEM Hospital Pune with expertise in echocardiography, cardiac MRI, and heart failure management. Fellow of the American College of Cardiology with 25 published research papers on heart failure and valvular heart disease."
    HospitalName    = "KEM Hospital Pune"
    ClinicAddress   = "489 Rasta Peth, Pune 411011"
    City            = "Pune"
    State           = "Maharashtra"
    Country         = "India"
    LanguagesSpoken = @("Marathi", "Hindi", "English")
}

$PROFILES["arun.pillai@healthconsult.in"] = @{
    Specialization  = "Cardiology"
    Qualification   = "MBBS, MD, DM Cardiology, FSCAI"
    LicenseNumber   = "KMC-CARD-KL-2010-006"
    ExperienceYears = 14
    ConsultationFee = 1000.00
    Bio             = "Interventional cardiologist at KIMS Hospital Thiruvananthapuram with expertise in coronary artery disease, adult congenital heart defects, and cardiac electrophysiology. Trained in complex bifurcation stenting and rotational atherectomy techniques."
    HospitalName    = "KIMS Hospital"
    ClinicAddress   = "1 Anayara, Thiruvananthapuram 695029"
    City            = "Thiruvananthapuram"
    State           = "Kerala"
    Country         = "India"
    LanguagesSpoken = @("Malayalam", "English", "Hindi")
}

$PROFILES["meera.joshi@healthconsult.in"] = @{
    Specialization  = "Dermatology"
    Qualification   = "MBBS, MD Dermatology Venereology and Leprosy"
    LicenseNumber   = "MCI-DERM-RJ-2011-007"
    ExperienceYears = 13
    ConsultationFee = 700.00
    Bio             = "Dermatologist at SMS Medical College Jaipur specialising in psoriasis, vitiligo, hair loss disorders, and cosmetic dermatology. Expertise in PRP therapy, chemical peels, and laser treatment for chronic skin conditions including melasma and acne scarring."
    HospitalName    = "SMS Medical College and Hospital"
    ClinicAddress   = "Sawai Ram Singh Road, Gangori Bazaar, Jaipur 302004"
    City            = "Jaipur"
    State           = "Rajasthan"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English")
}

$PROFILES["suresh.patel@healthconsult.in"] = @{
    Specialization  = "Dermatology"
    Qualification   = "MBBS, DVD, DDV"
    LicenseNumber   = "GMC-DERM-GJ-2016-008"
    ExperienceYears = 8
    ConsultationFee = 500.00
    Bio             = "Dermatologist and venereologist at Civil Hospital Ahmedabad focusing on chronic skin diseases, acne, eczema, and sexually transmitted infections. Special interest in skin biopsies and dermoscopy for early melanoma and skin cancer detection."
    HospitalName    = "Civil Hospital Ahmedabad"
    ClinicAddress   = "Asarwa, Ahmedabad 380016"
    City            = "Ahmedabad"
    State           = "Gujarat"
    Country         = "India"
    LanguagesSpoken = @("Gujarati", "Hindi", "English")
}

$PROFILES["kavitha.reddy@healthconsult.in"] = @{
    Specialization  = "Dermatology"
    Qualification   = "MBBS, MD Dermatology, FRGUHS"
    LicenseNumber   = "TSMC-DERM-TS-2013-009"
    ExperienceYears = 11
    ConsultationFee = 650.00
    Bio             = "Clinical and cosmetic dermatologist at Yashoda Hospitals Hyderabad. Specialises in skin allergy testing, botox therapy, dermal fillers, and laser hair removal. Trainer for aesthetic procedures at the institute with over 1000 cosmetic procedures performed."
    HospitalName    = "Yashoda Hospitals"
    ClinicAddress   = "Raj Bhavan Road, Somajiguda, Hyderabad 500082"
    City            = "Hyderabad"
    State           = "Telangana"
    Country         = "India"
    LanguagesSpoken = @("Telugu", "Hindi", "English")
}

$PROFILES["neeraj.gupta@healthconsult.in"] = @{
    Specialization  = "Pediatrics"
    Qualification   = "MBBS, DCH, MD Pediatrics"
    LicenseNumber   = "MCI-PED-UP-2009-010"
    ExperienceYears = 15
    ConsultationFee = 600.00
    Bio             = "Senior paediatrician at SGPGI Lucknow with 15 years of experience in neonatology, paediatric intensive care, and childhood immunisation. Certified neonatal resuscitation instructor managing over 200 NICU admissions annually."
    HospitalName    = "Sanjay Gandhi Postgraduate Institute"
    ClinicAddress   = "Raebareli Road, Lucknow 226014"
    City            = "Lucknow"
    State           = "Uttar Pradesh"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English")
}

$PROFILES["anjali.singh@healthconsult.in"] = @{
    Specialization  = "Pediatrics"
    Qualification   = "MBBS, MD Pediatrics, Fellowship Neonatology"
    LicenseNumber   = "DMC-PED-DL-2014-011"
    ExperienceYears = 10
    ConsultationFee = 700.00
    Bio             = "Paediatrician and neonatologist at Safdarjung Hospital New Delhi. Specialises in premature baby care, developmental paediatrics, and paediatric respiratory diseases. Also a certified childhood nutrition counsellor."
    HospitalName    = "Safdarjung Hospital"
    ClinicAddress   = "Safdarjung Enclave, New Delhi 110029"
    City            = "New Delhi"
    State           = "Delhi"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English")
}

$PROFILES["ravi.kumar@healthconsult.in"] = @{
    Specialization  = "Pediatrics"
    Qualification   = "MBBS, DNB Pediatrics"
    LicenseNumber   = "KMSB-PED-KA-2018-012"
    ExperienceYears = 6
    ConsultationFee = 450.00
    Bio             = "Paediatrician at Indira Gandhi Institute of Child Health Bangalore with expertise in childhood infectious diseases, nutritional deficiencies, and routine immunisation programmes. Passionate about preventive paediatrics and community child health education."
    HospitalName    = "Indira Gandhi Institute of Child Health"
    ClinicAddress   = "H Siddaiah Road, Shivajinagar, Bangalore 560001"
    City            = "Bangalore"
    State           = "Karnataka"
    Country         = "India"
    LanguagesSpoken = @("Kannada", "Hindi", "English", "Telugu")
}

$PROFILES["deepak.verma@healthconsult.in"] = @{
    Specialization  = "Neurology"
    Qualification   = "MBBS, MD Medicine, DM Neurology"
    LicenseNumber   = "MCI-NEURO-MP-2006-013"
    ExperienceYears = 18
    ConsultationFee = 1200.00
    Bio             = "Consultant neurologist and stroke specialist at AIIMS Bhopal with 18 years of experience in epilepsy management, movement disorders, and acute stroke thrombolysis. Principal investigator in multiple national neurology clinical trials."
    HospitalName    = "AIIMS Bhopal"
    ClinicAddress   = "Saket Nagar, Bhopal 462020"
    City            = "Bhopal"
    State           = "Madhya Pradesh"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English")
}

$PROFILES["sneha.bhatt@healthconsult.in"] = @{
    Specialization  = "Neurology"
    Qualification   = "MBBS, MD Neurology, MRCP"
    LicenseNumber   = "GMC-NEURO-GJ-2013-014"
    ExperienceYears = 11
    ConsultationFee = 900.00
    Bio             = "Neurologist at Sterling Hospitals Ahmedabad specialising in headache disorders, dementia, and neuroimmunological conditions including multiple sclerosis. Trained in nerve conduction studies and electromyography."
    HospitalName    = "Sterling Hospitals"
    ClinicAddress   = "Gurukul Road, Memnagar, Ahmedabad 380052"
    City            = "Ahmedabad"
    State           = "Gujarat"
    Country         = "India"
    LanguagesSpoken = @("Gujarati", "Hindi", "English")
}

$PROFILES["mohan.das@healthconsult.in"] = @{
    Specialization  = "Neurology"
    Qualification   = "MBBS, MD, DM Neurology"
    LicenseNumber   = "ORMC-NEURO-OR-2016-015"
    ExperienceYears = 8
    ConsultationFee = 800.00
    Bio             = "Neurologist at SCB Medical College Cuttack specialising in brain tumours, hydrocephalus, and deep brain stimulation for Parkinson disease. One of the youngest DBS specialists in Eastern India with advanced training in functional neurosurgery."
    HospitalName    = "SCB Medical College and Hospital"
    ClinicAddress   = "Manglabag, Cuttack 753007"
    City            = "Cuttack"
    State           = "Odisha"
    Country         = "India"
    LanguagesSpoken = @("Odia", "Hindi", "English")
}

$PROFILES["harish.rao@healthconsult.in"] = @{
    Specialization  = "Orthopedics"
    Qualification   = "MBBS, MS Orthopaedics, MCh Orthopaedics"
    LicenseNumber   = "APMC-ORTH-AP-2005-016"
    ExperienceYears = 19
    ConsultationFee = 1000.00
    Bio             = "Orthopaedic surgeon at Nizam's Institute of Medical Sciences Hyderabad with 19 years of expertise in total hip and knee replacement, arthroscopic surgery, and sports injuries. Visiting faculty at several orthopaedic training centres in South India."
    HospitalName    = "Nizam's Institute of Medical Sciences"
    ClinicAddress   = "Punjagutta, Hyderabad 500082"
    City            = "Hyderabad"
    State           = "Telangana"
    Country         = "India"
    LanguagesSpoken = @("Telugu", "Hindi", "English")
}

$PROFILES["pooja.chauhan@healthconsult.in"] = @{
    Specialization  = "Orthopedics"
    Qualification   = "MBBS, MS Orthopaedics, Fellowship Joint Replacement"
    LicenseNumber   = "HPMC-ORTH-HP-2014-017"
    ExperienceYears = 10
    ConsultationFee = 750.00
    Bio             = "Orthopaedic consultant at IGMC Shimla specialising in paediatric orthopaedics, scoliosis correction, and minimally invasive fracture management. Completed joint replacement fellowship at Hospital for Special Surgery New York."
    HospitalName    = "Indira Gandhi Medical College"
    ClinicAddress   = "Circular Road, Shimla 171001"
    City            = "Shimla"
    State           = "Himachal Pradesh"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English")
}

$PROFILES["sanjay.mishra@healthconsult.in"] = @{
    Specialization  = "Orthopedics"
    Qualification   = "MBBS, DNB Orthopaedics, AO Fellowship Trauma"
    LicenseNumber   = "UPMC-ORTH-UP-2017-018"
    ExperienceYears = 7
    ConsultationFee = 550.00
    Bio             = "Orthopaedic and trauma surgeon at Era's Lucknow Medical College. Specialises in polytrauma management, complex fracture fixation, and limb reconstruction. Completed AO Foundation fellowship in trauma surgery."
    HospitalName    = "Era's Lucknow Medical College"
    ClinicAddress   = "Sarfarazganj, Lucknow 226003"
    City            = "Lucknow"
    State           = "Uttar Pradesh"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English")
}

$PROFILES["lakshmi.nambiar@healthconsult.in"] = @{
    Specialization  = "ENT"
    Qualification   = "MBBS, MS ENT, DLORCS"
    LicenseNumber   = "KMC-ENT-KL-2004-019"
    ExperienceYears = 20
    ConsultationFee = 800.00
    Bio             = "Senior ENT surgeon at Government Medical College Kozhikode with 20 years of experience. Specialises in cochlear implantation, endoscopic sinus surgery, and head and neck oncology. Nationally recognised expert in paediatric hearing disorders."
    HospitalName    = "Government Medical College Kozhikode"
    ClinicAddress   = "Medical College PO, Kozhikode 673008"
    City            = "Kozhikode"
    State           = "Kerala"
    Country         = "India"
    LanguagesSpoken = @("Malayalam", "English", "Tamil", "Hindi")
}

$PROFILES["ashok.trivedi@healthconsult.in"] = @{
    Specialization  = "ENT"
    Qualification   = "MBBS, MS ENT, FRCS"
    LicenseNumber   = "MPMC-ENT-MP-2010-020"
    ExperienceYears = 14
    ConsultationFee = 700.00
    Bio             = "ENT specialist and head and neck surgeon at NSCB Medical College Jabalpur. Expertise in thyroid surgeries, parotid gland tumours, and advanced endoscopic procedures for nasal polyps and deviated nasal septum correction."
    HospitalName    = "NSCB Medical College"
    ClinicAddress   = "Geeta Bhawan Square, Jabalpur 482003"
    City            = "Jabalpur"
    State           = "Madhya Pradesh"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English")
}

$PROFILES["divya.pandey@healthconsult.in"] = @{
    Specialization  = "ENT"
    Qualification   = "MBBS, DNB ENT, Fellowship Cochlear Implant"
    LicenseNumber   = "UPMC-ENT-UP-2018-021"
    ExperienceYears = 6
    ConsultationFee = 500.00
    Bio             = "ENT specialist at King George's Medical University Lucknow with expertise in cochlear implant programming, voice disorders, and laryngoscopy. Runs quarterly free hearing camps for hearing-impaired children."
    HospitalName    = "King George's Medical University"
    ClinicAddress   = "Shah Mina Road, Chowk, Lucknow 226003"
    City            = "Lucknow"
    State           = "Uttar Pradesh"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English", "Urdu")
}

$PROFILES["rekha.agarwal@healthconsult.in"] = @{
    Specialization  = "Gynecology"
    Qualification   = "MBBS, MS Obstetrics and Gynaecology, FICOG"
    LicenseNumber   = "UPMC-GYN-UP-2001-022"
    ExperienceYears = 23
    ConsultationFee = 1000.00
    Bio             = "Senior obstetrician and gynaecologist at Ram Manohar Lohia Hospital New Delhi with 23 years of experience. Specialises in high-risk pregnancies, laparoscopic gynaecological surgeries, and infertility treatment including IVF and IUI procedures."
    HospitalName    = "Ram Manohar Lohia Hospital"
    ClinicAddress   = "Baba Kharak Singh Marg, New Delhi 110001"
    City            = "New Delhi"
    State           = "Delhi"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English")
}

$PROFILES["padma.krishnan@healthconsult.in"] = @{
    Specialization  = "Gynecology"
    Qualification   = "MBBS, DGO, MD Obstetrics and Gynaecology"
    LicenseNumber   = "TNMC-GYN-TN-2009-023"
    ExperienceYears = 15
    ConsultationFee = 800.00
    Bio             = "Gynaecologist at Madras Medical College Chennai specialising in minimal access surgery, endometriosis management, and menopausal disorders. RCOG-trained colposcopist and trainer in hysteroscopic procedures for junior residents."
    HospitalName    = "Madras Medical College"
    ClinicAddress   = "Park Town, Chennai 600003"
    City            = "Chennai"
    State           = "Tamil Nadu"
    Country         = "India"
    LanguagesSpoken = @("Tamil", "Telugu", "English", "Hindi")
}

$PROFILES["geeta.malhotra@healthconsult.in"] = @{
    Specialization  = "Gynecology"
    Qualification   = "MBBS, MS Gynaecology, Fellowship Reproductive Medicine"
    LicenseNumber   = "PMC-GYN-PB-2015-024"
    ExperienceYears = 9
    ConsultationFee = 700.00
    Bio             = "Reproductive medicine specialist and gynaecologist at PGI Chandigarh. Special interest in polycystic ovary syndrome, recurrent pregnancy loss, and male factor infertility evaluation. Certified embryologist with fellowship training from AIIMS."
    HospitalName    = "PGI Chandigarh"
    ClinicAddress   = "Sector 12, Chandigarh 160012"
    City            = "Chandigarh"
    State           = "Punjab"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "Punjabi", "English")
}

$PROFILES["kiran.desai@healthconsult.in"] = @{
    Specialization  = "Psychiatry"
    Qualification   = "MBBS, MD Psychiatry, MRCPsych"
    LicenseNumber   = "GMC-PSYC-GJ-2007-025"
    ExperienceYears = 17
    ConsultationFee = 1000.00
    Bio             = "Consultant psychiatrist at Mental Health Centre Ahmedabad with 17 years of expertise in schizophrenia, bipolar disorder, and addiction medicine. Member of the Royal College of Psychiatrists UK conducting CBT-based psychotherapy sessions regularly."
    HospitalName    = "Mental Health Centre Ahmedabad"
    ClinicAddress   = "Asarwa, Ahmedabad 380016"
    City            = "Ahmedabad"
    State           = "Gujarat"
    Country         = "India"
    LanguagesSpoken = @("Gujarati", "Hindi", "English")
}

$PROFILES["nitin.jain@healthconsult.in"] = @{
    Specialization  = "Psychiatry"
    Qualification   = "MBBS, MD Psychiatry, DPM"
    LicenseNumber   = "MMC-PSYC-MH-2012-026"
    ExperienceYears = 12
    ConsultationFee = 900.00
    Bio             = "Psychiatrist at Lokmanya Tilak Municipal General Hospital Mumbai specialising in OCD, anxiety disorders, and child and adolescent psychiatry. Conducts weekly group therapy and has trained over 50 mental health professionals in mindfulness-based stress reduction."
    HospitalName    = "Lokmanya Tilak Municipal General Hospital"
    ClinicAddress   = "Dr. Babasaheb Ambedkar Road, Sion, Mumbai 400022"
    City            = "Mumbai"
    State           = "Maharashtra"
    Country         = "India"
    LanguagesSpoken = @("Marathi", "Hindi", "English")
}

$PROFILES["shweta.bansal@healthconsult.in"] = @{
    Specialization  = "Psychiatry"
    Qualification   = "MBBS, MD Psychiatry, Fellowship Geriatric Psychiatry"
    LicenseNumber   = "DMC-PSYC-DL-2016-027"
    ExperienceYears = 8
    ConsultationFee = 800.00
    Bio             = "Psychiatrist at IHBAS Delhi specialising in depression, PTSD, and geriatric psychiatry. Certified yoga therapist integrating mindfulness techniques into clinical practice for holistic mental health care."
    HospitalName    = "Institute of Human Behaviour and Allied Sciences"
    ClinicAddress   = "Dilshad Garden, Delhi 110095"
    City            = "New Delhi"
    State           = "Delhi"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English", "Punjabi")
}

$PROFILES["ramesh.tiwari@healthconsult.in"] = @{
    Specialization  = "General Medicine"
    Qualification   = "MBBS, MD General Medicine, MRCP"
    LicenseNumber   = "UPMC-GM-UP-2000-028"
    ExperienceYears = 24
    ConsultationFee = 600.00
    Bio             = "General physician at BHU Institute of Medical Sciences Varanasi with 24 years of experience managing diabetes, hypertension, and complex multi-system disorders. Known for holistic approach combining evidence-based medicine with preventive care."
    HospitalName    = "BHU Institute of Medical Sciences"
    ClinicAddress   = "Lanka, Varanasi 221005"
    City            = "Varanasi"
    State           = "Uttar Pradesh"
    Country         = "India"
    LanguagesSpoken = @("Hindi", "English")
}

$PROFILES["vijaya.srinivasan@healthconsult.in"] = @{
    Specialization  = "General Medicine"
    Qualification   = "MBBS, MD Internal Medicine, FRCP"
    LicenseNumber   = "TNMC-GM-TN-2006-029"
    ExperienceYears = 18
    ConsultationFee = 700.00
    Bio             = "General physician at Christian Medical College Vellore with expertise in infectious diseases, thyroid disorders, and chronic kidney disease management. FRCP fellow and principal investigator in 12 WHO-sponsored tropical disease studies."
    HospitalName    = "Christian Medical College"
    ClinicAddress   = "Ida Scudder Road, Vellore 632004"
    City            = "Vellore"
    State           = "Tamil Nadu"
    Country         = "India"
    LanguagesSpoken = @("Tamil", "English", "Telugu", "Kannada")
}

$PROFILES["aditya.chandra@healthconsult.in"] = @{
    Specialization  = "General Medicine"
    Qualification   = "MBBS, DNB General Medicine, Diploma Diabetology"
    LicenseNumber   = "WBMC-GM-WB-2019-030"
    ExperienceYears = 5
    ConsultationFee = 400.00
    Bio             = "General physician at SSKM Hospital Kolkata with special interest in diabetology, geriatric medicine, and preventive health. Runs a free diabetic foot clinic and is a certified lifestyle medicine practitioner focused on reversing Type 2 diabetes."
    HospitalName    = "SSKM Hospital"
    ClinicAddress   = "244 AJC Bose Road, Kolkata 700020"
    City            = "Kolkata"
    State           = "West Bengal"
    Country         = "India"
    LanguagesSpoken = @("Bengali", "Hindi", "English")
}

# ===========================================================================
# HELPER FUNCTIONS
# ===========================================================================
function Invoke-DoctorLogin {
    param([string]$Email, [string]$Password)

    $bodyJson = ([ordered]@{
        email    = $Email
        password = $Password
        role     = "Doctor"
    }) | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri $LOGIN_URL -Method POST -Body $bodyJson -ContentType "application/json" -TimeoutSec 15

    if ($resp.success -ne $true) {
        throw "Login failed (success=false): $($resp.message)"
    }
    return $resp.data.accessToken
}

function Invoke-SubmitProfile {
    param([string]$Token, [hashtable]$ProfileData)

    $bodyJson = ([ordered]@{
        specialization  = $ProfileData.Specialization
        qualification   = $ProfileData.Qualification
        experienceYears = $ProfileData.ExperienceYears
        licenseNumber   = $ProfileData.LicenseNumber
        bio             = $ProfileData.Bio
        consultationFee = $ProfileData.ConsultationFee
        hospitalName    = $ProfileData.HospitalName
        clinicAddress   = $ProfileData.ClinicAddress
        city            = $ProfileData.City
        state           = $ProfileData.State
        country         = $ProfileData.Country
        languagesSpoken = $ProfileData.LanguagesSpoken
    }) | ConvertTo-Json

    $headers = @{ Authorization = "Bearer $Token" }
    $resp = Invoke-RestMethod -Uri $PROFILE_URL -Method POST -Headers $headers -Body $bodyJson -ContentType "application/json" -TimeoutSec 15

    if ($resp.success -ne $true) {
        throw "Profile submit failed (success=false): $($resp.message)"
    }
    return $resp.data
}

function Invoke-VerifyProfile {
    param([string]$Token)

    $headers = @{ Authorization = "Bearer $Token" }
    $resp = Invoke-RestMethod -Uri $PROFILE_ME_URL -Method GET -Headers $headers -ContentType "application/json" -TimeoutSec 15

    if ($resp.success -ne $true) {
        throw "Profile fetch failed (success=false): $($resp.message)"
    }
    return $resp.data
}

# ===========================================================================
# PRE-FLIGHT CHECKS
# ===========================================================================
Write-Log "INFO" "=== Phase 2 - Doctor Profile Completion Seed ==="
Write-Log "INFO" "Target: $BASE_URL"

if (-not (Test-Path $CSV_PATH)) {
    Write-Log "ERROR" "doctor_credentials.csv not found at: $CSV_PATH"
    Write-Log "ERROR" "Run Phase 1 (doctor_registration_seed.ps1) first."
    exit 1
}

$credentials = Import-Csv -Path $CSV_PATH -Encoding UTF8
$activeDoctors = $credentials | Where-Object { $_.Status -in @("REGISTERED", "ALREADY_REGISTERED") }

Write-Log "INFO" "Loaded $($activeDoctors.Count) registered doctors from credentials CSV."

if ($activeDoctors.Count -eq 0) {
    Write-Log "ERROR" "No successfully registered doctors in CSV. Re-run Phase 1 first."
    exit 1
}

$missingProfiles = @()
foreach ($doc in $activeDoctors) {
    if (-not $PROFILES.ContainsKey($doc.Email)) {
        $missingProfiles += $doc.Email
    }
}
if ($missingProfiles.Count -gt 0) {
    Write-Log "ERROR" "Profile data missing for: $($missingProfiles -join ', ')"
    exit 1
}

Write-Log "INFO" "All $($activeDoctors.Count) doctors have profile data. Starting profile completion..."

# ===========================================================================
# PROFILE COMPLETION LOOP
# ===========================================================================
$results      = New-Object System.Collections.ArrayList
$successCount = 0
$failCount    = 0

foreach ($doc in $activeDoctors) {
    $profileData = $PROFILES[$doc.Email]
    $completed   = $false
    $attempt     = 0
    $lastError   = "unknown"

    Write-Log "INFO" "--- Processing [$($doc.DoctorName)] ($($doc.Email)) ---"

    while ((-not $completed) -and ($attempt -lt $MAX_RETRIES)) {
        $attempt++
        Write-Log "INFO" "Attempt $attempt of $MAX_RETRIES - logging in..."

        $loginOk    = $false
        $token      = $null
        $loginError = $null

        try {
            $token   = Invoke-DoctorLogin -Email $doc.Email -Password $doc.Password
            $loginOk = $true
        } catch {
            $loginError = $_.ToString()
        }

        if (-not $loginOk) {
            $lastError = "Login failed: $loginError"
            Write-Log "WARN" $lastError
            if ($attempt -lt $MAX_RETRIES) { Start-Sleep -Seconds $RETRY_DELAY }
            continue
        }

        Write-Log "INFO" "Login OK. Submitting profile..."

        $submitOk    = $false
        $submitError = $null
        $submitStatus = 0

        try {
            $null    = Invoke-SubmitProfile -Token $token -ProfileData $profileData
            $submitOk = $true
        } catch {
            $submitError = $_
            if ($submitError.Exception.Response -ne $null) {
                $submitStatus = [int]$submitError.Exception.Response.StatusCode
            }
        }

        if ($submitOk -or ($submitStatus -eq 409)) {
            if ($submitStatus -eq 409) {
                Write-Log "WARN" "[$($doc.DoctorName)] profile already completed (409). Treating as success."
            } else {
                Write-Log "INFO" "Profile submitted. Verifying..."
            }

            $verifyOk    = $false
            $verifyData  = $null
            $verifyError = $null

            try {
                $verifyData = Invoke-VerifyProfile -Token $token
                $verifyOk   = $true
            } catch {
                $verifyError = $_.ToString()
            }

            if (-not $verifyOk) {
                $lastError = "Verification fetch failed: $verifyError"
                Write-Log "WARN" $lastError
                if ($attempt -lt $MAX_RETRIES) { Start-Sleep -Seconds $RETRY_DELAY }
                continue
            }

            if ($verifyData.isProfileCompleted -ne $true) {
                $lastError = "isProfileCompleted is still false after submit. Missing required fields?"
                Write-Log "WARN" $lastError
                $attempt = $MAX_RETRIES
                continue
            }

            if ($verifyData.approvalStatus -ne "Pending") {
                $lastError = "Unexpected approvalStatus: $($verifyData.approvalStatus)"
                Write-Log "WARN" $lastError
            }

            Write-Log "SUCCESS" "[$($doc.DoctorName)] isProfileCompleted=true | ApprovalStatus=$($verifyData.approvalStatus)"
            $null = $results.Add([PSCustomObject]@{
                DoctorName          = $doc.DoctorName
                Email               = $doc.Email
                Specialization      = $profileData.Specialization
                LicenseNumber       = $profileData.LicenseNumber
                Hospital            = $profileData.HospitalName
                City                = $profileData.City
                IsProfileCompleted  = $verifyData.isProfileCompleted
                ApprovalStatus      = $verifyData.approvalStatus
                Status              = "PROFILE_COMPLETED"
                FailureReason       = ""
            })
            $successCount++
            $completed = $true

        } else {
            $errMsg = $submitError.ToString()
            try {
                if ($submitError.ErrorDetails.Message) {
                    $parsed = $submitError.ErrorDetails.Message | ConvertFrom-Json
                    if ($parsed.message) { $errMsg = $parsed.message }
                }
            } catch { }
            $lastError = $errMsg

            if ($submitStatus -eq 400) {
                Write-Log "ERROR" "Validation error for [$($doc.DoctorName)]: $lastError - skipping retries"
                $attempt = $MAX_RETRIES
            } else {
                Write-Log "WARN" "Attempt $attempt failed for [$($doc.DoctorName)]: $lastError"
                if ($attempt -lt $MAX_RETRIES) { Start-Sleep -Seconds $RETRY_DELAY }
            }
        }
    }

    if (-not $completed) {
        Write-Log "ERROR" "FAILED after $MAX_RETRIES attempts: $($doc.DoctorName) | $lastError"
        $null = $results.Add([PSCustomObject]@{
            DoctorName          = $doc.DoctorName
            Email               = $doc.Email
            Specialization      = $profileData.Specialization
            LicenseNumber       = $profileData.LicenseNumber
            Hospital            = $profileData.HospitalName
            City                = $profileData.City
            IsProfileCompleted  = $false
            ApprovalStatus      = "Unknown"
            Status              = "FAILED"
            FailureReason       = $lastError
        })
        $failCount++
    }
}

# ===========================================================================
# SAVE RESULTS
# ===========================================================================
Write-Log "INFO" "Saving profile results: $RESULTS_CSV"
$results | Export-Csv -Path $RESULTS_CSV -NoTypeInformation -Encoding UTF8
Write-Log "SUCCESS" "Profile results saved: $RESULTS_CSV"

# ===========================================================================
# SUMMARY
# ===========================================================================
Write-Log "INFO" "============================================================"
Write-Log "INFO" "PHASE 2 SUMMARY"
Write-Log "INFO" "  Total processed     : $($activeDoctors.Count)"
Write-Log "INFO" "  Profiles completed  : $successCount"
Write-Log "INFO" "  Failed              : $failCount"
Write-Log "INFO" "============================================================"

if ($failCount -gt 0) {
    Write-Log "ERROR" "PHASE 2 INCOMPLETE - $failCount failure(s)."
    Write-Log "ERROR" "Review $LOG_PATH and $RESULTS_CSV for details."
    exit 1
} else {
    Write-Log "SUCCESS" "PHASE 2 COMPLETE - $successCount / $($activeDoctors.Count) profiles completed."
    Write-Log "SUCCESS" "All doctors visible in Admin -> Pending Doctors with Approve button enabled."
    Write-Log "INFO" "Next: Log in as Admin and approve doctors at /admin/doctors/pending"
    exit 0
}
