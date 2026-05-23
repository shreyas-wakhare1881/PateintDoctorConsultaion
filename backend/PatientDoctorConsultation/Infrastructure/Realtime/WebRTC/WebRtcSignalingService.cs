namespace PatientDoctorConsultation.Infrastructure.Realtime.WebRTC;

/// <summary>
/// WebRTC signaling support — ICE candidates and SDP offer/answer
/// are exchanged via the ConsultationHub (SignalR).
/// This service handles any server-side WebRTC coordination logic.
/// </summary>
public interface IWebRtcSignalingService
{
    Task HandleOfferAsync(string roomId, string senderId, string sdpOffer, CancellationToken ct = default);
    Task HandleAnswerAsync(string roomId, string senderId, string sdpAnswer, CancellationToken ct = default);
    Task HandleIceCandidateAsync(string roomId, string senderId, string candidate, CancellationToken ct = default);
}

public sealed class WebRtcSignalingService : IWebRtcSignalingService
{
    public Task HandleOfferAsync(string roomId, string senderId, string sdpOffer, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task HandleAnswerAsync(string roomId, string senderId, string sdpAnswer, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task HandleIceCandidateAsync(string roomId, string senderId, string candidate, CancellationToken ct = default)
        => throw new NotImplementedException();
}
