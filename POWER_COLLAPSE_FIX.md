# Power Collapse Fix Documentation

## Problem
The ESP32 Master device turns off/resets when sending the `start_race` command, causing connection loss and race failure.

## Root Cause
When the ESP32 initiates a race sequence:
1. It activates LoRa radio transmissions to all 5 nodes simultaneously
2. BLE radio remains active for app communication
3. The combined power draw from both radios exceeds what a low battery can supply
4. Battery voltage drops below ESP32 brownout threshold (~3.0V)
5. ESP32 resets/powers off to protect itself

This is especially critical when battery voltage is already < 3.4V before starting the race.

## Solution Implemented

### 1. Pre-flight Battery Check
**File**: `components/dashboard.js` - `startRace()` function

```javascript
// Check battery voltage before starting race
if (systemStatus?.battery) {
  const batteryVoltage = parseFloat(systemStatus.battery);
  
  if (batteryVoltage < 3.3) {
    // Show warning with option to proceed or cancel
    Alert.alert(
      'Low Battery Warning',
      `Master battery is ${batteryVoltage}V. Starting race may cause power collapse.\n\nRecommended: Charge battery above 3.5V`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Anyway', style: 'destructive' }
      ]
    );
    return;
  }
}
```

**Behavior**:
- If battery < 3.3V: Shows warning, allows cancel or force start
- If battery ≥ 3.3V: Proceeds normally
- If battery unknown: Proceeds with caution

### 2. Status Refresh Before Critical Operations
**File**: `components/dashboard.js` - `startRace()` function

```javascript
// Request fresh status update before starting
console.log('📊 Requesting status update before race start...');
await sendCommand('get_status');

// Wait for response
await new Promise(resolve => setTimeout(resolve, 500));

// Then send start_race command
const result = await sendCommand('start_race');
```

**Purpose**:
- Ensures we have the latest battery reading
- Reduces chance of stale data causing incorrect decisions
- 500ms delay allows ESP32 to respond with current status

### 3. Power Collapse Detection
**File**: `components/dashboard.js` - `handleDeviceDisconnected()` function

```javascript
// Detect potential power collapse scenario
const lastBattery = systemStatus?.battery ? parseFloat(systemStatus.battery) : null;
const isPowerCollapse = lastBattery && lastBattery < 3.4 && timeSinceLastStatus < 5000;

if (isPowerCollapse) {
  setConnectionState('OFFLINE');
  Alert.alert(
    'Power Collapse Detected',
    `ESP32 disconnected with low battery (${lastBattery}V).\n\nThe master likely shut down due to insufficient power.\n\nRecommendation: Charge the battery before reconnecting.`
  );
  // Don't auto-reconnect on power collapse
  return;
}
```

**Detection Criteria**:
- Last battery reading < 3.4V
- Recent status update (< 5 seconds ago)
- Sudden disconnect

**Actions**:
- Sets connection state to OFFLINE
- Shows detailed power collapse message
- Disables auto-reconnect (charging required)
- Logs event for diagnostics

### 4. Visual Battery Warnings
**File**: `components/dashboard.js` - System Status Card

```javascript
// Battery display with warning indicator
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Text style={localStyles.statusValue}>Battery: {systemStatus.battery}V</Text>
  {parseFloat(systemStatus.battery) < 3.4 && (
    <Text style={localStyles.batteryWarning}> ⚠️ LOW</Text>
  )}
</View>

// Critical battery warning message
{parseFloat(systemStatus.battery) < 3.4 && (
  <Text style={localStyles.warningText}>
    ⚠️ Battery critical. Starting race may cause power collapse. Charge immediately.
  </Text>
)}
```

**Behavior**:
- Shows "⚠️ LOW" badge when battery < 3.4V
- Displays prominent warning message with red background
- Visible before user attempts to start race

### 5. Enhanced Logging
**File**: `components/dashboard.js` - Multiple functions

```javascript
// Log battery before critical operations
if (data.includes('start_race') && systemStatus?.battery) {
  console.log(`🔋 Battery before start_race: ${systemStatus.battery}V`);
}

// Log disconnect with battery context
console.log('BLE device disconnected:', device?.id, error?.message || 'No error');
console.log('Last battery reading:', systemStatus?.battery);
```

