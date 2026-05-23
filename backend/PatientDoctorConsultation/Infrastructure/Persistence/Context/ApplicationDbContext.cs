using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace PatientDoctorConsultation.Infrastructure.Persistence.Context;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Scan all loaded assemblies whose name starts with our root namespace.
        // This picks up IEntityTypeConfiguration<T> implementations from all module assemblies
        // without Infrastructure needing a direct compile-time reference to any module.
        var domainAssemblies = AppDomain.CurrentDomain
            .GetAssemblies()
            .Where(a => a.GetName().Name?.StartsWith("PatientDoctorConsultation") == true);

        foreach (var assembly in domainAssemblies)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(assembly);
        }

        base.OnModelCreating(modelBuilder);
    }
}
