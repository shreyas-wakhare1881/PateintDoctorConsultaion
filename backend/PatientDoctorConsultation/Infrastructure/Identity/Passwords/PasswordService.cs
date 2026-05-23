namespace PatientDoctorConsultation.Infrastructure.Identity.Passwords;

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string password, string hashedPassword);
}

public sealed class PasswordService : IPasswordService
{
    public string Hash(string password)
        => Shared.Security.PasswordHasher.Hash(password);

    public bool Verify(string password, string hashedPassword)
        => Shared.Security.PasswordHasher.Verify(password, hashedPassword);
}
