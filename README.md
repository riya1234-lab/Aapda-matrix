# AAPDA MATRIX (आपदा मैट्रिक्स)

> **"One Tap. One Network. One Lifeline."**  
> Universal Emergency SOS and Multi-Hop Disaster Response Platform.

---

## 1. System Overview

**AAPDA MATRIX** is a full-stack, mission-critical emergency response application built to provide life-saving SOS signalling, live GPS tracking, authorized audio recording, tactical disaster triage, and off-grid communication fallback during natural disasters and everyday crises.

### Key Capabilities
- **Universal & Disaster SOS**: 1-Tap emergency distress beacon with accidental activation safeguards and no prerequisite sign-in barriers.
- **Multilingual Support**: Dynamic localized interface supporting **English**, **Marathi (मराठी)**, and **Hindi (हिंदी)** matching the reference screenshots.
- **Tactical Command Center**: Dark HUD mission control dashboard with Esri World Imagery Satellite maps, live reticle grids, real-time Socket.IO streaming, and search & rescue (SAR) dispatch controls.
- **AI Emergency Triage**: Powered by Google Gemini with a zero-latency, deterministic local rule-based NLP fallback engine (handles 100+ emergency keywords offline).
- **Offline Store-and-Forward Mesh**: Dexie IndexedDB persistent outbox queue in the web app, and a native Android/Kotlin module featuring BLE Mesh, Wi-Fi Direct, and Cellular SMS fallback.
- **Direct Calling**: One-touch verified national and regional helplines (112, 108, 100, 101, 1091, 1070).

---

## 2. Project Architecture & Structure

```
D:\antigravity\scratch\aapda-matrix/
├── client/                     # React + TypeScript + Vite + Tailwind CSS PWA
│   ├── public/                 # PWA manifest, service worker (sw.js), icons
│   ├── src/
│   │   ├── components/         # AppHeader, LocationStatus, EmergencyCard, SOSButton, IncidentMap, etc.
│   │   ├── context/            # LanguageContext, AuthContext, ConnectivityContext, IncidentContext
│   │   ├── hooks/              # useBattery, useGeolocation, useAudioRecorder, useSocket
│   │   ├── pages/              # LandingPortal, VictimDashboard, CommandCenterPage, etc.
│   │   ├── services/           # api.ts, offlineDb.ts (IndexedDB), socket.ts
│   │   ├── utils/              # Translations (en, mr, hi)
│   │   └── App.tsx             # React Router routing
│   └── package.json
│
├── server/                     # Node.js + Express + TypeScript + Socket.IO API Gateway
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma models (SQLite / PostgreSQL)
│   │   └── seed.ts             # Seed verified contacts, response teams, demo users, initial incidents
│   ├── src/
│   │   ├── controllers/        # Incident, AI, Contact, Team, Auth controllers
│   │   ├── services/           # AIService (Gemini + Local Fallback), MeshService
│   │   ├── sockets/            # Socket.IO real-time channels
│   │   ├── routes/             # REST endpoints
│   │   └── server.ts           # HTTP & Socket.IO server
│   ├── test/                   # Automated backend test suite (16 tests)
│   └── package.json
│
├── shared/                     # Shared TypeScript contracts
│   └── types/index.ts          # Incident, MeshPacket, Priority, EmergencyCategory
│
├── mobile/android/             # Native Android/Kotlin communication module
│   └── AapdaMatrix/            # Complete Gradle/Kotlin project with BLE Mesh, Wi-Fi Direct, SMS Fallback
│
├── docs/                       # Architecture, BLE Mesh Specs, PostgreSQL setup, API reference
├── .env.example
└── README.md
```

---

## 3. Quick Start & Execution Commands

### Prerequisites
- Node.js v18+ (tested on Node v24.18.0)
- npm v9+

### A. Start the Backend API & Socket Server
```bash
cd D:\antigravity\scratch\aapda-matrix\server
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```
*The server will start at `http://localhost:5000` with real database persistence and Socket.IO active.*

