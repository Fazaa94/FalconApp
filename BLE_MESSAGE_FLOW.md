# BLE Message Reception & Display Flow

## Overview
This document shows exactly where and how BLE notifications are received and displayed in the FalconRace app.

---

## 1. MESSAGE RECEPTION LAYER

### Location: `src/ble/BleProvider.js` - Line 327

```javascript
const subscription = device.monitorCharacteristicForService(
  BLE_CONFIG.SERVICE_UUID,      // "1234"
  BLE_CONFIG.TX_CHAR_UUID,       // "1235" (notifications from ESP32)
  handleNotification              // Callback handler
);
```

**This is the entry point** - Every notification from the ESP32 arrives here:
- Service UUID: `1234`
- Characteristic UUID: `1235` (TX from device to app)
- Handler function: `handleNotification` (lines 217-309)

---

## 2. NOTIFICATION HANDLER & PARSING

### Location: `src/ble/BleProvider.js` - `handleNotification()` (lines 217-309)

**Process:**
```
ESP32 sends base64-encoded notification
           ↓
handleNotification receives it
           ↓
Decode base64 → UTF-8 string
           ↓
Append to messageBufferRef.current (accumulates fragments)
           ↓
Call processStream(messageBufferRef) → extract complete JSON objects
           ↓
For each parsed message, call handleIncomingTelemetry(msg)
```

**Key logging:**
```javascript
console.log('📨 RAW BLE DATA FROM ESP BOARD:');
console.log('   Chunk received:', decoded);
console.log('📦 ACCUMULATED BUFFER:', messageBufferRef.current.length);
```

**Example:** When you receive "101" payload (falcon detection):
```
Raw ESP32: {"src":1,"payload":"101","utc":"2025-12-03T10:33:39Z"}
Log: 📨 RAW BLE DATA FROM ESP BOARD: {"src":1,"payload":"101","utc":"2025-12-03T10:33:39Z"}
```

---

## 3. MESSAGE PROCESSING LAYER

### Location: `src/ble/BleProvider.js` - `handleIncomingTelemetry()` (lines 53-215)

**This function processes each parsed message and:**

1. **Stores raw message** in RaceContext:
```javascript
raceContext.dispatch({ type: 'ADD_MESSAGE', payload: { raw: msg, ts: Date.now() } });
```
✅ **This shows in Dashboard's raw message log**

2. **Updates BLE state** (new!):
```javascript
setLastBleMessage(JSON.stringify(msg));
```
✅ **This feeds `lastBleMessage` to Race Control for detection display**

3. **Routes by type** (switch statement):
   - `case 'system_status'` → Update global status (battery, nodes, connection)
   - `case 'race'` → Start/stop race timers
   - `case 'falcon'` → Add falcon detection
   - `case 'motion'` → Add motion detection
   - `case 'detection'` → Add detection (alternative format)
   - ... etc

**For "101" payload specifically:**
```javascript
case 'falcon': {
  raceContext.dispatch({
    type: 'ADD_DETECTION',
    payload: {
      nodeId: src != null ? String(src) : 'master',
      ts_iso: msg.ts_iso,
      type: 'falcon',
      payload: msg.payload,  // "101"
    }
  });
  raceContext.dispatch({ type: 'SET_STATUS', payload: { falcon_detected: true } });
}
```

---

## 4. STATE STORAGE LAYER

### Location: `src/context/RaceContext.js`

**Three places messages are stored:**

#### a) Raw Message Log (Dashboard)
```javascript
case 'ADD_MESSAGE':
  return {
    ...state,
    messages: [action.payload, ...state.messages].slice(0, 200),
  };
```
**Used by:** Dashboard's `<MessagesScreen />` - shows all received messages

#### b) Detection Events (Race Control)
```javascript
case 'ADD_DETECTION':
  return {
    ...state,
    detections: [action.payload, ...state.detections].slice(0, 100),
  };
```
**Used by:** Race Control statistics & history

#### c) Last BLE Message (Race Control Display)
**Location:** `src/ble/BleProvider.js` - BleContext state
```javascript
const [lastBleMessage, setLastBleMessage] = useState(null);

// In context value:
return <BleContext.Provider value={{ ..., lastBleMessage }}>
```

---

## 5. UI DISPLAY LAYER

### Where Messages Appear:

#### **Dashboard (LoRaConnectionScreen)**
**File:** `components/dashboard.js`

**Raw Message Log** (lines ~500+):
```javascript
{raceCtx.state.messages.map((msg, i) => (
  <Text key={i} style={styles.logText}>
    {JSON.stringify(msg.raw).substring(0, 100)}
  </Text>
))}
```
✅ Shows every received message: status, detections, heartbeats, etc.

**Device Connection Status**:
```javascript
raceCtx.state.nodes[nodeId] // Shows node last seen time
// Color: Green <30s, Orange 30-120s, Red >120s
```

---

#### **Race Control (FalconRaceControlScreen)**
**File:** `components/racecontrol.js`

**Detection Display** (lines 86-95, 185):
```javascript
const detectionMsg = useMemo(() => {
  if (!lastBleMessage) return "--";
  try {
    const msg = JSON.parse(lastBleMessage);
    if ((msg.payload === "101" || msg.payload === "The Falcon Has Been Detected") && msg.src)
      return `🦅 Falcon detected at node #${msg.src}\n${msg.utc || ""}`;
  } catch (e) {}
  return "--";
}, [lastBleMessage]);

