
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   StatusBar,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Alert
// } from 'react-native';
// import { BleManager } from 'react-native-ble-plx';
// import { COLORS, FONTS, styles } from './theme';

// // BLE UUIDs matching your ESP32 code
// const UART_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
// const UART_TX_CHARACTERISTIC_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'; // Notify
// const UART_RX_CHARACTERISTIC_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'; // Write

// const LoRaConnectionScreen = () => {
//   const [isScanning, setIsScanning] = useState(false);
//   const [foundDevices, setFoundDevices] = useState([]);
//   const [connectedDevice, setConnectedDevice] = useState(null);
//   const [sensorData, setSensorData] = useState('');
//   const [meshNodes, setMeshNodes] = useState([]);
//   const [raceState, setRaceState] = useState('IDLE');
//   const [nodeDetections, setNodeDetections] = useState({});
//   const [bleManager] = useState(new BleManager());

//   useEffect(() => {
//     // Request Bluetooth permissions
//     requestPermissions();

//     // Set up BLE manager subscriptions
//     const subscription = bleManager.onStateChange((state) => {
//       if (state === 'PoweredOn') {
//         console.log('Bluetooth is powered on');
//       } else if (state === 'PoweredOff') {
//         console.log('Bluetooth is powered off');
//         Alert.alert('Bluetooth Off', 'Please enable Bluetooth to scan for devices');
//       }
//     }, true);

//     return () => {
//       subscription.remove();
//       bleManager.destroy();
//     };
//   }, []);

//   const requestPermissions = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.requestMultiple([
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//         ]);
        
//         if (
//           granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
//           granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
//           granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
//         ) {
//           console.log('All permissions granted');
//         } else {
//           Alert.alert('Permissions Required', 'Bluetooth permissions are needed to connect to devices');
//         }
//       } catch (err) {
//         console.warn(err);
//       }
//     }
//   };

//   const startScanning = () => {
//     setIsScanning(true);
//     setFoundDevices([]);
    
//     bleManager.startDeviceScan(null, null, (error, device) => {
//       if (error) {
//         console.error('Scan error:', error);
//         setIsScanning(false);
//         return;
//       }

//       // Filter for LoRaBLE devices (updated from ESP32 to LoRaBLE)
//       if (device.name?.includes('LoRaBLE') || device.localName?.includes('LoRaBLE')) {
//         setFoundDevices(prevDevices => {
//           // Check if device already exists
//           const exists = prevDevices.some(d => d.id === device.id);
//           if (!exists) {
//             return [...prevDevices, {
//               id: device.id,
//               name: device.name || device.localName || 'Unknown LoRaBLE',
//               device: device,
//               signalStrength: device.rssi,
//               status: 'ready'
//             }];
//           }
//           return prevDevices;
//         });
//       }
//     });

//     // Stop scanning after 10 seconds
//     setTimeout(() => {
//       stopScanning();
//     }, 10000);
//   };

//   const stopScanning = () => {
//     bleManager.stopDeviceScan();
//     setIsScanning(false);
//   };

//   const handleCancelScan = () => {
//     stopScanning();
//     setFoundDevices([]);
//   };

//   const connectToDevice = async (device) => {
//     try {
//       setIsScanning(false);
//       stopScanning();

//       // Update device status
//       setFoundDevices(prev => 
//         prev.map(d => 
//           d.id === device.id ? { ...d, status: 'connecting' } : d
//         )
//       );

//       const connectedDevice = await device.device.connect();
//       await connectedDevice.discoverAllServicesAndCharacteristics();
      
//       setConnectedDevice(connectedDevice);
      
//       // Update device status
//       setFoundDevices(prev => 
//         prev.map(d => 
//           d.id === device.id ? { ...d, status: 'connected' } : d
//         )
//       );

//       // Set up notifications for sensor data and mesh updates
//       await setupNotifications(connectedDevice);

//       Alert.alert('Connected', `Successfully connected to ${device.name}`);

//     } catch (error) {
//       console.error('Connection error:', error);
//       Alert.alert('Connection Failed', 'Failed to connect to the device');
      
