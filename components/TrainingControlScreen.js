import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { COLORS, FONTS, styles } from './theme';
import { useRace } from '../src/context/RaceContext';
import { useBle } from '../src/ble/BleProvider';
import realm from '../db/database';
import uuid from 'react-native-uuid';

const TrainingControlScreen = () => {
  const { state: raceState } = useRace();
  const { connectedDevice, write } = useBle();

  // Core State
  const [selectedFalcon, setselectedFalcon] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [falcons, setFalcons] = useState([]);
  const [todaysTrials, setTodaysTrials] = useState([]);

  // Input State (Environmental & Weight)
  const [inputs, setInputs] = useState({
    weight: '',
    temp: '',     // °C
    wind: '',     // km/h
    humidity: ''  // %
  });

  // Load Falcons
  useEffect(() => {
    const falconsFromRealm = realm.objects('FalconRegistration');
    setFalcons(Array.from(falconsFromRealm));
  }, []);

  // Load Previous Trials for Selected Falcon (For Comparison)
  useEffect(() => {
    if (selectedFalcon) {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        // Query realm for sessions matching this bird AND today's date
        const sessions = realm.objects('TrainingSession')
          .filtered('falconId == $0 AND sessionDate >= $1', selectedFalcon.id, today)
          .sorted('sessionDate', true); // Newest first
        setTodaysTrials(Array.from(sessions));
    } else {
        setTodaysTrials([]);
    }
  }, [selectedFalcon, isSessionActive]); // Reload when session ends

  // --- 1. LIVE TELEMETRY (TELWAH MODE) ---

  const sessionDetections = useMemo(() => {
    if (!isSessionActive || !sessionStartTime) return [];
    return raceState.detections.filter(d => {
      const ts = d.ts_iso ? Date.parse(d.ts_iso) : Date.now();
      return ts >= sessionStartTime;
    });
  }, [raceState.detections, isSessionActive, sessionStartTime]);

  const sectorAnalysis = useMemo(() => {
    const sorted = [...sessionDetections].sort((a, b) => a.nodeId - b.nodeId);
    const sectors = [];
    let maxSpeed = 0;
    let totalSpeed = 0;
    let validSectors = 0;
    const SECTOR_DIST = 100; 

    for (let i = 0; i < sorted.length; i++) {
        let prevTime = sessionStartTime;
        if (i > 0) prevTime = Date.parse(sorted[i-1].ts_iso);
        const currTime = Date.parse(sorted[i].ts_iso);
        const timeDiff = (currTime - prevTime) / 1000;

        if (timeDiff > 0) {
            const speedKmh = ((SECTOR_DIST / timeDiff) * 3.6).toFixed(1);
            if (speedKmh < 200) {
                if (parseFloat(speedKmh) > maxSpeed) maxSpeed = parseFloat(speedKmh);
                totalSpeed += parseFloat(speedKmh);
                validSectors++;
                sectors.push({
                    id: i + 1,
                    label: i === 0 ? "LAUNCH" : `${i*100}m`,
                    speed: speedKmh,
                    time: timeDiff.toFixed(2)
                });
            }
        }
    }

    return {
        sectors,
        topSpeed: maxSpeed.toFixed(1),
        totalTime: sorted.length > 0 ? ((Date.parse(sorted[sorted.length-1].ts_iso) - sessionStartTime)/1000).toFixed(2) : "0.00"
    };
  }, [sessionDetections, sessionStartTime]);

  // --- ACTIONS ---

  const handleStart = async () => {
    if (!selectedFalcon) return Alert.alert('Missing Info', 'Select a bird.');
    if (!inputs.weight) return Alert.alert('Missing Info', 'Enter flying weight.');
    if (!inputs.wind || !inputs.temp) return Alert.alert('Missing Info', 'Enter Wind & Temp for data comparison.');
    if (!connectedDevice) return Alert.alert('Offline', 'Connect to master node from Dashboard first.');

    console.log('🚀 Training: Sending start_race command...');
    console.log('📡 Connected device:', connectedDevice?.id);
    console.log('📝 Write function available:', !!write);
    
    try {
      if (write) {
        const success = await write('start_race');
        console.log('✅ start_race command sent, result:', success);
      } else {
        console.error('❌ Write function not available');
        Alert.alert('Error', 'BLE write function not available. Reconnect from Dashboard.');
        return;
      }
    } catch (err) {
      console.error('❌ Failed to send start_race:', err);
      Alert.alert('Command Failed', 'Could not send start command to device.');
      return;
    }
    
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
  };

  const handleStop = async () => {
    console.log('🛑 Training: Sending stop_race command...');
    
    try {
      if (write) {
        const success = await write('stop_race');
        console.log('✅ stop_race command sent, result:', success);
      }
    } catch (err) {
      console.error('❌ Failed to send stop_race:', err);
    }
    
    setIsSessionActive(false);

    // Create Trial Record
    const trialNumber = todaysTrials.length + 1;
    const durationMinutes = sectorAnalysis.totalTime ? parseFloat(sectorAnalysis.totalTime) / 60 : 0;
    
    // Calculate distance based on highest node ID detected (each node = 100m from start)
    // Master (src:1) = 0m (starting gate), Node 2 = 100m, Node 3 = 200m, etc.
    const nodeIds = sessionDetections.map(d => parseInt(d.nodeId) || 0);
    const maxNodeId = nodeIds.length > 0 ? Math.max(...nodeIds) : 0;
    const totalDistance = maxNodeId > 1 ? (maxNodeId - 1) * 100 : 0; // Node 1 = 0m, Node 2 = 100m, etc.
    
    const result = {
      id: uuid.v4(),
      falconId: selectedFalcon.id,
      animalId: selectedFalcon.animalId || selectedFalcon.id, // Use animalId or fallback to id
      falconName: selectedFalcon.falconName,
      sessionType: 'speed', // Default to speed training
      sessionDate: new Date(),
      duration: durationMinutes,
      totalDistance: totalDistance,
      focusArea: 'acceleration',
      trainingNotes: `Trial #${trialNumber} - Weight: ${inputs.weight}g, Wind: ${inputs.wind}km/h, Temp: ${inputs.temp}°C. Nodes detected: ${nodeIds.join(', ')}`,
      weatherConditions: `Temp: ${inputs.temp}°C, Wind: ${inputs.wind}km/h, Humidity: ${inputs.humidity}%`,
      trackConditions: 'Good',
      trainerName: '',
      sessionRating: null,
      heartRateData: [],
      performanceMetrics: {
        id: uuid.v4(),
        averageSpeed: 0,
        maxSpeed: parseFloat(sectorAnalysis.topSpeed) || 0,
        accelerationTime: null,
        decelerationPoints: null,
        consistencyScore: null,
        enduranceIndex: null,
      },
      drills: [],
      synced: false,
      createdAt: new Date(),
    };

    try {
      realm.write(() => { realm.create('TrainingSession', result); });
      Alert.alert('Trial Saved', `Trial #${trialNumber} recorded successfully.`);
    } catch (e) {
      console.error(e);
    }
  };

  // Reset today's trials for selected falcon
  const handleResetTrials = () => {
    if (!selectedFalcon) {
      Alert.alert('No Falcon Selected', 'Please select a falcon first.');
      return;
    }
    
    Alert.alert(
      'Reset Trials?',
      `This will delete all of today's trials for ${selectedFalcon.falconName}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            try {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              realm.write(() => {
                const trialsToDelete = realm.objects('TrainingSession')
                  .filtered('falconId == $0 AND sessionDate >= $1', selectedFalcon.id, today);
                realm.delete(trialsToDelete);
              });
              
              setTodaysTrials([]);
              Alert.alert('Reset Complete', `Trials for ${selectedFalcon.falconName} have been cleared.`);
            } catch (e) {
              console.error('Reset error:', e);
              Alert.alert('Reset Failed', e.message);
            }
          }
        }
      ]
    );
  };

  // --- UI COMPONENTS ---

  const FalconCard = ({ falcon }) => (
    <TouchableOpacity 
      onPress={() => {
        if (!isSessionActive) {
          console.log('Falcon selected:', falcon);
          setselectedFalcon(falcon);
        }
      }}
      style={[
        localStyles.falconCard,
        selectedFalcon?.id === falcon.id && localStyles.selectedCard,
        isSessionActive && selectedFalcon?.id !== falcon.id && { opacity: 0.5 }
      ]}
      disabled={isSessionActive}
    >
      <View style={localStyles.falconAvatar}><Text style={{fontSize: 20}}>🦅</Text></View>
      <View>
        <Text style={localStyles.falconName}>{falcon.falconName}</Text>
        <Text style={localStyles.falconBreed}>{falcon.breed}</Text>
      </View>
    </TouchableOpacity>
  );

  const InputBox = ({ label, value, onChange, placeholder, unit }) => (
    <View style={localStyles.inputContainer}>
      <Text style={localStyles.inputLabel}>{label}</Text>
      <View style={localStyles.inputWrapper}>
        <TextInput 
          style={localStyles.textInput}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          keyboardType="numeric"
          editable={!isSessionActive}
        />
        <Text style={localStyles.unitText}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
      
      <View style={localStyles.header}>
        <Text style={localStyles.headerTitle}>PERFORMANCE TRIALS</Text>
        <View style={[localStyles.statusBadge, { backgroundColor: connectedDevice ? COLORS.oasisGreen : COLORS.terracotta }]}>
            <Text style={localStyles.statusText}>{connectedDevice ? 'ONLINE' : 'OFFLINE'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* 1. Bird Selection */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>1. SELECT BIRD</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {falcons.map(f => <FalconCard key={f.id} falcon={f} />)}
          </ScrollView>
        </View>

        {/* 2. Environmental Setup (CRITICAL FOR COMPARISON) */}
        {selectedFalcon && (
            <View style={localStyles.section}>
                <Text style={localStyles.sectionTitle}>2. FLIGHT CONDITIONS</Text>
                <View style={localStyles.inputRow}>
                    <InputBox label="WEIGHT" value={inputs.weight} onChange={t => setInputs({...inputs, weight: t})} placeholder="000" unit="g" />
                    <InputBox label="WIND" value={inputs.wind} onChange={t => setInputs({...inputs, wind: t})} placeholder="00" unit="km/h" />
                </View>
                <View style={localStyles.inputRow}>
                    <InputBox label="TEMP" value={inputs.temp} onChange={t => setInputs({...inputs, temp: t})} placeholder="00" unit="°C" />
                    <InputBox label="HUMIDITY" value={inputs.humidity} onChange={t => setInputs({...inputs, humidity: t})} placeholder="00" unit="%" />
                </View>
            </View>
        )}

        {/* 3. Live Data */}
        <View style={localStyles.section}>
          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
             <Text style={localStyles.sectionTitle}>3. LIVE TELEMETRY</Text>
             {isSessionActive && <Text style={localStyles.liveBadge}>• RECORDING TRIAL</Text>}
          </View>
          
          <View style={localStyles.statsGrid}>
             <View style={localStyles.statBox}>
                <Text style={localStyles.statValue}>{sectorAnalysis.totalTime}<Text style={{fontSize:14}}>s</Text></Text>
                <Text style={localStyles.statLabel}>TIME</Text>
             </View>
             <View style={[localStyles.statBox, {borderLeftColor: COLORS.oasisGreen}]}>
                <Text style={[localStyles.statValue, {color: COLORS.oasisGreen}]}>{sectorAnalysis.topSpeed}</Text>
                <Text style={localStyles.statLabel}>TOP SPEED</Text>
             </View>
          </View>
        </View>

        {/* 4. Comparison Table (THE NEW FEATURE) */}
        {selectedFalcon && todaysTrials.length > 0 && (
            <View style={localStyles.section}>
                <View style={localStyles.sectionHeaderRow}>
                  <Text style={localStyles.sectionTitle}>TODAY'S TRIALS ({todaysTrials.length})</Text>
                  <TouchableOpacity style={localStyles.resetButton} onPress={handleResetTrials}>
                    <Text style={localStyles.resetButtonText}>🗑️ Reset</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={localStyles.tableHeader}>
                    <Text style={[localStyles.th, {flex:0.5}]}>#</Text>
                    <Text style={[localStyles.th, {flex:1}]}>DISTANCE</Text>
                    <Text style={[localStyles.th, {flex:1}]}>DURATION</Text>
                    <Text style={[localStyles.th, {flex:1, textAlign:'right'}]}>MAX SPEED</Text>
                </View>

                {todaysTrials.map((trial, index) => (
                    <View key={index} style={localStyles.tableRow}>
                        <Text style={[localStyles.td, {flex:0.5, fontFamily: FONTS.montserratBold}]}>{index + 1}</Text>
                        <Text style={[localStyles.td, {flex:1}]}>{trial.totalDistance || 0}m</Text>
                        <Text style={[localStyles.td, {flex:1}]}>{trial.duration ? (trial.duration * 60).toFixed(1) : '--'}s</Text>
                        <Text style={[localStyles.td, {flex:1, textAlign:'right', fontFamily: FONTS.orbitronBold, color: COLORS.charcoal}]}>
                            {trial.performanceMetrics?.maxSpeed?.toFixed(1) || '--'}
                        </Text>
                    </View>
                ))}
            </View>
        )}

        {/* 5. Controls */}
        <View style={localStyles.controls}>
           {!isSessionActive ? (
             <TouchableOpacity style={localStyles.btnStart} onPress={handleStart}>
                <Text style={localStyles.btnText}>START TRIAL</Text>
             </TouchableOpacity>
           ) : (
             <TouchableOpacity style={localStyles.btnStop} onPress={handleStop}>
                <Text style={localStyles.btnText}>FINISH & SAVE TRIAL</Text>
             </TouchableOpacity>
           )}
        </View>

      </ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  headerTitle: { fontFamily: FONTS.orbitronBold, fontSize: 18, color: COLORS.charcoal },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: 'white', fontFamily: FONTS.montserratBold, fontSize: 10 },
  
  section: {
    backgroundColor: 'white', margin: 10, padding: 15, borderRadius: 4,
    borderWidth: 1, borderColor: '#999'
  },
  sectionTitle: {
    fontFamily: FONTS.montserratBold, color: COLORS.charcoal, fontSize: 14, marginBottom: 10, opacity: 0.7
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: COLORS.terracotta + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.terracotta,
  },
  resetButtonText: {
    color: COLORS.terracotta,
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
  },
  
  // Cards
  falconCard: {
    backgroundColor: '#f0f0f0', padding: 10, borderRadius: 4, marginRight: 10,
    flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent'
  },
  selectedCard: { borderColor: COLORS.charcoal, backgroundColor: '#fff' },
  falconAvatar: { marginRight: 10 },
  falconName: { fontFamily: FONTS.orbitronBold, fontSize: 14, color: COLORS.charcoal },
  
  // Inputs
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputContainer: { flex: 1 },
  inputLabel: { fontFamily: FONTS.montserratBold, fontSize: 10, color: '#666', marginBottom: 4 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', 
    borderRadius: 4, borderWidth: 1, borderColor: '#ccc' 
  },
  textInput: { 
    flex: 1, padding: 10, fontFamily: FONTS.orbitronBold, fontSize: 16, color: COLORS.charcoal 
  },
  unitText: { paddingRight: 10, fontFamily: FONTS.montserratBold, fontSize: 10, color: '#888' },

  // Stats
  liveBadge: { color: COLORS.terracotta, fontFamily: FONTS.montserratBold, fontSize: 10 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, backgroundColor: '#f8f8f8', padding: 15, borderLeftWidth: 6, borderLeftColor: COLORS.charcoal,
    alignItems: 'center'
  },
  statValue: { fontFamily: FONTS.orbitronBold, fontSize: 32, color: COLORS.charcoal },
  statLabel: { fontFamily: FONTS.montserratBold, fontSize: 10, color: '#888', marginTop: 5 },

  // Comparison Table
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#333', paddingBottom: 5, marginBottom: 5 },
  th: { fontFamily: FONTS.montserratBold, fontSize: 10, color: '#555' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  td: { fontFamily: FONTS.montserratRegular, fontSize: 12, color: COLORS.charcoal },

  // Controls
  controls: { margin: 10 },
  btnStart: {
    backgroundColor: COLORS.charcoal, padding: 20, borderRadius: 4, alignItems: 'center',
    borderWidth: 2, borderColor: 'black'
  },
  btnStop: {
    backgroundColor: COLORS.terracotta, padding: 20, borderRadius: 4, alignItems: 'center',
    borderWidth: 2, borderColor: 'red'
  },
  btnText: { fontFamily: FONTS.orbitronBold, color: 'white', fontSize: 18, letterSpacing: 1 }
});

export default TrainingControlScreen;