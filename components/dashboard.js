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
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useBle } from '../src/ble/BleProvider';
import { useRace } from '../src/context/RaceContext';
import { formatTime, getNodeStatusColor } from '../src/utils/parser';
import { COLORS, FONTS, styles } from './theme';
import NodesTrackView from './NodesTrackView';

const { width } = Dimensions.get('window');

/**
 * MasterCard: Shows master device connection status, battery, GPS, last sync
 */
const MasterCard = ({ status, connectedDevice, connectionState }) => {
  const now = Date.now();
  const timeSinceStatus = status?.ts_received ? now - status.ts_received : Infinity;
  
  // Determine connection label - more stable thresholds
  let label = 'OFFLINE';
  let labelColor = COLORS.danger;
  if (connectedDevice) {
    if (timeSinceStatus < 15000) {
      // If received data within 15 seconds, consider it connected
      label = 'CONNECTED';
      labelColor = COLORS.success;
    } else if (timeSinceStatus < 30000) {
      // Between 15-30 seconds, show connecting
      label = 'CONNECTING';
      labelColor = COLORS.warning;
    } else {
      // Over 30 seconds with no data
      label = 'OFFLINE';
      labelColor = COLORS.danger;
    }
  }

  return (
    <View style={[ss.masterCard, { backgroundColor: COLORS.cardBg }]}>
      <View style={ss.masterCardHeader}>
        <Text style={[ss.masterCardTitle, { color: COLORS.textPrimary }]}>
          FalconRace Master
        </Text>
        <View
          style={[
            ss.statusBadge,
            { backgroundColor: labelColor },
          ]}
        >
          <Text style={[ss.statusBadgeText, { color: COLORS.textPrimary }]}>
            {label}
          </Text>
        </View>
      </View>

      <View style={ss.masterCardBody}>
        <View style={ss.masterCardRow}>
          <Text style={[ss.masterCardLabel, { color: COLORS.textSecondary }]}>
            Battery:
          </Text>
          <Text
            style={[
              ss.masterCardValue,
              {
                color:
                  status?.battery && status.battery < 3.3
                    ? COLORS.danger
                    : COLORS.textPrimary,
              },
            ]}
          >
            {status?.battery?.toFixed(2)}V
          </Text>
        </View>

        <View style={ss.masterCardRow}>
          <Text style={[ss.masterCardLabel, { color: COLORS.textSecondary }]}>
            GPS Satellites:
          </Text>
          <Text style={[ss.masterCardValue, { color: COLORS.textPrimary }]}>
            {status?.gps_sats || 0}
          </Text>
        </View>

        {status?.lat && status?.lng && (
          <View style={ss.masterCardRow}>
            <Text style={[ss.masterCardLabel, { color: COLORS.textSecondary }]}>
              Location:
            </Text>
            <Text
              style={[ss.masterCardValue, { color: COLORS.electric }]}
              numberOfLines={1}
            >
              {status.lat.toFixed(4)}, {status.lng.toFixed(4)}
            </Text>
          </View>
        )}

        <View style={ss.masterCardRow}>
          <Text style={[ss.masterCardLabel, { color: COLORS.textSecondary }]}>
            Last Sync:
          </Text>
          <Text style={[ss.masterCardValue, { color: COLORS.textPrimary }]}>
            {timeSinceStatus < Infinity
              ? `${(timeSinceStatus / 1000).toFixed(1)}s ago`
              : 'Never'}
          </Text>
        </View>
      </View>
    </View>
  );
};

/**
 * NodeStrip: Shows colored lights for each node (green/orange/red based on lastSeen)
 */