//       // Reset device status
//       setFoundDevices(prev => 
//         prev.map(d => 
//           d.id === device.id ? { ...d, status: 'ready' } : d
//         )
//       );
//     }
//   };

//   const setupNotifications = async (device) => {
//     try {
//       // Monitor TX characteristic for incoming data (sensor readings and mesh updates)
//       await device.monitorCharacteristicForService(
//         UART_SERVICE_UUID,
//         UART_TX_CHARACTERISTIC_UUID,
//         (error, characteristic) => {
//           if (error) {
//             console.error('Notification error:', error);
//             return;
//           }
          
//           if (characteristic?.value) {
//             const data = characteristic.value;
//             const decodedData = Buffer.from(data, 'base64').toString('utf-8');
//             console.log('Received data:', decodedData);
            
//             // Parse the incoming data
//             try {
//               const parsedData = JSON.parse(decodedData);
//               handleIncomingData(parsedData);
//             } catch (e) {
//               // If it's not JSON, treat it as regular sensor data
//               setSensorData(decodedData);
//             }
//           }
//         }
//       );

//       console.log('Notifications setup complete');

//     } catch (error) {
//       console.error('Notification setup error:', error);
//     }
//   };

//   const handleIncomingData = (data) => {
//     // Handle different types of incoming data from LoRa mesh
//     if (data.type === 'mesh_update') {
//       // Update mesh nodes information
//       setMeshNodes(data.nodes || []);
//     } else if (data.type === 'race_state') {
//       setRaceState(data.state);
//     } else if (data.type === 'node_detection') {
//       setNodeDetections(prev => ({
//         ...prev,
//         [data.nodeId]: data.detectionTime
//       }));
//     } else if (data.type === 'node_registered') {
//       // Add new node to mesh
//       setMeshNodes(prev => {
//         const exists = prev.some(node => node.id === data.nodeId);
//         if (!exists) {
//           return [...prev, {
//             id: data.nodeId,
//             name: `Node ${data.nodeId}`,
//             status: 'active',
//             lastSeen: new Date().toISOString(),
//             signalStrength: -70 // Default value
//           }];
//         }
//         return prev;
//       });
//     }
//   };

//   const sendDataToDevice = async (data) => {
//     if (!connectedDevice) {
//       Alert.alert('Not Connected', 'No device connected');
//       return;
//     }

//     try {
//       await connectedDevice.writeCharacteristicWithResponseForService(
//         UART_SERVICE_UUID,
//         UART_RX_CHARACTERISTIC_UUID,
//         Buffer.from(data).toString('base64')
//       );
//       console.log('Data sent to device:', data);
//     } catch (error) {
//       console.error('Send data error:', error);
//       Alert.alert('Send Failed', 'Failed to send data to device');
//     }
//   };

//   const sendCommand = async (command) => {
//     const commandData = JSON.stringify({
//       type: 'command',
//       command: command
//     });
//     await sendDataToDevice(commandData);
//   };

//   const disconnectDevice = async () => {
//     if (connectedDevice) {
//       try {
//         await connectedDevice.cancelConnection();
//         setConnectedDevice(null);
//         setSensorData('');
//         setMeshNodes([]);
//         setRaceState('IDLE');
//         setNodeDetections({});
        
//         // Reset device status
//         setFoundDevices(prev => 
//           prev.map(d => 
//             d.id === connectedDevice.id ? { ...d, status: 'ready' } : d
//           )
//         );
        
//         Alert.alert('Disconnected', 'Device disconnected successfully');
//       } catch (error) {
//         console.error('Disconnection error:', error);
//       }
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'ready': return COLORS.successGreen;
//       case 'connecting': return COLORS.terracotta;
//       case 'connected': return COLORS.oasisGreen;
//       case 'active': return COLORS.oasisGreen;
//       case 'inactive': return COLORS.offlineGray;
//       default: return COLORS.offlineGray;
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case 'ready': return 'Ready to Connect';
//       case 'connecting': return 'Connecting...';
//       case 'connected': return 'Connected';
//       case 'active': return 'Active';
//       case 'inactive': return 'Inactive';
//       default: return 'Unknown';
//     }
//   };

