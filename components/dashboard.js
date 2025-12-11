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
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Realm from 'realm';
import realm from '../db/database'; // explicit import to avoid global warning
import { COLORS, FONTS, SPACING, RADIUS, styles } from './theme';
import { useRace } from '../src/context/RaceContext';
import { useBle } from '../src/ble/BleProvider';
import { calculateDistance, formatDistance } from '../src/utils/parser';

// UUIDs (matching FalconRace-Master Arduino)
// (Keep only one definition, remove duplicates below)
const UART_SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb';
const UART_TX_CHARACTERISTIC_UUID = '00001235-0000-1000-8000-00805f9b34fb'; // Notify
const UART_RX_CHARACTERISTIC_UUID = '00001236-0000-1000-8000-00805f9b34fb'; // Write

// LayoutAnimation is handled automatically in New Architecture

// Main component definition (keep only one)
const LoRaConnectionScreen = () => {
  // Use shared BLE context for connection state
  const { 
    connectedDevice, 
    scanning: isScanning, 
    scannedDevices, 
    connect: bleConnect, 
    disconnect: bleDisconnect, 
    startScan: bleStartScan, 
    stopScan: bleStopScan,
    write: bleWrite 
  } = useBle();
  
  const [foundDevices, setFoundDevices] = useState([]);
  const [masterNode, setMasterNode] = useState(null); // master id and details
  const [slaveNodes, setSlaveNodes] = useState({}); // keyed by node id (live)
  const [rawMessages, setRawMessages] = useState([]); // recent raw messages (live)
  const [savedNodes, setSavedNodes] = useState({}); // saved nodes from realm

  const [isExpanded, setIsExpanded] = useState({}); // toggles for raw view
  const [isBusy, setIsBusy] = useState(false);

  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    requestPermissions();
    loadSavedNodesFromRealm();
    // Load recent raw messages from Realm (optional)
    loadRecentRawMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Sync scannedDevices from BleProvider to local foundDevices for UI
  useEffect(() => {
    if (scannedDevices && scannedDevices.length > 0) {
      setFoundDevices(prev => {
        const newDevices = scannedDevices.map(d => ({
          id: d.id,
          name: d.name || d.localName || 'FalconRace',
          device: d,
          rssi: d.rssi,
          status: connectedDevice?.id === d.id ? 'connected' : 'ready'
        }));
        return newDevices;
      });
    }
  }, [scannedDevices, connectedDevice]);

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

  /* ------------------ BLE life-cycle (using shared BleProvider) ------------------ */

  const startScanning = () => {
    setFoundDevices([]);
    bleStartScan((device) => {
      // Callback for each new device found
      console.log('📱 Found device:', device.name);
    });

    // Stop scanning after 10s
    scanTimeoutRef.current = setTimeout(() => {
      stopScanning();
    }, 10000);
  };

  const stopScanning = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    bleStopScan();
  };

  const connectToDevice = async (devWrap) => {
    setIsBusy(true);
    stopScanning();

    setFoundDevices(prev => prev.map(d => d.id === devWrap.id ? { ...d, status: 'connecting' } : d));
    try {
      // Use shared BleProvider connect - it handles all the connection logic,
      // service discovery, MTU negotiation, and notification setup
      await bleConnect(devWrap.id);
      
      setFoundDevices(prev => prev.map(d => d.id === devWrap.id ? { ...d, status: 'connected' } : d));
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
      await bleDisconnect();
    } catch (e) {
      console.warn('Disconnect error', e, 'Reason:', e?.reason);
    } finally {
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
    let type = msg.type;
    const src = msg.src ?? msg.source ?? null;

    // Infer type when missing
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
    if (!type && typeof msg.status === 'string') {
      type = 'race';
    }
    if (!type && (msg.payload === '101' || msg.payload === 'The Falcon Has Been Detected')) {
      type = 'falcon';
    }
    if (!type && msg.payload && msg.src) {
      type = 'detection';
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
      case 'race': {
        const started = typeof msg.status === 'string' && msg.status.toLowerCase().includes('started');
        const stopped = typeof msg.status === 'string' && msg.status.toLowerCase().includes('stopped');
        try {
          raceContext.dispatch({
            type: 'SET_STATUS',
            payload: {
              connected: true,
              race_active: started ? true : stopped ? false : undefined,
              ts_received: Date.now(),
            }
          });
        } catch {}
        break;
      }
      case 'falcon':
      case 'detection': {
        // Minimal UI hook: mark last detection
        setRawMessages(prev => [{ ts: Date.now(), raw: msg }, ...prev].slice(0, 200));
        break;
      }
      default:
        // Unknown type - keep logs concise
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
  const raceState = raceContext?.state || {};
  const onlineNodes = Object.values(raceState.nodes || {}).filter(n => n.lastSeen && (Date.now() - n.lastSeen < 120000));
  const battery = raceState.status?.battery;
  const batteryPercent = battery ? Math.min(100, Math.max(0, ((battery - 3.0) / 1.2) * 100)) : null;
  
  // Master GPS for distance calculations
  const masterGps = raceState.gps || raceState.status;
  const masterLat = masterGps?.lat;
  const masterLng = masterGps?.lng;

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.cobaltBlue} barStyle="light-content" />
      
      {/* Premium Header */}
      <LinearGradient
        colors={[COLORS.cobaltBlue, '#0D47A1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={localStyles.premiumHeader}
      >
        <View style={localStyles.headerContent}>
          <View style={localStyles.headerLeft}>
            <Text style={localStyles.headerTitle}>🦅 Dashboard</Text>
            <Text style={localStyles.headerSubtitle}>BLE Device Control</Text>
          </View>
          <View style={localStyles.headerRight}>
            {/* Connection Status */}
            <View style={[
              localStyles.connectionBadge,
              { backgroundColor: connectedDevice ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)' }
            ]}>
              <View style={[
                localStyles.connectionDot,
                { backgroundColor: connectedDevice ? '#4CAF50' : '#F44336' }
              ]} />
              <Text style={localStyles.connectionText}>
                {connectedDevice ? 'CONNECTED' : 'OFFLINE'}
              </Text>
            </View>
            {/* Battery */}
            {battery != null && typeof battery === 'number' && (
              <View style={localStyles.batteryBadge}>
                <Text style={localStyles.batteryEmoji}>🔋</Text>
                <Text style={localStyles.batteryText}>{String(battery.toFixed(1))}V</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Quick Stats Row */}
        <View style={localStyles.quickStats}>
          <View style={localStyles.quickStatItem}>
            <Text style={localStyles.quickStatValue}>{onlineNodes.length}</Text>
            <Text style={localStyles.quickStatLabel}>NODES</Text>
          </View>
          <View style={localStyles.quickStatDivider} />
          <View style={localStyles.quickStatItem}>
            <Text style={localStyles.quickStatValue}>{batteryPercent ? `${Math.round(batteryPercent)}%` : '--'}</Text>
            <Text style={localStyles.quickStatLabel}>BATTERY</Text>
          </View>
          <View style={localStyles.quickStatDivider} />
          <View style={localStyles.quickStatItem}>
            <Text style={localStyles.quickStatValue}>{raceState.status?.race_active ? '🦅' : '⏸️'}</Text>
            <Text style={localStyles.quickStatLabel}>{raceState.status?.race_active ? 'RACING' : 'IDLE'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={localStyles.scrollView} contentContainerStyle={localStyles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Start Scan Button */}
        {!isScanning && foundDevices.length === 0 && !connectedDevice && (
          <TouchableOpacity style={localStyles.premiumScanButton} onPress={startScanning} activeOpacity={0.8}>
            <LinearGradient
              colors={[COLORS.cobaltBlue, '#0D47A1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={localStyles.scanButtonGradient}
            >
              <Text style={localStyles.scanButtonIcon}>📡</Text>
              <Text style={localStyles.premiumScanButtonText}>SCAN FOR DEVICES</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Scanning */}
        {isScanning && (
          <View style={localStyles.scanningCard}>
            <ActivityIndicator size="large" color={COLORS.cobaltBlue} />
            <Text style={localStyles.scanningText}>Scanning for FalconRace devices...</Text>
            <TouchableOpacity style={localStyles.cancelScanButton} onPress={stopScanning}>
              <Text style={localStyles.cancelScanButtonText}>STOP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Found Devices */}
        {!connectedDevice && foundDevices.length > 0 && (
          <View style={localStyles.premiumCard}>
            <View style={localStyles.cardHeader}>
              <Text style={localStyles.cardIcon}>📱</Text>
              <Text style={localStyles.cardTitle}>Found Devices</Text>
            </View>
            {foundDevices.map((d) => (
              <TouchableOpacity 
                key={d.id} 
                style={[localStyles.deviceCard, d.status === 'connected' && localStyles.deviceCardConnected]} 
                onPress={() => connectToDevice(d)} 
                disabled={d.status === 'connecting' || d.status === 'connected' || isBusy}
                activeOpacity={0.7}
              >
                <View style={localStyles.deviceInfo}>
                  <Text style={localStyles.deviceName}>{d.name}</Text>
                  <View style={localStyles.deviceStatusRow}>
                    <View style={[localStyles.statusDot, { backgroundColor: d.status === 'ready' ? COLORS.oasisGreen : COLORS.sunYellow }]} />
                    <Text style={localStyles.statusText}>{d.status}</Text>
                  </View>
                </View>
                <View style={localStyles.signalBadge}>
                  <Text style={localStyles.signalText}>{d.rssi ?? 'N/A'}</Text>
                  <Text style={localStyles.signalUnit}>dBm</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={localStyles.secondaryButton} onPress={() => { stopScanning(); setFoundDevices([]); }}>
              <Text style={localStyles.secondaryButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Connected Device */}
        {connectedDevice && (
          <View style={localStyles.premiumCard}>
            <View style={localStyles.cardHeader}>
              <Text style={localStyles.cardIcon}>✅</Text>
              <Text style={localStyles.cardTitle}>Connected Device</Text>
            </View>
            <View style={localStyles.connectedDeviceCard}>
              <Text style={localStyles.connectedDeviceName}>{connectedDevice.name || 'FalconRace Master'}</Text>
              <Text style={localStyles.deviceId}>{connectedDevice.id}</Text>
              
              <View style={localStyles.actionButtonsRow}>
                <TouchableOpacity style={localStyles.actionButton} onPress={sendGetStatus} activeOpacity={0.8}>
                  <Text style={localStyles.actionButtonIcon}>📡</Text>
                  <Text style={localStyles.actionButtonText}>STATUS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={localStyles.actionButton} onPress={() => sendCommand('RESET')} activeOpacity={0.8}>
                  <Text style={localStyles.actionButtonIcon}>🔄</Text>
                  <Text style={localStyles.actionButtonText}>RESET</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={localStyles.disconnectButton} onPress={disconnectDevice} activeOpacity={0.8}>
                <Text style={localStyles.disconnectButtonText}>DISCONNECT</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Node Grid */}
        <View style={localStyles.premiumCard}>
          <View style={localStyles.cardHeader}>
            <Text style={localStyles.cardIcon}>🌐</Text>
            <Text style={localStyles.cardTitle}>Online Nodes ({onlineNodes.length})</Text>
          </View>
          
          {/* Get Status Button */}
          <TouchableOpacity style={localStyles.getStatusButton} onPress={sendGetStatus} activeOpacity={0.8}>
            <Text style={localStyles.getStatusIcon}>📡</Text>
            <Text style={localStyles.getStatusText}>GET STATUS</Text>
          </TouchableOpacity>
          
          {onlineNodes.length > 0 ? (
            <View style={localStyles.nodeGrid}>
              {onlineNodes.map((node) => {
                const isOnline = Date.now() - node.lastSeen < 60000;
                const hasBattery = node.battery != null && typeof node.battery === 'number';
                const hasRssi = node.rssi != null && typeof node.rssi === 'number';
                const hasGps = node.lat != null && node.lng != null;
                const distanceFromMaster = hasGps && masterLat != null && masterLng != null
                  ? calculateDistance(masterLat, masterLng, node.lat, node.lng)
                  : null;
                return (
                  <View key={node.id} style={[localStyles.nodeGridItem, isOnline ? localStyles.nodeGridOnline : localStyles.nodeGridOffline]}>
                    <View style={[localStyles.nodeGridDot, { backgroundColor: isOnline ? COLORS.oasisGreen : COLORS.terracotta }]} />
                    <Text style={localStyles.nodeGridNumber}>{node.id}</Text>
                    <Text style={localStyles.nodeGridLabel}>NODE</Text>
                    {hasBattery && (
                      <Text style={localStyles.nodeGridBattery}>🔋 {node.battery.toFixed(1)}V</Text>
                    )}
                    {hasRssi && (
                      <Text style={localStyles.nodeGridRssi}>📶 {node.rssi}dB</Text>
                    )}
                    {distanceFromMaster != null && (
                      <Text style={localStyles.nodeGridDistance}>📍 {formatDistance(distanceFromMaster)}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={localStyles.emptyState}>
              <Text style={localStyles.emptyStateIcon}>📡</Text>
              <Text style={localStyles.emptyStateText}>No nodes online</Text>
              <Text style={localStyles.emptyStateSubtext}>Tap GET STATUS to refresh</Text>
            </View>
          )}
        </View>

        {/* Master Node - Legacy section */}
        {(masterNode) && (
          <View style={localStyles.premiumCard}>
            <View style={localStyles.cardHeader}>
              <Text style={localStyles.cardIcon}>👑</Text>
              <Text style={localStyles.cardTitle}>Master Node</Text>
            </View>
            <View style={localStyles.masterNodeCard}>
              <Text style={localStyles.masterNodeId}>ID: {masterNode?.id || 'Connected'}</Text>
              <Text style={localStyles.masterNodeTime}>
                Last seen: {masterNode?.lastSeen ? new Date(masterNode.lastSeen).toLocaleTimeString() : 'Now'}
              </Text>
            </View>
          </View>
        )}

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

      </ScrollView>
    </View>
  );
};

// Styles (keep only one definition)
const localStyles = StyleSheet.create({
  // Premium Header
  premiumHeader: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  connectionText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  batteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  batteryEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  batteryText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    marginTop: 16,
    paddingVertical: 12,
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  quickStatLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    letterSpacing: 1,
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  
  // Scroll area
  scrollView: { flex: 1, backgroundColor: COLORS.desertSand },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 80, paddingTop: 20 },
  
  // Premium Scan Button
  premiumScanButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: COLORS.cobaltBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  scanButtonIcon: {
    fontSize: 20,
  },
  premiumScanButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  
  // Scanning state
  scanningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scanningText: {
    fontFamily: FONTS.montserratBold,
    marginTop: 16,
    color: COLORS.charcoal,
    fontSize: 14,
  },
  cancelScanButton: {
    marginTop: 16,
    backgroundColor: COLORS.terracotta + '15',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancelScanButtonText: {
    fontFamily: FONTS.montserratBold,
    color: COLORS.terracotta,
    fontSize: 12,
  },
  
  // Premium Card
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  cardTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    letterSpacing: 0.3,
  },
  
  // Device Cards
  deviceCard: {
    backgroundColor: COLORS.desertSand + '80',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deviceCardConnected: {
    borderColor: COLORS.oasisGreen,
    backgroundColor: COLORS.oasisGreen + '10',
  },
  deviceInfo: { flex: 1 },
  deviceName: {
    fontFamily: FONTS.montserratBold,
    fontSize: 15,
    color: COLORS.charcoal,
  },
  deviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontFamily: FONTS.montserratRegular,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  signalBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.cobaltBlue + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  signalText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 14,
    color: COLORS.cobaltBlue,
  },
  signalUnit: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  secondaryButton: {
    backgroundColor: COLORS.terracotta + '15',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontFamily: FONTS.montserratBold,
    color: COLORS.terracotta,
    fontSize: 14,
  },
  
  // Connected Device Card
  connectedDeviceCard: {
    backgroundColor: COLORS.oasisGreen + '08',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.oasisGreen + '30',
  },
  connectedDeviceName: {
    fontFamily: FONTS.montserratBold,
    fontSize: 18,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  deviceId: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cobaltBlue,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonIcon: {
    fontSize: 14,
  },
  actionButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  disconnectButton: {
    backgroundColor: COLORS.terracotta,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontFamily: FONTS.montserratBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  
  // Get Status Button
  getStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cobaltBlue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  getStatusIcon: {
    fontSize: 16,
  },
  getStatusText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  // Node Grid
  nodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  nodeGridItem: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: COLORS.desertSand,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  nodeGridOnline: {
    borderWidth: 2,
    borderColor: COLORS.oasisGreen,
    backgroundColor: COLORS.oasisGreen + '08',
  },
  nodeGridOffline: {
    borderWidth: 2,
    borderColor: COLORS.terracotta + '40',
    opacity: 0.6,
  },
  nodeGridNumber: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 22,
    color: COLORS.cobaltBlue,
  },
  nodeGridLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 1,
  },
  nodeGridBattery: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 10,
    color: COLORS.oasisGreen,
    marginTop: 4,
  },
  nodeGridRssi: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 10,
    color: COLORS.cobaltBlue,
    marginTop: 2,
  },
  nodeGridDistance: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: COLORS.terracotta,
    marginTop: 2,
  },
  nodeGridDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateIcon: {
    fontSize: 48,
    opacity: 0.5,
    marginBottom: 12,
  },
  emptyStateText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  
  // Master Node Card
  masterNodeCard: {
    backgroundColor: COLORS.cobaltBlue + '08',
    padding: 14,
    borderRadius: 12,
  },
  masterNodeId: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  masterNodeTime: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  
  // Legacy styles (kept for compatibility)
  header: { marginBottom: 12, alignItems: 'center' },
  mainTitle: { fontFamily: FONTS.orbitronBold, fontSize: 20, color: '#111827', fontWeight: '700' },
  scanButton: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginVertical: 8 },
  scanButtonText: { fontFamily: FONTS.montserratBold, fontSize: 16, color: '#fff', fontWeight: '700' },
  sectionTitle: { fontFamily: FONTS.montserratBold, fontSize: 16, color: COLORS.charcoal, marginBottom: 12, letterSpacing: 0.5 },
  
  connectedSection: { marginVertical: 12 },
  connectedCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#9CA3AF' },
  smallText: { fontFamily: FONTS.montserratRegular, fontSize: 13, color: '#374151' },
  commandButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  sendButton: { backgroundColor: COLORS.oasisGreen, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  sendButtonText: { fontFamily: FONTS.montserratBold, color: '#FFFFFF', fontWeight: '700' },
  disconnectBtn: { backgroundColor: COLORS.terracotta, marginTop: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  disconnectBtnText: { fontFamily: FONTS.montserratBold, color: '#FFFFFF', fontWeight: '700' },

  masterSection: { marginVertical: 12 },
  nodeCard: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.warmStone },
  nodeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeTitle: { fontFamily: FONTS.montserratBold, fontSize: 15, color: COLORS.charcoal },
  nodeBody: { marginTop: 8 },

  slavesSection: { marginVertical: 12 },
  savedSection: { marginVertical: 12 },
  savedItem: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 10, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.warmStone },
  removeBtn: { backgroundColor: COLORS.terracotta, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6 },
  removeBtnText: { color: '#FFFFFF', fontFamily: FONTS.montserratBold, fontWeight: '700' },

  rawSection: { marginVertical: 12 },
  rawItem: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: COLORS.warmStone },
  monoText: { fontFamily: FONTS.orbitronBold, fontSize: 12, color: COLORS.charcoal },
  noNodesText: { fontFamily: FONTS.montserratRegular, color: COLORS.textMuted, textAlign: 'center', padding: 20 },
  
  // Mesh Network
  meshSection: { marginVertical: 12 },
  meshNodeItem: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, marginBottom: 8 },
  meshNodeInfo: {},
  meshNodeName: { fontFamily: FONTS.montserratBold, fontSize: 14, color: COLORS.charcoal },
  meshNodeStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  meshNodeStatusText: { fontFamily: FONTS.montserratRegular, fontSize: 12, color: COLORS.textMuted, marginLeft: 6 },
  detectionTime: { fontFamily: FONTS.montserratRegular, fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
});

export default LoRaConnectionScreen;