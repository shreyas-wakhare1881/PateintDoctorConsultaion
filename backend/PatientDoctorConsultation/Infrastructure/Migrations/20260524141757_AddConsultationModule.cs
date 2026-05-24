using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PatientDoctorConsultation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddConsultationModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiSummary",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "ScheduledAt",
                table: "Consultations");

            migrationBuilder.RenameColumn(
                name: "StartedAt",
                table: "Consultations",
                newName: "MeetingStartedAt");

            migrationBuilder.RenameColumn(
                name: "RoomId",
                table: "Consultations",
                newName: "MeetingLink");

            migrationBuilder.RenameColumn(
                name: "EndedAt",
                table: "Consultations",
                newName: "MeetingEndedAt");

            migrationBuilder.AlterColumn<string>(
                name: "Symptoms",
                table: "Consultations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Consultations",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Consultations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(5000)",
                oldMaxLength: 5000,
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AvailabilityId",
                table: "Consultations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "Consultations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelledBy",
                table: "Consultations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ConsultationFeeSnapshot",
                table: "Consultations",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ConsultationNumber",
                table: "Consultations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ConsultationType",
                table: "Consultations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Consultations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "EndTime",
                table: "Consultations",
                type: "time without time zone",
                nullable: false,
                defaultValue: new TimeOnly(0, 0, 0));

            migrationBuilder.AddColumn<bool>(
                name: "IsFollowUp",
                table: "Consultations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MeetingRoomId",
                table: "Consultations",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentConsultationId",
                table: "Consultations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "ScheduledDate",
                table: "Consultations",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<TimeOnly>(
                name: "StartTime",
                table: "Consultations",
                type: "time without time zone",
                nullable: false,
                defaultValue: new TimeOnly(0, 0, 0));

            migrationBuilder.AddColumn<string>(
                name: "TimeZone",
                table: "Consultations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ConsultationStatusHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsultationId = table.Column<Guid>(type: "uuid", nullable: false),
                    OldStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NewStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ChangedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsultationStatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConsultationStatusHistories_Consultations_ConsultationId",
                        column: x => x.ConsultationId,
                        principalTable: "Consultations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Consultations_AvailabilityId",
                table: "Consultations",
                column: "AvailabilityId");

            migrationBuilder.CreateIndex(
                name: "IX_Consultations_DeletedAt_Active",
                table: "Consultations",
                column: "DeletedAt",
                filter: "\"DeletedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Consultations_ParentConsultationId",
                table: "Consultations",
                column: "ParentConsultationId");

            migrationBuilder.CreateIndex(
                name: "IX_Consultations_ScheduledDate_DoctorId",
                table: "Consultations",
                columns: new[] { "ScheduledDate", "DoctorId" });

            migrationBuilder.CreateIndex(
                name: "IX_Consultations_Status",
                table: "Consultations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "UQ_Consultations_ConsultationNumber",
                table: "Consultations",
                column: "ConsultationNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConsultationStatusHistories_ConsultationId",
                table: "ConsultationStatusHistories",
                column: "ConsultationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Consultations_Consultations_ParentConsultationId",
                table: "Consultations",
                column: "ParentConsultationId",
                principalTable: "Consultations",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Consultations_DoctorAvailabilities_AvailabilityId",
                table: "Consultations",
                column: "AvailabilityId",
                principalTable: "DoctorAvailabilities",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Consultations_Doctors_DoctorId",
                table: "Consultations",
                column: "DoctorId",
                principalTable: "Doctors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Consultations_Patients_PatientId",
                table: "Consultations",
                column: "PatientId",
                principalTable: "Patients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Consultations_Consultations_ParentConsultationId",
                table: "Consultations");

            migrationBuilder.DropForeignKey(
                name: "FK_Consultations_DoctorAvailabilities_AvailabilityId",
                table: "Consultations");

            migrationBuilder.DropForeignKey(
                name: "FK_Consultations_Doctors_DoctorId",
                table: "Consultations");

            migrationBuilder.DropForeignKey(
                name: "FK_Consultations_Patients_PatientId",
                table: "Consultations");

            migrationBuilder.DropTable(
                name: "ConsultationStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_Consultations_AvailabilityId",
                table: "Consultations");

            migrationBuilder.DropIndex(
                name: "IX_Consultations_DeletedAt_Active",
                table: "Consultations");

            migrationBuilder.DropIndex(
                name: "IX_Consultations_ParentConsultationId",
                table: "Consultations");

            migrationBuilder.DropIndex(
                name: "IX_Consultations_ScheduledDate_DoctorId",
                table: "Consultations");

            migrationBuilder.DropIndex(
                name: "IX_Consultations_Status",
                table: "Consultations");

            migrationBuilder.DropIndex(
                name: "UQ_Consultations_ConsultationNumber",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "AvailabilityId",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "ConsultationFeeSnapshot",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "ConsultationNumber",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "ConsultationType",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "IsFollowUp",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "MeetingRoomId",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "ParentConsultationId",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "ScheduledDate",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "Consultations");

            migrationBuilder.DropColumn(
                name: "TimeZone",
                table: "Consultations");

            migrationBuilder.RenameColumn(
                name: "MeetingStartedAt",
                table: "Consultations",
                newName: "StartedAt");

            migrationBuilder.RenameColumn(
                name: "MeetingLink",
                table: "Consultations",
                newName: "RoomId");

            migrationBuilder.RenameColumn(
                name: "MeetingEndedAt",
                table: "Consultations",
                newName: "EndedAt");

            migrationBuilder.AlterColumn<string>(
                name: "Symptoms",
                table: "Consultations",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Consultations",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Consultations",
                type: "character varying(5000)",
                maxLength: 5000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiSummary",
                table: "Consultations",
                type: "character varying(10000)",
                maxLength: 10000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledAt",
                table: "Consultations",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
