# FalconRace Controller - Architecture Refactor

## Overview

This refactor restructures the FalconRace Controller app to be **operator-friendly and robust** by implementing:

1. **Singleton BleManager** - Single BLE provider across the app
2. **Central RaceContext** - Single source of truth for app state
3. **Defensive Parser** - Safe message parsing with timestamp stamping
4. **Simplified Operator Flow** - Clean, linear race execution pipeline
5. **Error Boundaries** - App-wide error handling to prevent crashes

## Architecture Diagram

```
App.js
├─ ErrorBoundary
│  └─ RaceProvider (RaceContext)
│     └─ BleProvider (BLE notifications)
│        └─ NavigationContainer
│           ├─ DashboardScreen
│           ├─ RaceControl
│           └─ Other screens
```

## Core Components

### 1. BleProvider (`src/ble/BleProvider.js`)

**Responsibility**: Single BLE connection manager with robust error handling

**Exports**:
- `<BleProvider>` - Context provider
- `useBle()` - Hook to access BLE methods

**Key Methods**:
```javascript
const {
  manager,                // react-native-ble-plx BleManager instance
  connectedDevice,        // Currently connected device or null
  scanning,               // Boolean scan state
  scannedDevices,         // Array of discovered devices
  connect(deviceId),      // Async connect with monitoring setup
  disconnect(),           // Graceful disconnect with cleanup
  write(command),         // Send command to device (auto base64 encode)
  startScan(onFound),     // Scan for FalconRace devices
  stopScan(),             // Stop scanning
} = useBle();
```

**Features**:
- ✅ Monitors TX characteristic for notifications
- ✅ Auto base64 decode of received messages
- ✅ Dispatches parsed messages to RaceContext
- ✅ Exponential backoff reconnection (capped at 30s)
- ✅ Try/catch wrapping on notification handler (never crashes app)
- ✅ Configurable reconnect behavior

**Message Flow**:
```
Device TX notification (base64)
  ↓ [auto decode]
  ↓ [append to buffer]
  ↓ [processStream parses JSON/text]
  ↓ [stamp ts_received = Date.now()]
  ↓ [dispatch to RaceContext based on type]
```

### 2. RaceContext (`src/context/RaceContext.js`)

**Responsibility**: Central state management for race operations

**State Shape**:
```javascript
{
  status: {
    connected: boolean,         // BLE connected (from device JSON)
    race_active: boolean,       // Race running
    battery: number,            // Master battery voltage
    progress_percent: number,
    ts_received: number,        // Last status update timestamp
    track_length_m: number,
  },
  nodes: {
    // id -> { id, lastSeen, battery, rssi, lat, lng, cameraPresent }
  },
  messages: [],                 // Last 200 incoming messages with timestamps
  detections: [],               // Falcon/motion detections
  selectedFalcon: null,          // Current selected falcon
  races: [],                    // Historical race results
  currentRace: null,            // Race in progress
}
```

**Actions**:
- `ADD_MESSAGE` - Append incoming message
- `SET_STATUS` - Update master status
- `UPDATE_NODE` - Update node heartbeat (lights)
- `ADD_DETECTION` - Log falcon/motion detection
- `SELECT_FALCON` - Choose falcon for race
- `START_RACE` - Begin new race
- `STOP_RACE` - End race (keep data)
- `SAVE_RACE` - Move currentRace to races history
- `RESET_RACE` - Clear race data
- `LOAD_PERSISTED_STATE` - Hydrate from AsyncStorage

**Persistence**:
- Saves `selectedFalcon` and `races` to AsyncStorage
- Loads on app startup

### 3. Parser Utility (`src/utils/parser.js`)

**Responsibility**: Safe message parsing and utilities

**Functions**:

#### `parseIncoming(raw: string)`
Parses a single message (JSON or text). **Never throws**.

```javascript
parseIncoming('{"type":"status","battery":3.9}')
// → { kind: 'json', data: { type: 'status', battery: 3.9 } }

parseIncoming('Hello device')
// → { kind: 'text', data: 'Hello device' }

parseIncoming('{"malformed}')
// → { kind: 'text', data: '{"malformed}' }  // Treated as text, not thrown
```

#### `processStream(bufferRef: {current: string})`
Extracts complete JSON objects and text from a buffered stream.

```javascript
const bufferRef = { current: '{"type":"status"}{"type":"heartbeat"}' };
const messages = processStream(bufferRef);
// → [
//     { kind: 'json', data: {...} },
//     { kind: 'json', data: {...} }
//   ]
// bufferRef.current is now '' (all consumed)
```

#### `formatTime(ms: number): string`
Formats milliseconds to `mm:ss.SS`

