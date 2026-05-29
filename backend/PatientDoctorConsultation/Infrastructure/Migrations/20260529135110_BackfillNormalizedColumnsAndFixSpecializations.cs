using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PatientDoctorConsultation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BackfillNormalizedColumnsAndFixSpecializations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fix 1 outlier: Cardiologist → Cardiology (canonical specialty form)
            migrationBuilder.Sql("""
                UPDATE "Doctors"
                SET "Specialization" = 'Cardiology'
                WHERE "Specialization" = 'Cardiologist';
            """);

            // Backfill SpecializationNormalized = LOWER(TRIM(Specialization)) for all doctors
            migrationBuilder.Sql("""
                UPDATE "Doctors"
                SET "SpecializationNormalized" = LOWER(TRIM("Specialization"))
                WHERE "Specialization" IS NOT NULL;
            """);

            // Backfill CityNormalized = LOWER(TRIM(City)) for all doctors
            migrationBuilder.Sql("""
                UPDATE "Doctors"
                SET "CityNormalized" = LOWER(TRIM("City"))
                WHERE "City" IS NOT NULL;
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Clear normalized columns (they were NULL before this migration)
            migrationBuilder.Sql("""
                UPDATE "Doctors"
                SET "SpecializationNormalized" = NULL,
                    "CityNormalized" = NULL;
            """);
        }
    }
}
