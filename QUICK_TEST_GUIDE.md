# Quick Test Guide - Power Collapse Fix

## ✅ What Was Fixed
The ESP32 Master now prevents power collapse when starting races with low battery.

## 🔋 Battery Indicators

### Dashboard Display
- **Battery Reading**: Shows voltage (e.g., "3.45V")
- **⚠️ LOW Badge**: Appears when battery < 3.4V (red)
- **Warning Message**: Red box with "Battery critical. Starting race may cause power collapse. Charge immediately."

### Connection States
- **🟢 SYNCED**: Connected, receiving status updates
- **🟠 CONNECTING**: BLE connected, waiting for status
- **🔴 OFFLINE**: Disconnected

## 🧪 Testing Steps

### 1. Check Current Battery Level
1. Open FalconApp on your device
2. Go to **Dashboard**
3. Scan and connect to "FalconRace-Master"
4. Wait for connection state to show **SYNCED** (green)
5. Scroll down to **System Status** card
6. Note the **Battery** voltage reading

### 2. Test Normal Start (Battery > 3.3V)
If battery shows ≥ 3.3V:
1. Click **START RACE** button
2. **Expected**: Race starts immediately without warning
3. **Result**: Master should stay connected
4. Click **STOP RACE** to end test

### 3. Test Low Battery Warning (Battery < 3.3V)
If battery shows < 3.3V:
1. Observe **⚠️ LOW** badge next to battery reading
2. Read warning message in red box
3. Click **START RACE** button
4. **Expected**: Alert appears:
   ```
   Low Battery Warning
   Master battery is X.XXV. Starting race may cause 
   power collapse.
   
   Recommended: Charge battery above 3.5V
   
   [Cancel] [Start Anyway]
   ```
5. Test Option A: Click **Cancel**
   - Race does NOT start
   - Master stays connected
   - You can charge and try again

6. Test Option B: Click **Start Anyway**
   - Race command is sent
   - If battery too low, master may disconnect
   - If disconnect happens, check for power collapse alert

### 4. Test Power Collapse Detection
If master disconnects after starting race:
1. **Expected Alert**:
   ```
   Power Collapse Detected
   ESP32 disconnected with low battery (X.XXV).
   
   The master likely shut down due to insufficient power.
   
   Recommendation: Charge the battery before reconnecting.
   
   [OK]
   ```
2. Note: Auto-reconnect is DISABLED after power collapse
3. You must charge the battery before reconnecting

## 📊 What to Monitor

### In Dashboard - Diagnostics Panel
- **Last Status**: Timestamp of last status JSON
- **Last Disconnect**: When device last disconnected
- **Reconnect Attempts**: How many reconnection attempts made
- **Auto-Reconnect**: ON/OFF toggle

### In Logs (adb logcat)
Look for these messages:
```
🔋 Pre-flight battery check: X.XXV
📊 Requesting status update before race start...
🔋 Battery before start_race: X.XXV
⚠️ Power collapse detected
```

## ⚡ Recommended Actions by Battery Level

| Battery | Icon | Action |
|---------|------|--------|
| ≥ 3.5V | 🟢 | **Safe** - Race normally |
| 3.3-3.5V | 🟡 | **Caution** - Charge soon, monitor during race |
| < 3.3V | 🔴 | **Warning** - Charge immediately, race at your own risk |
| < 3.0V | ⛔ | **Critical** - Device will not operate |

## 🔧 If Master Still Turns Off

### Possible Causes:
1. **Battery worn out**: Replace if > 6 months old
2. **High internal resistance**: Test with voltmeter under load
3. **Power supply issue**: Check battery connections
4. **Too many nodes active**: Reduce number of active nodes

### Immediate Actions:
1. Charge battery fully (4.2V for LiPo)
2. Let battery rest 10 minutes before testing
3. Check battery voltage with multimeter
4. If voltage < 3.5V after charging, replace battery

### Hardware Improvements:
1. Use high-discharge battery (≥ 20C rating)
2. Add decoupling capacitor (100uF-1000uF) near ESP32
3. Check power wiring for voltage drops
4. Consider larger capacity battery (e.g., 2000mAh → 3000mAh)

## 📝 Expected Behavior Summary

### Normal Operation (Good Battery)
- ✅ No warnings shown
- ✅ START RACE works immediately
- ✅ Master stays connected
- ✅ Race completes successfully

### Low Battery Protection (< 3.3V)
- ✅ Warning indicators visible before starting
- ✅ Alert shown when START RACE clicked
- ✅ Option to cancel or proceed
- ✅ If collapse: Clear message with voltage
- ✅ Auto-reconnect disabled after collapse

## 🎯 Success Criteria
Your fix is working correctly if:
1. ✅ Battery voltage displays in Dashboard
2. ✅ Warning appears when battery < 3.4V
3. ✅ Alert shows before starting race with low battery
4. ✅ You can cancel the race start
5. ✅ Power collapse is detected and reported
6. ✅ No auto-reconnect after collapse

---

**Need Help?**
- Check full documentation: `POWER_COLLAPSE_FIX.md`
- Review BLE reliability: `BLE_ROBUSTNESS_README.md`
- Monitor logs: `adb logcat | findstr "ReactNativeJS"`