//   const getSignalStrength = (rssi) => {
//     // Convert RSSI to percentage (rough approximation)
//     if (rssi >= -50) return 100;
//     if (rssi <= -100) return 0;
//     return Math.round(((rssi + 100) / 50) * 100);
//   };

//   const ScanningIndicator = () => (
//     <View style={localStyles.scanningSection}>
//       <ActivityIndicator size="large" color={COLORS.cobaltBlue} />
//       <Text style={localStyles.scanningText}>Scanning for LoRaBLE Devices...</Text>
//       <Text style={localStyles.scanningSubtext}>
//         Looking for devices with "LoRaBLE" in their name
//       </Text>
//     </View>
//   );

//   const DeviceList = () => (
//     <View style={localStyles.devicesSection}>
//       <Text style={localStyles.sectionTitle}>Found LoRaBLE Devices</Text>
//       {foundDevices.map((device) => (
//         <TouchableOpacity
//           key={device.id}
//           style={[
//             localStyles.deviceItem,
//             device.status === 'connected' && localStyles.connectedDevice
//           ]}
//           onPress={() => connectToDevice(device)}
//           disabled={device.status === 'connecting' || device.status === 'connected'}
//         >
//           <View style={localStyles.deviceInfo}>
//             <Text style={localStyles.deviceName}>{device.name}</Text>
//             <View style={localStyles.deviceStatus}>
//               <View 
//                 style={[
//                   localStyles.statusDot, 
//                   { backgroundColor: getStatusColor(device.status) }
//                 ]} 
//               />
//               <Text style={localStyles.statusText}>
//                 {getStatusText(device.status)}
//               </Text>
//             </View>
//           </View>
//           <View style={localStyles.signalStrength}>
//             <View style={localStyles.signalBarContainer}>
//               {[1, 2, 3, 4].map((bar) => (
//                 <View
//                   key={bar}
//                   style={[
//                     localStyles.signalBar,
//                     localStyles[`signalBar${bar}`],
//                     {
//                       backgroundColor: bar * 25 <= getSignalStrength(device.signalStrength) 
//                         ? COLORS.cobaltBlue 
//                         : COLORS.warmStone,
//                     },
//                   ]}
//                 />
//               ))}
//             </View>
//             <Text style={localStyles.signalText}>{device.signalStrength} dBm</Text>
//           </View>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );

//   const MeshNetworkSection = () => (
//     <View style={localStyles.meshSection}>
//       <Text style={localStyles.sectionTitle}>LoRa Mesh Network</Text>
//       <View style={localStyles.raceInfo}>
//         <Text style={localStyles.raceState}>
//           Race State: <Text style={localStyles.raceStateValue}>{raceState}</Text>
//         </Text>
//         <Text style={localStyles.nodeCount}>
//           Connected Nodes: {meshNodes.length}
//         </Text>
//       </View>
      
//       {meshNodes.length > 0 ? (
//         <View style={localStyles.meshNodesList}>
//           {meshNodes.map((node) => (
//             <View key={node.id} style={localStyles.meshNodeItem}>
//               <View style={localStyles.meshNodeInfo}>
//                 <Text style={localStyles.meshNodeName}>{node.name}</Text>
//                 <View style={localStyles.meshNodeStatus}>
//                   <View 
//                     style={[
//                       localStyles.statusDot, 
//                       { backgroundColor: getStatusColor(node.status) }
//                     ]} 
//                   />
//                   <Text style={localStyles.meshNodeStatusText}>
//                     {getStatusText(node.status)}
//                   </Text>
//                 </View>
//                 {nodeDetections[node.id] && (
//                   <Text style={localStyles.detectionTime}>
//                     Detection: {nodeDetections[node.id]}
//                   </Text>
//                 )}
//               </View>
//               <View style={localStyles.signalStrength}>
//                 <View style={localStyles.signalBarContainer}>
//                   {[1, 2, 3, 4].map((bar) => (
//                     <View
//                       key={bar}
//                       style={[
//                         localStyles.signalBar,
//                         localStyles[`signalBar${bar}`],
//                         {
//                           backgroundColor: bar * 25 <= getSignalStrength(node.signalStrength) 
//                             ? COLORS.cobaltBlue 
//                             : COLORS.warmStone,
//                         },
//                       ]}
//                     />
//                   ))}
//                 </View>
//                 <Text style={localStyles.signalText}>{node.signalStrength} dBm</Text>
//               </View>
//             </View>
//           ))}
//         </View>
//       ) : (
//         <Text style={localStyles.noNodesText}>No mesh nodes connected yet</Text>
//       )}
//     </View>
//   );

