using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PatientDoctorConsultation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNlpSearchAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SearchQueries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: true),
                    Query = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ParsedIntentJson = table.Column<string>(type: "text", nullable: true),
                    ResultCount = table.Column<int>(type: "integer", nullable: false),
                    SearchSource = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "nlp"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SearchQueries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SearchQueries_CreatedAt",
                table: "SearchQueries",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SearchQueries_PatientId",
                table: "SearchQueries",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_SearchQueries_SearchSource",
                table: "SearchQueries",
                column: "SearchSource");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SearchQueries");
        }
    }
}
