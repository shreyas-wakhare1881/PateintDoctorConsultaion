using Microsoft.AspNetCore.SignalR;

namespace PatientDoctorConsultation.API.Hubs;

public class ConsultationHub : Hub
{
    public async Task JoinRoom(string roomId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

    public async Task LeaveRoom(string roomId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

    public async Task SendSignal(string roomId, string signal)
        => await Clients.OthersInGroup(roomId).SendAsync("ReceiveSignal", Context.ConnectionId, signal);
}
