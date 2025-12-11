# FalconRace Mobile App - AI Agent Instructions

## Project Overview

**FalconRace** is a React Native mobile app for tracking falcon racing events using BLE (Bluetooth Low Energy) connected IoT devices. The app connects to an ESP32-based master node that communicates with multiple slave nodes positioned along a race track to detect and track falcon movements in real-time.

**Tech Stack**: React Native 0.82, react-native-ble-plx, Realm DB (local persistence), React Navigation (Drawer + Stack), AsyncStorage, Firebase (future sync)

## Architecture Pattern

The app follows a **Singleton BLE + Central State** architecture:

```
App.js
├─ RaceProvider (global race state via Context)
│  └─ BleProvider (singleton BLE manager)
│     └─ NavigationContainer
│        └─ Stack Navigator (Splash → Login → DrawerNavigator)
│           ├─ Dashboard (main control panel)
│           ├─ RaceControl (race execution)
│           ├─ RegistrationScreen (falcon registration)
│           ├─ TrainingControl (training sessions)
│           ├─ IoTMonitor (system diagnostics)
│           └─ RegisteredAnimals (falcon list)
```

### Key Design Principles

1. **Single Source of Truth**: `RaceContext` holds all app state (status, nodes, detections, races)
2. **Defensive BLE**: All BLE operations wrapped in try/catch; never crash on disconnection
3. **Message Buffer**: BLE stream accumulates in buffer, parsed via `processStream()` to handle partial packets
4. **Never Throws**: Parser utilities (`parseIncoming`, `processStream`) return safe defaults instead of throwing
5. **Camera Detection**: Nested `node_msg` with `camera_msg` payload (code `101`) triggers falcon detections with split times

## Critical Files & Components

### Core State Management

- **`src/context/RaceContext.js`** - Central Redux-style reducer for race state
  - Actions: `SET_STATUS`, `UPDATE_NODE`, `ADD_DETECTION`, `PROCESS_NODE_MSG`, `START_RACE`, `STOP_RACE`, `SELECT_FALCON`
  - Persists `selectedFalcon` and `races` to AsyncStorage
  - Always dispatch with `{ type, payload }` pattern
  - `PROCESS_NODE_MSG` handles nested camera detection payloads and calculates split times

- **`src/ble/BleProvider.js`** - Singleton BLE manager (802 lines)
  - Exports: `useBle()` hook → `{ connectedDevice, scanning, scannedDevices, connect(), disconnect(), write(), startScan(), stopScan(), lastBleMessage }`
  - **Shared Connection State**: All screens (Dashboard, Race Control, Training Control) use this single provider
  - **Connection Pattern**: `connect(deviceId)` → discover services → `startMonitoring()` → dispatch to RaceContext
  - **Exponential Backoff**: Reconnects with delays: 1s, 2s, 4s, 8s, 16s, 30s (capped), max 5 attempts
  - **Message Flow**: TX notification (base64) → decode → buffer → `processStream()` → `handleIncomingTelemetry()` → dispatch by inferred type
  - **Never await device.cancelConnection()** - it's fire-and-forget to avoid hangs
  - **Type Inference**: Auto-detects message type from structure (nodes → `system_status`, Race text → `race`, payload: '101' → `falcon`)

### Data Layer

- **`db/database.js`** - Realm schemas (v10)
  - Main schemas: `FalconRegistration`, `RaceResults`, `Node`, `RawMessage`, `TrainingSession`, `HealthRecord`
  - Always use `realm.write()` for mutations
  - Migration logic handles v8→v10 schema upgrades automatically
  - Schema includes training analytics, performance metrics, nutrition tracking

### Utilities

- **`src/utils/parser.js`** - Defensive message parsing (178 lines)
  - `parseIncoming(raw)` → `{ kind: 'json'|'text', data }` - never throws
  - `processStream(bufferRef, flush?)` → extracts complete JSON objects from accumulated buffer
  - Handles fragmented JSON by tracking brace count; waits for complete objects
  - `formatTime(ms)` → `"mm:ss.SS"`
  - `getNodeStatusColor(lastSeenMs)` → `'green'|'orange'|'red'` (< 30s, 30-120s, > 120s)

### UI Screens

- **`components/dashboard.js`** - Main operator control panel
  - Shows: connection state, battery, GPS, node lights, message log
  - Handles: device scanning, connection via shared `useBle()` hook
  - **Uses shared BleProvider**: `connectedDevice`, `startScan`, `stopScan`, `connect`, `disconnect` from `useBle()`
  - Connection state is shared across all screens (Race Control, Training Control, etc.)
  - Displays battery critical warning when < 3.4V

