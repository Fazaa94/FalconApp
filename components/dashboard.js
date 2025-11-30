// LoRaConnectionScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import realm from '../db/database'; // <-- adjust path if needed
import { COLORS, FONTS, styles } from './theme';
import { useRace } from '../src/context/RaceContext';

// UUIDs (matching FalconRace-Master Arduino)
// (Keep only one definition, remove duplicates below)
const UART_SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb';
const UART_TX_CHARACTERISTIC_UUID = '00001235-0000-1000-8000-00805f9b34fb'; // Notify
const UART_RX_CHARACTERISTIC_UUID = '00001236-0000-1000-8000-00805f9b34fb'; // Write

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Main component definition (keep only one)
const LoRaConnectionScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [masterNode, setMasterNode] = useState(null); // master id and details
  const [slaveNodes, setSlaveNodes] = useState({}); // keyed by node id (live)
  const [rawMessages, setRawMessages] = useState([]); // recent raw messages (live)
  const [savedNodes, setSavedNodes] = useState({}); // saved nodes from realm

  const [isExpanded, setIsExpanded] = useState({}); // toggles for raw view
  const [isBusy, setIsBusy] = useState(false);

  const bleManagerRef = useRef(null);
  const monitorSubscriptionRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    bleManagerRef.current = new BleManager();
    requestPermissions();
    loadSavedNodesFromRealm();

    const sub = bleManagerRef.current.onStateChange((state) => {
      if (state === 'PoweredOn') {
        console.log('Bluetooth powered on');
      } else if (state === 'PoweredOff') {
        Alert.alert('Bluetooth Off', 'Please enable Bluetooth to scan for devices');
      }
    }, true);

    // Load recent raw messages from Realm (optional)
    loadRecentRawMessages();

    return () => {
      sub.remove();
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------ Realm helpers ------------------ */

  const loadSavedNodesFromRealm = () => {
    try {
      const nodes = realm.objects('Node').filtered('saved == true');
      const map = {};
      nodes.forEach(n => {
        map[n.nodeId] = {
          nodeId: n.nodeId,
          masterId: n.masterId,
          lastSeen: n.lastSeen ? n.lastSeen.toISOString() : null,
          lastMsg: n.lastMsg ? JSON.parse(n.lastMsg) : null,
          rssi: n.rssi,
          battery: n.battery,
        };
      });
      setSavedNodes(map);
    } catch (e) {
      console.warn('Realm loadSavedNodes error', e);
    }
  };

  const saveNodeToRealmAsSaved = (nodeId) => {
    try {
      realm.write(() => {
        const existing = realm.objectForPrimaryKey('Node', String(nodeId));
        if (existing) {
          existing.saved = true;
        } else {
          // create a minimal saved node entry
          realm.create('Node', {
            nodeId: String(nodeId),
            saved: true,
            lastSeen: new Date(),
          });
        }
      });
      loadSavedNodesFromRealm();
      Alert.alert('Saved', `Node ${nodeId} saved`);
    } catch (e) {
      console.warn('Realm saveNode error', e);
      Alert.alert('Save Failed', 'Could not save node');
    }
  };

  const removeSavedNodeFromRealm = (nodeId) => {
    try {
      realm.write(() => {
        const existing = realm.objectForPrimaryKey('Node', String(nodeId));
        if (existing) {
          existing.saved = false;
        }
      });
      loadSavedNodesFromRealm();
    } catch (e) {
      console.warn('Realm removeSavedNode error', e);
      Alert.alert('Remove Failed', 'Could not remove node');
    }
  };

  const writeNodeToRealm = (nodeRecord) => {
    try {
      realm.write(() => {
        realm.create('Node', {
          nodeId: String(nodeRecord.nodeId),
          masterId: nodeRecord.masterId != null ? String(nodeRecord.masterId) : null,
          lastSeen: new Date(),
          lastMsg: JSON.stringify(nodeRecord),
          rssi: nodeRecord.rssi != null ? Number(nodeRecord.rssi) : null,
          battery: nodeRecord.battery != null ? Number(nodeRecord.battery) : null,
        }, Realm.UpdateMode.Modified);
      });
    } catch (e) {
      console.warn('Realm writeNodeToRealm error', e);
    }
  };

  const addRawMessageToRealm = (raw) => {
    try {
      const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      realm.write(() => {
        realm.create('RawMessage', {
          id,
          ts: new Date(),
          raw,
        });
        // Optionally keep only last N raw messages in realm - not necessary here
      });
    } catch (e) {
      console.warn('Realm addRawMessage error', e);
    }
  };

  const loadRecentRawMessages = () => {
    try {
      const raws = realm.objects('RawMessage').sorted('ts', true).slice(0, 50);
      const arr = raws.map(r => ({ ts: r.ts.toISOString(), raw: r.raw }));
      setRawMessages(arr);
    } catch (e) {
      console.warn('Realm loadRecentRawMessages', e);
    }
  };

  /* ------------------ Permissions ------------------ */
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const perms = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ].filter(Boolean);

        const granted = await PermissionsAndroid.requestMultiple(perms);
        const ok = Object.values(granted).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
        if (!ok) {
          Alert.alert('Permissions', 'Bluetooth permissions are needed to scan/connect.');
        }
      } catch (err) {
        console.warn('Permission error', err);
      }
    }
  };

  /* ------------------ BLE life-cycle ------------------ */
  const cleanup = async () => {
    try {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      if (monitorSubscriptionRef.current) {
        monitorSubscriptionRef.current.remove();
        monitorSubscriptionRef.current = null;
      }
      if (bleManagerRef.current) {
        bleManagerRef.current.stopDeviceScan();
        bleManagerRef.current.destroy();
      }
    } catch (err) {
      console.warn('Cleanup error', err);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setFoundDevices([]);

    const manager = bleManagerRef.current;
    if (!manager) return;

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error, 'Reason:', error?.reason);
        Alert.alert('Scan Error', error?.reason ? String(error.reason) : String(error));
        setIsScanning(false);
        return;
      }

      // Filter FalconRace name
      const name = device?.name || device?.localName;
      if (name && name.includes('FalconRace')) {
        setFoundDevices(prev => {
          const exists = prev.some(d => d.id === device.id);
          if (!exists) {
            return [...prev, {
              id: device.id,
              name: name || 'FalconRace',
              device,
              rssi: device.rssi,
              status: 'ready'
            }];
          }
          return prev;
        });
      }
    });

    // Stop scanning after 10s
    scanTimeoutRef.current = setTimeout(() => {
      stopScanning();
    }, 10000);
  };

  const stopScanning = () => {
    try { bleManagerRef.current?.stopDeviceScan(); } catch (e) { console.warn(e); }
    setIsScanning(false);
  };

  const connectToDevice = async (devWrap) => {
    setIsBusy(true);
    stopScanning();

    setFoundDevices(prev => prev.map(d => d.id === devWrap.id ? { ...d, status: 'connecting' } : d));
    try {
      const connected = await devWrap.device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      // Request MTU 128 for larger packets
      try {
        await connected.requestMTU(128);
        console.log('✅ MTU 128 requested');
      } catch (mtuErr) {
        console.warn('MTU request failed', mtuErr);
      }

      setConnectedDevice(connected);
      setFoundDevices(prev => prev.map(d => d.id === devWrap.id ? { ...d, status: 'connected' } : d));

      // Setup notifications
      await setupNotifications(connected);

      Alert.alert('Connected', `Connected to ${devWrap.name}`);
    } catch (err) {
      console.error('Connection error:', err, 'Reason:', err?.reason);
      Alert.alert('Connection Failed', err?.reason ? String(err.reason) : String(err.message || err));
      setFoundDevices(prev => prev.map(d => d.id === devWrap.id ? { ...d, status: 'ready' } : d));
    } finally {
      setIsBusy(false);
    }
  };

  const disconnectDevice = async () => {
    if (!connectedDevice) return;
    setIsBusy(true);
    try {
      await connectedDevice.cancelConnection();
    } catch (e) {
      console.warn('Disconnect error', e, 'Reason:', e?.reason);
    } finally {
      setConnectedDevice(null);
      setMasterNode(null);
      setSlaveNodes({});
      setRawMessages([]);
      setIsBusy(false);
      setFoundDevices(prev => prev.map(d => ({ ...d, status: 'ready' })));
    }
  };

  /* ------------------ Notifications parsing ------------------ */

  // Extract JSON substrings (handles messy / concatenated messages)
  const extractJsonStrings = (text) => {
    if (!text || typeof text !== 'string') return [];
    const matches = text.match(/\{[^]*?\}/g);
    return matches || [];
  };

  const handleNotificationPayload = (base64Value) => {
    let decoded = '';
    try {
      decoded = Buffer.from(base64Value, 'base64').toString('utf-8');
    } catch (e) {
      try {
        decoded = global.atob ? global.atob(base64Value) : base64Value;
      } catch (e2) {
        decoded = base64Value;
      }
    }

    // update raw messages (live)
    setRawMessages(prev => {
      const next = [{ ts: Date.now(), raw: decoded }, ...prev].slice(0, 50);
      return next;
    });

    // add to Realm raw messages for persistence
    try { addRawMessageToRealm(decoded); } catch (e) { /* ignore */ }

    const jsonStrings = extractJsonStrings(decoded);
    if (jsonStrings.length === 0) {
      // Not JSON - ignore or handle as plain payload
      return;
    }

    jsonStrings.forEach(js => {
      try {
        const obj = JSON.parse(js);
        handleIncomingData(obj); // unified handler
      } catch (e) {
        console.warn('Failed parse substring', e);
      }
    });
  };

  // Unified telemetry handler matching Master firmware JSON schema
  // Maps: system_status, race, falcon, motion, gps, camera_status, node_msg
  const raceContext = useRace();

  const handleIncomingData = (msg) => {
        // Debug: log every incoming message
        console.log('📨 Incoming BLE message:', JSON.stringify(msg));
        if (msg.type === 'system_status' || msg.type === 'status') {
          console.log('✅ Master status received:', JSON.stringify(msg));
        }
    const type = msg.type;
    const src = msg.src ?? msg.source ?? null;

    // If type is missing but nodes array exists, treat as status
    if (!type && Array.isArray(msg.nodes)) {
      // Node roster
      setMasterNode(prev => ({
        ...prev,
        lastSeen: new Date().toISOString(),
        timestamp: msg.utc || new Date().toISOString(),
      }));
      setSlaveNodes(prev => {
        const updated = {};
        msg.nodes.forEach(n => {
          const nodeIdStr = typeof n === 'object' ? String(n.id) : String(n);
          updated[nodeIdStr] = {
            nodeId: nodeIdStr,
            lastSeen: new Date().toISOString(),
          };
        });
        return updated;
      });
      return;
    }

    switch (type) {
      case 'system_status': {
        // Master status
        setMasterNode({
          id: String(src || 1),
          lastSeen: new Date().toISOString(),
          raceActive: msg.race_active,
          battery: msg.battery,
          localCamera: msg.local_camera,
          timestamp: msg.ts_iso,
        });
        // Global status
        try {
          raceContext.dispatch({
            type: 'SET_STATUS',
            payload: {
              connected: true,
              race_active: !!msg.race_active,
              battery: msg.battery,
              ts_received: msg.ts_iso ? Date.parse(msg.ts_iso) : Date.now(),
            }
          });
        } catch {}
        // Node roster
        if (Array.isArray(msg.nodes)) {
          // Merge new node IDs into slaveNodes, update lastSeen
          setSlaveNodes(prev => {
            const updated = { ...prev };
            msg.nodes.forEach(n => {
              const nodeIdStr = typeof n === 'object' ? String(n.id) : String(n);
              updated[nodeIdStr] = {
                nodeId: nodeIdStr,
                lastSeen: new Date().toISOString(),
              };
            });
            // Remove nodes not present in msg.nodes
            Object.keys(updated).forEach(id => {
              if (!msg.nodes.some(n => (typeof n === 'object' ? String(n.id) : String(n)) === id)) {
                delete updated[id];
              }
            });
            return updated;
          });
        } else {
          setSlaveNodes({});
        }
        break;
      }
      case 'race': {
        // Race events
        if (msg.event === 'started') {
          try {
            raceContext.dispatch({
              type: 'START_RACE',
              payload: {
                id: msg.ts_iso || String(Date.now()),
                falcon: raceContext.state.selectedFalcon,
                startTimeMs: msg.ts_iso ? Date.parse(msg.ts_iso) : Date.now(),
              }
            });
          } catch {}
        } else if (msg.event === 'stopped') {
          try { raceContext.dispatch({ type: 'STOP_RACE' }); } catch {}
        }
        break;
      }
      case 'falcon': {
        // Falcon detection
        if (src != null) {
          const nodeIdStr = String(src);
          setSlaveNodes(prev => ({
            ...prev,
            [nodeIdStr]: {
              ...prev[nodeIdStr],
              nodeId: nodeIdStr,
              lastSeen: new Date().toISOString(),
              lastDetection: msg.ts_iso,
              detectionCount: (prev[nodeIdStr]?.detectionCount || 0) + 1,
            }
          }));
        }
        try {
          raceContext.dispatch({
            type: 'ADD_DETECTION',
            payload: {
              nodeId: src != null ? String(src) : 'master',
              ts_iso: msg.ts_iso,
              type: 'falcon',
              payload: msg.payload,
            }
          });
          raceContext.dispatch({ type: 'SET_STATUS', payload: { falcon_detected: true } });
        } catch {}
        break;
      }
      case 'motion': {
        try {
          raceContext.dispatch({
            type: 'ADD_DETECTION',
            payload: {
              nodeId: src != null ? String(src) : 'master',
              ts_iso: msg.ts_iso,
              type: 'motion',
              payload: msg.payload || null,
            }
          });
        } catch {}
        break;
      }
      case 'camera_status': {
        if (src != null) {
          const nodeIdStr = String(src);
          setSlaveNodes(prev => ({
            ...prev,
            [nodeIdStr]: {
              ...prev[nodeIdStr],
              nodeId: nodeIdStr,
              cameraStatus: msg.event,
              cameraAlive: msg.event === 'ready' || msg.event === 'probe_ok',
            }
          }));
          try {
            raceContext.dispatch({
              type: 'UPDATE_NODE',
              payload: {
                id: nodeIdStr,
                cameraPresent: msg.event === 'ready' || msg.event === 'probe_ok',
              }
            });
          } catch {}
        }
        break;
      }
      case 'node_msg': {
        if (src != null) {
          const nodeIdStr = String(src);
          setSlaveNodes(prev => ({
            ...prev,
            [nodeIdStr]: {
              ...prev[nodeIdStr],
              nodeId: nodeIdStr,
              lastSeen: new Date().toISOString(),
              lastPayload: msg.payload,
            }
          }));
        }
        try {
          raceContext.dispatch({
            type: 'ADD_MESSAGE',
            payload: { ts: msg.ts_iso ? Date.parse(msg.ts_iso) : Date.now(), raw: msg }
          });
        } catch {}
        break;
      }
      case 'gps': {
        setMasterNode(prev => ({
          ...prev,
          lat: msg.lat,
          lng: msg.lng,
          sats: msg.sats,
          alt: msg.alt,
          speed: msg.speed_kmh,
        }));
        try {
          raceContext.dispatch({
            type: 'UPDATE_GPS',
            payload: {
              lat: msg.lat,
              lng: msg.lng,
              sats: msg.sats,
              alt: msg.alt,
              speed_kmh: msg.speed_kmh,
              ts_iso: msg.ts_iso,
            }
          });
        } catch {}
        break;
      }
      default:
        console.log('Unknown message type:', type, msg);
    }

    // Persist minimal node info (if src exists)
    if (src != null) {
      try {
        writeNodeToRealm({
          nodeId: String(src),
          masterId: '1',
          rssi: msg.rssi || null,
          battery: msg.battery || null,
          raw: msg,
        });
      } catch (e) {
        console.warn('writeNodeToRealm failed', e);
      }
    }
  };

  const setupNotifications = async (device) => {
    try {
      if (monitorSubscriptionRef.current) {
        monitorSubscriptionRef.current.remove();
        monitorSubscriptionRef.current = null;
      }
    } catch (e) { /* ignore */ }

    try {
      monitorSubscriptionRef.current = device.monitorCharacteristicForService(
        UART_SERVICE_UUID,
        UART_TX_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Notification error:', error, 'Reason:', error?.reason);
            Alert.alert('Notification Error', error?.reason ? String(error.reason) : String(error));
            return;
          }
          if (!characteristic?.value) return;
          handleNotificationPayload(characteristic.value);
        }
      );
    } catch (err) {
      console.warn('Notification setup failed', err);
    }
  };

  /* ------------------ Sending ------------------ */
  const sendDataToDevice = async (data) => {
    if (!connectedDevice) {
      Alert.alert('Not Connected', 'No device connected');
      return;
    }
    try {
      // Convert string to base64 for React Native (no Buffer global)
      const base64Data = btoa(unescape(encodeURIComponent(data)));
      await connectedDevice.writeCharacteristicWithResponseForService(
        UART_SERVICE_UUID,
        UART_RX_CHARACTERISTIC_UUID,
        base64Data
      );
      console.log('Data sent to device:', data);
    } catch (error) {
      console.error('Send data error:', error, 'Reason:', error?.reason);
      Alert.alert('Send Failed', error?.reason ? String(error.reason) : 'Failed to send data to device');
    }
  };

  const sendCommand = async (command) => {
    const commandData = JSON.stringify({
      type: 'command',
      command: command
    });
    await sendDataToDevice(commandData);
  };

  /* ------------------ Save / Remove Node (UI) ------------------ */
  const saveNode = (nodeId) => {
    if (!nodeId) return;
    const node = slaveNodes[nodeId] || (masterNode && masterNode.id === nodeId ? masterNode : null);
    if (!node) {
      Alert.alert('Not found', 'Node not available to save');
      return;
    }
    saveNodeToRealmAsSaved(nodeId);
  };

  const removeSavedNode = (nodeId) => {
    removeSavedNodeFromRealm(nodeId);
  };

  /* ------------------ UI helpers ------------------ */

  // Send BLE 'get_status' command
  const sendGetStatus = async () => {
    try {
      await sendDataToDevice('status');
      Alert.alert('Status Requested', 'get_status command sent to master node.');
    } catch (e) {
      Alert.alert('Error', 'Failed to send get_status command');
    }
  }
  const toggleExpand = (id) => {
    setIsExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Replace mesh/slave node list with this ---
  const MeshNetworkSection = () => {
    const { state: raceState } = useRace();
    const nodes = raceState.nodes || {};
    // Helper to sort nodes by ID
    const activeNodesList = Object.values(nodes).sort((a, b) => Number(a.id) - Number(b.id));

    return (
      <View style={localStyles.meshSection}>
        <Text style={localStyles.sectionTitle}>LoRa Mesh Network</Text>
        {activeNodesList.length === 0 ? (
          <Text style={localStyles.noNodesText}>Waiting for heartbeats...</Text>
        ) : (
          activeNodesList.map((node) => (
            <View key={node.id} style={localStyles.meshNodeItem}>
              <View style={localStyles.meshNodeInfo}>
                <Text style={localStyles.meshNodeName}>Node {node.id}</Text>
                <View style={localStyles.meshNodeStatus}>
                  <View style={[
                    localStyles.statusDot,
                    { backgroundColor: (Date.now() - node.lastSeen < 60000) ? COLORS.oasisGreen : COLORS.terracotta }
                  ]} />
                  <Text style={localStyles.meshNodeStatusText}>
                    {(Date.now() - node.lastSeen < 60000) ? 'Online' : 'Offline'}
                  </Text>
                </View>
                <Text style={localStyles.detectionTime}>
                  Last seen: {node.lastSeen ? new Date(node.lastSeen).toLocaleTimeString() : '-'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  /* ------------------ Render ------------------ */
  // Debug panel: show last received BLE message
  const lastRawMsg = rawMessages.length > 0 ? rawMessages[0].raw : null;

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
      <View style={localStyles.header}>
        <Text style={localStyles.mainTitle}>FalconRace — Master & Slave Monitor</Text>
      </View>

      {/* Debug Panel - visible in UI */}
      <View style={{ backgroundColor: '#FFFDE7', borderColor: '#FFD600', borderWidth: 2, borderRadius: 8, margin: 12, padding: 10 }}>
        <Text style={{ color: '#333', fontFamily: FONTS.montserratBold, fontSize: 14 }}>Debug: Last BLE Message</Text>
        <Text style={{ color: '#444', fontFamily: FONTS.orbitronBold, fontSize: 12 }}>{lastRawMsg ? lastRawMsg : 'No message received yet.'}</Text>
        <TouchableOpacity style={{ marginTop: 8, backgroundColor: '#F97316', padding: 6, borderRadius: 6, alignSelf: 'flex-start' }} onPress={() => setRawMessages([])}>
          <Text style={{ color: '#fff', fontFamily: FONTS.montserratBold }}>Clear Recent Raw Messages</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={localStyles.scrollView} contentContainerStyle={localStyles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Start Scan Button */}
        {!isScanning && foundDevices.length === 0 && !connectedDevice && (
          <TouchableOpacity style={localStyles.scanButton} onPress={startScanning}>
            <Text style={localStyles.scanButtonText}>START SCAN</Text>
          </TouchableOpacity>
        )}

        {/* Scanning */}
        {isScanning && <View style={localStyles.scanningSection}>
          <ActivityIndicator size="large" color={COLORS.cobaltBlue} />
          <Text style={localStyles.scanningText}>Scanning for FalconRace devices...</Text>
        </View>}

        {/* Found Devices */}
        {!connectedDevice && foundDevices.length > 0 && (
          <View style={localStyles.devicesSection}>
            <Text style={localStyles.sectionTitle}>Found Devices</Text>
            {foundDevices.map((d) => (
              <TouchableOpacity key={d.id} style={[localStyles.deviceItem, d.status === 'connected' && localStyles.connectedDevice]} onPress={() => connectToDevice(d)} disabled={d.status === 'connecting' || d.status === 'connected' || isBusy}>
                <View style={localStyles.deviceInfo}>
                  <Text style={localStyles.deviceName}>{d.name}</Text>
                  <View style={localStyles.deviceStatusRow}>
                    <View style={[localStyles.statusDot, { backgroundColor: d.status === 'ready' ? COLORS.successGreen : COLORS.terracotta }]} />
                    <Text style={localStyles.statusText}>{d.status}</Text>
                  </View>
                </View>
                <Text style={localStyles.signalText}>{d.rssi ?? 'N/A'} dBm</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={localStyles.cancelButton} onPress={() => { stopScanning(); setFoundDevices([]); }}>
              <Text style={localStyles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Connected Device */}
        {connectedDevice && (
          <View style={localStyles.connectedSection}>
            <Text style={localStyles.sectionTitle}>Connected Device</Text>
            <View style={localStyles.connectedCard}>
              <Text style={localStyles.connectedDeviceName}>{connectedDevice.name || connectedDevice.id}</Text>
              <Text style={localStyles.smallText}>ID: {connectedDevice.id}</Text>
              <Text style={localStyles.smallText}>RSSI / Real-time messages below</Text>
              <Text style={localStyles.smallText}>Go to Race Control page to start/stop races</Text>

              <View style={localStyles.commandButtons}>
                <TouchableOpacity style={localStyles.sendButton} onPress={() => sendCommand('RESET')}>
                  <Text style={localStyles.sendButtonText}>RESET</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={localStyles.disconnectBtn} onPress={disconnectDevice}>
                <Text style={localStyles.disconnectBtnText}>DISCONNECT</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Master Node */}
        <View style={localStyles.masterSection}>
          <Text style={localStyles.sectionTitle}>Master Node</Text>
          {/* Get Status Button */}
          <TouchableOpacity style={localStyles.sendButton} onPress={sendGetStatus}>
            <Text style={localStyles.sendButtonText}>GET STATUS</Text>
          </TouchableOpacity>
          {(connectedDevice || masterNode) ? (
            <View style={localStyles.nodeCard}>
              <View style={localStyles.nodeHeader}>
                <Text style={localStyles.nodeTitle}>Master ID: {masterNode?.id || connectedDevice?.id || 'Connected'}</Text>
                {masterNode?.id && (
                  <TouchableOpacity onPress={() => saveNode(masterNode.id)} style={localStyles.saveBtn}>
                    <Text style={localStyles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={localStyles.smallText}>Last Seen: {masterNode?.lastSeen || 'Connected'}</Text>
              {masterNode?.lastMsg && (
                <>
                  <Text style={localStyles.subTitle}>Last Message</Text>
                  <Text style={localStyles.monoText}>{JSON.stringify(masterNode.lastMsg, null, 2)}</Text>
                </>
              )}
            </View>
          ) : (
            <Text style={localStyles.noNodesText}>No master detected yet</Text>
          )}
        </View>

        {/* Online Nodes */}
        <View style={localStyles.slavesSection}>
          <Text style={localStyles.sectionTitle}>Online Nodes ({Object.keys(slaveNodes).length})</Text>
          {Object.keys(slaveNodes).length > 0 ? (
            Object.keys(slaveNodes).map((nodeId) => (
              <View key={nodeId} style={localStyles.nodeCard}>
                <View style={localStyles.nodeHeader}>
                  <Text style={localStyles.nodeTitle}>Node {nodeId} Online</Text>
                </View>
                <View style={localStyles.nodeBody}>
                  <Text style={localStyles.smallText}>Node ID: {nodeId}</Text>
                  <Text style={localStyles.smallText}>Last Seen: {slaveNodes[nodeId].lastSeen}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={localStyles.noNodesText}>No nodes online</Text>
          )}
        </View>

        {/* Saved Nodes */}
        <View style={localStyles.savedSection}>
          <Text style={localStyles.sectionTitle}>Saved Nodes</Text>
          {Object.keys(savedNodes).length > 0 ? (
            Object.keys(savedNodes).map(k => (
              <View key={k} style={localStyles.savedItem}>
                <Text style={localStyles.smallText}>Node {k}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => removeSavedNode(k)} style={localStyles.removeBtn}>
                    <Text style={localStyles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={localStyles.noNodesText}>No saved nodes</Text>
          )}
        </View>

        {/* Recent raw messages */}
        <View style={localStyles.rawSection}>
          <Text style={localStyles.sectionTitle}>Recent Raw Messages</Text>
          {rawMessages.map((m, idx) => (
            <View key={m.ts + '_' + idx} style={localStyles.rawItem}>
              <Text style={localStyles.smallText}>{new Date(m.ts).toLocaleTimeString()}</Text>
              <Text style={localStyles.monoText}>{m.raw}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
};

// Styles (keep only one definition)
const localStyles = StyleSheet.create({
  header: { marginBottom: 12, alignItems: 'center' },
  mainTitle: { fontFamily: FONTS.orbitronBold, fontSize: 20, color: '#111827', fontWeight: '700' },
  scrollView: { flex: 1, backgroundColor: '#F3F4F6' }, // Paper-white sunlight bg
  scrollContent: { paddingHorizontal: 16, paddingBottom: 80 },
  scanButton: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginVertical: 8 }, // Royal blue
  scanButtonText: { fontFamily: FONTS.montserratBold, fontSize: 16, color: '#000', fontWeight: '700' },
  scanningSection: { alignItems: 'center', paddingVertical: 20 },
  scanningText: { fontFamily: FONTS.montserratRegular, marginTop: 8, color: '#111827', fontWeight: '600' },
  devicesSection: { marginVertical: 12 },
  sectionTitle: { fontFamily: FONTS.montserratBold, fontSize: 18, color: '#000', marginBottom: 8, fontWeight: '700', textTransform: 'uppercase' },
  deviceItem: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#9CA3AF' },
  connectedDevice: { borderColor: '#16A34A', borderWidth: 2 }, // Emerald green
  deviceInfo: { flex: 1 },
  deviceName: { fontFamily: FONTS.montserratBold, fontSize: 16, color: '#111827', fontWeight: '700' },
  deviceStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontFamily: FONTS.montserratRegular, color: '#111827', fontWeight: '600' },
  signalText: { fontFamily: FONTS.montserratRegular, color: '#374151' },
  cancelButton: { backgroundColor: '#F97316', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 }, // Safety orange
  cancelButtonText: { fontFamily: FONTS.montserratBold, color: '#FFFFFF', fontWeight: '700' },

  connectedSection: { marginVertical: 12 },
  connectedCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#9CA3AF' },
  connectedDeviceName: { fontFamily: FONTS.montserratBold, fontSize: 16, color: '#111827', fontWeight: '700' },
  smallText: { fontFamily: FONTS.montserratRegular, fontSize: 13, color: '#374151' },
  commandButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  sendButton: { backgroundColor: '#16A34A', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 }, // Emerald green
  sendButtonText: { fontFamily: FONTS.montserratBold, color: '#FFFFFF', fontWeight: '700' },
  disconnectBtn: { backgroundColor: '#F97316', marginTop: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, // Safety orange
  disconnectBtnText: { fontFamily: FONTS.montserratBold, color: '#FFFFFF', fontWeight: '700' },

  masterSection: { marginVertical: 12 },
  nodeCard: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: '#9CA3AF' },
  nodeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeTitle: { fontFamily: FONTS.montserratBold, fontSize: 16, color: '#111827', fontWeight: '700' },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 }, // Royal blue
  saveBtnText: { color: '#FFFFFF', fontFamily: FONTS.montserratBold, fontWeight: '700' },
  expandBtn: { marginLeft: 8, backgroundColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  expandBtnText: { fontFamily: FONTS.montserratBold, color: '#111827', fontWeight: '700' },

  nodeBody: { marginTop: 8 },
  subTitle: { fontFamily: FONTS.montserratBold, fontSize: 14, marginTop: 8, color: '#374151', fontWeight: '700', textTransform: 'uppercase' },
  monoText: { fontFamily: FONTS.orbitronBold, fontSize: 20, marginTop: 6, color: '#000', letterSpacing: 1 }, // Digital watch style
  rawBox: { marginTop: 8, backgroundColor: '#E5E7EB', padding: 8, borderRadius: 6, borderWidth: 2, borderColor: '#9CA3AF' },

  slavesSection: { marginVertical: 12 },

  savedSection: { marginVertical: 12 },
  savedItem: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#9CA3AF' },
  removeBtn: { backgroundColor: '#F97316', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6 }, // Safety orange
  removeBtnText: { color: '#FFFFFF', fontFamily: FONTS.montserratBold, fontWeight: '700' },

  rawSection: { marginVertical: 12 },
  rawItem: { backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, marginBottom: 6, borderWidth: 2, borderColor: '#9CA3AF' },

  noNodesText: { fontFamily: FONTS.montserratRegular, color: '#374151' },
});

export default LoRaConnectionScreen;
