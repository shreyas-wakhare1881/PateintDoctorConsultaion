using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Admin.Interfaces;

namespace PatientDoctorConsultation.Modules.Admin.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController(IAdminService adminService) : ControllerBase
{
    private readonly IAdminService _adminService = adminService;
    [HttpGet("doctors")]
    public IActionResult GetDoctors() => Ok();

    [HttpGet("consultations")]
    public IActionResult GetConsultations() => Ok();
}