- **`components/registrationscreen.js`** - Falcon registration form
  - Auto-generates animal ID from name (e.g., `FAL-123456`)
  - Stores images via `react-native-fs` to DocumentDirectory
  - Uses Realm for offline persistence with `synced: false` flag

- **`components/racecontrol.js`** - Race execution screen (~1060 lines)
  - Pre-start checklist validates: master connected, nodes online, battery > 3.3V, GPS sats >= 5
  - Sends BLE commands: `start_race`, `stop_race`, `reset_tracking`
  - Live timer updates every 50ms during race
  - Displays low battery alert before starting race with < 3.3V
  - **Falcon Selection**: Horizontal ScrollView with visual indicators (○ unselected, ✓ selected), 🦅 emoji
  - **Race Results Modal**: View saved race history with stats (elapsed time, checkpoints, speeds)
  - Uses `useFocusEffect` to reload saved races from Realm when screen focuses
  - Saves race results to Realm `RaceResults` schema on race completion

- **`components/iotmonitorscreen.js`** - System diagnostics
  - Displays all nodes with battery/RSSI/last seen
  - Shows raw message log for debugging
  - Toggles mock mode for UI testing

- **`components/sidebar.js`** - Drawer navigation (260 lines)
  - Custom drawer content with menu items and logout
  - Routes: Dashboard, Registration, Registered Falcons, Race Control, Training Control, Messages
  - Uses `realm.write()` to clear UserSession on logout

### Theme & Styling

- **`components/theme.js`** - Design system constants (~210 lines)
  - **COLORS**: `desertSand` (bg), `warmStone` (cards), `charcoal` (text), `cobaltBlue` (primary), `oasisGreen` (success), `terracotta` (danger), `sunYellow` (warning)
  - **Status Colors**: `statusOnline` (green), `statusWarning` (amber), `statusOffline` (red)
  - **FONTS**: `montserratRegular`, `montserratBold`, `orbitronBold` (race numbers)
  - **SPACING**: `xs` (4), `sm` (8), `md` (16), `lg` (24), `xl` (32), `xxl` (48)
  - **RADIUS**: `sm` (4), `md` (8), `lg` (16), `pill` (9999)
  - **Shared Styles**: `card`, `sectionTitle`, `buttonPrimary`, `buttonSuccess`, `buttonDanger`, `badge*`, `statusDot*`, `emptyState`, `input`
  - Import pattern: `import { COLORS, FONTS, SPACING, RADIUS, styles } from './theme';`

## BLE Communication Protocol

### Message Types from ESP32 Master

All messages are JSON strings sent as base64-encoded BLE notifications:

```javascript
// Master status (authoritative connection state)
{"type":"status","src":1,"race_active":false,"track_length_m":800,"connected":true,"battery":3.9,"progress_percent":0,"lat":24.231,"lng":55.776,"ts_iso":"2025-11-12T10:29:23Z"}

// Node heartbeat (from slave nodes)
{"type":"heartbeat","src":3,"timestamp_ms":624493,"battery":3.8,"rssi":-20,"camera_present":false,"lat":24.231473,"lng":55.775889}

// Falcon detection (direct)
{"type":"falcon","src":3,"timestamp_ms":624500,"payload":"The Falcon Has Been Detected","ts_iso":"2025-11-12T10:30:00Z"}

// Node message with nested camera detection
{"type":"node_msg","src":3,"payload":"{\"type\":\"camera_msg\",\"payload\":\"101\"}","ts_iso":"2025-11-12T10:30:00Z"}

// Motion detection
{"type":"motion","src":4,"event":"Motion detected at node 4","timestamp_ms":625000}

// GPS update
{"type":"gps","lat":24.231,"lng":55.776,"sats":8,"alt":50.5,"speed":0,"hdop":1.2}

// Analytics (computed by master)
{"type":"falcon_analytics","detection_count":2,"segment_speed_kmh":42.35,"average_speed_kmh":40.54,"total_distance_m":400}
```

### Commands to ESP32 (via RX characteristic)

Send as plain strings (auto-converted to base64 by `write()`):

- `start_race` - Begin race timer
- `stop_race` - Stop race timer
- `reset_tracking` - Clear race data
- `get_status` - Request status JSON

## Common Development Patterns

### Connecting to BLE Device

