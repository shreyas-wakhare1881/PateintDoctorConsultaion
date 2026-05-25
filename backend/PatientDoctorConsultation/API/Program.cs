using PatientDoctorConsultation.API.Extensions;
using PatientDoctorConsultation.API.Middleware;
using PatientDoctorConsultation.API.Hubs;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Infrastructure.Persistence.Seed;
using PatientDoctorConsultation.Shared.Config;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddSwaggerDocumentation();
builder.Services.AddCorsPolicy(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddSignalR();

// ── Configuration binding ─────────────────────────────────────────────────────
builder.Services.Configure<JwtConfig>(
    builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<LiveKitConfig>(
    builder.Configuration.GetSection("LiveKit"));

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Database: migrate + seed ──────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider
        .GetRequiredService<ILogger<Program>>();

    // Apply any pending EF Core migrations automatically on startup.
    await db.Database.MigrateAsync();

    // Seed the default admin user (idempotent — skips if already exists).
    await AdminSeeder.SeedAsync(db, logger);
}

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

