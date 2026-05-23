using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Doctor.Interfaces;

namespace PatientDoctorConsultation.Modules.Doctor.Controllers;

[ApiController]
[Route("api/doctors")]
[Authorize]
public class DoctorController(IDoctorService doctorService) : ControllerBase
{
    [HttpGet("{id:guid}/profile")]
    public IActionResult GetProfile(Guid id) => Ok();

    [HttpPut("{id:guid}/availability")]
    public IActionResult SetAvailability(Guid id) => Ok();
}
