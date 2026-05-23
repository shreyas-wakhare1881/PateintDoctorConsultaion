using Microsoft.AspNetCore.SignalR;

namespace PatientDoctorConsultation.Infrastructure.Realtime.SignalR;

public interface ISignalRNotificationService
{
    Task SendToUserAsync(string userId, string method, object payload, CancellationToken ct = default);
    Task SendToGroupAsync(string groupName, string method, object payload, CancellationToken ct = default);
}

public sealed class SignalRNotificationService<THub>(IHubContext<THub> hubContext)
    : ISignalRNotificationService where THub : Hub
{
    public Task SendToUserAsync(string userId, string method, object payload, CancellationToken ct = default)
        => hubContext.Clients.User(userId).SendAsync(method, payload, ct);

    public Task SendToGroupAsync(string groupName, string method, object payload, CancellationToken ct = default)
        => hubContext.Clients.Group(groupName).SendAsync(method, payload, ct);
}
