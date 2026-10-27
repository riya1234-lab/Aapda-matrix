# AAPDA MATRIX REST & Socket.IO API Reference

Base URL: `http://localhost:5000/api`

## REST Endpoints

### 1. Incidents
- `POST /api/incidents`: Register new distress SOS.
  - Body: `{ emergencyCategory, priority, description, latitude, longitude, locationAccuracy, batteryLevel }`
  - Returns: `{ incident, deliveryStatus, acknowledgementReceived }`
- `GET /api/incidents`: Fetch incidents (supports `?status=`, `?priority=`, `?category=`, `?search=`).
- `GET /api/incidents/:id`: Fetch complete incident details including attachments and audit history.
- `PATCH /api/incidents/:id/status`: Update incident status (`PENDING`, `ACKNOWLEDGED`, `DISPATCHED`, `EN_ROUTE`, `ON_SCENE`, `RESOLVED`).
- `POST /api/incidents/:id/location`: Update GPS coordinates.
- `POST /api/incidents/:id/audio`: Upload multipart form-data 5s voice SOS recording.
- `GET /api/incidents/:id/audio/:attachmentId`: Stream protected emergency audio log.
- `POST /api/incidents/:id/acknowledgement`: Record server acknowledgement.
- `POST /api/incidents/relay/mesh`: Intake off-grid store-and-forward mesh packet.

### 2. AI Triage Engine
- `POST /api/ai/classify`: Classify natural language distress input.
  - Body: `{ description: "Kitchen fire with heavy smoke" }`
  - Returns: `{ category, priority, rationale, recommendedActions, requiresImmediateServices, suggestedEmergencyNumber, isFallback }`

### 3. Emergency Contacts & Response Teams
- `GET /api/emergency-contacts`: Retrieve verified regional emergency helplines.
- `GET /api/response-teams`: Retrieve all tactical SAR, Medical, and Fire units.
- `POST /api/response-teams/assign`: Assign response team to incident (`{ incidentId, responseTeamId }`).

### 4. Health & Diagnostics
- `GET /api/health`: Verify backend gateway and database connectivity.

## Socket.IO Events
- Channel: `command_center`
  - `incident:new`: Emitted immediately when an SOS is created or relayed.
  - `incident:updated`: Emitted when status changes.
  - `incident:location`: Emitted on live GPS update.
  - `incident:audio_added`: Emitted when voice recording uploads.
