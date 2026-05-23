using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace PatientDoctorConsultation.API.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // Register module services here
        return services;
    }
}
