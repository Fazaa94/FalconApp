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
  const [lastBleMessage, setLastBleMessage] = useState(null);
  
  const raceContext = useRace();
  const manager = useRef(getBleManager());
  const connectedDeviceRef = useRef(null); // Use ref for immediate access
  const monitorSubscriptionRef = useRef(null); // Track monitoring subscription
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttemptsRef = useRef(5);
  const reconnectDelayRef = useRef(1000); // Start with 1s
  const reconnectTimeoutRef = useRef(null);
  const messageBufferRef = useRef('');
  const bufferFlushTimeoutRef = useRef(null); // Timeout for forcing buffer flush

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

  // Unified telemetry handler mapping firmware JSON types
  // Types: system_status, race, falcon, motion, gps, camera_status, node_msg, camera_msg
  const handleIncomingTelemetry = (msg) => {
    if (!msg || typeof msg !== 'object') return;
    
    // Infer message type if not explicitly provided
    let type = msg.type;
    if (!type) {
      if (msg.nodes && msg.count !== undefined) {
        type = 'system_status';
        console.log('✅ Inferred type: system_status (nodes detected)');
      } else if (msg.status && msg.status.includes('Race')) {
        type = 'race';
        console.log('✅ Inferred type: race (status message)');
      } else if (msg.payload === '101' || msg.payload === 'The Falcon Has Been Detected') {
        type = 'falcon';
        console.log('✅ Inferred type: falcon (101 payload)');
      } else if (msg.payload && msg.src) {
        type = 'detection';
        console.log('✅ Inferred type: detection (src + payload)');
      } else {
        console.warn('⚠️ Could not infer message type');
      }
    }
    
    const src = msg.src ?? msg.source ?? null;

    // Store last message for UI display (e.g., detection messages)
    setLastBleMessage(JSON.stringify(msg));

    // Add raw message record first
    try {
      raceContext.dispatch({ type: 'ADD_MESSAGE', payload: { raw: msg, ts: Date.now() } });
    } catch {}

    switch (type) {
      case 'system_status': {
        // Update global status
        try {
          raceContext.dispatch({
            type: 'SET_STATUS',
            payload: {
              connected: true,
              race_active: !!msg.race_active,
              battery: msg.battery,
              ts_received: msg.utc ? Date.parse(msg.utc) : Date.now(),
              falcon_detected: false,
            }
          });
        } catch {}
        
        // Roster nodes - can be either array of numbers or objects
        if (Array.isArray(msg.nodes)) {
          msg.nodes.forEach(n => {
            // If n is a number, use it directly; if object, use n.id
            const nodeId = typeof n === 'object' ? n.id : n;
            const nodeIdStr = String(nodeId);
            try {
              raceContext.dispatch({
                type: 'UPDATE_NODE',
                payload: {
                  id: nodeIdStr,
                  lastSeen: Date.now(),
                  cameraPresent: typeof n === 'object' ? n.camera_alive : undefined,
                }
              });
            } catch {}
          });
        }
        break;
      }
      case 'race': {
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
          try {
            raceContext.dispatch({
              type: 'UPDATE_NODE',
              payload: {
                id: nodeIdStr,
                lastSeen: Date.now(),
              }
            });
          } catch {}
        }
        try {
          raceContext.dispatch({
            type: 'ADD_MESSAGE',
            payload: { ts: msg.ts_iso ? Date.parse(msg.ts_iso) : Date.now(), raw: msg }
          });
        } catch {}

        // Check for nested camera_msg in payload
        if (msg.payload) {
          let inner = null;
          try {
            inner = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
          } catch {
            inner = msg.payload;
          }
          if (inner && inner.type === 'camera_msg' && inner.payload === '101') {
            raceContext.dispatch({
              type: 'PROCESS_NODE_MSG',
              payload: {
                src,
                payload: msg.payload,
                ts_iso: msg.ts_iso,
              }
            });
          }
        }
        break;
      }
      case 'gps': {
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
      case 'camera_msg': {
        try {
          raceContext.dispatch({
            type: 'ADD_DETECTION',
            payload: {
              nodeId: src != null ? String(src) : 'master',
              ts_iso: msg.ts_iso,
              type: 'camera',
              event: msg.event,
            }
          });
        } catch {}
        break;
      }
      default:
        // Unknown type, already stored in messages
        break;
    }
  };

  // Safe notification handler (now using unified telemetry parser)
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
      console.log('═══════════════════════════════════════════════════════');
      console.log('📨 RAW BLE DATA FROM ESP BOARD:');
      console.log('   Chunk received:', decoded);
      console.log('   Chunk length:', decoded.length, 'chars');
      console.log('───────────────────────────────────────────────────────');
      
      messageBufferRef.current += decoded;
      
      console.log('📦 ACCUMULATED BUFFER:');
      console.log('   Total length:', messageBufferRef.current.length, 'chars');
      console.log('   First 200 chars:', messageBufferRef.current.substring(0, 200));
      if (messageBufferRef.current.length > 200) {
        console.log('   ... (truncated)');
      }
      console.log('───────────────────────────────────────────────────────');

      // Import parser after BleProvider is created to avoid circular dependency
      const { processStream } = require('../utils/parser');
      const messages = processStream(messageBufferRef, false); // Try normal parse first

      if (messages.length > 0) {
        console.log('✅ SUCCESSFULLY PARSED', messages.length, 'MESSAGE(S):');
        messages.forEach((msg, idx) => {
          console.log(`\n📋 MESSAGE #${idx + 1}:`);
          console.log('   Full JSON:', JSON.stringify(msg, null, 2));
        });
        
        // Clear timeout since we got complete messages
        if (bufferFlushTimeoutRef.current) {
          clearTimeout(bufferFlushTimeoutRef.current);
          bufferFlushTimeoutRef.current = null;
        }
        
        messages.forEach((msg) => {
          try {
            // Extract actual payload (parser returns { kind, data })
            const payloadObj = (msg.data && typeof msg.data === 'object') ? msg.data : msg;
            handleIncomingTelemetry(payloadObj);
            console.log('✅ Message processed successfully');
          } catch (e) {
            console.warn('❌ Telemetry handling error:', e.message);
          }
        });
      } else {
        console.log('⏳ No complete messages yet (waiting for more data...)');
        
        // Only set timeout on first incomplete message, don't reset it on each chunk
        if (!bufferFlushTimeoutRef.current) {
          bufferFlushTimeoutRef.current = setTimeout(() => {
            console.log('⏱️ Buffer flush timeout triggered, buffer has:', messageBufferRef.current.length, 'chars');
            const { processStream } = require('../utils/parser');
            const flushMessages = processStream(messageBufferRef, true); // Force flush
            bufferFlushTimeoutRef.current = null; // Clear timeout reference
            
            if (flushMessages.length > 0) {
              console.log('✅ FLUSHED', flushMessages.length, 'MESSAGE(S) from timeout:');
              flushMessages.forEach((msg, idx) => {
                console.log(`\n📋 FLUSHED MESSAGE #${idx + 1}:`);
                console.log('   Full JSON:', JSON.stringify(msg, null, 2));
              });
              
              flushMessages.forEach((msg) => {
                try {
                  // Extract actual payload (parser returns { kind, data })
                  const payloadObj = (msg.data && typeof msg.data === 'object') ? msg.data : msg;
                  handleIncomingTelemetry(payloadObj);
                  console.log('✅ Flushed message processed successfully');
                } catch (e) {
                  console.warn('❌ Telemetry handling error:', e.message);
                }
              });
            } else {
              console.warn('⚠️ Buffer flush returned no messages, buffer was:', messageBufferRef.current);
            }
          }, 500); // 500ms timeout
        }
      }
      
      console.log('═══════════════════════════════════════════════════════\n');
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
        try {
          monitorSubscriptionRef.current.remove();
        } catch (e) {
          console.warn('Could not remove old subscription:', e.message);
        }
        monitorSubscriptionRef.current = null;
      }

      // Wrap the notification handler with error boundaries
      const safeNotificationHandler = (error, characteristic) => {
        try {
          if (error) {
            console.warn('⚠️ Notification subscription error (non-fatal):', error?.message || error);
            // Don't crash on subscription errors, just log them
            return;
          }
          handleNotification(error, characteristic);
        } catch (e) {
          console.error('❌ Fatal error in notification handler:', e);
          // Still try to keep going
        }
      };

      const subscription = device.monitorCharacteristicForService(
        BLE_CONFIG.SERVICE_UUID,
        BLE_CONFIG.TX_CHAR_UUID,
        safeNotificationHandler
      );
      
      monitorSubscriptionRef.current = subscription;
      console.log('✅ Monitoring subscription created');
    } catch (error) {
      console.error('❌ Error starting monitoring:', error?.message || error);
      throw error;
    }
  };

  // Handle disconnection with exponential backoff
  const handleDisconnection = async (error, device) => {
    try {
      console.log('🔌 Device disconnected:', error?.message || 'Unknown reason');
      
      // Clear monitoring subscription - this may fail if subscription already errored
      if (monitorSubscriptionRef.current) {
        try {
          monitorSubscriptionRef.current.remove();
          console.log('✅ Monitoring subscription removed');
        } catch (err) {
          console.warn('⚠️ Could not remove subscription (may already be gone):', err?.message || err);
        }
        monitorSubscriptionRef.current = null;
      }
      
      // Clear buffer flush timeout if exists
      if (bufferFlushTimeoutRef.current) {
        try {
          clearTimeout(bufferFlushTimeoutRef.current);
        } catch (err) {
          console.warn('Could not clear buffer timeout:', err?.message || err);
        }
        bufferFlushTimeoutRef.current = null;
      }
      
      // Clear reconnect timeout if exists
      if (reconnectTimeoutRef.current) {
        try {
          clearTimeout(reconnectTimeoutRef.current);
        } catch (err) {
          console.warn('Could not clear reconnect timeout:', err?.message || err);
        }
        reconnectTimeoutRef.current = null;
      }

      connectedDeviceRef.current = null;
      setConnectedDevice(null);
      messageBufferRef.current = '';

      if (raceContext) {
        try {
          raceContext.dispatch({
            type: 'SET_STATUS',
            payload: {
              connected: false,
              ts_received: Date.now(),
            },
          });
        } catch (err) {
          console.warn('Could not dispatch status update:', err?.message || err);
        }
      }

      console.log('✅ Disconnection handled gracefully');
    } catch (err) {
      console.warn('⚠️ Error in handleDisconnection:', err?.message || err);
    }
  };

  // Connect to device
  const connect = async (deviceId) => {
    try {
      console.log('🔄 Connecting to device:', deviceId);
      const device = await manager.current.connectToDevice(deviceId).catch((err) => {
        console.error('❌ BLE connectToDevice error:', err);
        throw err;
      });
      console.log('✅ Device connected, discovering services...');
      
      await device.discoverAllServicesAndCharacteristics().catch((err) => {
        console.error('❌ BLE discoverAllServicesAndCharacteristics error:', err);
        throw err;
      });
      console.log('✅ Services discovered');
      
      // Negotiate MTU to 128 for larger BLE packets (avoids fragmentation)
      try {
        const mtu = await device.requestMTU(128);
        console.log('✅ MTU negotiated to:', mtu);
      } catch (mtuError) {
        console.warn('⚠️ MTU negotiation failed:', mtuError?.message || mtuError);
        // Continue anyway - MTU negotiation is optional
      }
      
      // Verify required characteristics exist
      const services = await device.services().catch((err) => {
        console.error('❌ BLE services() error:', err);
        throw err;
      });
      const targetService = services.find(s => s.uuid.toLowerCase().includes('1234'));
      if (targetService) {
        const chars = await targetService.characteristics().catch((err) => {
          console.error('❌ BLE characteristics() error:', err);
          throw err;
        });
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
      await startMonitoring(device).catch((err) => {
        console.error('❌ BLE startMonitoring error:', err);
        throw err;
      });
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
      ).catch((err) => {
        console.error('❌ BLE writeCharacteristicWithResponseForService error:', err);
        if (err && err.reason) console.error('❌ BLE error reason:', err.reason);
        if (err && err.reason) alert('BLE Error: ' + err.reason);
        throw err;
      });

      console.log('📤 BLE TX:', commandString);
      console.log('✅ Command sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Write error:', error.message);
      if (error && error.reason) console.error('❌ BLE error reason:', error.reason);
      if (error && error.reason) alert('BLE Error: ' + error.reason);
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
    lastBleMessage,
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
