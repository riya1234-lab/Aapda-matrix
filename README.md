# AAPDA MATRIX (आपदा मैट्रिक्स)

> **"One Tap. One Network. One Lifeline."**  
> Universal Emergency SOS and Multi-Hop Disaster Response Platform — Unified Single-Directory Architecture.

---

## 1. System Overview

**AAPDA MATRIX** is a unified, full-stack, mission-critical emergency response application built to provide life-saving SOS signalling, live GPS tracking, authorized audio recording, tactical disaster triage, and off-grid communication fallback during natural disasters and everyday crises.

The application is consolidated into a **single unified directory**, allowing a single server process (`PORT=5000`) to provide both the Express + Socket.IO REST/WebSocket APIs and serve the compiled React SPA static client with wildcard fallback for one-command cloud deployment.

### Key Capabilities & New Enhancements
- **Unified Single-Directory Architecture**: One root `package.json`, single `npm install`, single `npm run build`, and single `npm start` command for both client and backend.
- **Strict Real-Time GPS Lock**: Default New Delhi fallback removed. SOS trigger is locked until real GPS coordinates are acquired from the device hardware.
- **Multilingual Support Across All Features**: English, Marathi (मराठी), and Hindi (हिंदी) translations for all pages, disaster types, priorities, warnings, and dispatch notifications.
- **Predefined Emergency Circle**: Users can save and manage their family/close contacts in browser IndexedDB.
- **Battery Guard (< 10% Auto-Share)**: Detects battery drops below 10% and prepares/dispatches automated location SMS alerts to predefined emergency contacts.
- **Auto-Sync Offline Pending Queue**: Distress beacons dispatched when offline are safely queued in Dexie IndexedDB. When internet connectivity is restored, the queue auto-syncs to the Command Center.
- **Strict Bidirectional Route Guards**: Victims cannot access the tactical Command Center, and Command Center officers cannot access victim creation flows without proper authorization.
- **Direct Phone Dialer Keypad**: Emergency directory entries use native `tel:` links that immediately launch the device phone dialer keypad with the number pre-filled.
- **Calamity-Specific Helplines**: Tailored emergency numbers per disaster (Fire: 101, Flood/Cyclone: 1070/1077, Coast Guard: 1554, Childline: 1098, National Emergency: 112).
- **Dynamic Proportional SOS Priorities**: Allows users and AI triage to classify incidents into Critical, High, Moderate, and Low priorities.
- **Nearest Tactical Units & ETA**: Command Center calculates Euclidean/Haversine spherical distance and tactical travel ETAs to assign the closest active units.
- **Real Active Mesh Relay Nodes**: Command Center monitors real active delay-tolerant mesh relay nodes persisted in the database.
- **"IN_ACTION" Status & Real-Time Victim Alert**: Dispatching a unit updates status to `IN_ACTION` and emits a real-time WebSocket alert informing the victim that *"Help is on the way!"*.

---

## 2. Unified Directory Architecture