// Then displayed:
<Text style={styles.detectMsg}>{detectionMsg}</Text>
```
✅ Shows latest falcon detection with node number and timestamp

---

## 6. COMPLETE MESSAGE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                     ESP32 MASTER NODE                           │
│                                                                  │
│  Detects "101" → Sends JSON via BLE Notification (base64)      │
│  {"src":1,"payload":"101","utc":"2025-12-03T10:33:39Z"}        │
└─────────────────────┬───────────────────────────────────────────┘
                      │ BLE Notification (MTU 128)
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│          BleProvider.js - handleNotification()                  │
│                                                                  │
│  1. Receive base64 characteristic.value                         │
│  2. Decode → UTF-8 string                                       │
│  3. Append to messageBufferRef.current                          │
│  4. Parse with processStream() → extracts complete JSON        │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Parsed JSON objects
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│     BleProvider.js - handleIncomingTelemetry()                  │
│                                                                  │
│  1. dispatch('ADD_MESSAGE') → store in RaceContext             │
│     └─> messages: [{raw, ts}, ...]                            │
│                                                                  │
│  2. setLastBleMessage(JSON.stringify(msg))                      │
│     └─> BleContext.lastBleMessage = {...}                      │
│                                                                  │
│  3. Route by msg.type (switch statement)                        │
│     └─> case 'falcon': dispatch('ADD_DETECTION')              │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Dispatched actions
                      ↓
        ┌─────────────┴─────────────┐
        ↓                           ↓
┌──────────────────┐      ┌────────────────────┐
│  RaceContext     │      │  BleContext        │
│  messages[]      │      │  lastBleMessage    │
│  detections[]    │      │                    │
│  status          │      │                    │
└────────┬─────────┘      └────────┬───────────┘
         │                         │
         ↓                         ↓
┌──────────────────┐      ┌────────────────────┐
│ Dashboard        │      │ Race Control       │
│ (MessagesScreen) │      │ (Detection Display)│
│                  │      │                    │
│ Shows all raw    │      │ Shows latest       │
│ messages         │      │ detection (101)    │
│ with timestamps  │      │ with node #        │
└──────────────────┘      └────────────────────┘
```

---

## 7. HOW STATUS COMMAND WORKS (for comparison)

**Dashboard sends `status` command:**
```javascript
await write('status');  // Sends to RX characteristic (UUID 1236)
```

**ESP32 receives and responds:**
```
ESP32 RX receives: "status"
↓
ESP32 prepares response JSON
↓
ESP32 TX sends: {"nodes":[1,4,2],"count":3,...}
↓
(Same flow as above)
```

**You see it in:**
1. **Console logs** (BleProvider.js)
2. **Dashboard raw message log** (MessagesScreen)
3. **Dashboard status display** (battery, nodes, connection)

---

## 8. DEBUGGING TIPS

### To verify "101" is being received:

1. **Check console logs for:**
```
📨 RAW BLE DATA FROM ESP BOARD:
   Chunk received: {"src":1,"payload":"101",...}
```

2. **Check Dashboard Messages tab:**
   - Should show message with `payload: "101"`

3. **Check Race Control Detection:**
   - Should display: `🦅 Falcon detected at node #1`

### If "101" not showing in Race Control but appears in console/Dashboard:

- **Problem:** `lastBleMessage` state not updating
- **Fix:** Verify `setLastBleMessage()` is called in `handleIncomingTelemetry()` (line ~60)
- **Verify:** Race Control imports `useBle()` hook correctly

### If fragments not accumulating:

- **Problem:** Buffer clearing issue
- **Check:** `src/utils/parser.js` line 120+ - only trims if `i > 0`
- **Verify:** `processStream()` preserves buffer when no complete messages found

---

## 9. MESSAGE TYPES & PAYLOADS

### Detection Messages Format:

**From ESP32:**
```javascript
{
  "src": 1,              // Node ID
  "payload": "101",      // Falcon detection code
  "utc": "2025-12-03T10:33:39Z"  // Timestamp
}
```

**Stored in RaceContext:**
```javascript
detections: [
  {
    nodeId: "1",
    ts_iso: "2025-12-03T10:33:39Z",
    type: "falcon",
    payload: "101"
  },
  ...
]
```

**Displayed in Race Control:**
```
🦅 Falcon detected at node #1
2025-12-03T10:33:39Z
```

---

## 10. KEY FILES CHECKLIST

✅ **BLE Reception:**
- `src/ble/BleProvider.js` - Notification handler & parsing
- `src/utils/parser.js` - Message extraction from fragments

✅ **State Management:**
- `src/context/RaceContext.js` - Message & detection storage
- `src/ble/BleProvider.js` - `lastBleMessage` state

✅ **Display:**
- `components/dashboard.js` - Raw message log (MessagesScreen)
- `components/racecontrol.js` - Detection display (useMemo)

---

## Summary

**When you receive a "101" detection:**

1. ✅ ESP32 sends JSON via BLE notification (1235)
2. ✅ `handleNotification()` accumulates fragments in buffer
3. ✅ `processStream()` extracts complete JSON
4. ✅ `handleIncomingTelemetry()` stores it:
   - In `messages[]` (shows in Dashboard)
   - In `lastBleMessage` (shows in Race Control)
   - In `detections[]` (historical record)
5. ✅ Race Control's `detectionMsg` useMemo updates
6. ✅ UI shows: `🦅 Falcon detected at node #1`

All three locations are now connected! ✨
