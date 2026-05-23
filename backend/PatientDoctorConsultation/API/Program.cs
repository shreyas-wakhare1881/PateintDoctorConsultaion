using PatientDoctorConsultation.API.Extensions;
using PatientDoctorConsultation.API.Middleware;
using PatientDoctorConsultation.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddSwaggerDocumentation();
builder.Services.AddCorsPolicy(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddSignalR();

// ── Configuration binding ─────────────────────────────────────────────────────
builder.Services.Configure<PatientDoctorConsultation.API.Config.JwtConfig>(
    builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<PatientDoctorConsultation.API.Config.LiveKitConfig>(
    builder.Configuration.GetSection("LiveKit"));

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Middleware pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerDocumentation();
}

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

// ── Endpoints ─────────────────────────────────────────────────────────────────
app.MapControllers();
app.MapHub<ConsultationHub>("/hubs/consultation");
app.MapHub<NotificationHub>("/hubs/notification");

app.Run();

