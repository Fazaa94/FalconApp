import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRace } from '../src/context/RaceContext';
import { useBle } from '../src/ble/BleProvider';
import { COLORS } from './theme';

const { width } = Dimensions.get('window');

const RaceControlScreen = () => {
  const { state: raceState } = useRace();
  const { connectedDevice, write } = useBle();
  const [raceActive, setRaceActive] = useState(false);
  const [selectedFalcon, setSelectedFalcon] = useState(null);

  // Falcon options
  const falcons = [
    { id: 1, name: 'Shaheen', color: '#FFD700' },
    { id: 2, name: 'Saker', color: '#C0392B' },
    { id: 3, name: 'Peregrine', color: '#2C3E50' },
  ];

  const handleStartRace = async () => {
    if (!selectedFalcon) {
      Alert.alert('Select Falcon', 'Please select a falcon before starting the race');
      return;
    }

    if (!connectedDevice) {
      Alert.alert('No Connection', 'Please connect to the FalconRace Master device first');
      return;
    }

    try {
      setRaceActive(true);
      const success = await write('start_race');
      if (success) {
        Alert.alert('Race Started', `Race started with ${selectedFalcon.name}!`);
      } else {
        throw new Error('Failed to send start command');
      }
    } catch (error) {
      setRaceActive(false);
      Alert.alert('Error', 'Failed to start race: ' + error.message);
    }
  };

  const handleStopRace = async () => {
    try {
      setRaceActive(false);
      const success = await write('stop_race');
      if (success) {
        Alert.alert('Race Stopped', 'Race has been stopped');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to stop race: ' + error.message);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    return `${(diff / 1000).toFixed(1)}s ago`;
  };

  const getNodeStatusColor = (lastSeen) => {
    if (!lastSeen) return COLORS.danger;
    const now = Date.now();
    const diff = now - lastSeen;
    if (diff < 10000) return COLORS.success;
    if (diff < 30000) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.desertSand }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Race Control Header */}
        <View style={[styles.headerCard, { backgroundColor: COLORS.cardBg }]}>
          <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>
            Race Control
          </Text>
          <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>
            {raceActive ? 'Race in Progress' : 'Ready to Race'}
          </Text>
        </View>

        {/* Falcon Selection */}
        <View style={[styles.sectionCard, { backgroundColor: COLORS.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
            Select Falcon
          </Text>
          <View style={styles.falconGrid}>
            {falcons.map((falcon) => (
              <TouchableOpacity
                key={falcon.id}
                style={[
                  styles.falconButton,
                  {
                    backgroundColor: selectedFalcon?.id === falcon.id ? falcon.color : COLORS.surfaceBg,
                    borderColor: falcon.color,
                  }
                ]}
                onPress={() => setSelectedFalcon(falcon)}
              >
                <Text
                  style={[
                    styles.falconButtonText,
                    {
                      color: selectedFalcon?.id === falcon.id ? COLORS.textPrimary : falcon.color,
                    }
                  ]}
                >
                  {falcon.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedFalcon && (
            <Text style={[styles.selectedText, { color: COLORS.electric }]}>
              ✓ Selected: {selectedFalcon.name}
            </Text>
          )}
        </View>

        {/* Race Controls */}
        <View style={[styles.sectionCard, { backgroundColor: COLORS.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
            Race Controls
          </Text>
          {!raceActive ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.success }]}
              onPress={handleStartRace}
            >
              <Text style={[styles.buttonText, { color: COLORS.textPrimary }]}>
                Start Race
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
              onPress={handleStopRace}
            >
              <Text style={[styles.buttonText, { color: COLORS.textPrimary }]}>
                Stop Race
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Live Track Status */}
        <View style={[styles.sectionCard, { backgroundColor: COLORS.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
            Live Track Status
          </Text>
          
          {Object.keys(raceState.nodes || {}).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                No sensor nodes detected yet.
              </Text>
              <Text style={[styles.emptySubtext, { color: COLORS.textSecondary }]}>
                {connectedDevice ? 'Waiting for Arduino data...' : 'Connect to FalconRace Master first.'}
              </Text>
            </View>
          ) : (
            <View style={styles.nodesGrid}>
              {Object.values(raceState.nodes || {})
                .sort((a, b) => a.id - b.id)
                .map((node) => (
                  <View key={node.id} style={[styles.nodeCard, { backgroundColor: COLORS.surfaceBg }]}>
                    <View style={styles.nodeHeader}>
                      <Text style={[styles.nodeId, { color: COLORS.textPrimary }]}>
                        Node {node.id}
                      </Text>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getNodeStatusColor(node.lastSeen) }
                        ]}
                      />
                    </View>
                    
                    <View style={styles.nodeInfo}>
                      <Text style={[styles.nodeDetail, { color: COLORS.textSecondary }]}>
                        Battery: {node.battery?.toFixed(2)}V
                      </Text>
                      <Text style={[styles.nodeDetail, { color: COLORS.textSecondary }]}>
                        RSSI: {node.rssi}dBm
                      </Text>
                      <Text style={[styles.nodeDetail, { color: COLORS.textSecondary }]}>
                        Last: {formatTime(node.lastSeen)}
                      </Text>
                      {node.cameraPresent && (
                        <Text style={[styles.cameraIndicator, { color: COLORS.electric }]}>
                          📷 Camera Ready
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* Live Events */}
        {raceState.messages && raceState.messages.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: COLORS.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
              Live Events ({raceState.messages.length})
            </Text>
            <View style={styles.eventsList}>
              {raceState.messages.slice(0, 5).map((message, index) => (
                <View key={index} style={[styles.eventItem, { backgroundColor: COLORS.surfaceBg }]}>
                  <Text style={[styles.eventType, { color: COLORS.electric }]}>
                    {message.kind === 'json' ? message.data.type || 'system' : 'text'}
                  </Text>
                  <Text
                    style={[styles.eventText, { color: COLORS.textSecondary }]}
                    numberOfLines={2}
                  >
                    {message.kind === 'json' 
                      ? JSON.stringify(message.data).substring(0, 80) + '...'
                      : message.data
                    }
                  </Text>
                  <Text style={[styles.eventTime, { color: COLORS.textSecondary }]}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* System Status */}
        <View style={[styles.sectionCard, { backgroundColor: COLORS.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
            System Status
          </Text>
          <View style={styles.statusList}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: COLORS.textSecondary }]}>
                Master Device:
              </Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: connectedDevice ? COLORS.success : COLORS.danger }
                ]}
              >
                {connectedDevice ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: COLORS.textSecondary }]}>
                Track Nodes:
              </Text>
              <Text style={[styles.statusValue, { color: COLORS.textPrimary }]}>
                {Object.keys(raceState.nodes || {}).length} detected
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: COLORS.textSecondary }]}>
                Race Status:
              </Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: raceActive ? COLORS.warning : COLORS.textPrimary }
                ]}
              >
                {raceActive ? 'Active' : 'Idle'}
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.falcon,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  falconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  falconButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  falconButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  nodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nodeCard: {
    width: (width - 56) / 2,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeId: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nodeInfo: {
    gap: 2,
  },
  nodeDetail: {
    fontSize: 11,
  },
  cameraIndicator: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  eventsList: {
    gap: 8,
  },
  eventItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  eventType: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  eventText: {
    fontSize: 12,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 10,
    textAlign: 'right',
  },
  statusList: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RaceControlScreen;
