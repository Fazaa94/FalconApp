import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { useRace } from '../context/RaceContext';

const BleContext = createContext(null);

// Singleton BleManager instance
let bleManagerInstance = null;

const getBleManager = () => {
  if (!bleManagerInstance) {
    bleManagerInstance = new BleManager();
  }
  return bleManagerInstance;
};

export const BleProvider = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState([]);
  
  const raceContext = useRace();
  const manager = useRef(getBleManager());
  const connectedDeviceRef = useRef(null); // Use ref for immediate access
  const monitorSubscriptionRef = useRef(null); // Track monitoring subscription
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttemptsRef = useRef(5);
  const reconnectDelayRef = useRef(1000); // Start with 1s
  const reconnectTimeoutRef = useRef(null);
  const messageBufferRef = useRef('');

  const BLE_CONFIG = {
    SERVICE_UUID: '1234',
    TX_CHAR_UUID: '1235',
    RX_CHAR_UUID: '1236',
  };

  // Safe base64 decode
  const decodeBase64 = (base64String) => {
    try {
      return Buffer.from(base64String, 'base64').toString('utf8');
    } catch (error) {
      console.error('Base64 decode error:', error);
      return base64String; // Return original if decode fails
    }
  };

  // Safe notification handler
  const handleNotification = async (error, characteristic) => {
    try {
      if (error) {
        console.error('❌ Notification error:', error);
        return;
      }
      
      if (!characteristic || !characteristic.value) {
        console.warn('⚠️ Empty characteristic received');
        return;
      }

      const decoded = decodeBase64(characteristic.value);
      console.log('📨 BLE RX Chunk:', decoded);
      messageBufferRef.current += decoded;
      console.log('📦 Buffer accumulated:', messageBufferRef.current.substring(0, 100) + '...');
      console.log('📊 Buffer total length:', messageBufferRef.current.length, 'chars');

      // Import parser after BleProvider is created to avoid circular dependency
      const { processStream } = require('../utils/parser');
      const messages = processStream(messageBufferRef);

      if (messages.length > 0) {
        console.log(`✅ Parsed ${messages.length} complete message(s)!`);
      }
      
      messages.forEach((msg) => {
        msg.ts_received = Date.now();
        console.log('📦 BLE Parsed Message:', JSON.stringify(msg, null, 2));

        if (raceContext) {
          raceContext.dispatch({
            type: 'ADD_MESSAGE',
            payload: msg,
          });

          // Dispatch to specific handlers based on message type
          if (msg.data && msg.data.type === 'status') {
            raceContext.dispatch({
              type: 'SET_STATUS',
              payload: {
                connected: msg.data.connected || false,
                race_active: msg.data.race_active || false,
                battery: msg.data.battery || 0,
                progress_percent: msg.data.progress_percent || 0,
                track_length_m: msg.data.track_length_m || 800,
                detection_count: msg.data.detection_count || 0,
                total_sensors: msg.data.total_nodes || msg.data.total_sensors || 5, // Use dynamic count
                online_count: msg.data.online_count || 0,
                falcon_detected: msg.data.falcon_detected || false,
                rssi: msg.data.rssi || 0,
                local_camera: msg.data.local_camera || false,
                gps_status: msg.data.gps_status || 'unknown',
                last_detection_node: msg.data.last_detection_node,
                total_distance_m: msg.data.total_distance_m,
                lat: msg.data.lat,
                lng: msg.data.lng,
                sats: msg.data.sats,
                ts_received: msg.ts_received,
              },
            });
            
            // Handle dynamic nodes from online_nodes array
            if (msg.data.online_nodes && Array.isArray(msg.data.online_nodes)) {
              msg.data.online_nodes.forEach(nodeId => {
                if (nodeId !== 1) { // Skip master node
                  raceContext.dispatch({
                    type: 'UPDATE_NODE',
                    payload: {
                      id: nodeId,
                      name: `Sensor ${nodeId}`,
                      lastSeen: msg.ts_received,
                      online: true,
                      distance: (nodeId - 1) * 160, // Default positioning: 160m apart
                      battery: 85, // Default values since Arduino doesn't send individual stats
                      rssi: msg.data.rssi || 0,
                    },
                  });
                }
              });
            }
          } else if (msg.data && msg.data.type === 'falcon_analytics') {
            // Handle comprehensive falcon analytics
            raceContext.dispatch({
              type: 'UPDATE_ANALYTICS',
              payload: {
                detection_count: msg.data.detection_count,
                total_sensors: msg.data.total_sensors,
                progress_percent: msg.data.progress_percent,
                current_sensor: msg.data.current_sensor,
                current_node_id: msg.data.current_node_id,
                segment_distance_m: msg.data.segment_distance_m,
                segment_time_s: msg.data.segment_time_s,
                segment_speed_kmh: msg.data.segment_speed_kmh,
                total_distance_m: msg.data.total_distance_m,
                total_time_s: msg.data.total_time_s,
                average_speed_kmh: msg.data.average_speed_kmh,
                track_length_m: msg.data.track_length_m,
                race_status: msg.data.race_status,
                detection_history: msg.data.detection_history || [],
                ts_received: msg.ts_received,
              },
            });
          } else if (msg.data && msg.data.type === 'falcon') {
            // Falcon detection event
            raceContext.dispatch({
              type: 'ADD_DETECTION',
              payload: {
                id: `det_${msg.ts_received}`,
                nodeId: msg.data.src,
                sensor: msg.data.sensor,
                payload: msg.data.payload,
                timestamp: msg.ts_received,
                type: 'falcon',
              },
            });
          } else if (msg.data && msg.data.type === 'motion') {
            // Motion detection event
            raceContext.dispatch({
              type: 'ADD_DETECTION',
              payload: {
                id: `mot_${msg.ts_received}`,
                nodeId: msg.data.src,
                event: msg.data.event,
                timestamp: msg.ts_received,
                type: 'motion',
              },
            });
          } else if (msg.data && msg.data.type === 'gps') {
            // GPS update
            raceContext.dispatch({
              type: 'UPDATE_GPS',
              payload: {
                lat: msg.data.lat,
                lng: msg.data.lng,
                sats: msg.data.sats,
                alt: msg.data.alt,
                speed: msg.data.speed,
                hdop: msg.data.hdop,
                ts_received: msg.ts_received,
              },
            });
          } else if (msg.data && msg.data.type === 'node_msg') {
            // Message from slave node - parse the payload JSON string
            try {
              const nodeData = typeof msg.data.payload === 'string' 
                ? JSON.parse(msg.data.payload) 
                : msg.data.payload;
              
              raceContext.dispatch({
                type: 'UPDATE_NODE',
                payload: {
                  id: msg.data.src || nodeData.src,
                  name: `Sensor ${msg.data.src || nodeData.src}`,
                  lastSeen: msg.ts_received,
                  battery: nodeData.battery || 0,
                  rssi: nodeData.rssi || 0,
                  race_active: nodeData.race_active || false,
                  camera_present: nodeData.camera_present || false,
                  timestamp_ms: nodeData.timestamp_ms,
                  type: nodeData.type,
                },
              });
            } catch (parseErr) {
              console.warn('Could not parse node payload:', parseErr.message);
              // Fallback to basic info
              raceContext.dispatch({
                type: 'UPDATE_NODE',
                payload: {
                  id: msg.data.src,
                  name: `Sensor ${msg.data.src}`,
                  lastSeen: msg.ts_received,
                  payload: msg.data.payload,
                },
              });
            }
          } else if (msg.data && msg.data.type === 'camera_msg') {
            // Camera message
            raceContext.dispatch({
              type: 'ADD_DETECTION',
              payload: {
                id: `cam_${msg.ts_received}`,
                nodeId: msg.data.src,
                event: msg.data.event,
                timestamp: msg.ts_received,
                type: 'camera',
              },
            });
          }
        }
      });
    } catch (error) {
      console.error('Error in notification handler:', error);
      // Log but don't crash
    }
  };

  // Start monitoring characteristic for notifications
  const startMonitoring = async (device) => {
    try {
      // Cancel existing subscription if any
      if (monitorSubscriptionRef.current) {
        monitorSubscriptionRef.current.remove();
        monitorSubscriptionRef.current = null;
      }

      const subscription = device.monitorCharacteristicForService(
        BLE_CONFIG.SERVICE_UUID,
        BLE_CONFIG.TX_CHAR_UUID,
        handleNotification
      );
      
      monitorSubscriptionRef.current = subscription;
      console.log('✅ Monitoring subscription created');
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };

  // Handle disconnection with exponential backoff
  const handleDisconnection = async (error, device) => {
    try {
      console.log('🔌 Device disconnected:', error?.message || 'Unknown reason');
      
      // Clear monitoring subscription
      if (monitorSubscriptionRef.current) {
        try {
          monitorSubscriptionRef.current.remove();
          console.log('✅ Monitoring subscription removed');
        } catch (err) {
          console.warn('Could not remove subscription:', err.message);
        }
        monitorSubscriptionRef.current = null;
      }
      
      // Clear reconnect timeout if exists
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      connectedDeviceRef.current = null;
      setConnectedDevice(null);
      messageBufferRef.current = '';

      if (raceContext) {
        raceContext.dispatch({
          type: 'SET_STATUS',
          payload: {
            connected: false,
            ts_received: Date.now(),
          },
        });
      }

      console.log('✅ Disconnection handled gracefully');
    } catch (err) {
      console.warn('⚠️ Error in handleDisconnection:', err.message);
      // Never crash on disconnect - just log and continue
    }
  };

  // Connect to device
  const connect = async (deviceId) => {
    try {
      console.log('🔄 Connecting to device:', deviceId);
      const device = await manager.current.connectToDevice(deviceId);
      console.log('✅ Device connected, discovering services...');
      
      await device.discoverAllServicesAndCharacteristics();
      console.log('✅ Services discovered');
      
      // Verify required characteristics exist
      const services = await device.services();
      const targetService = services.find(s => s.uuid.toLowerCase().includes('1234'));
      if (targetService) {
        const chars = await targetService.characteristics();
        console.log('📋 Service 1234 Characteristics:');
        chars.forEach(c => {
          console.log(`   - ${c.uuid} (${c.isReadable ? 'R' : ''}${c.isWritableWithResponse ? 'W' : ''}${c.isNotifiable ? 'N' : ''})`);
        });
      } else {
        console.warn('⚠️  Service 1234 not found!');
      }
      
      connectedDeviceRef.current = device; // Set ref immediately
      setConnectedDevice(device); // Set state for UI
      reconnectAttemptsRef.current = 0;
      reconnectDelayRef.current = 1000;
      messageBufferRef.current = '';

      // Start listening for disconnections
      device.onDisconnected(handleDisconnection);

      // Start monitoring for notifications
      await startMonitoring(device);
      console.log('✅ Monitoring started');

      if (raceContext) {
        raceContext.dispatch({
          type: 'SET_STATUS',
          payload: {
            connected: true,
            ts_received: Date.now(),
          },
        });
      }

      console.log('✅ Connection complete');
      return device;
    } catch (error) {
      console.error('❌ Connection error:', error);
      throw error;
    }
  };

  // Disconnect from device
  const disconnect = async () => {
    console.log('💡 Disconnect called');
    
    // Clear monitoring subscription first
    if (monitorSubscriptionRef.current) {
      try {
        console.log('Removing subscription...');
        monitorSubscriptionRef.current.remove();
        console.log('✅ Subscription removed');
      } catch (err) {
        console.warn('Could not remove subscription:', err?.message || err);
      }
      monitorSubscriptionRef.current = null;
    }
    
    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      try {
        clearTimeout(reconnectTimeoutRef.current);
      } catch (err) {
        console.warn('Timeout clear error:', err?.message || err);
      }
      reconnectTimeoutRef.current = null;
    }

    // Cancel device connection (fire and forget - don't wait for it)
    const device = connectedDeviceRef.current;
    if (device) {
      console.log('Disconnecting device (async)...');
      // Don't await - just fire it off and let it complete in background
      device.cancelConnection().catch((err) => {
        console.warn('Device cancel error (ignored):', err?.message || err);
      });
    }
    
    // Always clean up state regardless of cancel result
    try {
      connectedDeviceRef.current = null;
      setConnectedDevice(null);
      messageBufferRef.current = '';

      if (raceContext) {
        raceContext.dispatch({
          type: 'SET_STATUS',
          payload: {
            connected: false,
            ts_received: Date.now(),
          },
        });
      }
      
      console.log('✅ Disconnect complete');
    } catch (stateError) {
      console.warn('State cleanup error:', stateError?.message || stateError);
    }
  };

  // Write command to device
  const write = async (command, withoutResponse = false) => {
    try {
      const device = connectedDeviceRef.current;
      if (!device) {
        console.warn('Cannot write - device not connected');
        return false;
      }

      // Check if device is still connected
      const isConnected = await device.isConnected();
      if (!isConnected) {
        console.warn('Device disconnected');
        connectedDeviceRef.current = null;
        setConnectedDevice(null);
        return false;
      }

      const commandString = typeof command === 'string' ? command : JSON.stringify(command);
      const commandBase64 = Buffer.from(commandString, 'utf8').toString('base64');

      await device.writeCharacteristicWithResponseForService(
        BLE_CONFIG.SERVICE_UUID,
        BLE_CONFIG.RX_CHAR_UUID,
        commandBase64
      );

      console.log('📤 BLE TX:', commandString);
      console.log('✅ Command sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Write error:', error.message);
      return false;
    }
  };

  // Scan for devices
  const startScan = (onFound) => {
    try {
      setScanning(true);
      setScannedDevices([]);

      manager.current.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          setScanning(false);
          return;
        }

        if (device && device.name && device.name.includes('FalconRace')) {
          setScannedDevices((prev) => {
            const exists = prev.find((d) => d.id === device.id);
            if (!exists) {
              onFound?.(device);
            }
            return exists ? prev : [...prev, device];
          });
        }
      });

      // Stop scan after 10 seconds
      setTimeout(() => {
        manager.current.stopDeviceScan();
        setScanning(false);
      }, 10000);
    } catch (error) {
      console.error('Scan start error:', error);
      setScanning(false);
    }
  };

  const stopScan = () => {
    try {
      manager.current.stopDeviceScan();
      setScanning(false);
    } catch (error) {
      console.error('Scan stop error:', error);
    }
  };

  // Cleanup on unmount ONLY
  useEffect(() => {
    return () => {
      console.log('🧹 BleProvider cleanup - component unmounting');
      try {
        // Clean up subscription
        if (monitorSubscriptionRef.current) {
          monitorSubscriptionRef.current.remove();
          monitorSubscriptionRef.current = null;
        }
        
        // Clear timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Stop scanning if active
        try {
          manager.current.stopDeviceScan();
        } catch (scanErr) {
          // Ignore scan stop errors on cleanup
        }
      } catch (err) {
        console.warn('Cleanup warning:', err.message);
      }
    };
  }, []); // Empty deps = only runs on unmount

  const value = {
    manager: manager.current,
    connectedDevice,
    scanning,
    scannedDevices,
    connect,
    disconnect,
    write,
    startScan,
    stopScan,
  };

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
};

export const useBle = () => {
  const context = useContext(BleContext);
  if (!context) {
    throw new Error('useBle must be used within a BleProvider');
  }
  return context;
};
