using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Shared.Security;

namespace PatientDoctorConsultation.Infrastructure.Persistence.Seed;

/// <summary>
/// Seeds the default admin user on application startup using raw SQL.
///
/// Strategy: UPSERT — if the admin email already exists, do nothing.
/// This ensures the seeder is fully idempotent — safe to run on every startup.
///
/// Credentials are sourced exclusively from environment variables:
///   ADMIN_EMAIL    — default admin login email (fallback: admin@pdc.com)
///   ADMIN_PASSWORD — default admin plain-text password (fallback: Admin@123)
///
/// SECURITY: The default fallback password MUST be overridden via ADMIN_PASSWORD
/// environment variable and rotated on first production deployment.
/// Store ADMIN_PASSWORD in a secrets manager — never commit it to source control.
///
/// Raw SQL is used because Infrastructure has no compile-time reference to module
/// entity types (clean architecture boundary).
/// </summary>
public static class AdminSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        ILogger logger)
    {
        logger.LogInformation("[AdminSeeder] Starting admin seed check...");

        // ── Resolve credentials from environment ──────────────────────────────
        var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL")
                         ?? "admin@pdc.com";

        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD")
                            ?? "Admin@123";

        // ── UPSERT guard — equivalent to ON CONFLICT (Email) DO NOTHING ───────
        // SqlQueryRaw<int> requires the scalar column to be aliased as "Value".
        var count = await context.Database
            .SqlQueryRaw<int>(
                "SELECT COUNT(1)::int AS \"Value\" FROM \"Users\" WHERE \"Email\" = {0} AND \"Role\" = 'Admin'",
                adminEmail)
            .SingleAsync();

        if (count > 0)
        {
            logger.LogInformation(
                "[AdminSeeder] Admin with email '{Email}' already exists. Skipping seed.",
                adminEmail);
            return;
        }

        // ── Hash password — NEVER store plain text ────────────────────────────
        var passwordHash = PasswordHasher.Hash(adminPassword);
        var adminId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        // ── Insert seeded admin via parameterized raw SQL ─────────────────────
        await context.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO "Users" (
                "Id", "FullName", "Email", "PhoneNumber",
                "PasswordHash", "Role", "IsActive", "IsVerified",
                "CreatedAt", "CreatedBy"
            )
            VALUES (
                {0}, {1}, {2}, {3},
                {4}, 'Admin', true, true,
                {5}, 'system-seed'
            )
            """,
            adminId,
            "Platform Admin",
            adminEmail,
            "+910000000000",   // system placeholder — admin does not use phone auth
            passwordHash,
            now
        );

        logger.LogInformation(
            "[AdminSeeder] Default admin seeded successfully with email '{Email}'. " +
            "IMPORTANT: Change the default password before production deployment.",
            adminEmail);
    }
}


