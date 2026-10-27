# AAPDA MATRIX Store-and-Forward Mesh Protocol

## Service UUID
- **Standard AAPDA Service UUID**: `0000FA11-0000-1000-8000-00805F9B34FB`

## Packet Format
Every off-grid packet follows this specification:

```json
{
  "messageId": "MSG_1730000000_8F3A29",
  "incidentId": "SOS_8F3A29",
  "originDeviceId": "NODE_ANDROID_A12B3C",
  "hopCount": 2,
  "maxHops": 5,
  "timestamp": 1730030000000,
  "expiresAt": 1730289200000,
  "payload": "{\"category\":\"LANDSLIDE\",\"priority\":\"CRITICAL\",\"lat\":31.1048,\"lng\":77.1734}",
  "checksum": "a8f3b2e9c1d044f2",
  "relayPath": ["NODE_ANDROID_A12B3C", "NODE_RELAY_F291", "GATEWAY_HQ"]
}
```

## Protocol Guardrails
1. **Loop Prevention & Deduplication**: Each device maintains an in-memory `HashSet<String>` and local database table of observed `messageId`s. Packets with existing IDs are immediately discarded.
2. **Hop Counter**: Max hops defaults to 5. Every forwarding node increments `hopCount`. If `hopCount > maxHops`, the packet is dropped to conserve network airtime.
3. **Expiration TTL**: 72-hour operational window matching standard Disaster SAR phases.
4. **Battery Guard Integration**: When a node's battery level drops to $\le 5\%$, the `BatteryGuardReceiver` switches the node from Continuous Advertising/Scanning to Low-Power Passive Receiver mode, reserving the remaining battery for life-saving incoming distress packets.
