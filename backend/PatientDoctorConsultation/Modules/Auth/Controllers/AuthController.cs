using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Auth.Interfaces;

namespace PatientDoctorConsultation.Modules.Auth.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    // POST api/auth/login
    [HttpPost("login")]
    public IActionResult Login() => Ok();

    // POST api/auth/send-otp
    [HttpPost("send-otp")]
    public IActionResult SendOtp() => Ok();

    // POST api/auth/verify-otp
    [HttpPost("verify-otp")]
    public IActionResult VerifyOtp() => Ok();
}
