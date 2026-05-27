using Microsoft.Extensions.Options;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PatientDoctorConsultation.Shared.Config;

namespace PatientDoctorConsultation.Infrastructure.Realtime.LiveKit;

public interface ILiveKitService
{
    Task<string> CreateRoomAsync(string roomName, CancellationToken ct = default);
    string GenerateAccessToken(string roomName, string participantIdentity, string participantName);
}

public sealed class LiveKitService(IOptions<LiveKitConfig> options, HttpClient httpClient)
    : ILiveKitService
{
    private readonly LiveKitConfig _config = options.Value;
    private readonly HttpClient _httpClient = httpClient;

    public Task<string> CreateRoomAsync(string roomName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(roomName))
            throw new ArgumentException("Room name is required.", nameof(roomName));

        // LiveKit can auto-create rooms on first participant join when enabled.
        // We still keep this method for future explicit room provisioning.
        return Task.FromResult(roomName);
    }

    public string GenerateAccessToken(string roomName, string participantIdentity, string participantName)
    {
        if (string.IsNullOrWhiteSpace(_config.ApiKey) || string.IsNullOrWhiteSpace(_config.ApiSecret))
            throw new InvalidOperationException("LiveKit ApiKey/ApiSecret are not configured.");

        if (string.IsNullOrWhiteSpace(roomName))
            throw new ArgumentException("Room name is required.", nameof(roomName));
        if (string.IsNullOrWhiteSpace(participantIdentity))
            throw new ArgumentException("Participant identity is required.", nameof(participantIdentity));

        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddHours(2);

        var grants = new Dictionary<string, object>
        {
            ["roomJoin"] = true,
            ["room"] = roomName,
            ["canPublish"] = true,
            ["canSubscribe"] = true,
        };

        var payload = new JwtPayload
        {
            [JwtRegisteredClaimNames.Iss] = _config.ApiKey,
            [JwtRegisteredClaimNames.Sub] = participantIdentity,
            ["name"] = string.IsNullOrWhiteSpace(participantName) ? participantIdentity : participantName,
            ["video"] = grants,
            [JwtRegisteredClaimNames.Nbf] = now.ToUnixTimeSeconds(),
            [JwtRegisteredClaimNames.Exp] = expiresAt.ToUnixTimeSeconds(),
            [JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString("N"),
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config.ApiSecret));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(new JwtHeader(credentials), payload);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
