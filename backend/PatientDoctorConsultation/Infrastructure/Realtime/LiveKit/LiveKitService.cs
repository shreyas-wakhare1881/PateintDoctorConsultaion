using Microsoft.Extensions.Options;
using PatientDoctorConsultation.API.Config;

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

    public Task<string> CreateRoomAsync(string roomName, CancellationToken ct = default)
        => throw new NotImplementedException("LiveKit room creation — implement with LiveKit SDK.");

    public string GenerateAccessToken(string roomName, string participantIdentity, string participantName)
        => throw new NotImplementedException("LiveKit JWT token generation — implement with LiveKit SDK.");
}
