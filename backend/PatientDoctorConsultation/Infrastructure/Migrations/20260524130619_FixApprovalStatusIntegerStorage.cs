using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PatientDoctorConsultation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixApprovalStatusIntegerStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Convert ApprovalStatus from varchar(50) → integer.
            // Handles two cases:
            //   'Pending'/'Approved'/'Rejected'/'Suspended' — written by EF Core HasConversion<string>()
            //   '0'/'1'/'2'/'3'                             — written by direct DB edits
            migrationBuilder.Sql(@"
                ALTER TABLE ""Doctors""
                ALTER COLUMN ""ApprovalStatus"" TYPE integer
                USING CASE ""ApprovalStatus""
                    WHEN 'Pending'   THEN 0
                    WHEN 'Approved'  THEN 1
                    WHEN 'Rejected'  THEN 2
                    WHEN 'Suspended' THEN 3
                    ELSE ""ApprovalStatus""::integer
                END;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Doctors""
                ALTER COLUMN ""ApprovalStatus"" TYPE character varying(50)
                USING CASE ""ApprovalStatus""
                    WHEN 0 THEN 'Pending'
                    WHEN 1 THEN 'Approved'
                    WHEN 2 THEN 'Rejected'
                    WHEN 3 THEN 'Suspended'
                    ELSE 'Pending'
                END;
            ");
        }
    }
}
