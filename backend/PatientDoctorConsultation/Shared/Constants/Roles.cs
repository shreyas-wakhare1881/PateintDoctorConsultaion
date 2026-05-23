namespace PatientDoctorConsultation.Shared.Constants;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Doctor = "Doctor";
    public const string Patient = "Patient";

    public static readonly IReadOnlyList<string> All = [Admin, Doctor, Patient];
}
