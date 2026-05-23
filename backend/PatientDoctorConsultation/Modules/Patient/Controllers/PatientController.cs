using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Patient.Interfaces;

namespace PatientDoctorConsultation.Modules.Patient.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientController(IPatientService patientService) : ControllerBase
{
    [HttpGet("{id:guid}/profile")]
    public IActionResult GetProfile(Guid id) => Ok();

    [HttpPut("{id:guid}/profile")]
    public IActionResult UpdateProfile(Guid id) => Ok();
}
