# Consultation Module — Flow

## Booking Flow
1. Patient sends POST /api/consultations.
2. ConsultationService validates slot availability.
3. Creates Consultation record with Status=Booked.
4. LiveKit service generates room token.
5. NotificationHub broadcasts to Doctor via SignalR.
6. Response includes roomId and LiveKit token.

## Video Call Flow
1. Patient/Doctor join frontend video-call/[roomId] page.
2. LiveKit WebRTC session established.
3. SignalR ConsultationHub maintains presence.

## AI Summary Flow
1. On consultation complete, transcript sent to ai-services.
2. FastAPI → BioMistral generates clinical summary.
3. Summary stored in Consultations.AiSummary.
