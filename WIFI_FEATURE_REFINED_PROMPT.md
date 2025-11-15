# WiFi Connectivity Feature - Refined Implementation Prompt

## Executive Summary
Add WiFi as an alternative connection method to the existing BLE implementation, allowing users to connect to FalconRace Master via HTTP REST API while maintaining full feature parity with BLE mode.

---

## Current State
- **Connection Method**: BLE only (Bluetooth Low Energy)
- **BLE Details**: Service 1234, TX 1235 (notify), RX 1236 (write)
- **Device Name**: FalconRace-Master
- **Data Format**: JSON messages over BLE notifications
- **Status Updates**: Real-time via BLE notifications

---

## WiFi Access Point Configuration
```
SSID: FalconRace-Master
Password: falcon2025
IP Address: 192.168.4.1 (fixed, DHCP assignment)
Port: 80 (HTTP)
Optional mDNS: http://falconrace.local
```

---

## API Endpoints

### 1. GET /api/status
**Purpose**: Retrieve current system status (equivalent to BLE status JSON)

**Response** (200 OK):
```json
{
  "race_active": true,
  "falcon_detected": true,
  "detection_count": 2,
  "total_sensors": 5,
  "track_length_m": 800,
  "battery": 4.15,
  "timestamp": "2025-11-12 15:25:18",
  "wifi_clients": 2,
  "ble_connected": false,
  "total_distance_m": 400,
  "current_speed_kmh": 43.64,
  "average_speed_kmh": 40.91,
  "lat": 24.231473,
  "lng": 55.775889,
  "sats": 7
}
```

**Polling**: Every 2 seconds (configurable in Settings)

---

### 2. GET /api/start
**Purpose**: Start race on all nodes

**Response** (200 OK):
```json
{
  "status": "race_started"
}
```

---

### 3. GET /api/stop
**Purpose**: Stop race on all nodes

**Response** (200 OK):
```json
{
  "status": "race_stopped"
}
```

---

### 4. GET /api/reset
**Purpose**: Reset falcon tracking data and clear detections

**Response** (200 OK):
```json
{
  "status": "tracking_reset"
}
```

---

### 5. GET / (Optional)
**Purpose**: Web dashboard (HTML page) for web-based monitoring

---

## Implementation Requirements

### UI/UX Changes

#### 1. Connection Method Selector
Add at top of Dashboard screen:
```
┌─────────────────────────────────────┐
│  Connect to Falcon Race System      │
├─────────────────────────────────────┤
│                                     │
│  Connection Type:                   │
│  ○ Bluetooth (BLE)                  │
│  ○ WiFi (192.168.4.1)               │
│                                     │
│  [Scan & Connect]                   │
│                                     │
└─────────────────────────────────────┘
```

#### 2. WiFi Connection Flow
**If not connected to FalconRace-Master WiFi:**
```
┌─────────────────────────────────────┐
│  WiFi Not Connected                 │
├─────────────────────────────────────┤
│                                     │
│  Please connect to:                 │
│  Network: FalconRace-Master         │
│  Password: falcon2025               │
│                                     │
│  [Open WiFi Settings] [Retry]       │
│                                     │
└─────────────────────────────────────┘
```

**If connected to correct WiFi:**
- Automatically attempt HTTP connection to http://192.168.4.1/api/status
- Mark as SYNCED if successful
- Start polling every 2 seconds

#### 3. Connection Status Badge
```
Connected via WiFi:           Connected via Bluetooth:
┌──────────────────────┐      ┌──────────────────────┐
│ 🟢 SYNCED           │      │ 🟢 SYNCED            │
│ WiFi: 192.168.4.1   │      │ BLE: FalconRace-M    │
│ Clients: 2          │      │ RSSI: -15 dBm        │
└──────────────────────┘      └──────────────────────┘
```

---

## Code Structure

### State Management
```javascript
const [connectionType, setConnectionType] = useState('ble'); // 'ble' | 'wifi'
const [wifiConnected, setWifiConnected] = useState(false);
const [wifiError, setWifiError] = useState(null);
const [wifiPollingInterval, setWifiPollingInterval] = useState(2000); // ms
const wifiPollTimeoutRef = useRef(null);
```

### WiFi Polling Function
```javascript
async function pollMasterStatus() {
  if (connectionType !== 'wifi' || !wifiConnected) return;
  
  try {
    const response = await fetchWithTimeout(
      'http://192.168.4.1/api/status',
      { headers: { 'Accept': 'application/json' } },
      5000 // 5s timeout
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    // Update UI
    setSystemStatus(data);
    setRaceActive(data.race_active);
    setConnectionState('SYNCED');
    setWifiError(null);
    
    // Detect new falcon detections
    if (data.detection_count > lastDetectionCount) {
      handleNewDetection(data);
    }
    
  } catch (error) {
    console.warn('WiFi poll error:', error);
    setWifiError(error.message);
    setConnectionState('CONNECTING');
  } finally {
    wifiPollTimeoutRef.current = setTimeout(pollMasterStatus, wifiPollingInterval);
  }
}
```

