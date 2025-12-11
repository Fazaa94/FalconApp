import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  StyleSheet
} from 'react-native';
import { COLORS, FONTS, styles } from './theme';

const IoTSystemScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for devices
  const [devices, setDevices] = useState([
    { id: 'COLLAR-01', name: 'Tracker', type: 'collar', status: 'ready', lastSeen: 'now', connection: 'bluetooth' },
    { id: 'GATE-03', name: 'Online', type: 'gate', status: 'ready', lastSeen: 'now', connection: 'wifi' },
    { id: 'Starting Gate', name: 'Weak Signal — 5 ms ago', type: 'gate', status: 'weak', lastSeen: '5ms', connection: 'bluetooth' },
    { id: 'SENSOR-12', name: 'Bluetooth — 5 min ago', type: 'sensor', status: 'weak', lastSeen: '5min', connection: 'bluetooth' },
    { id: 'TIMER-01', name: 'Offline', type: 'timer', status: 'offline', lastSeen: '20min', connection: 'wifi' },
    { id: 'TIMER-02', name: 'Last sync 20 min ago', type: 'timer', status: 'weak', lastSeen: '20min', connection: 'wifi' },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return COLORS.oasisGreen;
      case 'weak': return COLORS.sunYellow;
      case 'offline': return COLORS.terracotta;
      default: return COLORS.charcoal;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready': return 'READY';
      case 'weak': return 'WEAK SIGNAL';
      case 'offline': return 'NO RESPONSE';
      default: return 'UNKNOWN';
    }
  };

  const handleRestartDevice = (deviceId) => {
    // In real app, this would send a restart command to the device
    console.log(`Restarting device: ${deviceId}`);
  };

  const SystemStatusCard = () => (
    <View style={localStyles.statusCard}>
      <Text style={localStyles.statusCardTitle}>IOT SYSTEM MONITOR</Text>
      <View style={localStyles.onlineIndicator}>
        <View style={localStyles.onlineDot} />
        <Text style={localStyles.onlineText}>All Systems Online</Text>
      </View>
      <Text style={localStyles.statusDescription}>
        Telemetry and collars reporting normally
      </Text>
    </View>
  );

  const NetworkStatusCard = () => (
    <View style={localStyles.networkCard}>
      <Text style={localStyles.networkCardTitle}>OVERALL NETWORK STATUS</Text>
      <View style={localStyles.deviceCountSection}>
        <Text style={localStyles.deviceCount}>15</Text>
        <Text style={localStyles.deviceLabel}>Devices</Text>
      </View>
      <Text style={localStyles.connectedText}>Connected</Text>
    </View>
  );

  const ConnectionStats = () => (
    <View style={localStyles.connectionStats}>
      <View style={localStyles.connectionItem}>
        <Text style={localStyles.connectionNumber}>15</Text>
        <Text style={localStyles.connectionLabel}>Devices Connected</Text>
        <Text style={localStyles.connectionType}>Bluetooth</Text>
      </View>
      <View style={localStyles.connectionDivider} />
      <View style={localStyles.connectionItem}>
        <Text style={localStyles.connectionNumber}>32</Text>
        <Text style={localStyles.connectionLabel}>Devices (Wi-Fi)</Text>
        <Text style={localStyles.connectionType}>Wired & Wireless</Text>
      </View>
    </View>
  );

  const DeviceItem = ({ device }) => (
    <View style={localStyles.deviceItem}>
      <View style={localStyles.deviceHeader}>
        <View style={localStyles.deviceInfo}>
          <Text style={localStyles.deviceId}>{device.id}</Text>
          <Text style={localStyles.deviceName}>{device.name}</Text>
        </View>
        <View style={localStyles.deviceStatus}>
          <View style={[localStyles.statusDot, { backgroundColor: getStatusColor(device.status) }]} />
          <Text style={localStyles.statusText}>{getStatusText(device.status)}</Text>
        </View>
      </View>
      <View style={localStyles.deviceActions}>
        <TouchableOpacity 
          style={localStyles.actionButton}
          onPress={() => handleRestartDevice(device.id)}
        >
          <Text style={localStyles.actionButtonText}>Restart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const GPSStatusSection = () => (
    <View style={localStyles.gpsSection}>
      <Text style={localStyles.sectionTitle}>GPS STATUS</Text>
      <View style={localStyles.statusLegend}>
        <View style={localStyles.legendItem}>
          <View style={[localStyles.legendDot, { backgroundColor: COLORS.oasisGreen }]} />
          <Text style={localStyles.legendText}>READY</Text>
        </View>
        <View style={localStyles.legendItem}>
          <View style={[localStyles.legendDot, { backgroundColor: COLORS.sunYellow }]} />
          <Text style={localStyles.legendText}>WEAK SIGNAL</Text>
        </View>
        <View style={localStyles.legendItem}>
          <View style={[localStyles.legendDot, { backgroundColor: COLORS.terracotta }]} />
          <Text style={localStyles.legendText}>NO RESPONSE</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={modernStyles.container}>
      <StatusBar backgroundColor={COLORS.warmStone} barStyle="dark-content" />
      {/* Header */}
      <View style={modernStyles.header}>
        <Text style={modernStyles.mainTitle}>IoT System Monitor</Text>
        <TextInput
          style={modernStyles.searchInput}
          placeholder="Search devices..."
          placeholderTextColor={COLORS.charcoal + '80'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={modernStyles.dashboardRow}>
          <SystemStatusCard />
          <NetworkStatusCard />
        </View>
        <ConnectionStats />
        <GPSStatusSection />
        <View style={modernStyles.devicesSection}>
          <Text style={modernStyles.sectionTitle}>Connected Devices</Text>
          {devices.map((device) => (
            <DeviceItem key={device.id} device={device} />
          ))}
        </View>
        <View style={modernStyles.quickActions}>
          <TouchableOpacity style={[modernStyles.quickButton, modernStyles.readyButton]}>
            <Text style={modernStyles.quickButtonText}>Ready</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[modernStyles.quickButton, modernStyles.approvedButton]}>
            <Text style={modernStyles.quickButtonText}>Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[modernStyles.quickButton, modernStyles.weakButton]}>
            <Text style={modernStyles.quickButtonText}>Weak</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[modernStyles.quickButton, modernStyles.restartButton]}>
            <Text style={modernStyles.quickButtonText}>Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[modernStyles.quickButton, modernStyles.noResponseButton]}>
            <Text style={modernStyles.quickButtonText}>No Resp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
