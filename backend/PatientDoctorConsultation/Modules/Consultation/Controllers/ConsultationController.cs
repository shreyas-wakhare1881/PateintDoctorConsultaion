using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Consultation.Interfaces;

namespace PatientDoctorConsultation.Modules.Consultation.Controllers;

[ApiController]
[Route("api/consultations")]
[Authorize]
public class ConsultationController(IConsultationService consultationService) : ControllerBase
{
    [HttpPost]
    public IActionResult Book() => Ok();

    [HttpGet("{id:guid}")]
    public IActionResult GetById(Guid id) => Ok();

    [HttpPut("{id:guid}/complete")]
    public IActionResult Complete(Guid id) => Ok();
}