```javascript
const { connect, write } = useBle();

await connect(device.id);
await write('get_status'); // Request initial state
```

### Dispatching Race Events

```javascript
const { dispatch } = useRace();

dispatch({
  type: 'ADD_DETECTION',
  payload: {
    id: `det_${Date.now()}`,
    nodeId: 3,
    timestamp: Date.now(),
    type: 'falcon'
  }
});
```

### Handling Nested Camera Detections

```javascript
// BleProvider automatically routes node_msg to PROCESS_NODE_MSG action
// which extracts nested camera_msg with payload '101' (falcon detected)
// and creates detection with calculated splitTime

dispatch({
  type: 'PROCESS_NODE_MSG',
  payload: {
    src: 3,
    payload: '{"type":"camera_msg","payload":"101"}',
    ts_iso: new Date().toISOString()
  }
});
```

### Safe Realm Writes

```javascript
import realm from '../db/database';
import uuid from 'react-native-uuid';

realm.write(() => {
  realm.create('FalconRegistration', {
    id: uuid.v4(),
    falconName: 'Swift',
    breed: 'Peregrine',
    synced: false,
    createdAt: new Date()
  });
});
```

### Formatting Race Times

```javascript
import { formatTime } from '../src/utils/parser';

const elapsed = Date.now() - race.startTime;
const display = formatTime(elapsed); // "02:05.05"
```

### Loading Saved Data from Realm (with useFocusEffect)

```javascript
import { useFocusEffect } from '@react-navigation/native';
import realm from '../db/database';

const [savedRaces, setSavedRaces] = useState([]);

const loadSavedRaces = useCallback(() => {
  try {
    const races = realm.objects('RaceResults').sorted('endTime', true);
    setSavedRaces([...races]);
  } catch (err) {
    console.error('❌ Failed to load saved races:', err);
  }
}, []);

useFocusEffect(loadSavedRaces); // Reload when screen focuses
```

### Modal for Viewing Details

```javascript
import { Modal, ScrollView } from 'react-native';

const [showModal, setShowModal] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

// In render:
<Modal visible={showModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <ScrollView>{/* Details content */}</ScrollView>
      <TouchableOpacity onPress={() => setShowModal(false)}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

### Creating a New Screen

```javascript
// 1. Add component to components/
// 2. Import in sidebar.js
// 3. Add to menuItems array with icon name
// 4. Add to Drawer.Screen in createDrawerNavigator
// 5. Use hooks: const { state, dispatch } = useRace(); const { connectedDevice } = useBle();
```

## Testing & Development

### Running the App

```powershell
# Android
npx react-native run-android

# iOS
npx react-native run-ios

