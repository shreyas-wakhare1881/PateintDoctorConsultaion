using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PatientDoctorConsultation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSearchQueryV2Fields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "ConfidenceScore",
                table: "SearchQueries",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NormalizedQuery",
                table: "SearchQueries",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConfidenceScore",
                table: "SearchQueries");

            migrationBuilder.DropColumn(
                name: "NormalizedQuery",
                table: "SearchQueries");
        }
    }
}