//   const ConnectedDeviceInfo = () => (
//     <View style={localStyles.connectedSection}>
//       <Text style={localStyles.sectionTitle}>Connected Device</Text>
//       <View style={localStyles.connectedDeviceInfo}>
//         <Text style={localStyles.connectedDeviceName}>
//           {connectedDevice?.name || 'LoRaBLE Device'}
//         </Text>
//         <Text style={localStyles.sensorData}>
//           {sensorData || 'Waiting for data...'}
//         </Text>
//         <TouchableOpacity 
//           style={localStyles.disconnectButton}
//           onPress={disconnectDevice}
//         >
//           <Text style={localStyles.disconnectButtonText}>DISCONNECT</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   const InstructionsSection = () => (
//     <View style={localStyles.instructionsSection}>
//       <Text style={localStyles.instructionsTitle}>
//         Connection Instructions
//       </Text>
//       <Text style={localStyles.instructionsText}>
//         • Ensure your LoRaBLE device is powered on{'\n'}
//         • Make sure Bluetooth is enabled on your phone{'\n'}
//         • The device should appear as "LoRaBLE"{'\n'}
//         • Mesh network nodes will appear automatically once connected{'\n'}
//         • Race state and detections will update in real-time
//       </Text>
//     </View>
//   );

//   return (
//     <View style={styles.screen}>
//       <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
      
//       {/* Header */}
//       <View style={localStyles.header}>
//         <Text style={localStyles.mainTitle}>CONNECT LoRaBLE MESH</Text>
//       </View>

//       <ScrollView 
//         style={localStyles.scrollView}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={localStyles.scrollContent}
//       >
//         {/* Start Scan Button */}
//         {!isScanning && foundDevices.length === 0 && !connectedDevice && (
//           <TouchableOpacity 
//             style={localStyles.scanButton}
//             onPress={startScanning}
//           >
//             <Text style={localStyles.scanButtonText}>START SCAN</Text>
//           </TouchableOpacity>
//         )}

//         {/* Scanning Section */}
//         {isScanning && <ScanningIndicator />}

//         {/* Divider */}
//         {(isScanning || foundDevices.length > 0) && (
//           <View style={localStyles.divider} />
//         )}

//         {/* Connected Device Info */}
//         {connectedDevice && (
//           <>
//             <ConnectedDeviceInfo />
//             <View style={localStyles.divider} />
//           </>
//         )}

//         {/* Mesh Network Section */}
//         {connectedDevice && (
//           <>
//             <MeshNetworkSection />
//             <View style={localStyles.divider} />
//           </>
//         )}

//         {/* Found Devices */}
//         {!isScanning && foundDevices.length > 0 && !connectedDevice && (
//           <>
//             <DeviceList />
//             <View style={localStyles.divider} />
//           </>
//         )}

//         {/* Instructions */}
//         <InstructionsSection />

//         {/* Action Buttons */}
//         <View style={localStyles.buttonsContainer}>
//           {(isScanning || foundDevices.length > 0) && !connectedDevice && (
//             <TouchableOpacity 
//               style={localStyles.cancelButton}
//               onPress={handleCancelScan}
//             >
//               <Text style={localStyles.cancelButtonText}>CANCEL SCAN</Text>
//             </TouchableOpacity>
//           )}
          
