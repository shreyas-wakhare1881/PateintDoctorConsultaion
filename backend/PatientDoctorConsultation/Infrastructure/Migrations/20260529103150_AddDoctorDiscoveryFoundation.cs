using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PatientDoctorConsultation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorDiscoveryFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CityNormalized",
                table: "Doctors",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SpecializationNormalized",
                table: "Doctors",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_CityNormalized",
                table: "Doctors",
                column: "CityNormalized");

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_ConsultationFee",
                table: "Doctors",
                column: "ConsultationFee");

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_Discovery_Composite",
                table: "Doctors",
                columns: new[] { "IsPubliclyVisible", "ApprovalStatus", "SpecializationNormalized", "CityNormalized" });

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_Discovery_Eligibility",
                table: "Doctors",
                columns: new[] { "IsPubliclyVisible", "ApprovalStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_ExperienceYears",
                table: "Doctors",
                column: "ExperienceYears");

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_SpecializationNormalized",
                table: "Doctors",
                column: "SpecializationNormalized");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Doctors_CityNormalized",
                table: "Doctors");

            migrationBuilder.DropIndex(
                name: "IX_Doctors_ConsultationFee",
                table: "Doctors");

            migrationBuilder.DropIndex(
                name: "IX_Doctors_Discovery_Composite",
                table: "Doctors");

            migrationBuilder.DropIndex(
                name: "IX_Doctors_Discovery_Eligibility",
                table: "Doctors");

            migrationBuilder.DropIndex(
                name: "IX_Doctors_ExperienceYears",
                table: "Doctors");

            migrationBuilder.DropIndex(
                name: "IX_Doctors_SpecializationNormalized",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "CityNormalized",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "SpecializationNormalized",
                table: "Doctors");
        }
    }
}
