# AAPDA MATRIX System Architecture

AAPDA MATRIX ("One Tap. One Network. One Lifeline.") is an emergency distress response platform designed to maintain communications during catastrophic failures of public telecommunications infrastructure and everyday crises.

```
+-----------------------------------------------------------------------------------+
|                                  AAPDA MATRIX                                     |
+-----------------------------------------------------------------------------------+
                                         |
         +-------------------------------+-------------------------------+
         |                                                               |
         v                                                               v
+-----------------------+                                     +-----------------------+
|   VICTIM INTERFACE    |                                     |    COMMAND CENTER     |
|   (Web PWA / Mobile)  |                                     |   (Tactical Portal)   |
+-----------------------+                                     +-----------------------+
         |                                                               ^
         | 1. Universal / Disaster SOS                                   | Real-Time Alerts
         | 2. GPS & 5s Authorized Audio                                  | Live Satellite Map
         | 3. Local AI Triage Fallback                                   | Tactical SAR Dispatch
         |                                                               |
         +-------------------------------+-------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |    MULTI-TIER TRANSPORT FALLBACK      |
                     +---------------------------------------+
                                         |
     +-------------------+---------------+-------------------+-------------------+
     |                   |                                   |                   |
     v                   v                                   v                   v
+----------+       +-----------+                       +-----------+       +-----------+
| Primary  |       | Secondary |                       | Tertiary  |       | Quaternary|
| INTERNET |       | BLE MESH  |                       | WI-FI P2P |       | CELLULAR  |
|  (REST)  |       | (5s Loop) |                       |  (Direct) |       |   (SMS)   |
+----------+       +-----------+                       +-----------+       +-----------+
     |                   |                                   |                   |
     |                   +-----------------+-----------------+                   |
     |                                     |                                     |
     |                                     v                                     |
     |                        +-------------------------+                        |
     |                        | Nearby Relay Node Hop   |                        |
     |                        | (Store-and-Forward TTL) |                        |
     |                        +-------------------------+                        |
     |                                     | Gateway Uplink                      |
     +-------------------------------------+-------------------------------------+
                                           |
                                           v
                              +-------------------------+
                              | EXPRESS & SOCKET GATEWAY|
                              | Node.js / TypeScript    |
                              +-------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
        +-----------------------+                     +-----------------------+
        |   PRISMA ORM & DB     |                     |   AI TRIAGE ENGINE    |
        |  PostgreSQL / SQLite  |                     |  Gemini + Local NLP   |
        +-----------------------+                     +-----------------------+
```

## Transport Fallback Sequence
1. **Internet Delivery**: Instant transmission to Express REST API + Socket.IO.
2. **Bluetooth Low Energy (BLE) Mesh**: Multi-hop peer-to-peer loops with 5-second advertising bursts and SHA-256 deduplication.
3. **Wi-Fi Direct (P2P)**: High-bandwidth peer discovery for congested wireless environments.
4. **Cellular SMS Fallback**: Formatted compact SMS packets to Emergency 112 Dispatch.
5. **Local Persistent Queue**: IndexedDB (browser) or SQLite (Android) retaining incidents until a gateway connects.
