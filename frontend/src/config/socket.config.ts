import { env } from './env';

export const socketConfig = {
  consultationHub: `${env.signalrHubUrl}/consultation`,
  notificationHub: `${env.signalrHubUrl}/notification`,
  options: {
    withCredentials: true,
    reconnectDelays: [0, 2000, 5000, 10000, 30000],
  },
  events: {
    consultationStatusChanged: 'ConsultationStatusChanged',
    incomingCall: 'IncomingCall',
    callEnded: 'CallEnded',
    newNotification: 'NewNotification',
    webRtcOffer: 'WebRtcOffer',
    webRtcAnswer: 'WebRtcAnswer',
    webRtcIceCandidate: 'WebRtcIceCandidate',
    doctorStatusUpdated: 'DoctorStatusUpdated',
  },
} as const;