### B. Start the React Frontend Application
In a separate terminal:
```bash
cd D:\antigravity\scratch\aapda-matrix\client
npm install
npm run dev
```
*The client will start at `http://localhost:5173`.*

---

## 4. Running Automated Tests

Run the backend test suite:
```bash
cd D:\antigravity\scratch\aapda-matrix\server
npm test
```
**Test Results**: 16/16 Passed:
- AI Engine Local Fallback triage (Chest pain -> Medical Critical 108, Fire -> Fire 101, Landslide -> 1070)
- Database models and verified contact queries
- Incident creation, retrieval, status lifecycle, and history tracking
- Store-and-Forward mesh packet generation and SHA-256 checksum verification

---

## 5. Testing the End-to-End Workflows

1. **Gateway Portal (`/`)**:
   - Open `http://localhost:5173`.
   - Inspect the **"I NEED HELP"** (Victim Port) and **"COMMAND CENTER"** (Authority Portal) cards matching Screenshot 4.
2. **Victim Interface (`/home`)**:
   - Click "Open Victim App".
   - View real-time battery status and location protocol (`GPS ACTIVE`).
   - Switch language to **Marathi (मराठी)** in top bar -> interface instantly switches to Marathi matching Screenshot 1.
   - Select **Medical Emergency** -> enter note -> tap **ACTIVATE SOS** -> 5s audio countdown begins and incident is dispatched immediately.
3. **Command Center Mission Control (`/command-center`)**:
   - Open `http://localhost:5173/command-center` in another tab.
   - Observe tactical dark-mode dashboard matching Screenshot 2.
   - Observe the new incident marker appear on the satellite map with a pulsating red marker.
   - Click the incident in the sidebar or map popup, listen to the recorded voice log, assign an NDRF response team, and update status to **DISPATCHED**.
   - Note that status updates sync in real time back to the victim's screen via Socket.IO.
4. **Offline Mode & Sync**:
   - In browser DevTools, toggle Network to **Offline**.
   - Trigger SOS -> incident is safely queued in IndexedDB with pending status.
   - Toggle Network back to **Online** -> background sync triggers and synchronizes the incident to the backend.

---

## 6. Native Android Module & Hardware Testing

The Android module is located at `mobile/android/AapdaMatrix`.
- Open Android Studio and select `Open Existing Project` -> navigate to `D:\antigravity\scratch\aapda-matrix\mobile\android\AapdaMatrix`.
- Build the APK or run on an emulator/device:
  ```bash
  cd mobile\android\AapdaMatrix
  .\gradlew.bat assembleDebug
  ```
- **Bluetooth Low Energy**: Employs UUID `0000FA11-0000-1000-8000-00805F9B34FB` with 5s advertisement bursts.
- **Battery Guard**: When battery drops to $\le 5\%$, `BatteryGuardReceiver` switches to passive low-power mode.

---

## 7. Status Classification of Features

- **Implemented & Tested**:
  - React + TypeScript + Vite frontend with Tailwind CSS
  - Express.js + Socket.IO real-time backend
  - Database schema & migrations via Prisma ORM
  - Complete Universal SOS & 9-disaster subcategory SOS workflow
  - Multi-language localization (English, Marathi, Hindi)
  - Browser Geolocation API & MediaRecorder emergency audio recording
  - AI emergency triage engine with deterministic local NLP fallback
  - IndexedDB offline outbox queue & automatic reconnection sync
  - Tactical Command Center with Esri World Imagery Satellite Leaflet map
  - Direct telephone emergency helpline actions with safeguard modal
  - Comprehensive automated test suite (16 tests passing)

- **Implemented but requires Physical Hardware / Mobile Testing**:
  - Native Android BLE mesh advertising and scanning on physical Android phones
  - Wi-Fi Direct peer-to-peer transport socket exchange
  - Silent SMS transmission via cellular carrier SIM

- **Requires Optional External Credentials**:
  - `GEMINI_API_KEY`: Optional; if omitted, the local rule-based fallback handles triage instantly.
  - Production PostgreSQL connection string: Optional; SQLite is active out of the box for immediate development.