```
D:\antigravity\scratch\aapda-matrix/
├── src/
│   ├── client/                 # React 19 + TypeScript + Vite + Tailwind CSS
│   │   ├── components/         # LocationStatus, SOSButton, EmergencyCallButton, IncidentMap, etc.
│   │   ├── context/            # LanguageContext, AuthContext, ConnectivityContext, IncidentContext
│   │   ├── hooks/              # useGeolocation, useBattery, useAudioRecorder, useSocket
│   │   ├── pages/              # LandingPortal, VictimDashboard, CommandCenterPage, ContactsPage, etc.
│   │   ├── services/           # api.ts, offlineDb.ts (Dexie IndexedDB), socket.ts
│   │   ├── utils/              # translations.ts (English, Marathi, Hindi)
│   │   └── App.tsx             # Role-guarded routing
│   │
│   ├── server/                 # Express + Socket.IO + TypeScript API Gateway
│   │   ├── controllers/        # incidentController, teamController, aiController, authController
│   │   ├── routes/             # incidentRoutes, teamRoutes, aiRoutes, authRoutes
│   │   ├── services/           # aiService (Gemini + Local Fallback), meshService
│   │   ├── sockets/            # socket.io real-time gateway (dispatch alerts)
│   │   ├── app.ts              # Express configuration & static client serving
│   │   └── server.ts           # HTTP & Socket.IO server entry point
│   │
│   └── shared/                 # Unified shared TypeScript contracts
│       └── types/index.ts      # Incident, Priority, RelayNode, DispatchAlertPayload
│
├── prisma/                     # Database ORM
│   ├── schema.prisma           # Prisma schema (Incidents, Teams, RelayNodes, Contacts)
│   ├── seed.ts                 # Real emergency contacts, tactical response teams, mesh relay nodes
│   └── dev.db                  # SQLite database
│
├── public/                     # Web app manifest, service worker (sw.js), icons
├── uploads/                    # Persisted emergency audio recordings
├── test/                       # Automated API test suite (16 tests)
├── dist/                       # Production output (dist/client and dist/server)
├── .env                        # Local environment variables
├── .env.example                # Environment configuration template
├── package.json                # Unified root package.json
├── tsconfig.json               # Frontend TypeScript configuration
├── tsconfig.server.json        # Backend TypeScript configuration
├── vite.config.ts              # Vite bundling & dev proxy
└── README.md
```

---

## 3. Quick Start & Execution

### Prerequisites
- Node.js v18+ (tested on Node v24.18.0)
- npm v9+

### Single Command Setup & Run (Development)
```bash
# 1. Install all dependencies at the root
npm install

# 2. Synchronize database and seed verified contacts, teams, and nodes
npm run prisma:push
npm run prisma:seed

# 3. Start unified development mode (Vite client on :5173 + API server on :5000)
npm run dev
```

### Production Build & Deployment
In production, a single server process serves both the backend API and the static React SPA:
```bash
# Build both server (dist/server) and client (dist/client)
npm run build

# Start the unified server on PORT 5000
npm start
```
The application will be accessible at `http://localhost:5000` (or your configured `PORT`).

---

## 4. Running Automated Tests

Run the complete 16-test suite covering AI triage fallback, database models, incident creation, status transitions, and store-and-forward mesh packet generation:
```bash
npm test
```
**Test Results**: 16/16 Passed:
- AI Engine Local Fallback triage (Chest pain -> Medical Critical 108, Fire -> Fire 101, Landslide -> 1070)
- Database models and verified contact queries
- Incident creation, retrieval, status lifecycle, and history tracking
- Store-and-Forward mesh packet generation and SHA-256 checksum verification

---

## 5. End-to-End Workflow Verification

1. **Victim Interface (`/home`)**:
   - Access `http://localhost:5000/home`.
   - GPS lock check prevents SOS activation until real device coordinates are found.
   - Switch language (English / मराठी / हिंदी) to see immediate UI localization.
   - Open **Emergency Directory** (`/contacts`) -> Click any emergency service to launch the phone dialer keypad directly (`tel:112`, `tel:108`, etc.).
   - Switch to **Personal Contacts** tab -> Add emergency contacts; observe battery alert when battery is low.
   - Trigger SOS -> Audio recording countdown triggers and uploads incident with selected priority.
2. **Command Center (`/command-center`)**:
   - Access `http://localhost:5000/command-center`.
   - View incident list, priority badges, and playable emergency audio player.
   - Click an incident -> View nearest tactical units sorted by Haversine distance and dynamic travel ETA.
   - Click **"DISPATCH UNIT"** -> Unit is assigned, status transitions to `IN_ACTION`, and victim immediately receives the real-time `"🚨 HELP IS ON THE WAY!"` alert.
3. **Offline Store-and-Forward Sync**:
   - Disconnect network in browser -> Trigger SOS -> Incident is held locally in IndexedDB pending queue.
   - Reconnect network -> Offline sync service detects online status and transmits pending beacons to the server.
