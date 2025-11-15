import React, { useState, useEffect } from 'react';
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
  Modal,
  Switch,
} from 'react-native';
import { COLORS, FONTS, styles } from './theme';
import realm from '../db/database';
import ExportService from '../services/ExportService';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import uuid from 'react-native-uuid';

const { width } = Dimensions.get('window');

const TrainingControlScreen = () => {
  const [selectedFalcon, setselectedFalcon] = useState(null);
  const [trainingTime, setTrainingTime] = useState(0);
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [falcons, setfalcons] = useState([]);
  const [heartRateData, setHeartRateData] = useState([]);
  const [drills, setDrills] = useState([]);
  const [showSessionSetup, setShowSessionSetup] = useState(false);

  // Training session configuration
  const [sessionConfig, setSessionConfig] = useState({
    sessionType: 'speed',
    focusArea: 'acceleration',
    plannedDuration: 30,
    plannedDistance: 1600,
    trainerNotes: '',
    weatherConditions: 'Normal',
    trackConditions: 'Good',
  });

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageSpeed: 0,
    maxSpeed: 0,
    accelerationTime: 0,
    consistencyScore: 0,
    enduranceIndex: 0,
  });

  // Load falcons and training sessions from Realm
  useEffect(() => {
    const loadDataFromRealm = () => {
      try {
        // Load falcons
        const falconsFromRealm = realm.objects('FalconRegistration');
        const falconsWithStatus = falconsFromRealm.map(falcon => ({
          ...falcon,
          status: 'ready'
        }));
        setfalcons(Array.from(falconsWithStatus));

        // Load training sessions
        const sessions = realm.objects('TrainingSession').sorted('sessionDate', true);
        setTrainingSessions(Array.from(sessions));
      } catch (error) {
        console.error('Error loading data from Realm:', error);
      }
    };

    loadDataFromRealm();

    const falconsCollection = realm.objects('FalconRegistration');
    const sessionsCollection = realm.objects('TrainingSession');
    
    falconsCollection.addListener(loadDataFromRealm);
    sessionsCollection.addListener(loadDataFromRealm);

    return () => {
      falconsCollection.removeAllListeners();
      sessionsCollection.removeAllListeners();
    };
  }, []);

  // Training simulation
  useEffect(() => {
    let interval;
    if (isTrainingActive && selectedFalcon) {
      interval = setInterval(() => {
        setTrainingTime(prev => prev + 1);
        
        // Simulate training metrics
        const speed = 6 + Math.random() * 4; // variable speed for training
        const newPosition = Math.min(
          sessionConfig.plannedDistance, 
          speed * trainingTime
        );
        setCurrentPosition(newPosition);

        // Record heart rate data
        recordHeartRate();

        // Update performance metrics
        updatePerformanceMetrics(speed);

        // Check if training session should end
        if (trainingTime >= sessionConfig.plannedDuration * 60 || 
            newPosition >= sessionConfig.plannedDistance) {
          finishTraining();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTrainingActive, trainingTime, selectedFalcon]);

  const recordHeartRate = () => {
    const baseHeartRate = 120;
    const activityHeartRate = 140 + Math.floor(Math.random() * 60);
    const heartRate = isTrainingActive ? activityHeartRate : baseHeartRate;
    
    const heartRateRecord = {
      id: uuid.v4(),
      timestamp: new Date(),
      heartRate: heartRate,
      activityLevel: isTrainingActive ? 'active' : 'resting'
    };
    
    setHeartRateData(prev => [...prev, heartRateRecord]);
  };

  const updatePerformanceMetrics = (currentSpeed) => {
    setPerformanceMetrics(prev => ({
      averageSpeed: ((prev.averageSpeed * trainingTime + currentSpeed) / (trainingTime + 1)),
      maxSpeed: Math.max(prev.maxSpeed, currentSpeed),
      accelerationTime: prev.accelerationTime || (currentSpeed > 8 ? trainingTime : 0),
      consistencyScore: calculateConsistency(currentSpeed),
      enduranceIndex: calculateEnduranceIndex()
    }));
  };

  const calculateConsistency = (currentSpeed) => {
    if (trainingTime < 10) return 0;
    const recentSpeeds = heartRateData.slice(-10).map(hr => hr.heartRate / 20); // rough speed estimate
    const avgSpeed = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length;
    const variance = recentSpeeds.reduce((a, b) => a + Math.pow(b - avgSpeed, 2), 0) / recentSpeeds.length;
    return Math.max(0, 100 - (Math.sqrt(variance) / avgSpeed * 100));
  };

  const calculateEnduranceIndex = () => {
    if (trainingTime < 60) return 0;
    const recentHeartRates = heartRateData.slice(-30).map(hr => hr.heartRate);
    const avgHeartRate = recentHeartRates.reduce((a, b) => a + b, 0) / recentHeartRates.length;
    return Math.max(0, 100 - ((avgHeartRate - 140) / 2)); // Lower heart rate = better endurance
  };

  const startTraining = () => {
    if (!selectedFalcon) {
      Alert.alert('No falcon Selected', 'Please select a falcon to start training');
      return;
    }

    if (!sessionConfig.sessionType) {
      Alert.alert('Session Setup Required', 'Please configure training session first');
      setShowSessionSetup(true);
      return;
    }

    setIsTrainingActive(true);
    setTrainingTime(0);
    setCurrentPosition(0);
    setHeartRateData([]);
    setDrills([]);
    
    // Record initial heart rate
    recordHeartRate();

    setfalcons(prev => prev.map(falcon => 
      falcon.id === selectedFalcon.id 
        ? { ...falcon, status: 'training' }
        : falcon
    ));

    Alert.alert('Training Started', `${selectedFalcon.falconName} - ${sessionConfig.sessionType} training`);
  };

  const finishTraining = () => {
    setIsTrainingActive(false);
    
    const sessionResult = {
      id: uuid.v4(),
      animalId: selectedFalcon.animalId,
      falconName: selectedFalcon.falconName,
      sessionType: sessionConfig.sessionType,
      sessionDate: new Date(),
      duration: trainingTime / 60, // convert to minutes
      totalDistance: currentPosition,
      focusArea: sessionConfig.focusArea,
      trainingNotes: sessionConfig.trainerNotes,
      weatherConditions: sessionConfig.weatherConditions,
      trackConditions: sessionConfig.trackConditions,
      trainerName: 'Trainer', // Could be dynamic
      sessionRating: calculateSessionRating(),
      heartRateData: heartRateData,
      performanceMetrics: {
        id: uuid.v4(),
        averageSpeed: performanceMetrics.averageSpeed,
        maxSpeed: performanceMetrics.maxSpeed,
        accelerationTime: performanceMetrics.accelerationTime,
        consistencyScore: performanceMetrics.consistencyScore,
        enduranceIndex: performanceMetrics.enduranceIndex,
        efficiencyRating: calculateEfficiencyRating(),
      },
      drills: drills,
      synced: false,
      createdAt: new Date(),
    };

    // Save to Realm
    saveTrainingSession(sessionResult);
    
    setfalcons(prev => prev.map(falcon => 
      falcon.id === selectedFalcon.id 
        ? { ...falcon, status: 'completed' }
        : falcon
    ));

    Alert.alert(
      'Training Completed', 
      `${selectedFalcon.falconName} completed ${sessionConfig.sessionType} training!\nDuration: ${Math.round(trainingTime / 60)}min\nDistance: ${Math.round(currentPosition)}m`
    );
  };

  const calculateSessionRating = () => {
    const rating = Math.min(5, 
      1 + 
      (performanceMetrics.consistencyScore / 25) + 
      (performanceMetrics.enduranceIndex / 25) +
      (performanceMetrics.maxSpeed / 3)
    );
    return Math.round(rating);
  };

  const calculateEfficiencyRating = () => {
    const avgHeartRate = heartRateData.reduce((sum, hr) => sum + hr.heartRate, 0) / heartRateData.length;
    const efficiency = (performanceMetrics.averageSpeed * 100) / avgHeartRate;
    return Math.min(100, efficiency * 10);
  };

  const saveTrainingSession = (session) => {
    try {
      realm.write(() => {
        // Save main training session
        const savedSession = realm.create('TrainingSession', session);
        
        // Save heart rate data
        session.heartRateData.forEach(hr => {
          realm.create('HeartRateData', {
            ...hr,
            trainingSessionId: savedSession.id
          });
        });

        // Save performance metrics
        realm.create('PerformanceMetrics', {
          ...session.performanceMetrics,
          trainingSessionId: savedSession.id
        });

        // Save drills
        session.drills.forEach(drill => {
          realm.create('TrainingDrill', {
            ...drill,
            trainingSessionId: savedSession.id
          });
        });
      });
      
      console.log('Training session saved successfully');
    } catch (error) {
      console.error('Error saving training session:', error);
      Alert.alert('Error', 'Could not save training session');
    }
  };

  const stopTraining = () => {
    setIsTrainingActive(false);
    Alert.alert('Training Stopped', 'Training session ended manually');
  };

  const addTrainingDrill = () => {
    const newDrill = {
      id: uuid.v4(),
      drillName: `Drill ${drills.length + 1}`,
      drillType: sessionConfig.focusArea,
      duration: 5,
      repetitions: 5,
      distance: 100,
      successRate: 80,
      notes: '',
      improvements: '',
    };
    
    setDrills(prev => [...prev, newDrill]);
    Alert.alert('Drill Added', 'New training drill added to session');
  };

  const handleExportTrainingReport = async () => {
    try {
      if (trainingSessions.length === 0) {
        Alert.alert('No Data', 'No training sessions to export');
        return;
      }

      Alert.alert(
        'Export Training Report',
        'Choose export format:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'JSON', 
            onPress: () => exportTrainingReport('json')
          },
          { 
            text: 'CSV', 
            onPress: () => exportTrainingReport('csv')
          },
          { 
            text: 'TXT', 
            onPress: () => exportTrainingReport('txt')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export training report');
    }
  };

  const exportTrainingReport = async (format) => {
    try {
      const reportData = generateTrainingReport(trainingSessions, format);
      const fileExt = format === 'csv' ? 'csv' : format === 'txt' ? 'txt' : 'json';
      const fileName = `training_report_${new Date().getTime()}.${fileExt}`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      let fileContent;
      if (format === 'csv' || format === 'txt') {
        fileContent = reportData;
      } else {
        fileContent = JSON.stringify(reportData, null, 2);
      }
      
      await RNFS.writeFile(filePath, fileContent, 'utf8');
      
      await Share.open({
        url: `file://${filePath}`,
        type: format === 'csv' ? 'text/csv' : format === 'txt' ? 'text/plain' : 'application/json',
        filename: fileName,
        subject: `Training Report - ${new Date().toLocaleDateString()}`,
        message: `Falcon Training Performance Report - ${trainingSessions.length} sessions`
      });

      Alert.alert('Success', 'Training report exported successfully!');
    } catch (error) {
      if (error.message !== 'User did not share') {
        Alert.alert('Export Error', 'Failed to export training report');
      }
    }
  };

  const generateTrainingReport = (sessions, format) => {
    const reportData = {
      reportTitle: 'Falcon Training Performance Report',
      generatedAt: new Date().toISOString(),
      totalSessions: sessions.length,
      reportPeriod: {
        start: sessions.length > 0 ? 
          new Date(Math.min(...sessions.map(s => s.sessionDate))).toISOString() : 'N/A',
        end: sessions.length > 0 ? 
          new Date(Math.max(...sessions.map(s => s.sessionDate))).toISOString() : 'N/A'
      },
      sessions: sessions.map(session => ({
        sessionId: session.id,
        animalId: session.animalId,
        falconName: session.falconName,
        sessionType: session.sessionType,
        sessionDate: session.sessionDate,
        duration: session.duration,
        totalDistance: session.totalDistance,
        focusArea: session.focusArea,
        sessionRating: session.sessionRating,
        performanceMetrics: session.performanceMetrics,
        drills: session.drills,
        trainingNotes: session.trainingNotes,
      })),
      statistics: {
        totalTrainingTime: sessions.reduce((sum, s) => sum + s.duration, 0),
        totalDistance: sessions.reduce((sum, s) => sum + s.totalDistance, 0),
        averageSessionRating: sessions.reduce((sum, s) => sum + (s.sessionRating || 0), 0) / sessions.length,
        mostTrainedfalcon: getMostTrainedfalcon(sessions),
        improvementTrend: calculateImprovementTrend(sessions)
      }
    };

    if (format === 'csv') {
      return convertTrainingToCSV(reportData);
    } else if (format === 'txt') {
      return convertTrainingToTXT(reportData);
    }

    return reportData;
  };

  const convertTrainingToCSV = (reportData) => {
    let csv = 'Training Performance Report\n\n';
    
    csv += 'SUMMARY\n';
    csv += `Total Sessions,${reportData.totalSessions}\n`;
    csv += `Total Training Time,${reportData.statistics.totalTrainingTime.toFixed(1)} minutes\n`;
    csv += `Total Distance,${reportData.statistics.totalDistance} meters\n`;
    csv += `Average Session Rating,${reportData.statistics.averageSessionRating.toFixed(1)}/5\n`;
    csv += `Most Trained falcon,${reportData.statistics.mostTrainedfalcon}\n\n`;
    
    csv += 'DETAILED SESSIONS\n';
    csv += 'Session Date,falcon Name,Session Type,Focus Area,Duration (min),Distance (m),Rating,Avg Speed,Max Speed,Consistency\n';
    
    reportData.sessions.forEach(session => {
      csv += `"${new Date(session.sessionDate).toLocaleDateString()}","${session.falconName}","${session.sessionType}","${session.focusArea}",${session.duration.toFixed(1)},${session.totalDistance},${session.sessionRating || 'N/A'},${session.performanceMetrics?.averageSpeed?.toFixed(2) || 'N/A'},${session.performanceMetrics?.maxSpeed?.toFixed(2) || 'N/A'},${session.performanceMetrics?.consistencyScore?.toFixed(1) || 'N/A'}\n`;
    });
    
    return csv;
  };

  const convertTrainingToTXT = (reportData) => {
    let txt = 'FALCON TRAINING PERFORMANCE REPORT\n';
    txt += '='.repeat(50) + '\n\n';
    
    txt += `Generated: ${new Date().toLocaleString()}\n`;
    txt += `Total Sessions: ${reportData.totalSessions}\n`;
    txt += `Total Training Time: ${reportData.statistics.totalTrainingTime.toFixed(1)} minutes\n`;
    txt += `Total Distance: ${reportData.statistics.totalDistance} meters\n`;
    txt += `Average Rating: ${reportData.statistics.averageSessionRating.toFixed(1)}/5\n\n`;
    
    txt += 'TRAINING SESSIONS:\n';
    txt += '-'.repeat(30) + '\n';
    
    reportData.sessions.forEach((session, index) => {
      txt += `\nSession ${index + 1}:\n`;
      txt += `  falcon: ${session.falconName} (${session.animalId})\n`;
      txt += `  Type: ${session.sessionType}\n`;
      txt += `  Focus: ${session.focusArea}\n`;
      txt += `  Date: ${new Date(session.sessionDate).toLocaleString()}\n`;
      txt += `  Duration: ${session.duration.toFixed(1)} minutes\n`;
      txt += `  Distance: ${session.totalDistance}m\n`;
      txt += `  Rating: ${session.sessionRating}/5\n`;
      
      if (session.performanceMetrics) {
        txt += `  Performance:\n`;
        txt += `    Avg Speed: ${session.performanceMetrics.averageSpeed?.toFixed(2) || 'N/A'} m/s\n`;
        txt += `    Max Speed: ${session.performanceMetrics.maxSpeed?.toFixed(2) || 'N/A'} m/s\n`;
        txt += `    Consistency: ${session.performanceMetrics.consistencyScore?.toFixed(1) || 'N/A'}%\n`;
        txt += `    Endurance: ${session.performanceMetrics.enduranceIndex?.toFixed(1) || 'N/A'}\n`;
      }
      
      if (session.trainingNotes) {
        txt += `  Notes: ${session.trainingNotes}\n`;
      }
    });
    
    return txt;
  };

  const getMostTrainedfalcon = (sessions) => {
    if (sessions.length === 0) return 'N/A';
    const falconCount = {};
    sessions.forEach(session => {
      falconCount[session.falconName] = (falconCount[session.falconName] || 0) + 1;
    });
    return Object.keys(falconCount).reduce((a, b) => falconCount[a] > falconCount[b] ? a : b);
  };

  const calculateImprovementTrend = (sessions) => {
    if (sessions.length < 2) return 'Insufficient data';
    const recentSessions = sessions.slice(0, 5); // Last 5 sessions
    const ratings = recentSessions.map(s => s.sessionRating).filter(r => r);
    if (ratings.length < 2) return 'Insufficient ratings';
    const trend = ratings[0] - ratings[ratings.length - 1];
    return trend > 0 ? 'Improving' : trend < 0 ? 'Declining' : 'Stable';
  };

  const selectfalconForTraining = (falcon) => {
    if (isTrainingActive) {
      Alert.alert('Training in Progress', 'Cannot change falcon during active training');
      return;
    }
    setselectedFalcon(falcon);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return COLORS.successGreen;
      case 'training': return COLORS.cobaltBlue;
      case 'completed': return COLORS.oasisGreen;
      case 'inactive': return COLORS.offlineGray;
      default: return COLORS.warningYellow;
    }
  };

  // Session Setup Modal
  const SessionSetupModal = () => (
    <Modal
      visible={showSessionSetup}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSessionSetup(false)}
    >
      <View style={localStyles.modalContainer}>
        <View style={localStyles.modalContent}>
          <Text style={localStyles.modalTitle}>Training Session Setup</Text>
          
          <View style={localStyles.inputGroup}>
            <Text style={localStyles.label}>Session Type</Text>
            <View style={localStyles.buttonGroup}>
              {['speed', 'endurance', 'technique', 'recovery'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    localStyles.sessionTypeButton,
                    sessionConfig.sessionType === type && localStyles.sessionTypeButtonActive
                  ]}
                  onPress={() => setSessionConfig(prev => ({ ...prev, sessionType: type }))}
                >
                  <Text style={[
                    localStyles.sessionTypeButtonText,
                    sessionConfig.sessionType === type && localStyles.sessionTypeButtonTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={localStyles.inputGroup}>
            <Text style={localStyles.label}>Focus Area</Text>
            <View style={localStyles.buttonGroup}>
              {['acceleration', 'maintaining_speed', 'finishing', 'gate_start'].map(area => (
                <TouchableOpacity
                  key={area}
                  style={[
                    localStyles.focusButton,
                    sessionConfig.focusArea === area && localStyles.focusButtonActive
                  ]}
                  onPress={() => setSessionConfig(prev => ({ ...prev, focusArea: area }))}
                >
                  <Text style={[
                    localStyles.focusButtonText,
                    sessionConfig.focusArea === area && localStyles.focusButtonTextActive
                  ]}>
                    {area.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={localStyles.inputRow}>
            <View style={localStyles.inputGroup}>
              <Text style={localStyles.label}>Duration (min)</Text>
              <TextInput
                style={localStyles.numberInput}
                value={sessionConfig.plannedDuration.toString()}
                onChangeText={(text) => setSessionConfig(prev => ({ 
                  ...prev, 
                  plannedDuration: parseInt(text) || 30 
                }))}
                keyboardType="numeric"
              />
            </View>
            <View style={localStyles.inputGroup}>
              <Text style={localStyles.label}>Distance (m)</Text>
              <TextInput
                style={localStyles.numberInput}
                value={sessionConfig.plannedDistance.toString()}
                onChangeText={(text) => setSessionConfig(prev => ({ 
                  ...prev, 
                  plannedDistance: parseInt(text) || 1600 
                }))}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={localStyles.inputGroup}>
            <Text style={localStyles.label}>Trainer Notes</Text>
            <TextInput
              style={[localStyles.input, localStyles.textArea]}
              placeholder="Enter training objectives and notes..."
              value={sessionConfig.trainerNotes}
              onChangeText={(text) => setSessionConfig(prev => ({ ...prev, trainerNotes: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={localStyles.modalButtons}>
            <TouchableOpacity 
              style={[localStyles.modalButton, localStyles.cancelButton]}
              onPress={() => setShowSessionSetup(false)}
            >
              <Text style={localStyles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[localStyles.modalButton, localStyles.confirmButton]}
              onPress={() => {
                setShowSessionSetup(false);
                Alert.alert('Session Configured', 'Training session is ready to start');
              }}
            >
              <Text style={localStyles.modalButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Training Overview Component
  const TrainingOverview = () => (
    <View style={localStyles.trainingOverview}>
      <Text style={localStyles.sectionTitle}>TRAINING SESSION CONTROL</Text>
      
      {/* Selected falcon Info */}
      {selectedFalcon ? (
        <View style={localStyles.selectedFalconInfo}>
          {selectedFalcon.imagePath ? (
            <Image 
              source={{ uri: selectedFalcon.imagePath }} 
              style={localStyles.falconImage}
            />
          ) : (
            <View style={localStyles.falconImagePlaceholder}>
              <Text style={localStyles.placeholderText}>No Image</Text>
            </View>
          )}
          <View style={localStyles.selectedFalconDetails}>
            <Text style={localStyles.selectedFalconName}>{selectedFalcon.falconName}</Text>
            <Text style={localStyles.selectedFalconBreed}>{selectedFalcon.breed} • {selectedFalcon.weight}</Text>
            <Text style={localStyles.animalId}>Animal ID: {selectedFalcon.animalId}</Text>
            <Text style={localStyles.trainingLevel}>Level: {selectedFalcon.trainingLevel || 'Not Set'}</Text>
          </View>
        </View>
      ) : (
        <Text style={localStyles.nofalconSelected}>No falcon selected for training</Text>
      )}

      {/* Session Configuration */}
      <View style={localStyles.sessionConfig}>
        <Text style={localStyles.sessionConfigTitle}>Session Configuration</Text>
        <View style={localStyles.configGrid}>
          <View style={localStyles.configItem}>
            <Text style={localStyles.configLabel}>Type</Text>
            <Text style={localStyles.configValue}>{sessionConfig.sessionType}</Text>
          </View>
          <View style={localStyles.configItem}>
            <Text style={localStyles.configLabel}>Focus</Text>
            <Text style={localStyles.configValue}>{sessionConfig.focusArea}</Text>
          </View>
          <View style={localStyles.configItem}>
            <Text style={localStyles.configLabel}>Duration</Text>
            <Text style={localStyles.configValue}>{sessionConfig.plannedDuration}min</Text>
          </View>
          <View style={localStyles.configItem}>
            <Text style={localStyles.configLabel}>Distance</Text>
            <Text style={localStyles.configValue}>{sessionConfig.plannedDistance}m</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={localStyles.setupButton}
          onPress={() => setShowSessionSetup(true)}
        >
          <Text style={localStyles.setupButtonText}>CONFIGURE SESSION</Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.trainingInfo}>
        <View style={localStyles.trainingMainInfo}>
          <Text style={localStyles.trainingName}>{sessionConfig.sessionType} Training</Text>
          <Text style={localStyles.trainingDetails}>
            {Math.round(trainingTime / 60)}min • {Math.round(currentPosition)}m • {sessionConfig.focusArea}
          </Text>
        </View>
        <View style={localStyles.trainingTimer}>
          <Text style={localStyles.timerText}>
            {Math.floor(trainingTime / 60)}:{(trainingTime % 60).toString().padStart(2, '0')}
          </Text>
          <Text style={localStyles.timerLabel}>Training Time</Text>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={localStyles.metricsGrid}>
        <View style={localStyles.metricItem}>
          <Text style={localStyles.metricValue}>{performanceMetrics.averageSpeed.toFixed(1)}</Text>
          <Text style={localStyles.metricLabel}>Avg Speed</Text>
        </View>
        <View style={localStyles.metricItem}>
          <Text style={localStyles.metricValue}>{performanceMetrics.maxSpeed.toFixed(1)}</Text>
          <Text style={localStyles.metricLabel}>Max Speed</Text>
        </View>
        <View style={localStyles.metricItem}>
          <Text style={localStyles.metricValue}>{performanceMetrics.consistencyScore.toFixed(0)}%</Text>
          <Text style={localStyles.metricLabel}>Consistency</Text>
        </View>
        <View style={localStyles.metricItem}>
          <Text style={localStyles.metricValue}>{performanceMetrics.enduranceIndex.toFixed(0)}</Text>
          <Text style={localStyles.metricLabel}>Endurance</Text>
        </View>
      </View>

      <View style={localStyles.trainingControls}>
        <TouchableOpacity 
          style={[
            localStyles.controlButton, 
            localStyles.startButton,
            (!selectedFalcon || isTrainingActive) && localStyles.disabledButton
          ]}
          onPress={startTraining}
          disabled={!selectedFalcon || isTrainingActive}
        >
          <Text style={localStyles.controlButtonText}>
            {isTrainingActive ? 'TRAINING IN PROGRESS' : 'START TRAINING'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            localStyles.controlButton, 
            localStyles.stopButton,
            !isTrainingActive && localStyles.disabledButton
          ]}
          onPress={stopTraining}
          disabled={!isTrainingActive}
        >
          <Text style={localStyles.controlButtonText}>STOP TRAINING</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            localStyles.controlButton, 
            localStyles.drillButton,
            !isTrainingActive && localStyles.disabledButton
          ]}
          onPress={addTrainingDrill}
          disabled={!isTrainingActive}
        >
          <Text style={localStyles.controlButtonText}>ADD DRILL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // falcon Selection Component
  const FalconSelection = () => (
    <View style={localStyles.falconSelectionSection}>
      <Text style={localStyles.sectionTitle}>SELECT falcon FOR TRAINING</Text>
      {falcons.length === 0 ? (
        <Text style={localStyles.nofalconsAvailable}>No falcons registered yet</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={localStyles.falconSelectionList}>
            {falcons.map((falcon) => (
              <TouchableOpacity
                key={falcon.id}
                style={[
                  localStyles.falconSelectionCard,
                  selectedFalcon?.id === falcon.id && localStyles.selectedFalconCard,
                  isTrainingActive && localStyles.disabledCard
                ]}
                onPress={() => selectfalconForTraining(falcon)}
                disabled={isTrainingActive}
              >
                {falcon.imagePath ? (
                  <Image 
                    source={{ uri: falcon.imagePath }} 
                    style={localStyles.selectionfalconImage}
                  />
                ) : (
                  <View style={localStyles.selectionImagePlaceholder}>
                    <Text style={localStyles.placeholderTextSmall}>No Image</Text>
                  </View>
                )}
                <View style={localStyles.selectionfalconInfo}>
                  <Text style={localStyles.selectionfalconName}>{falcon.falconName}</Text>
                  <Text style={localStyles.selectionAnimalId}>{falcon.animalId}</Text>
                  <Text style={localStyles.selectionfalconBreed}>{falcon.breed}</Text>
                  <Text style={localStyles.selectionfalconWeight}>{falcon.weight}</Text>
                  <Text style={localStyles.selectionTrainingLevel}>
                    Level: {falcon.trainingLevel || 'Not Set'}
                  </Text>
                  <View style={[
                    localStyles.statusBadge,
                    { backgroundColor: getStatusColor(falcon.status) }
                  ]}>
                    <Text style={localStyles.statusBadgeText}>
                      {falcon.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  // Training Sessions History
  const TrainingSessionsHistory = () => (
    <View style={localStyles.sessionsSection}>
      <Text style={localStyles.sectionTitle}>TRAINING HISTORY</Text>
      {trainingSessions.length === 0 ? (
        <Text style={localStyles.noSessions}>No training sessions completed yet</Text>
      ) : (
        <View style={localStyles.sessionsList}>
          {trainingSessions.slice(0, 5).map((session) => (
            <View key={session.id} style={localStyles.sessionItem}>
              <View style={localStyles.sessionHeader}>
                <Text style={localStyles.sessionfalconName}>{session.falconName}</Text>
                <Text style={localStyles.sessionDate}>
                  {new Date(session.sessionDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={localStyles.sessionDetails}>
                <Text style={localStyles.sessionType}>{session.sessionType}</Text>
                <Text style={localStyles.sessionFocus}>{session.focusArea}</Text>
                <Text style={localStyles.sessionStats}>
                  {session.duration.toFixed(1)}min • {session.totalDistance}m
                </Text>
              </View>
              <View style={localStyles.sessionRating}>
                <Text style={localStyles.ratingText}>Rating: {session.sessionRating}/5</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Data Summary
  const DataSummary = () => {
    const totalSessions = realm.objects('TrainingSession').length;
    const totalfalcons = realm.objects('FalconRegistration').length;
    const totalTrainingTime = trainingSessions.reduce((sum, session) => sum + session.duration, 0);
    const recentSession = totalSessions > 0 ? 
      new Date(trainingSessions[0].sessionDate).toLocaleDateString() : 'None';

    return (
      <View style={localStyles.dataSummarySection}>
        <Text style={localStyles.sectionTitle}>TRAINING DATA SUMMARY</Text>
        <View style={localStyles.summaryGrid}>
          <View style={localStyles.summaryItem}>
            <Text style={localStyles.summaryNumber}>{totalSessions}</Text>
            <Text style={localStyles.summaryLabel}>Total Sessions</Text>
          </View>
          <View style={localStyles.summaryItem}>
            <Text style={localStyles.summaryNumber}>{Math.round(totalTrainingTime)}</Text>
            <Text style={localStyles.summaryLabel}>Training Minutes</Text>
          </View>
          <View style={localStyles.summaryItem}>
            <Text style={localStyles.summaryNumber}>{totalfalcons}</Text>
            <Text style={localStyles.summaryLabel}>Trained falcons</Text>
          </View>
          <View style={localStyles.summaryItem}>
            <Text style={localStyles.summaryNumber}>{recentSession}</Text>
            <Text style={localStyles.summaryLabel}>Last Session</Text>
          </View>
        </View>
      </View>
    );
  };

  // Quick Actions
  const QuickActions = () => (
    <View style={localStyles.quickActions}>
      <TouchableOpacity 
        style={[
          localStyles.quickButton,
          !isTrainingActive && localStyles.disabledButton
        ]}
        onPress={stopTraining}
        disabled={!isTrainingActive}
      >
        <Text style={localStyles.quickButtonText}>STOP TRAINING</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={localStyles.quickButton}
        onPress={() => Alert.alert('Data Saved', 'All training data is stored locally')}
      >
        <Text style={localStyles.quickButtonText}>SAVE DATA</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          localStyles.quickButton,
          trainingSessions.length === 0 && localStyles.disabledButton
        ]}
        onPress={handleExportTrainingReport}
        disabled={trainingSessions.length === 0}
      >
        <Text style={localStyles.quickButtonText}>EXPORT REPORT</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Training Overview */}
        <TrainingOverview />

        {/* falcon Selection */}
        <FalconSelection />

        {/* Training Sessions History */}
        <TrainingSessionsHistory />

        {/* Data Summary */}
        <DataSummary />

        {/* Quick Actions */}
        <QuickActions />
      </ScrollView>

      {/* Session Setup Modal */}
      <SessionSetupModal />
    </View>
  );
};

const localStyles = StyleSheet.create({
  trainingOverview: {
    backgroundColor: COLORS.warmStone,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 18,
    color: COLORS.charcoal,
    marginBottom: 12,
  },
  selectedFalconInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.desertSand,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  falconImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  falconImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.offlineGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.desertSand,
  },
  selectedFalconDetails: {
    flex: 1,
  },
  selectedFalconName: {
    fontFamily: FONTS.montserratBold,
    fontSize: 18,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  selectedFalconBreed: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal + '80',
    marginBottom: 2,
  },
  animalId: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.cobaltBlue,
    marginBottom: 2,
  },
  trainingLevel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.terracotta,
  },
  nofalconSelected: {
    fontFamily: FONTS.montserratItalic,
    fontSize: 14,
    color: COLORS.charcoal + '60',
    textAlign: 'center',
    padding: 20,
  },
  sessionConfig: {
    backgroundColor: COLORS.desertSand,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sessionConfigTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: 8,
  },
  configGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  configItem: {
    alignItems: 'center',
    flex: 1,
  },
  configLabel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '60',
    marginBottom: 4,
  },
  configValue: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  setupButton: {
    backgroundColor: COLORS.cobaltBlue,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  setupButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.desertSand,
  },
  trainingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trainingMainInfo: {
    flex: 1,
  },
  trainingName: {
    fontFamily: FONTS.montserratBold,
    fontSize: 20,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  trainingDetails: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal + '80',
  },
  trainingTimer: {
    alignItems: 'center',
  },
  timerText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 24,
    color: COLORS.cobaltBlue,
  },
  timerLabel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '80',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 18,
    color: COLORS.cobaltBlue,
    marginBottom: 4,
  },
  metricLabel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 10,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
  },
  trainingControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: COLORS.oasisGreen,
  },
  stopButton: {
    backgroundColor: COLORS.terracotta,
  },
  drillButton: {
    backgroundColor: COLORS.cobaltBlue,
    flex: 0.7,
  },
  disabledButton: {
    backgroundColor: COLORS.offlineGray,
    opacity: 0.6,
  },
  controlButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.desertSand,
    textAlign: 'center',
  },
  falconSelectionSection: {
    backgroundColor: COLORS.warmStone,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  nofalconsAvailable: {
    fontFamily: FONTS.montserratItalic,
    fontSize: 14,
    color: COLORS.charcoal + '60',
    textAlign: 'center',
    padding: 20,
  },
  falconSelectionList: {
    flexDirection: 'row',
    gap: 12,
  },
  falconSelectionCard: {
    width: 140,
    backgroundColor: COLORS.desertSand,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFalconCard: {
    borderColor: COLORS.cobaltBlue,
  },
  disabledCard: {
    opacity: 0.6,
  },
  selectionfalconImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 8,
  },
  selectionImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.offlineGray,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  placeholderTextSmall: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 10,
    color: COLORS.desertSand,
  },
  selectionfalconInfo: {
    alignItems: 'center',
  },
  selectionfalconName: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 2,
  },
  selectionAnimalId: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 10,
    color: COLORS.cobaltBlue,
    textAlign: 'center',
    marginBottom: 2,
  },
  selectionfalconBreed: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
    marginBottom: 2,
  },
  selectionfalconWeight: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 11,
    color: COLORS.charcoal + '60',
    textAlign: 'center',
    marginBottom: 2,
  },
  selectionTrainingLevel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 10,
    color: COLORS.terracotta,
    textAlign: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: COLORS.desertSand,
  },
  sessionsSection: {
    backgroundColor: COLORS.warmStone,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  noSessions: {
    fontFamily: FONTS.montserratItalic,
    fontSize: 14,
    color: COLORS.charcoal + '60',
    textAlign: 'center',
    padding: 20,
  },
  sessionsList: {
    gap: 8,
  },
  sessionItem: {
    backgroundColor: COLORS.desertSand,
    padding: 12,
    borderRadius: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionfalconName: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
  },
  sessionDate: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '60',
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionType: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.cobaltBlue,
  },
  sessionFocus: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '80',
  },
  sessionStats: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.terracotta,
  },
  sessionRating: {
    alignItems: 'flex-start',
  },
  ratingText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.oasisGreen,
  },
  dataSummarySection: {
    backgroundColor: COLORS.warmStone,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 20,
    color: COLORS.cobaltBlue,
    marginBottom: 4,
  },
  summaryLabel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 10,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  quickButton: {
    flex: 1,
    backgroundColor: COLORS.terracotta,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.desertSand,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.warmStone,
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 20,
    color: COLORS.charcoal,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.desertSand,
    borderWidth: 1,
    borderColor: COLORS.charcoal + '40',
  },
  sessionTypeButtonActive: {
    backgroundColor: COLORS.cobaltBlue,
    borderColor: COLORS.cobaltBlue,
  },
  sessionTypeButtonText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal,
  },
  sessionTypeButtonTextActive: {
    color: COLORS.desertSand,
    fontFamily: FONTS.montserratBold,
  },
  focusButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: COLORS.desertSand,
    borderWidth: 1,
    borderColor: COLORS.charcoal + '40',
  },
  focusButtonActive: {
    backgroundColor: COLORS.oasisGreen,
    borderColor: COLORS.oasisGreen,
  },
  focusButtonText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 10,
    color: COLORS.charcoal,
  },
  focusButtonTextActive: {
    color: COLORS.desertSand,
    fontFamily: FONTS.montserratBold,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  numberInput: {
    backgroundColor: COLORS.desertSand,
    borderWidth: 1,
    borderColor: COLORS.charcoal + '40',
    borderRadius: 6,
    padding: 8,
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.desertSand,
    borderWidth: 1,
    borderColor: COLORS.charcoal + '40',
    borderRadius: 6,
    padding: 8,
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.offlineGray,
  },
  confirmButton: {
    backgroundColor: COLORS.oasisGreen,
  },
  modalButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.desertSand,
  },
});

export default TrainingControlScreen;