// Modern styles for IoTSystemScreen
const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmStone,
    paddingTop: 8,
    paddingBottom: 8,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 28,
    color: COLORS.cobaltBlue,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  searchInput: {
    backgroundColor: COLORS.desertSand,
    borderWidth: 1,
    borderColor: COLORS.charcoal + '40',
    borderRadius: 10,
    padding: 14,
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: 8,
  },
  dashboardRow: {
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  devicesSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.desertSand,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.charcoal,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 20,
    color: COLORS.cobaltBlue,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  quickButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 2,
    backgroundColor: COLORS.warmStone,
    shadowColor: COLORS.charcoal,
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  readyButton: {
    backgroundColor: COLORS.oasisGreen,
  },
  approvedButton: {
    backgroundColor: COLORS.cobaltBlue,
  },
  weakButton: {
    backgroundColor: COLORS.sunYellow,
  },
  restartButton: {
    backgroundColor: COLORS.terracotta,
  },
  noResponseButton: {
    backgroundColor: COLORS.terracotta,
  },
  quickButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 15,
    color: COLORS.charcoal,
    textTransform: 'uppercase',
  },
});
};

const localStyles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  mainTitle: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 28,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.warmStone,
    borderWidth: 1,
    borderColor: COLORS.charcoal + '40',
    borderRadius: 8,
    padding: 12,
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal,
  },
  statusCard: {
    backgroundColor: COLORS.warmStone,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.oasisGreen,
  },
  statusCardTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 18,
    color: COLORS.charcoal,
    marginBottom: 12,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.oasisGreen,
    marginRight: 8,
  },
  onlineText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.oasisGreen,
  },
  statusDescription: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal + '80',
  },
  networkCard: {
    backgroundColor: COLORS.cobaltBlue,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  networkCardTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.desertSand,
    marginBottom: 16,
  },
  deviceCountSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceCount: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 36,
    color: COLORS.desertSand,
  },
  deviceLabel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.desertSand,
  },
  connectedText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.desertSand,
  },
  connectionStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.warmStone,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  connectionItem: {
    flex: 1,
    alignItems: 'center',
  },
  connectionNumber: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 24,
    color: COLORS.cobaltBlue,
    marginBottom: 4,
  },
  connectionLabel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 4,
  },
  connectionType: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
  },
  connectionDivider: {
    width: 1,
    backgroundColor: COLORS.charcoal + '20',
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 20,
    color: COLORS.charcoal,
    marginBottom: 16,
  },
  gpsSection: {
    backgroundColor: COLORS.warmStone,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minWidth: '30%',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.charcoal,
  },
  devicesSection: {
    backgroundColor: COLORS.warmStone,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  deviceItem: {
    backgroundColor: COLORS.desertSand,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceId: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  deviceName: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal + '80',
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.charcoal,
  },
  deviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.desertSand,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  quickButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  readyButton: {
    backgroundColor: COLORS.oasisGreen,
  },
  approvedButton: {
    backgroundColor: COLORS.oasisGreen,
  },
  weakButton: {
    backgroundColor: COLORS.sunYellow,
  },
  restartButton: {
    backgroundColor: COLORS.terracotta,
  },
  noResponseButton: {
    backgroundColor: COLORS.terracotta,
  },
  quickButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.desertSand,
    textAlign: 'center',
  },
});

export default IoTSystemScreen;