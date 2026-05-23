using Microsoft.EntityFrameworkCore;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;

namespace PatientDoctorConsultation.Infrastructure.Persistence.Seed;

public static class AdminSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (await context.Database.CanConnectAsync())
        {
            // Seed default admin user if not present
            // TODO: Add admin entity and seed logic here
            await Task.CompletedTask;
        }
    }
}
