import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  StyleSheet,
} from 'react-native';
import { useBle } from '../src/ble/BleProvider';
import { useRace } from '../src/context/RaceContext';
import { COLORS } from './theme';
import realm from '../db/database'; // Make sure this is your Realm import!

const FalconRaceControlScreen = () => {
  const raceCtx = useRace();
  const { write, connectedDevice, lastBleMessage } = useBle();
  const [falcons, setFalcons] = useState([]);

  // Load registered falcons from Realm DB
  useEffect(() => {
    const falconsFromRealm = realm.objects('FalconRegistration');
    setFalcons(Array.from(falconsFromRealm));
  }, []);

  const selectedFalcon = raceCtx?.state?.selectedFalcon;
  const status = raceCtx?.state?.status ?? {};

  const startRace = async () => {
    if (!connectedDevice || !selectedFalcon) {
      Alert.alert("Please select a Falcon and connect to device!");
      return;
    }
    try {
      await write("start_race");
      raceCtx.dispatch({ type: "START_RACE" });
      Alert.alert("Race Started");
    } catch (e) {
      Alert.alert("Error", "Failed to send start_race command.");
    }
  };

  const stopRace = async () => {
    if (!connectedDevice) return;
    try {
      await write("stop_race");
      raceCtx.dispatch({ type: "STOP_RACE" });
      Alert.alert("Race Stopped");
    } catch (e) {
      Alert.alert("Error", "Failed to send stop_race command.");
    }
  };

  const getStatus = async () => {
    if (!connectedDevice) return;
    try {
      await write("status");
      Alert.alert("Status Requested");
    } catch (e) {
      Alert.alert("Error", "Failed to send status command.");
    }
  };

  // Show latest detection event (from BLE message payload)
  const detectionMsg = useMemo(() => {
    if (!lastBleMessage) return "--";
    try {
      const msg = JSON.parse(lastBleMessage);
      if ((msg.payload === "101" || msg.payload === "The Falcon Has Been Detected") && msg.src)
        return `🦅 Falcon detected at node #${msg.src}\n${msg.utc || ""}`;
    } catch (e) {}
    return "--";
  }, [lastBleMessage]);

  if (!raceCtx || !raceCtx.state || !raceCtx.dispatch) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: 'red', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          Race context not available
        </Text>
        <Text style={{ color: '#333', fontSize: 15, textAlign: 'center', maxWidth: 300 }}>
          This screen requires RaceProvider and BleProvider to be active. Please restart the app or check provider setup.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.desertSand} />
      {/* System Status Card */}
      <View style={styles.cardHeader}>
        <Text style={styles.headerTitle}>
          {status?.connected
            ? "🟢 Connected"
            : "🔴 Disconnected"}
        </Text>
        <Text style={styles.headerInfo}>
          Master Battery: {status?.battery ?? "--"}%
        </Text>
      </View>
      {/* Falcon Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.sectionTitle}>Select Falcon</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.falconsRow}>
          {falcons.length === 0 ? (
            <Text style={styles.noFalcons}>No falcons registered</Text>
          ) : (
            falcons.map(falcon => (
              <TouchableOpacity
                key={falcon.id}
                style={[
                  styles.falconCard,
                  selectedFalcon?.id === falcon.id && styles.falconCardSelected,
                  !status.connected && styles.itemDisabled,
                ]}
                disabled={!status.connected}
                activeOpacity={0.8}
                onPress={() => raceCtx.dispatch({ type: "SELECT_FALCON", payload: falcon })}
              >
                <Text style={selectedFalcon?.id === falcon.id ? styles.falconNameSelected : styles.falconName}>
                  {falcon.falconName}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
      {/* Controls */}
      <View style={styles.controlBar}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.startButton,
            (!status.connected || !selectedFalcon || status.race_active) && styles.btnDisabled,
          ]}
          disabled={!status.connected || !selectedFalcon || status.race_active}
          onPress={startRace}
        >
          <Text style={styles.controlButtonLabel}>START RACE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.stopButton,
            (!status.connected || !status.race_active) && styles.btnDisabled,
          ]}
          disabled={!status.connected || !status.race_active}
          onPress={stopRace}
        >
          <Text style={styles.controlButtonLabel}>STOP RACE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.statusButton,
            !status.connected && styles.btnDisabled,
          ]}
          disabled={!status.connected}
          onPress={getStatus}
        >
          <Text style={styles.controlButtonLabel}>GET STATUS</Text>
        </TouchableOpacity>
      </View>
      {/* Detection Events */}
      <View style={styles.detectionCard}>
        <Text style={styles.sectionTitle}>Detection Events</Text>
        <Text style={styles.detectMsg}>{detectionMsg}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.desertSand },
  cardHeader: {
    backgroundColor: COLORS.cobaltBlue,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 3,
  },
  headerTitle: {
    color: "#fff", fontWeight: "bold", fontSize: 19,
  },
  headerInfo: {
    color: "#fff", fontSize: 14, marginTop: 6, fontStyle: 'italic', opacity: 0.85,
  },
  selectorContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 14,
    color: COLORS.cobaltBlue,
    marginLeft: 6,
  },
  falconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  falconCard: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: COLORS.cobaltBlue + "15",
    elevation: 3,
    marginHorizontal: 6,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cobaltBlue + "30",
  },
  falconCardSelected: {
    backgroundColor: COLORS.oasisGreen + "99",
    borderColor: COLORS.oasisGreen,
    borderWidth: 3,
    shadowColor: COLORS.oasisGreen,
    elevation: 6,
  },
  falconName: {
    color: COLORS.cobaltBlue,
    fontWeight: "bold",
    fontSize: 15,
  },
  falconNameSelected: {
    color: COLORS.oasisGreen,
    fontWeight: "bold",
    fontSize: 16,
  },
  noFalcons: {
    color: COLORS.terracotta,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 16,
  },
  itemDisabled: {
    opacity: 0.5,
  },
  controlBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    marginVertical: 14,
    marginHorizontal: 12,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 13,
    alignItems: "center",
    marginHorizontal: 7,
    elevation: 2,
  },
  startButton: { backgroundColor: COLORS.oasisGreen },
  stopButton: { backgroundColor: COLORS.terracotta },
  statusButton: { backgroundColor: COLORS.cobaltBlue },
  btnDisabled: { opacity: 0.5 },
  controlButtonLabel: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  detectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 2,
    padding: 21,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 70,
    justifyContent: 'center',
  },
  detectMsg: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 9,
    color: COLORS.oasisGreen,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default FalconRaceControlScreen;