# Metro bundler
npm start
```

### Unit Tests

```powershell
npm test -- tests/parser.test.js
npm test -- tests/formatTime.test.js
```

### BLE Testing Without Hardware

1. Use **Mock Mode** toggle in IoTMonitor screen (dev only)
2. Test with **nRF Connect** app:
   - Connect to ESP32 device
   - Subscribe to TX characteristic (UUID: 1235)
   - Write to RX characteristic (UUID: 1236)
   - Send sample JSON messages (will be auto base64-encoded by app)

## Important Conventions

### State Updates

- **Always use `dispatch()`** - never mutate state directly
- **Set `ts_received: Date.now()`** on all incoming messages (done automatically in BleProvider)
- **Connection state hierarchy**: `status.connected` (from JSON) > BLE device connected > disconnected
- Messages stored in `state.messages` array (limited to last 200 to prevent memory bloat)

### Error Handling

- **BLE operations**: Wrap in try/catch, return `true/false` for success
- **Parser functions**: Return safe defaults (`{ kind: 'text', data: raw }`) instead of throwing
- **Disconnections**: Handle gracefully via `onDisconnected` handler, clear subscriptions, dispatch status update
- **Type Inference**: If `msg.type` missing, BleProvider infers from structure (never fails)

### Performance

- **Message log limit**: Keep last 200 messages only (auto-sliced in ADD_MESSAGE action)
- **Node color thresholds**: Green < 30s, Orange 30-120s, Red > 120s
- **Timer precision**: Use 50ms intervals for race timer updates
- **BLE buffer**: Always use `messageBufferRef.current` to accumulate partial packets
- **Schema migrations**: Realm v10 auto-migrates old schemas; don't manually call migrations

### Naming Conventions

- **State actions**: SCREAMING_SNAKE_CASE (`SET_STATUS`, `ADD_DETECTION`, `PROCESS_NODE_MSG`)
- **Component files**: lowercase with extension (`dashboard.js`, `racecontrol.js`)
- **Realm schemas**: PascalCase classes (`FalconRegistration`, `TrainingSession`)
- **BLE UUIDs**: Service `1234`, TX `1235`, RX `1236`
- **Message types**: lowercase snake_case (`system_status`, `node_msg`, `camera_msg`)

### Safe Development Practices

- **Incremental Changes**: Make small, targeted edits - don't restructure entire files at once
- **Verify After Edits**: Run `get_errors` after each file modification to catch issues early
- **Preserve Existing Patterns**: Match existing code style (emoji in console.logs, try/catch wrappers)
- **Import Carefully**: Only add imports that are actually used; check existing imports first
- **Color References**: Use `COLORS.oasisGreen` not `COLORS.successGreen`; `COLORS.terracotta` not `COLORS.errorRed`
- **Font Usage**: Use `fontFamily: FONTS.montserratBold` instead of `fontWeight: 'bold'`
- **Test Locally**: Verify changes don't break the app before committing

## Troubleshooting Guide

### App Crashes on BLE Notification

**Cause**: Unhandled exception in notification handler  
**Fix**: Check `BleProvider.js` - all handlers wrapped in try/catch; verify you're not adding code outside try blocks. Parser utils never throw.

### Messages Not Updating UI

**Cause**: RaceContext not receiving dispatch  
**Fix**: Add console.log in `handleIncomingTelemetry` after `dispatch()` calls; verify message type matches reducer cases

### Connection State Stuck on "CONNECTING"

**Cause**: No status JSON received from master  
**Fix**: Send `get_status` command after connection; check ESP32 is sending status messages; verify status contains `connected: true`

### Timer Not Advancing

**Cause**: Race not started properly  
**Fix**: Verify `START_RACE` action dispatched; check `currentRace.startTimeMs` is set; ensure timer interval is running

### Nodes Showing Red Despite Recent Heartbeat

**Cause**: Timestamp comparison issue  
**Fix**: Ensure `lastSeen` is millisecond timestamp (not ISO string); verify `getNodeStatusColor()` receives `lastSeenMs`

### Camera Detections Not Triggering

**Cause**: Missing PROCESS_NODE_MSG handler or wrong payload structure  
**Fix**: Verify nested `payload` is stringified JSON with `type: 'camera_msg'` and `payload: '101'`; check RaceContext reducer handles PROCESS_NODE_MSG

## Future Enhancements (Documented in .md files)

- **WiFi connectivity** (`WIFI_FEATURE_REFINED_PROMPT.md`) - Alternative to BLE for longer range
- **Power optimization** (`POWER_COLLAPSE_FIX.md`) - Battery management strategies
- **Dashboard updates** (`DASHBOARD_UPDATES.md`) - UI/UX improvements
- **Arduino integration** (`ARDUINO_RECOMMENDATIONS.md`) - Hardware setup guidance

## AI Agent Quick Reference

When asked to:

- **Add BLE feature** → Update `BleProvider.js` notification handler + add RaceContext action
- **Create new screen** → Follow drawer pattern in `sidebar.js`, use `useBle()` + `useRace()` hooks, add to Drawer.Screen
- **Modify state** → Update `raceReducer` in `RaceContext.js`, never mutate state directly
- **Handle new message type** → Add case in `handleIncomingTelemetry()`, add reducer action, ensure type inference works
- **Add Realm schema** → Update `database.js`, increment `schemaVersion`, add migration logic
- **Fix connection issues** → Check `handleDisconnection()` in BleProvider, verify exponential backoff settings
- **Debug BLE** → Add console.logs with emoji prefixes (📨, ✅, ❌, ⚠️) to match existing pattern
- **Test without hardware** → Use Mock Mode in IoTMonitor or nRF Connect app with sample JSON messages
- **Add modal/details view** → Use `Modal` from react-native with `modalOverlay` + `modalContent` pattern
- **Show saved data** → Use `useFocusEffect` with Realm query, store in local state
- **Apply theme consistently** → Import `COLORS, FONTS, SPACING, RADIUS` from theme.js; use shared `styles`
- **Update UI safely** → Make incremental edits, verify with `get_errors`, preserve existing patterns

**Always reference `ARCHITECTURE.md` for detailed component interaction flows and `QUICK_TEST_GUIDE.md` for testing procedures.**