//           {connectedDevice && (
//             <View style={localStyles.commandButtons}>
//               <TouchableOpacity 
//                 style={localStyles.sendDataButton}
//                 onPress={() => sendCommand('START')}
//               >
//                 <Text style={localStyles.sendDataButtonText}>START RACE</Text>
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 style={localStyles.sendDataButton}
//                 onPress={() => sendCommand('STOP')}
//               >
//                 <Text style={localStyles.sendDataButtonText}>STOP RACE</Text>
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 style={localStyles.sendDataButton}
//                 onPress={() => sendCommand('RESET')}
//               >
//                 <Text style={localStyles.sendDataButtonText}>RESET</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// const localStyles = StyleSheet.create({
//   header: {
//     marginBottom: 24,
//     alignItems: 'center',
//   },
//   mainTitle: {
//     fontFamily: FONTS.orbitronBold,
//     fontSize: 24,
//     color: COLORS.charcoal,
//     textAlign: 'center',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     paddingHorizontal: 16,
//   },
//   scanButton: {
//     backgroundColor: COLORS.cobaltBlue,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   scanButtonText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.desertSand,
//     textTransform: 'uppercase',
//   },
//   scanningSection: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   scanningText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 18,
//     color: COLORS.charcoal,
//     marginTop: 16,
//   },
//   scanningSubtext: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal + '80',
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: COLORS.charcoal + '20',
//     marginVertical: 24,
//   },
//   devicesSection: {
//     marginBottom: 16,
//   },
//   connectedSection: {
//     marginBottom: 16,
//   },
//   meshSection: {
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 20,
//     color: COLORS.charcoal,
//     marginBottom: 16,
//   },
//   deviceItem: {
//     backgroundColor: COLORS.warmStone,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 12,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: COLORS.charcoal + '20',
//   },
//   connectedDevice: {
//     borderColor: COLORS.oasisGreen,
//     borderWidth: 2,
//   },
//   deviceInfo: {
//     flex: 1,
//   },
//   deviceName: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.charcoal,
//     marginBottom: 8,
//   },
//   deviceStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     marginRight: 8,
//   },
//   statusText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 14,
//     color: COLORS.charcoal,
//   },
//   signalStrength: {
//     alignItems: 'center',
//     marginLeft: 16,
//   },
//   signalBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     height: 20,
//     marginBottom: 4,
//   },
//   signalBar: {
//     width: 4,
//     marginHorizontal: 1,
//     borderRadius: 2,
//   },
//   signalBar1: {
//     height: 6,
//   },
//   signalBar2: {
//     height: 10,
//   },
//   signalBar3: {
//     height: 14,
//   },
//   signalBar4: {
//     height: 18,
//   },
//   signalText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.charcoal + '80',
//   },
//   connectedDeviceInfo: {
//     backgroundColor: COLORS.warmStone,
//     padding: 20,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   connectedDeviceName: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 18,
//     color: COLORS.charcoal,
//     marginBottom: 12,
//   },
//   sensorData: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 16,
//     color: COLORS.cobaltBlue,
//     marginBottom: 16,
//     textAlign: 'center',
//   },
//   meshNodesList: {
//     marginTop: 12,
//   },
//   meshNodeItem: {
//     backgroundColor: COLORS.warmStone,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 8,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   meshNodeInfo: {
//     flex: 1,
//   },
//   meshNodeName: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.charcoal,
//     marginBottom: 4,
//   },
//   meshNodeStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   meshNodeStatusText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal,
//   },
//   detectionTime: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.oasisGreen,
//   },
//   raceInfo: {
//     backgroundColor: COLORS.warmStone,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//   },
//   raceState: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.charcoal,
//     marginBottom: 8,
//   },
//   raceStateValue: {
//     color: COLORS.cobaltBlue,
//   },
//   nodeCount: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal,
//   },
//   noNodesText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal + '80',
//     textAlign: 'center',
//     padding: 20,
//   },
//   instructionsSection: {
//     backgroundColor: COLORS.warmStone,
//     padding: 20,
//     borderRadius: 12,
//     marginBottom: 24,
//   },
//   instructionsTitle: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.charcoal,
//     marginBottom: 12,
//   },
//   instructionsText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal + '80',
//     lineHeight: 20,
//   },
//   buttonsContainer: {
//     gap: 12,
//   },
//   commandButtons: {
//     gap: 12,
//   },
//   cancelButton: {
//     backgroundColor: COLORS.terracotta,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.desertSand,
//     textTransform: 'uppercase',
//   },
//   disconnectButton: {
//     backgroundColor: COLORS.terracotta,
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 8,
//   },
//   disconnectButtonText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 14,
//     color: COLORS.desertSand,
//     textTransform: 'uppercase',
//   },
//   sendDataButton: {
//     backgroundColor: COLORS.oasisGreen,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   sendDataButtonText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.charcoal,
//     textTransform: 'uppercase',
//   },
// });