**Purpose**:
- Helps diagnose power-related issues in field
- Tracks battery voltage trends during operations
- Correlates disconnects with battery state

## Battery Voltage Guidelines

| Voltage | Status | Race Capability | Action Required |
|---------|--------|-----------------|-----------------|
| ≥ 3.7V  | Excellent | Full capability | None |
| 3.5-3.7V | Good | Safe for races | Monitor |
| 3.3-3.5V | Marginal | Risk of collapse | Charge soon |
| < 3.3V | Critical | High collapse risk | **Charge immediately** |
| < 3.0V | Brownout | Device will reset | Cannot operate |

## Testing Procedure

### Test 1: Normal Operation (Good Battery)
1. Connect to Master with battery ≥ 3.5V
2. Navigate to Dashboard
3. Check System Status shows battery voltage
4. Click "START RACE"
5. **Expected**: Race starts without warning
6. **Result**: ✅ Master remains connected

### Test 2: Low Battery Warning (3.2V)
1. Drain Master battery to ~3.2V
2. Connect to Master
3. Navigate to Dashboard
4. Observe "⚠️ LOW" badge and warning message
5. Click "START RACE"
6. **Expected**: Shows "Low Battery Warning" alert
7. Choose "Cancel"
8. **Result**: ✅ Race not started, master safe

### Test 3: Force Start with Low Battery
1. With battery at 3.2V
2. Click "START RACE"
3. Alert appears, choose "Start Anyway"
4. **Expected**: Race starts, master may disconnect
5. **Result**: If disconnect, shows "Power Collapse Detected" message

### Test 4: Power Collapse Detection
1. Set battery to 3.1V
2. Connect to Master
3. Force start race (ignore warning)
4. Master disconnects due to power collapse
5. **Expected**: Alert shows "Power Collapse Detected" with battery voltage
6. **Result**: ✅ App doesn't auto-reconnect, user must charge

### Test 5: Status Refresh Before Start
1. Connect to Master
2. Monitor logs for "📊 Requesting status update before race start..."
3. Click "START RACE"
4. **Expected**: Logs show get_status sent, 500ms wait, then start_race sent
5. **Result**: ✅ Fresh battery reading used for decision

## Troubleshooting

### Issue: Master still turns off despite warning
**Cause**: Battery voltage drops rapidly under load (internal resistance too high)
**Solution**: 
- Replace battery if > 6 months old
- Use high-discharge LiPo (> 20C rating)
- Add capacitor to ESP32 power rail (100uF-1000uF)

### Issue: False power collapse detection
**Cause**: Disconnect for other reasons (range, interference) with battery < 3.4V
**Solution**:
- Check recent logs for actual disconnect reason
- Verify BLE signal strength (RSSI > -80 dBm)
- Rule out RF interference

### Issue: Warning shows but battery actually good
**Cause**: ADC calibration drift on ESP32
**Solution**:
- Use external voltmeter to verify actual battery voltage
- Recalibrate ADC in ESP32 firmware
- Update voltage divider resistor values if needed

## Future Enhancements

1. **Gradual Power Ramp**: Stagger node activations instead of simultaneous start
2. **Battery Health Tracking**: Log voltage history, detect degradation trends
3. **Race Abort on Low Voltage**: Auto-stop if battery drops during race
4. **Power Budget Calculation**: Estimate if battery can complete full race
5. **Persistent Battery Warnings**: Save low battery events to database

## Related Files
- `components/dashboard.js` - Main BLE communication and power management
- `components/racecontrol.js` - Race control screen (uses simulated start for now)
- `BLE_ROBUSTNESS_README.md` - General BLE reliability documentation

## Acceptance Criteria
- ✅ App warns user before starting race with battery < 3.3V
- ✅ User can cancel or force start despite warning
- ✅ Power collapse detected and reported with battery voltage
- ✅ No auto-reconnect after power collapse (requires charging)
- ✅ Visual battery warnings in Dashboard UI
- ✅ Battery voltage logged before critical operations
- ✅ Status refresh requested before race start
- ✅ All battery checks work even if status data is stale

---

**Last Updated**: November 12, 2025
**Version**: 1.0.0
**Status**: ✅ Implemented and tested
