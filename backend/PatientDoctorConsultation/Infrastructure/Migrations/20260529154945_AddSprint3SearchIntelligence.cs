using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace PatientDoctorConsultation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSprint3SearchIntelligence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DidYouMeanQuery",
                table: "SearchQueries",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "FuzzyMatchApplied",
                table: "SearchQueries",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TopResultId",
                table: "SearchQueries",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "SearchVector",
                table: "Doctors",
                type: "tsvector",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_SearchVector",
                table: "Doctors",
                column: "SearchVector")
                .Annotation("Npgsql:IndexMethod", "GIN");

            // ── Backfill SearchVector for all existing doctors ────────────────
            // Weights: Specialization=A, HospitalName=B, Qualification=B, City=C, Bio=D
            migrationBuilder.Sql(@"
                UPDATE ""Doctors""
                SET ""SearchVector"" =
                    setweight(to_tsvector('english', coalesce(""Specialization"", '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(""HospitalName"",   '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(""Qualification"",  '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(""City"",           '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(""Bio"",            '')), 'D');
            ");

            // ── Trigger function: keeps SearchVector current on INSERT/UPDATE ─
            migrationBuilder.Sql(@"
                CREATE OR REPLACE FUNCTION doctors_search_vector_trigger()
                RETURNS trigger AS $$
                BEGIN
                    NEW.""SearchVector"" :=
                        setweight(to_tsvector('english', coalesce(NEW.""Specialization"", '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(NEW.""HospitalName"",   '')), 'B') ||
                        setweight(to_tsvector('english', coalesce(NEW.""Qualification"",  '')), 'B') ||
                        setweight(to_tsvector('english', coalesce(NEW.""City"",           '')), 'C') ||
                        setweight(to_tsvector('english', coalesce(NEW.""Bio"",            '')), 'D');
                    RETURN NEW;
                END
                $$ LANGUAGE plpgsql;
            ");

            migrationBuilder.Sql(@"
                DROP TRIGGER IF EXISTS trg_doctors_search_vector ON ""Doctors"";
                CREATE TRIGGER trg_doctors_search_vector
                BEFORE INSERT OR UPDATE OF ""Specialization"", ""HospitalName"", ""Qualification"", ""City"", ""Bio""
                ON ""Doctors""
                FOR EACH ROW EXECUTE FUNCTION doctors_search_vector_trigger();
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TRIGGER IF EXISTS trg_doctors_search_vector ON ""Doctors"";");
            migrationBuilder.Sql(@"DROP FUNCTION IF EXISTS doctors_search_vector_trigger();");

            migrationBuilder.DropIndex(
                name: "IX_Doctors_SearchVector",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "DidYouMeanQuery",
                table: "SearchQueries");

            migrationBuilder.DropColumn(
                name: "FuzzyMatchApplied",
                table: "SearchQueries");

            migrationBuilder.DropColumn(
                name: "TopResultId",
                table: "SearchQueries");

            migrationBuilder.DropColumn(
                name: "SearchVector",
                table: "Doctors");
        }
    }
}