```javascript
formatTime(125050) // → "02:05.05"
formatTime(0)      // → "00:00.00"
```

#### `getNodeStatusColor(lastSeenMs: number): 'green' | 'orange' | 'red'`
Color indicator for node health:
- **Green**: `< 30s` ago
- **Orange**: `30-120s` ago
- **Red**: `> 120s` ago or unknown

#### `computeSpeed(distanceM: number, timeS: number)`
Returns `{ speedMps, speedKmh }`

### 4. ErrorBoundary (`src/components/ErrorBoundary.js`)

**Responsibility**: Catch render errors and show fallback UI

- Wraps entire app
- Shows error message and stack trace
- "Try Again" button to reset
- Never crashes the app during render

## Integration Guide

### Updated DashboardScreen

Structure (clean operator flow):

```
┌─────────────────────────────┐
│  MasterCard                 │  ← Connection status, battery, GPS sats
│  (BLE Connected / Syncing)  │
├─────────────────────────────┤
│  NodeStrip (colored lights)  │  ← Tap to see node details
├─────────────────────────────┤
│  RaceCard                    │  ← Select/Register Falcon, Pre-start checks
│  - Big Timer (mm:ss.SS)     │
│  - Start/Stop/Reset Buttons │
├─────────────────────────────┤
│  Live Message Log (last 50)  │  ← Detections, errors, info
│  Export Button               │  ← JSON/CSV report
└─────────────────────────────┘
```

### Updated RaceControl

- Simplified: remove mock BLE code
- Wire to `useRace()` and `useBle()`
- Read authoritative state from RaceContext
- Keep track visualizer
- Display computed speeds and split times from detections

## Message Types & Handling

### Status (Master)
```json
{
  "type": "status",
  "src": 1,
  "race_active": false,
  "track_length_m": 800,
  "connected": true,
  "battery": 3.9,
  "progress_percent": 0,
  "lat": 24.231,
  "lng": 55.776,
  "ts_iso": "2025-11-12T10:29:23Z"
}
```
**Dispatch**: `SET_STATUS` + add to messages log

### Heartbeat (Node)
```json
{
  "type": "heartbeat",
  "src": 3,
  "timestamp_ms": 624493,
  "battery": 3.8,
  "rssi": -20,
  "camera_present": false,
  "lat": 24.231473,
  "lng": 55.775889
}
```
**Dispatch**: `UPDATE_NODE` (lights) + add to messages log

### Falcon Detection
```json
{
  "type": "falcon",
  "src": 3,
  "timestamp_ms": 624500,
  "payload": "The Falcon Has Been Detected",
  "ts_iso": "2025-11-12T10:30:00Z"
}
```
**Dispatch**: `ADD_DETECTION` + haptic feedback + alert (configurable)

### Analytics
```json
{
  "type": "falcon_analytics",
  "detection_count": 2,
  "segment_speed_kmh": 42.35,
  "segment_distance_m": 200,
  "total_distance_m": 400,
  "average_speed_kmh": 40.54,
  "ts_iso": "2025-11-12T10:30:30Z"
}
```
**Dispatch**: `SET_ANALYTICS` (computed metrics)

## Start Race Flow

### Pre-Start Checklist (Modal)

User clicks **Start Race** → Modal shows:

1. ✓ Master connected?
2. ✓ Nodes online >= 3?
3. ✓ Master battery >= 3.3V?
4. ✓ GPS sats >= 5?
5. ✓ At least 1 camera present?

**If all pass**: Auto-enable Start button
**If any fail**: Show reason, block Start
**Force Start**: Type "START" to override checks

### Start Logic

1. Send `start_race` command via BLE
2. Start local timer (millisecond precision)
3. Clear detections array
4. Set `status.race_active = true`
5. Move to Live view

### During Race

- Timer ticks every ~50ms
- Each detection logged with `ts_received` and master `timestamp_ms`
- Compute segment speed: `distance / (t2 - t1)`
- Display live detections in message log

### Stop/Reset

**Stop**: Pause timer, keep data
**Reset**: Clear detections, timer back to 0:00, can start again

## Export Report

After race, user clicks **Export** → Generates:

### JSON Format
```json
{
  "race_id": "...",
  "falcon": { "name": "...", "id": "..." },
  "start_time_iso": "2025-11-12T10:30:00Z",
  "duration_s": 45.67,
  "total_distance_m": 800,
  "average_speed_kmh": 63.2,
  "messages": [
    {
      "type": "heartbeat",
      "src": 3,
      "ts_received": 1731403200000,
      "ts_master": 624493,
      "data": {...}
    },
    ...
  ],
  "checkpoints": [
    {
      "node_id": 3,
      "distance_m": 100,
      "time_s": 1.5,
      "speed_kmh": 60,
      "ts_received": 1731403201500,
      "ts_master": 625000
    },
    ...
  ]
}
```

