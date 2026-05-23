import * as signalR from '@microsoft/signalr';

export function buildHubConnection(hubUrl: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem('access_token') ?? '';
        }
        return '';
      },
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}
