import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  StyleSheet,
  Alert,
  FlatList,
  Switch,
} from 'react-native';
import { useBle } from '../src/ble/BleProvider';
import { useRace } from '../src/context/RaceContext';
import { COLORS, FONTS } from './theme';

const IoTSystemScreen = () => {
  const { connectedDevice } = useBle();
  const { state: raceState } = useRace();

  const [searchQuery, setSearchQuery] = useState('');
  const [mockModeEnabled, setMockModeEnabled] = useState(false);

  // Get master status and nodes from RaceContext
  const masterStatus = raceState.status;
  const nodes = Object.values(raceState.nodes);
  const messages = raceState.messages;
  const detections = raceState.detections;

  const getStatusColor = (status) => {
    if (!status) return COLORS.danger;
    if (status.connected) return COLORS.success;
    return COLORS.warning;
  };

  const handleMockModeToggle = (enabled) => {
    setMockModeEnabled(enabled);
    if (enabled) {
      Alert.alert('Mock Mode', 'Mock data simulation enabled (development only)');
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery) return true;
    return (
      (msg.kind === 'json' &&
        JSON.stringify(msg.data).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (msg.kind === 'text' && msg.data.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredDetections = detections.filter((det) => {
    if (!searchQuery) return true;
    return (
      det.payload?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      det.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <View style={[ss.container, { backgroundColor: COLORS.desertSand }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.desertSand} />

      <ScrollView style={ss.scrollView} showsVerticalScrollIndicator={false}>
        {/* Master Status Card */}
        <View style={[ss.card, { backgroundColor: COLORS.cardBg }]}>
          <Text style={[ss.cardTitle, { color: COLORS.textPrimary }]}>
            FalconRace Master Status
          </Text>

          <View style={ss.statusGrid}>
            <View style={ss.statusItem}>
              <Text style={[ss.statusLabel, { color: COLORS.textSecondary }]}>
                Connection
              </Text>
              <View
                style={[
                  ss.statusBadge,
                  { backgroundColor: masterStatus.connected ? COLORS.success : COLORS.danger },
                ]}
              >
                <Text style={[ss.statusBadgeText, { color: COLORS.textPrimary }]}>
                  {masterStatus.connected ? 'SYNCED' : 'OFFLINE'}
                </Text>
              </View>
            </View>

            <View style={ss.statusItem}>
              <Text style={[ss.statusLabel, { color: COLORS.textSecondary }]}>
                Battery
              </Text>
              <Text
                style={[
                  ss.statusValue,
                  {
                    color:
                      masterStatus.battery && masterStatus.battery < 3.3
                        ? COLORS.danger
                        : COLORS.success,
                  },
                ]}
              >
                {masterStatus.battery?.toFixed(2)}V
              </Text>
            </View>

            <View style={ss.statusItem}>
              <Text style={[ss.statusLabel, { color: COLORS.textSecondary }]}>
                GPS Satellites
              </Text>
              <Text style={[ss.statusValue, { color: COLORS.electric }]}>
                {masterStatus.gps_sats || 0}
              </Text>
            </View>

            <View style={ss.statusItem}>
              <Text style={[ss.statusLabel, { color: COLORS.textSecondary }]}>
                Race Active
              </Text>
              <View
                style={[
                  ss.statusBadge,
                  { backgroundColor: masterStatus.race_active ? COLORS.falcon : COLORS.warning },
                ]}
              >
                <Text style={[ss.statusBadgeText, { color: COLORS.textPrimary }]}>
                  {masterStatus.race_active ? 'RUNNING' : 'IDLE'}
                </Text>
              </View>
            </View>
          </View>

          {masterStatus.lat && masterStatus.lng && (
            <View style={ss.gpsInfo}>
              <Text style={[ss.gpsLabel, { color: COLORS.textSecondary }]}>
                GPS Location:
              </Text>
              <Text style={[ss.gpsCoords, { color: COLORS.electric }]}>
                {masterStatus.lat.toFixed(6)}, {masterStatus.lng.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Nodes Status */}
        {nodes.length > 0 && (
          <View style={[ss.card, { backgroundColor: COLORS.cardBg }]}>
            <Text style={[ss.cardTitle, { color: COLORS.textPrimary }]}>
              LoRa Nodes ({nodes.length})
            </Text>

            <FlatList
              data={nodes}
              scrollEnabled={false}
              keyExtractor={(item) => `node_${item.id}`}
              renderItem={({ item }) => {
                const now = Date.now();
                const timeSinceMs = item.lastSeen ? now - item.lastSeen : Infinity;
                const isOnline = timeSinceMs < 30000;

                return (
                  <View
                    style={[
                      ss.nodeItem,
                      {
                        backgroundColor: COLORS.surfaceBg,
                        borderLeftColor: isOnline ? COLORS.success : COLORS.danger,
                      },
                    ]}
                  >
                    <View style={ss.nodeItemLeft}>
                      <Text style={[ss.nodeId, { color: COLORS.falcon }]}>
                        Node {item.id}
                      </Text>
                      <View style={ss.nodeDetails}>
                        <Text style={[ss.nodeDetail, { color: COLORS.textSecondary }]}>
                          Battery: {item.battery?.toFixed(2)}V
                        </Text>
                        <Text style={[ss.nodeDetail, { color: COLORS.textSecondary }]}>
                          RSSI: {item.rssi} dBm
                        </Text>
                        {item.cameraPresent && (
                          <Text style={[ss.nodeDetail, { color: COLORS.electric }]}>
                            📷 Camera
                          </Text>
                        )}
                        <Text style={[ss.nodeDetail, { color: COLORS.textSecondary }]}>
                          {timeSinceMs < Infinity ? `${(timeSinceMs / 1000).toFixed(1)}s ago` : 'Never'}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        ss.onlineIndicator,
                        { backgroundColor: isOnline ? COLORS.success : COLORS.danger },
                      ]}
                    />
                  </View>
                );
              }}
            />
          </View>
        )}

        {/* Detection Events */}
        {detections.length > 0 && (
          <View style={[ss.card, { backgroundColor: COLORS.cardBg }]}>
            <Text style={[ss.cardTitle, { color: COLORS.textPrimary }]}>
              Detection Events ({detections.length})
            </Text>

            <FlatList
              data={detections.slice(0, 10)}
              scrollEnabled={false}
              keyExtractor={(item, idx) => `det_${idx}`}
              renderItem={({ item }) => (
                <View style={[ss.eventItem, { backgroundColor: COLORS.surfaceBg }]}>
                  <Text style={[ss.eventType, { color: COLORS.electric }]}>
                    {item.type === 'falcon' ? '🦅 Falcon' : '📍 Motion'} - Node {item.src}
                  </Text>
                  <Text style={[ss.eventPayload, { color: COLORS.textSecondary }]}>
                    {item.payload || item.data?.payload || 'Detection event'}
                  </Text>
                  <Text style={[ss.eventTime, { color: COLORS.textTertiary }]}>
                    {new Date(item.ts_received || Date.now()).toLocaleTimeString()}
                  </Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Message Log */}
        <View style={[ss.card, { backgroundColor: COLORS.cardBg }]}>
          <View style={ss.messageHeader}>
            <Text style={[ss.cardTitle, { color: COLORS.textPrimary }]}>
              Message Log ({messages.length})
            </Text>
          </View>

          <TextInput
            style={[ss.searchInput, { backgroundColor: COLORS.surfaceBg, color: COLORS.textPrimary, borderColor: COLORS.falcon }]}
            placeholder="Search messages..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <FlatList
            data={filteredMessages.slice(0, 15)}
            scrollEnabled={false}
            keyExtractor={(item, idx) => `msg_${idx}`}
            renderItem={({ item }) => (
              <View style={[ss.messageItem, { backgroundColor: COLORS.surfaceBg }]}>
                <Text style={[ss.messageType, { color: COLORS.falcon }]}>
                  {item.kind === 'json' ? `[${item.data.type}]` : '[text]'}
                </Text>
                <Text
                  style={[ss.messageContent, { color: COLORS.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.kind === 'json'
                    ? JSON.stringify(item.data).substring(0, 60)
                    : item.data}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Development Mode Toggle */}
        <View style={[ss.card, { backgroundColor: COLORS.cardBg }]}>
          <View style={ss.settingRow}>
            <View>
              <Text style={[ss.settingLabel, { color: COLORS.textPrimary }]}>
                Mock Mode (Dev)
              </Text>
              <Text style={[ss.settingDesc, { color: COLORS.textSecondary }]}>
                Simulate BLE messages without hardware
              </Text>
            </View>
            <Switch
              value={mockModeEnabled}
              onValueChange={handleMockModeToggle}
              trackColor={{ false: COLORS.textTertiary, true: COLORS.falcon }}
            />
          </View>

          {mockModeEnabled && (
            <Text style={[ss.mockModeNote, { color: COLORS.warning }]}>
              ⚠️ Mock mode enabled - development only
            </Text>
          )}
        </View>
      </ScrollView>
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
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    flex: 1,
    minWidth: '48%',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gpsInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 53, 0.2)',
  },
  gpsLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  gpsCoords: {
    fontSize: 13,
    fontWeight: '600',
  },
  nodeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  nodeItemLeft: {
    flex: 1,
  },
  nodeId: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  nodeDetails: {
    gap: 3,
  },
  nodeDetail: {
    fontSize: 11,
    fontWeight: '500',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  eventItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventType: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventPayload: {
    fontSize: 12,
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 10,
  },
  messageHeader: {
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  messageItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageContent: {
    fontSize: 11,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
  },
  mockModeNote: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
});

export default IoTSystemScreen;