### CSV Format
```
node_id,distance_m,time_s,speed_kmh,ts_received,ts_master
3,100,1.5,60,1731403201500,625000
3,200,3.2,62.5,1731403203000,626500
...
```

**Share via**: `Share.open()` or save to Documents folder

## Testing

### Unit Tests

Run:
```bash
npm test -- tests/parser.test.js
npm test -- tests/formatTime.test.js
```

### Manual Testing with nRF Connect

1. Open nRF Connect on your phone
2. Find FalconRace-Master BLE device
3. Connect and subscribe to TX characteristic (1235)
4. Send sample messages to RX characteristic (1236):

```
{"type":"status","src":1,"connected":true,"battery":3.9}
{"type":"heartbeat","src":3,"battery":3.8,"rssi":-20}
{"type":"falcon","src":3,"payload":"Detected"}
```

App should:
- Display messages in log
- Update lights for node 3
- Show battery in header
- Log detections

### Mock Mode

For development/demo without real master:

1. Go to Settings
2. Toggle **Mock Data Mode** (only in dev)
3. Select sample race scenario
4. Auto-generates messages, lights, detections
5. Can test UI without hardware

## Key Design Decisions

### 1. Timestamp Strategy

**Rule**: Use master timestamps when available, fall back to local.

```javascript
// When saving events
const ts_master = data.timestamp_ms || data.ts_iso;
const ts_received = Date.now();

// In UI: if ts_received is recent → SYNCED
// If device connected but no recent status → CONNECTING
// If no device → OFFLINE
```

### 2. Message Buffer

**Why separate buffer + processStream?**
- Handles partial JSON (e.g., `{"type":"stat` arrives in 2 packets)
- Supports multiple messages in single notification
- Falls back to text if JSON parsing fails

### 3. Exponential Backoff Reconnect

**Cap at 30s** to avoid draining battery on field disconnect

```javascript
delay = min(1s * 2^attempt, 30s)
// attempt 1: 2s
// attempt 2: 4s
// attempt 3: 8s
// attempt 4: 16s
// attempt 5+: 30s
```

### 4. Nodes Map vs Array

**Why Map?**
- O(1) lookup by node ID
- Easy to update single node
- No duplicates by design

```javascript
nodes[3] = { lastSeen, battery, rssi, ... }
// Update one node: O(1)
// Get all nodes: Object.values(nodes)
```

### 5. Message Log Limit (200)

- Keeps memory bounded
- Recent events most relevant
- Old events in export report

## Troubleshooting

### App Crashes on BLE Notification

**Issue**: Unhandled exception in notification callback
**Solution**: All notification handlers wrapped in try/catch in BleProvider
**Check**: Are you extending BLE notification code? Wrap in try/catch!

### Messages not updating

**Issue**: RaceContext not receiving updates
**Cause**: Check `dispatch` call in BleProvider after notification decode
**Debug**: Add `console.log('Dispatch:', action)` in notification handler

### Timer not advancing

**Issue**: `currentRace.startTime` not set
**Check**: Did Start button send `start_race` command successfully?
**Debug**: Watch RaceContext logs for START_RACE action

### Nodes not changing color

**Issue**: `UPDATE_NODE` not dispatching
**Check**: Are heartbeat messages being received?
**Debug**: Open message log, search for `"type":"heartbeat"`

### Parser test failures

**Issue**: Test assumes specific behavior
**Check**: Are you modifying parser? Ensure never throws
**Run**: `npm test -- tests/parser.test.js --verbose`

## Next Steps (Optional)

1. **LoggingService**: Collect debug logs locally for field troubleshooting
2. **Mock Data Generator**: Auto-simulate races for UI testing
3. **Settings Screen**: Configurable reconnect delay, battery threshold, etc.
4. **Offline Mode**: Record detections locally, sync when connected
5. **Analytics Dashboard**: Past 10 races, trends, best performance

## Files Reference

| File | Purpose |
|------|---------|
| `src/ble/BleProvider.js` | Singleton BLE manager + context |
| `src/context/RaceContext.js` | Central race state + reducer |
| `src/utils/parser.js` | Safe message parsing + utilities |
| `src/components/ErrorBoundary.js` | App crash prevention |
| `App.js` | Provider setup |
| `tests/parser.test.js` | Parser unit tests |
| `tests/formatTime.test.js` | Time formatter tests |

## Questions?

See architecture diagram, message flow, or specific component docs above.