const NodeStrip = ({ nodes, onNodePress }) => {
  const nodeArray = Object.values(nodes).sort((a, b) => a.id - b.id);

  return (
    <View style={[ss.nodeStrip, { backgroundColor: COLORS.cardBg }]}>
      <Text style={[ss.nodeStripTitle, { color: COLORS.textPrimary }]}>
        Nodes ({nodeArray.length})
      </Text>
      <View style={ss.nodeLights}>
        {nodeArray.map((node) => {
          const color = getNodeStatusColor(node.lastSeen);
          const colorMap = {
            green: COLORS.success,
            orange: COLORS.warning,
            red: COLORS.danger,
          };
          return (
            <TouchableOpacity
              key={node.id}
              style={[
                ss.nodeLight,
                { backgroundColor: colorMap[color] || COLORS.danger },
              ]}
              onPress={() => onNodePress(node)}
              activeOpacity={0.7}
            >
              <Text style={[ss.nodeLightText, { color: COLORS.textPrimary }]}>
                {node.id}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/**
 * NodeDetailsModal: Shows detailed info for a selected node
 */
const NodeDetailsModal = ({ visible, node, onClose }) => {
  if (!node) return null;

  const now = Date.now();
  const timeSinceMs = node.lastSeen ? now - node.lastSeen : null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[ss.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
        <View style={[ss.modalContent, { backgroundColor: COLORS.cardBg }]}>
          <View style={ss.modalHeader}>
            <Text style={[ss.modalTitle, { color: COLORS.textPrimary }]}>
              Node {node.id} Details
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[ss.modalCloseButton, { color: COLORS.electric }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={ss.modalBody}>
            <View style={ss.detailRow}>
              <Text style={[ss.detailLabel, { color: COLORS.textSecondary }]}>
                Battery:
              </Text>
              <Text style={[ss.detailValue, { color: COLORS.textPrimary }]}>
                {node.battery?.toFixed(2)}V
              </Text>
            </View>

            <View style={ss.detailRow}>
              <Text style={[ss.detailLabel, { color: COLORS.textSecondary }]}>
                RSSI:
              </Text>
              <Text style={[ss.detailValue, { color: COLORS.textPrimary }]}>
                {node.rssi} dBm
              </Text>
            </View>

            <View style={ss.detailRow}>
              <Text style={[ss.detailLabel, { color: COLORS.textSecondary }]}>
                Camera:
              </Text>
              <Text style={[ss.detailValue, { color: COLORS.textPrimary }]}>
                {node.cameraPresent ? 'Present' : 'Not detected'}
              </Text>
            </View>

            {node.lat && node.lng && (
              <View style={ss.detailRow}>
                <Text style={[ss.detailLabel, { color: COLORS.textSecondary }]}>
                  Location:
                </Text>
                <Text
                  style={[ss.detailValue, { color: COLORS.electric }]}
                  numberOfLines={1}
                >
                  {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
                </Text>
              </View>
            )}

            <View style={ss.detailRow}>
              <Text style={[ss.detailLabel, { color: COLORS.textSecondary }]}>
                Last Seen:
              </Text>
              <Text style={[ss.detailValue, { color: COLORS.textPrimary }]}>
                {timeSinceMs ? `${(timeSinceMs / 1000).toFixed(1)}s ago` : 'Never'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Main Dashboard Component
 */
const DashboardScreen = () => {
  const { connectedDevice, scanning, scannedDevices, connect, disconnect, startScan, write } = useBle();
  const { state: raceState, dispatch } = useRace();

  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetailsVisible, setNodeDetailsVisible] = useState(false);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const perms = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ].filter(Boolean);

        await PermissionsAndroid.requestMultiple(perms);
      } catch (err) {
        console.warn('Permission error', err);
      }
    }
  };

  const handleScan = () => {
    if (scanning) return;
    startScan((device) => {
      console.log('Found device:', device.name);
    });
  };

  const handleConnect = async (device) => {
    try {
      await connect(device.id);
      Alert.alert('Connected', `Connected to ${device.name || device.id}`);
      
      // Request initial status (no delay needed, using ref now)
      const success = await write('get_status');
      if (!success) {
        console.warn('Could not request initial status');
      }
    } catch (error) {
      Alert.alert('Connection Failed', String(error.message || error));
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log('Starting disconnect...');
      await disconnect();
      console.log('Disconnect completed');
      // Use setTimeout to show Alert after disconnect completes
      setTimeout(() => {
        Alert.alert('Disconnected', 'Disconnected from FalconRace Master');
      }, 100);
    } catch (error) {
      console.error('Disconnect error:', error);
      setTimeout(() => {
        Alert.alert('Disconnect Error', String(error.message || error));
      }, 100);
    }
  };

  return (
    <View style={[ss.container, { backgroundColor: COLORS.desertSand }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.desertSand} />

      <ScrollView style={ss.scrollView} showsVerticalScrollIndicator={false}>
        {/* Master Card */}
        <MasterCard
          status={raceState.status}
          connectedDevice={connectedDevice}
          connectionState={raceState.status.connected ? 'SYNCED' : 'OFFLINE'}
        />

        {/* Sensor Nodes Status Card */}
        {connectedDevice && (
          <View style={ss.sensorNodesCard}>
            <Text style={ss.sensorNodesTitle}>Sensor Nodes Status</Text>
            <View style={ss.nodeStatusDisplay}>
              <Text style={ss.nodeCount}>{Object.keys(raceState.nodes || {}).length}</Text>
              <Text style={ss.nodeLabel}>SENSORS ONLINE</Text>
            </View>
            {Object.keys(raceState.nodes || {}).length > 0 && (
              <View>
                {Object.entries(raceState.nodes || {}).map(([nodeId, node]) => {
                  const now = Date.now();
                  const timeSince = node.lastSeen ? now - node.lastSeen : Infinity;
                  const isOnline = timeSince < 30000;
                  return (
                    <View key={nodeId} style={ss.sensorNodeItem}>
                      <View style={[ss.sensorNodeDot, { backgroundColor: isOnline ? '#4ECDC4' : '#FF6B6B' }]} />
                      <View style={ss.sensorNodeInfo}>
                        <Text style={ss.sensorNodeName}>{node.name || `Node ${nodeId}`}</Text>
                        <Text style={ss.sensorNodeDetail}>
                          Battery: {node.battery?.toFixed(2)}V • RSSI: {node.rssi}dBm
                        </Text>
                        <Text style={ss.sensorNodeTime}>
                          {isOnline ? `Active ${(timeSince / 1000).toFixed(0)}s ago` : 'Offline'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            {Object.keys(raceState.nodes || {}).length === 0 && (
              <Text style={ss.noNodesText}>No sensor nodes detected yet. Waiting for messages...</Text>
            )}
          </View>
        )}

        {/* Track Visualization */}
        {connectedDevice && Object.keys(raceState.nodes).length > 0 && (
          <NodesTrackView
            nodes={raceState.nodes}
            onNodePress={(node) => {
              setSelectedNode(node);
              setNodeDetailsVisible(true);
            }}
          />
        )}

        {/* Node Strip */}
        {Object.keys(raceState.nodes).length > 0 && (
          <NodeStrip
            nodes={raceState.nodes}
            onNodePress={(node) => {
              setSelectedNode(node);
              setNodeDetailsVisible(true);
            }}
          />
        )}

        {/* Device List / Scan */}
        {!connectedDevice ? (
          <View style={[ss.deviceListCard, { backgroundColor: COLORS.cardBg }]}>
            <Text style={[ss.deviceListTitle, { color: COLORS.textPrimary }]}>
              Available Devices
            </Text>

            <TouchableOpacity
              style={[ss.scanButton, { backgroundColor: COLORS.falcon }]}
              onPress={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <ActivityIndicator color={COLORS.textPrimary} size="small" />
                  <Text style={[ss.scanButtonText, { color: COLORS.textPrimary }]}>
                    Scanning...
                  </Text>
                </>
              ) : (
                <Text style={[ss.scanButtonText, { color: COLORS.textPrimary }]}>
                  Scan for Devices
                </Text>
              )}
            </TouchableOpacity>

            <FlatList
              data={scannedDevices}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[ss.deviceItem, { backgroundColor: COLORS.surfaceBg }]}
                  onPress={() => handleConnect(item)}
                >
                  <View style={ss.deviceItemContent}>
                    <Text style={[ss.deviceName, { color: COLORS.falcon }]}>
                      {item.name || 'Unknown'}
                    </Text>
                    <Text style={[ss.deviceId, { color: COLORS.textSecondary }]}>
                      RSSI: {item.rssi}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : (
          <>
            {/* Connected Device Info */}
            <View style={[ss.connectedDeviceCard, { backgroundColor: COLORS.cardBg }]}>
              <Text style={[ss.connectedDeviceText, { color: COLORS.electric }]}>
                ✓ Connected to FalconRace Master
              </Text>
              <TouchableOpacity
                style={[ss.disconnectButton, { backgroundColor: COLORS.danger }]}
                onPress={handleDisconnect}
              >
                <Text style={[ss.disconnectButtonText, { color: COLORS.textPrimary }]}>
                  Disconnect
                </Text>
              </TouchableOpacity>
            </View>

            {/* Message Log */}
            {raceState.messages.length > 0 && (
              <View style={[ss.messageLogCard, { backgroundColor: COLORS.cardBg }]}>
                <Text style={[ss.messageLogTitle, { color: COLORS.textPrimary }]}>
                  Recent Events ({raceState.messages.length})
                </Text>
                <FlatList
                  data={raceState.messages.slice(0, 10)}
                  scrollEnabled={false}
                  keyExtractor={(item, idx) => `msg_${idx}`}
                  renderItem={({ item }) => (
                    <View style={ss.messageItem}>
                      <Text
                        style={[ss.messageType, { color: COLORS.electric }]}
                        numberOfLines={1}
                      >
                        {item.kind === 'json' ? item.data.type : 'text'}
                      </Text>
                      <Text
                        style={[ss.messageBody, { color: COLORS.textSecondary }]}
                        numberOfLines={2}
                      >
                        {item.kind === 'json'
                          ? JSON.stringify(item.data).substring(0, 50)
                          : item.data}
                      </Text>
                    </View>
                  )}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Node Details Modal */}
      <NodeDetailsModal
        visible={nodeDetailsVisible}
        node={selectedNode}
        onClose={() => setNodeDetailsVisible(false)}
      />
    </View>
  );
};

const ss = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  masterCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.falcon,
  },
  masterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  masterCardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  masterCardBody: {
    gap: 8,
  },
  masterCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masterCardLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  masterCardValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  nodeStrip: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nodeStripTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  nodeLights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nodeLight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeLightText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deviceListCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  deviceListTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  scanButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deviceItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  deviceItemContent: {
    gap: 4,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 12,
  },
  connectedDeviceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  connectedDeviceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  raceControlCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  raceControlTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  stopButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timerDisplay: {
    paddingVertical: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  sensorNodesCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2E3A59',
  },
  sensorNodesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  nodeStatusDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nodeCount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#4ECDC4',
  },
  nodeLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sensorNodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A3554',
  },
  sensorNodeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 14,
  },
  sensorNodeInfo: {
    flex: 1,
  },
  sensorNodeName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sensorNodeDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  sensorNodeTime: {
    fontSize: 11,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  noNodesText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  messageLogCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  messageLogTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  messageItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 53, 0.2)',
  },
  messageType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageBody: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 53, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '50%',
  },
});

export default DashboardScreen;