// export default LoRaConnectionScreen;

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
        console.error('Scan error:', error);
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

      setConnectedDevice(connected);
      setFoundDevices(prev => prev.map(d => d.id === devWrap.id ? { ...d, status: 'connected' } : d));

      // Setup notifications
      await setupNotifications(connected);

      Alert.alert('Connected', `Connected to ${devWrap.name}`);
    } catch (err) {
      console.error('Connection error:', err);
      Alert.alert('Connection Failed', String(err.message || err));
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
      console.warn('Disconnect error', e);
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
    const type = msg.type;
    const src = msg.src ?? msg.source ?? null;

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
          msg.nodes.forEach(n => {
            const nodeIdStr = String(n.id);
            setSlaveNodes(prev => ({
              ...prev,
              [nodeIdStr]: {
                ...prev[nodeIdStr],
                nodeId: nodeIdStr,
                lastSeen: new Date(Date.now() - (n.last_seen_ms || 0)).toISOString(),
                cameraAlive: n.camera_alive,
              }
            }));
            try {
              raceContext.dispatch({
                type: 'UPDATE_NODE',
                payload: { id: nodeIdStr, cameraPresent: n.camera_alive }
              });
            } catch {}
          });
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
            console.error('Notification error:', error);
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
      console.error('Send data error:', error);
      Alert.alert('Send Failed', 'Failed to send data to device');
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
  const toggleExpand = (id) => {
    setIsExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  /* ------------------ Render ------------------ */
  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
      <View style={localStyles.header}>
        <Text style={localStyles.mainTitle}>FalconRace — Master & Slave Monitor</Text>
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
          {masterNode ? (
            <View style={localStyles.nodeCard}>
              <View style={localStyles.nodeHeader}>
                <Text style={localStyles.nodeTitle}>Master ID: {masterNode.id}</Text>
                <TouchableOpacity onPress={() => saveNode(masterNode.id)} style={localStyles.saveBtn}>
                  <Text style={localStyles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>

              <Text style={localStyles.smallText}>Last Seen: {masterNode.lastSeen}</Text>
              {masterNode.lastMsg && (
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

        {/* Slave Nodes */}
        <View style={localStyles.slavesSection}>
          <Text style={localStyles.sectionTitle}>Slave Nodes ({Object.keys(slaveNodes).length})</Text>
          {Object.values(slaveNodes).length > 0 ? (
            Object.values(slaveNodes).map((node) => (
              <View key={String(node.nodeId)} style={localStyles.nodeCard}>
                <View style={localStyles.nodeHeader}>
                  <Text style={localStyles.nodeTitle}>Node {node.nodeId}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => saveNode(node.nodeId)} style={localStyles.saveBtn}>
                      <Text style={localStyles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleExpand(node.nodeId)} style={[localStyles.expandBtn]}>
                      <Text style={localStyles.expandBtnText}>{isExpanded[node.nodeId] ? 'Hide' : 'Raw'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={localStyles.nodeBody}>
                  <Text style={localStyles.smallText}>Master: {node.masterId ?? '-'}</Text>
                  <Text style={localStyles.smallText}>Last Seen: {node.lastSeen}</Text>
                  <Text style={localStyles.smallText}>RSSI: {node.rssi ?? 'N/A'}</Text>
                  <Text style={localStyles.smallText}>Battery: {node.battery ?? 'N/A'}</Text>
                  <Text style={localStyles.subTitle}>Payload:</Text>
                  <Text style={localStyles.monoText}>{JSON.stringify(node.lastMsg, null, 2)}</Text>

                  {isExpanded[node.nodeId] && (
                    <View style={localStyles.rawBox}>
                      <Text style={localStyles.monoText}>{JSON.stringify(node.lastMsg?.raw ?? node.lastMsg, null, 2)}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={localStyles.noNodesText}>No slave nodes received yet</Text>
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

const localStyles = StyleSheet.create({
  header: { marginBottom: 12, alignItems: 'center' },
  mainTitle: { fontFamily: FONTS.orbitronBold, fontSize: 20, color: COLORS.charcoal },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 80 },
  scanButton: { backgroundColor: COLORS.cobaltBlue, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginVertical: 8 },
  scanButtonText: { fontFamily: FONTS.montserratBold, fontSize: 16, color: COLORS.desertSand },
  scanningSection: { alignItems: 'center', paddingVertical: 20 },
  scanningText: { fontFamily: FONTS.montserratRegular, marginTop: 8, color: COLORS.charcoal },
  devicesSection: { marginVertical: 12 },
  sectionTitle: { fontFamily: FONTS.montserratBold, fontSize: 18, color: COLORS.charcoal, marginBottom: 8 },
  deviceItem: { backgroundColor: COLORS.warmStone, padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  connectedDevice: { borderColor: COLORS.oasisGreen, borderWidth: 2 },
  deviceInfo: { flex: 1 },
  deviceName: { fontFamily: FONTS.montserratBold, fontSize: 16, color: COLORS.charcoal },
  deviceStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontFamily: FONTS.montserratRegular, color: COLORS.charcoal },
  signalText: { fontFamily: FONTS.montserratRegular, color: COLORS.charcoal + '80' },
  cancelButton: { backgroundColor: COLORS.terracotta, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { fontFamily: FONTS.montserratBold, color: COLORS.desertSand },

  connectedSection: { marginVertical: 12 },
  connectedCard: { backgroundColor: COLORS.warmStone, padding: 14, borderRadius: 12 },
  connectedDeviceName: { fontFamily: FONTS.montserratBold, fontSize: 16, color: COLORS.charcoal },
  smallText: { fontFamily: FONTS.montserratRegular, fontSize: 13, color: COLORS.charcoal },
  commandButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  sendButton: { backgroundColor: COLORS.oasisGreen, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  sendButtonText: { fontFamily: FONTS.montserratBold, color: COLORS.charcoal },
  disconnectBtn: { backgroundColor: COLORS.terracotta, marginTop: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  disconnectBtnText: { fontFamily: FONTS.montserratBold, color: COLORS.desertSand },

  masterSection: { marginVertical: 12 },
  nodeCard: { backgroundColor: COLORS.warmStone, padding: 12, borderRadius: 10, marginBottom: 10 },
  nodeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeTitle: { fontFamily: FONTS.montserratBold, fontSize: 16, color: COLORS.charcoal },
  saveBtn: { backgroundColor: COLORS.cobaltBlue, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  saveBtnText: { color: COLORS.desertSand, fontFamily: FONTS.montserratBold },
  expandBtn: { marginLeft: 8, backgroundColor: COLORS.charcoal + '20', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  expandBtnText: { fontFamily: FONTS.montserratBold },

  nodeBody: { marginTop: 8 },
  subTitle: { fontFamily: FONTS.montserratBold, fontSize: 14, marginTop: 8 },
  monoText: { fontFamily: FONTS.montserratRegular, fontSize: 12, marginTop: 6, color: COLORS.charcoal },
  rawBox: { marginTop: 8, backgroundColor: '#1111', padding: 8, borderRadius: 6 },

  slavesSection: { marginVertical: 12 },

  savedSection: { marginVertical: 12 },
  savedItem: { backgroundColor: COLORS.warmStone, padding: 10, borderRadius: 8, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  removeBtn: { backgroundColor: COLORS.terracotta, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6 },
  removeBtnText: { color: COLORS.desertSand, fontFamily: FONTS.montserratBold },

  rawSection: { marginVertical: 12 },
  rawItem: { backgroundColor: COLORS.warmStone, padding: 8, borderRadius: 8, marginBottom: 6 },

  noNodesText: { fontFamily: FONTS.montserratRegular, color: COLORS.charcoal + '80' },
});

export default LoRaConnectionScreen;
