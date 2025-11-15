# Dashboard Updates - FalconRace Controller Integration

## Updates Made to dashboard.js

### ✅ **New Features Added**

1. **Falcon Analytics Display**
   - Shows detection count, segment speed, average speed, and total distance
   - Real-time analytics card with formatted metrics
   - Displays timestamp of last analytics update

2. **Message Log**
   - Scrollable log of last 50 messages
   - Color-coded by source: TX (sent), RX (received), CAMERA events
   - Shows timestamps and truncated message content
   - Automatically adds entries for all BLE communication

3. **Enhanced Message Parsing**
   - Added `heartbeat` message type support (for node status updates)
   - Added `falcon_analytics` message type
   - Added `camera_probe` message type
   - All messages logged to message log

4. **Per-Node Controls**
   - Individual Ping, Probe, Start, Stop buttons for each slave node
   - Only shows Probe button if camera is present on node
   - Enhanced node display with RSSI, camera status, GPS coordinates

5. **Additional Commands**
   - `probe_cam` - Probe local camera
   - `probe_slave <nodeId>` - Probe specific slave node camera
   - `start <nodeId>` - Start specific node
   - `stop <nodeId>` - Stop specific node
   - `ping <nodeId>` - Ping specific node

### 📋 **Message Types Now Supported**

```javascript
// Status from master
{"type":"status","src":1,"race_active":true,"battery":3.8,"rssi":-15,"ts_iso":"..."}

// Heartbeat from nodes
{"type":"heartbeat","src":3,"battery":3,"rssi":-20,"race_active":false,"camera_present":false,"lat":24.231473,"lng":55.775889,"sats":7,"ts_iso":"..."}

// Falcon analytics
{"type":"falcon_analytics","detection_count":2,"segment_speed_kmh":42.35,"segment_distance_m":200,"total_distance_m":400,"average_speed_kmh":40.54,"ts_iso":"..."}

// Camera probe response
{"type":"camera_probe","src":3,"payload":"Camera OK","ts_iso":"..."}

// Motion detection
{"type":"motion","src":1,"ts_iso":"..."}

// Falcon detection
{"type":"falcon","src":1,"ts_iso":"..."}

// Node messages
{"type":"node_msg","src":3,"payload":"{...}","ts_iso":"..."}

// Camera messages
{"type":"camera_msg","src":1,"event":"...","message":"..."}
```

### 🎨 **UI Components Added**

1. **Falcon Analytics Card** - Shows 4 metrics in a grid layout
2. **Message Log Card** - Scrollable log with color-coded sources
3. **Enhanced Node Cards** - Individual cards with action buttons
4. **Probe Camera Button** - Added to race control buttons

### 📱 **How to Test**

1. **Build and Run**:
   ```bash
   npx react-native run-android
   ```

2. **Connect to ESP32**:
   - Tap "SCAN FOR FALCONRACE MASTER"
   - Select the FalconRace-Master device
   - Wait for connection

3. **Test Commands**:
   - Use control buttons to send commands
   - Watch message log for TX/RX communication
   - Per-node controls appear when nodes send heartbeats

4. **Expected Behavior**:
   - Status updates show in System Status card
   - Heartbeats from nodes 2-5 populate Slave Nodes section
   - Falcon analytics appear when detection occurs
   - All messages logged in Message Log at bottom

### 🔧 **Technical Details**

- **Message Buffering**: Properly handles partial JSON messages
- **State Management**: Uses React hooks for all state
- **Auto-reconnect**: Not implemented yet (can be added if needed)
- **Message Logging**: Keeps last 50 messages in state

### 🚀 **Next Steps** (Optional Enhancements)

1. Add AsyncStorage to persist message history
2. Add export functionality for analytics
3. Add map view for node GPS coordinates
4. Add custom command input field
5. Add auto-reconnect on disconnect
6. Add race progress visualization

### 📝 **Notes**

- All BLE UUIDs match specification:
  - Service: `1234`
  - TX (notifications): `1235`
  - RX (commands): `1236`
- Message parsing is robust and handles malformed data
- Per-node controls only show when node data is available
- All alerts use native Alert component for instant feedback