### Command Routing
```javascript
async function sendCommand(command) {
  if (connectionType === 'wifi') {
    const endpoints = {
      'start_race': '/api/start',
      'stop_race': '/api/stop',
      'reset_tracking': '/api/reset'
    };
    
    const response = await fetch(`http://192.168.4.1${endpoints[command]}`);
    return await response.json();
    
  } else if (connectionType === 'ble') {
    // Existing BLE implementation
    return await sendDataToDevice(command);
  }
}
```

---

## Error Handling

| Scenario | User Feedback | Action |
|----------|---------------|--------|
| Not on FalconRace-Master WiFi | Show network join dialog | Prompt to open Settings |
| Master not responding (5s timeout) | "Cannot reach master at 192.168.4.1" | Show Retry button |
| HTTP error (non-200) | Display HTTP status code | Allow manual retry |
| WiFi disconnects mid-session | "WiFi connection lost" | Attempt reconnect or fallback to BLE |

---

## Settings Screen (New Component)

Add `components/settings.js` with:
- **Preferred Connection Type**: Radio buttons (BLE, WiFi, Auto)
- **WiFi Polling Interval**: Slider (1s - 10s, default 2s)
- **Auto-Reconnect on Disconnect**: Toggle (default ON)
- **Persist Settings**: AsyncStorage

Example UI:
```
┌─────────────────────────────────────┐
│  Connection Settings                │
├─────────────────────────────────────┤
│                                     │
│ Preferred Connection:               │
│  ○ Bluetooth                        │
│  ● WiFi                             │
│  ○ Auto (try WiFi first)            │
│                                     │
│ WiFi Polling Interval:              │
│  [━━━●━━━] 2 seconds                │
│                                     │
│ Auto-Reconnect:                     │
│  ☑ Enabled                          │
│                                     │
│ [Save Changes]                      │
│                                     │
└─────────────────────────────────────┘
```

---

## Navigation Integration

Update `components/sidebar.js` to add:
```
Dashboard
Race Control
Settings ← NEW
Registered Falcons
Training Control
---
About
```

Wire Settings screen into DrawerNavigator navigation stack.

---

## Data Synchronization Strategy

| Aspect | BLE | WiFi | Notes |
|--------|-----|------|-------|
| **Status Updates** | Real-time (push) | 2s polling | WiFi less responsive but acceptable |
| **Detections** | Immediate (push) | Compare count field | Fetch detail if count increased |
| **Commands** | Write + notify ACK | GET + JSON response | Simpler for WiFi (stateless) |
| **Battery Warnings** | Real-time | Every 2s poll | Same thresholds apply |
| **Connection State** | SYNCED when status arrives | SYNCED when poll succeeds | Both support same states |

---

## Acceptance Criteria

- ✅ User can select BLE or WiFi connection method
- ✅ WiFi connection validates network then tests API endpoint
- ✅ Status updates poll every 2s when connected via WiFi
- ✅ All race commands (start/stop/reset) work via WiFi API
- ✅ Connection status badge shows active connection type
- ✅ WiFi errors display with actionable messages
- ✅ Graceful fallback if master becomes unreachable
- ✅ Settings persist across app restarts (AsyncStorage)
- ✅ No performance degradation vs BLE mode
- ✅ Battery warnings apply equally to BLE and WiFi
- ✅ Power collapse detection works for both modes

---

## Testing Checklist

### Functional Tests
- [ ] WiFi network detection working
- [ ] Connection succeeds when on correct network
- [ ] Status polling updates UI every 2 seconds
- [ ] Start race command executes via WiFi
- [ ] Stop race command executes via WiFi
- [ ] Reset command clears detections
- [ ] Graceful handling when WiFi disconnects
- [ ] Switch between BLE and WiFi mid-session
- [ ] Connection badge displays correct type
- [ ] Settings persist after app restart

### Edge Cases
- [ ] Master device reboots during race
- [ ] WiFi network changes password
- [ ] Multiple users on same master
- [ ] Low battery warnings trigger correctly
- [ ] Power collapse detection works
- [ ] Switching from WiFi to BLE and back

---

## Timeline & Dependencies

| Phase | Task | Duration |
|-------|------|----------|
| 1 | State management + WiFi polling | 2-3 hours |
| 2 | UI selector + connection flow | 2-3 hours |
| 3 | Command routing + Settings screen | 2-3 hours |
| 4 | Error handling + edge cases | 2 hours |
| 5 | Testing + refinement | 2-3 hours |
| **Total** | | **1-2 weeks** |

---

## Success Metrics

After implementation, the app should:
1. Support both BLE and WiFi connections seamlessly
2. Maintain <500ms response time for status updates via WiFi
3. Handle network interruptions gracefully
4. Provide clear feedback for connection issues
5. Offer no performance advantage for BLE over WiFi in normal conditions

---

## Questions for Clarification

1. Should auto-switch attempt WiFi first, then BLE if WiFi fails?
2. Should WiFi polling interval be user-adjustable or fixed?
3. Is WebSocket support planned for future real-time updates?
4. Should app cache last status when offline?
5. Should users be able to set custom WiFi credentials?

---

## Appendix: JSON Schema Validation

All API responses should validate against this schema:

```javascript
const statusSchema = {
  race_active: 'boolean',
  detection_count: 'number',
  total_sensors: 'number',
  track_length_m: 'number',
  battery: 'number',
  timestamp: 'string',
  wifi_clients: 'number',
  current_speed_kmh: 'number',
  average_speed_kmh: 'number',
  lat: 'number (optional)',
  lng: 'number (optional)',
  sats: 'number (optional)'
};
```

Validate all responses before updating state to prevent UI crashes from malformed data.
