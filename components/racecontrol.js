
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
  const RaceOverview = () => (
    <View style={modernStyles.container}>
      {/* Connection Banner */}
      <View style={[modernStyles.connectionBanner, { backgroundColor: connectedDevice ? COLORS.successGreen : COLORS.terracotta }]}>
        <Text style={modernStyles.connectionText}>
          {connectedDevice ? 'Master Board Connected' : 'Not Connected - Go to Dashboard'}
        </Text>
      </View>

      {/* Selected Falcon Card */}
      <View style={modernStyles.falconCard}>
        {raceState && raceState.selectedFalcon ? (
          <>
            <Image
              source={{ uri: raceState.selectedFalcon.imagePath }}
              style={modernStyles.falconImage}
              defaultSource={require('../assets/falconplaceholder.png')}
            />
            <View style={modernStyles.falconDetails}>
              <Text style={modernStyles.falconName}>{raceState.selectedFalcon.falconName ?? '-'}</Text>
              <Text style={modernStyles.falconStats}>{raceState.selectedFalcon.breed ?? '-'} • {raceState.selectedFalcon.weight ?? '-'}</Text>
              <Text style={modernStyles.falconId}>Animal ID: {raceState.selectedFalcon.animalId ?? '-'}</Text>
            </View>
          </>
        ) : (
          <View style={modernStyles.falconEmpty}>
            <Text style={modernStyles.falconEmptyText}>No falcon selected for race</Text>
          </View>
        )}
      </View>

      {/* Race Controls */}
      <View style={modernStyles.raceControlsSection}>
        <View style={modernStyles.raceInfoBox}>
          <Text style={modernStyles.raceTitle}>Single Falcon Time Trial</Text>
          <Text style={modernStyles.raceSubtitle}>{currentRaceCfg.distance} • Straight Track</Text>
        </View>
        <View style={modernStyles.raceTimerBox}>
          <Text style={modernStyles.raceTimer}>{derivedRaceSeconds}s</Text>
          <Text style={modernStyles.raceTimerLabel}>Race Time</Text>
        </View>
        <View style={modernStyles.raceButtonsRow}>
          <TouchableOpacity
            style={[modernStyles.raceButton, modernStyles.startButton,
              (!connectedDevice || !(raceState && raceState.selectedFalcon)) && modernStyles.disabledButton]}
            onPress={startRace}
            disabled={raceState.status.race_active || !connectedDevice || !(raceState && raceState.selectedFalcon)}
          >
            <Text style={modernStyles.raceButtonText}>
              {!connectedDevice
                ? 'Connect Master'
                : raceState.status.race_active
                  ? 'RACE IN PROGRESS'
                  : 'START RACE'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modernStyles.raceButton, modernStyles.stopButton,
              (!connectedDevice || !raceState.status.race_active) && modernStyles.disabledButton]}
            onPress={stopRace}
            disabled={!connectedDevice || !raceState.status.race_active}
          >
            <Text style={modernStyles.raceButtonText}>STOP RACE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Detection Timeline */}
      <View style={modernStyles.timelineSection}>
        <Text style={modernStyles.timelineTitle}>Detection Timeline</Text>
        {raceState.currentRace && derivedCheckpoints.length === 0 && (
          <Text style={modernStyles.timelineEmpty}>No detections yet</Text>
        )}
        {derivedCheckpoints.length > 0 && (
          <View style={modernStyles.timelineList}>
            {derivedCheckpoints.map(cp => (
              <View key={cp.id} style={modernStyles.timelineItem}>
                <View style={modernStyles.timelineDot} />
                <View style={modernStyles.timelineDetails}>
                  <Text style={modernStyles.timelineNode}>Node {cp.nodeId}</Text>
                  <Text style={modernStyles.timelineTime}>{cp.splitTime.toFixed ? cp.splitTime.toFixed(1) : cp.splitTime}s</Text>
                  <Text style={modernStyles.timelineType}>{cp.type}</Text>
                  <Text style={modernStyles.timelineStamp}>{new Date(cp.timestamp).toLocaleTimeString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
// Modern styles for RaceControlScreen
const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmStone,
    paddingTop: 8,
    paddingBottom: 8,
  },
  connectionBanner: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.charcoal + '30',
    backgroundColor: COLORS.desertSand,
    shadowColor: COLORS.charcoal,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 18,
    color: COLORS.cobaltBlue,
    letterSpacing: 1,
  },
  falconCard: {
    backgroundColor: COLORS.desertSand,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: COLORS.charcoal,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  falconImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: COLORS.cobaltBlue + '20',
    borderWidth: 2,
    borderColor: COLORS.cobaltBlue,
  },
  falconDetails: {
    alignItems: 'center',
  },
  falconName: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 26,
    color: COLORS.cobaltBlue,
    marginBottom: 6,
    letterSpacing: 1,
  },
  falconStats: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  falconId: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal,
    marginBottom: 2,
  },
  falconEmpty: {
    alignItems: 'center',
    padding: 24,
  },
  falconEmptyText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 18,
    color: COLORS.terracotta,
    textAlign: 'center',
  },
  raceControlsSection: {
    backgroundColor: COLORS.desertSand,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: COLORS.charcoal,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  raceInfoBox: {
    marginBottom: 12,
    alignItems: 'center',
  },
  raceTitle: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 22,
    color: COLORS.cobaltBlue,
    marginBottom: 4,
  },
  raceSubtitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: 2,
  },
  raceTimerBox: {
    marginBottom: 12,
    alignItems: 'center',
  },
  raceTimer: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 38,
    color: COLORS.oasisGreen,
    marginBottom: 2,
  },
  raceTimerLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
  },
  raceButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  raceButton: {
    flex: 1,
    backgroundColor: COLORS.cobaltBlue,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: COLORS.charcoal,
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  startButton: {
    backgroundColor: COLORS.oasisGreen,
  },
  stopButton: {
    backgroundColor: COLORS.terracotta,
  },
  disabledButton: {
    opacity: 0.4,
  },
  raceButtonText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 18,
    color: COLORS.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timelineSection: {
    backgroundColor: COLORS.desertSand,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    shadowColor: COLORS.charcoal,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  timelineTitle: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 18,
    color: COLORS.cobaltBlue,
    marginBottom: 10,
  },
  timelineEmpty: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.terracotta,
    textAlign: 'center',
    padding: 16,
  },
  timelineList: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmStone,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    shadowColor: COLORS.charcoal,
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.cobaltBlue,
    marginRight: 14,
  },
  timelineDetails: {
    flex: 1,
  },
  timelineNode: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: 2,
  },
  timelineTime: {
    fontFamily: FONTS.montserratBold,
    fontSize: 15,
    color: COLORS.oasisGreen,
    marginBottom: 2,
  },
  timelineType: {
    fontFamily: FONTS.montserratBold,
    fontSize: 13,
    color: COLORS.cobaltBlue,
    marginBottom: 2,
  },
  timelineStamp: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 13,
    color: COLORS.charcoal,
  },
});
//       type: 'sensor', 
//       status: 'active', 
//       position: 100,
//       distanceFromStart: '100m'
//     },
//     { 
//       id: 'sensor-2', 
//       name: 'Checkpoint 2', 
//       type: 'sensor', 
//       status: 'active', 
//       position: 200,
//       distanceFromStart: '200m'
//     },
//     { 
//       id: 'sensor-3', 
//       name: 'Checkpoint 3', 
//       type: 'sensor', 
//       status: 'active', 
//       position: 300,
//       distanceFromStart: '300m'
//     },
//     { 
//       id: 'sensor-finish', 
//       name: 'Finish Line', 
//       type: 'sensor', 
//       status: 'active', 
//       position: 400,
//       distanceFromStart: '400m'
//     },
//   ]);

//   // Race configuration
//   const [currentRace, setCurrentRace] = useState({
//     distance: '400m',
//     trackLength: 400,
//     status: 'waiting'
//   });

//   useEffect(() => {
//     let interval;
//     if (isRaceActive && selectedFalcon) {
//       interval = setInterval(() => {
//         setRaceTime(prev => prev + 0.1);
        
//         // Simulate falcon movement based on time
//         const speed = 8; // meters per second
//         const newPosition = Math.min(
//           currentRace.trackLength, 
//           speed * raceTime
//         );
//         setCurrentPosition(newPosition);

//         // Check if falcon reached finish line
//         if (newPosition >= currentRace.trackLength) {
//           finishRace();
//         }
//       }, 100);
//     }
//     return () => clearInterval(interval);
//   }, [isRaceActive, raceTime, selectedFalcon]);

//   const startRace = () => {
//     if (!selectedFalcon) {
//       Alert.alert('No falcon Selected', 'Please select a falcon to start the race');
//       return;
//     }

//     setIsRaceActive(true);
//     setRaceTime(0);
//     setCurrentPosition(0);
    
//     // Update falcon status
//     setFalcons(prev => prev.map(falcon => 
//       falcon.id === selectedFalcon.id 
//         ? { ...falcon, status: 'racing' }
//         : falcon
//     ));

//     Alert.alert('Race Started', `Tracking initiated for ${selectedFalcon.falconName}`);
//   };

//   const finishRace = () => {
//     setIsRaceActive(false);
    
//     const result = {
//       falconId: selectedFalcon.id,
//       falconName: selectedFalcon.falconName,
//       time: raceTime,
//       distance: currentRace.distance,
//       timestamp: new Date().toISOString()
//     };

//     setRaceResults(prev => [...prev, result]);
    
//     // Update falcon status
//     setFalcons(prev => prev.map(falcon => 
//       falcon.id === selectedFalcon.id 
//         ? { ...falcon, status: 'finished' }
//         : falcon
//     ));

//     Alert.alert(
//       'Race Completed', 
//       `${selectedFalcon.falconName} finished in ${raceTime} seconds!`
//     );
//   };

//   const stopRace = () => {
//     setIsRaceActive(false);
//     Alert.alert('Race Stopped', 'Performance data saved');
//   };

//   const selectfalconForRace = (falcon) => {
//     if (isRaceActive) {
//       Alert.alert('Race in Progress', 'Cannot change falcon during active race');
//       return;
//     }
//     setselectedFalcon(falcon);
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'ready': return COLORS.successGreen;
//       case 'racing': return COLORS.cobaltBlue;
//       case 'finished': return COLORS.oasisGreen;
//       case 'inactive': return COLORS.offlineGray;
//       default: return COLORS.warningYellow;
//     }
//   };

//   const RaceOverview = () => (
//     <View style={localStyles.raceOverview}>
//       <Text style={localStyles.sectionTitle}>SINGLE falcon RACE CONTROL</Text>
      
//       {/* Selected falcon Info */}
//       {selectedFalcon ? (
//         <View style={localStyles.selectedFalconInfo}>
//           {/* <Image 
//             source={{ uri: selectedFalcon.imagePath }} 
//             style={localStyles.falconImage}
//             // defaultSource={require('./assets/falconplaceholder.png')}
//           /> */}
//           <View style={localStyles.selectedFalconDetails}>
//             <Text style={localStyles.selectedFalconName}>{selectedFalcon.falconName}</Text>
//             <Text style={localStyles.selectedFalconBreed}>{selectedFalcon.breed} • {selectedFalcon.weight}</Text>
//             <Text style={localStyles.deviceId}>Device: {selectedFalcon.deviceId}</Text>
//           </View>
//         </View>
//       ) : (
//         <Text style={localStyles.nofalconSelected}>No falcon selected for race</Text>
//       )}

//       <View style={localStyles.raceInfo}>
//         <View style={localStyles.raceMainInfo}>
//           <Text style={localStyles.raceName}>Single falcon Time Trial</Text>
//           <Text style={localStyles.raceDetails}>{currentRace.distance} • Straight Track</Text>
//         </View>
//         <View style={localStyles.raceTimer}>
//           <Text style={localStyles.timerText}>
//             {raceTime.toFixed(1)}s
//           </Text>
//           <Text style={localStyles.timerLabel}>Race Time</Text>
//         </View>
//       </View>

//       <View style={localStyles.raceControls}>
//         <TouchableOpacity 
//           style={[
//             localStyles.controlButton, 
//             localStyles.startButton,
//             !selectedFalcon && localStyles.disabledButton
//           ]}
//           onPress={startRace}
//           disabled={isRaceActive || !selectedFalcon}
//         >
//           <Text style={localStyles.controlButtonText}>
//             {isRaceActive ? 'RACE IN PROGRESS' : 'START RACE'}
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity 
//           style={[
//             localStyles.controlButton, 
//             localStyles.stopButton,
//             !isRaceActive && localStyles.disabledButton
//           ]}
//           onPress={stopRace}
//           disabled={!isRaceActive}
//         >
//           <Text style={localStyles.controlButtonText}>STOP RACE</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   const TrackMap = () => (
//     <View style={localStyles.trackSection}>
//       <Text style={localStyles.sectionTitle}>TRACK OVERVIEW - {currentRace.distance}</Text>
//       <View style={localStyles.trackContainer}>
//         {/* Straight track visualization */}
//         <View style={localStyles.straightTrack}>
          
//           {/* Starting Gate */}
//           <View style={[localStyles.trackDevice, { left: 20 }]}>
//             <View style={[localStyles.deviceDot, { backgroundColor: COLORS.successGreen }]} />
//             <Text style={localStyles.deviceLabel}>START</Text>
//           </View>

//           {/* LORA Devices along the track */}
//           {trackDevices.map((device) => (
//             <View 
//               key={device.id}
//               style={[
//                 localStyles.trackDevice,
//                 { 
//                   left: 20 + (device.position / currentRace.trackLength) * (width - 80)
//                 }
//               ]}
//             >
//               <View style={[
//                 localStyles.deviceDot, 
//                 { backgroundColor: getStatusColor(device.status) }
//               ]} />
//               <Text style={localStyles.deviceLabel}>
//                 {device.name.split(' ')[0]}
//               </Text>
//               <Text style={localStyles.deviceDistance}>{device.distanceFromStart}</Text>
//             </View>
//           ))}

//           {/* falcon position indicator */}
//           {selectedFalcon && (
//             <View 
//               style={[
//                 localStyles.falconMarker,
//                 { 
//                   left: 20 + (currentPosition / currentRace.trackLength) * (width - 80),
//                   backgroundColor: getStatusColor(selectedFalcon.status)
//                 }
//               ]}
//             >
//               <Text style={localStyles.falconMarkerText}>
//                 {selectedFalcon.falconName.split(' ')[0]}
//               </Text>
//             </View>
//           )}

//           {/* Track line */}
//           <View style={localStyles.trackLine} />
//         </View>

//         {/* Position indicator */}
//         <View style={localStyles.positionInfo}>
//           <Text style={localStyles.positionText}>
//             Current Position: {currentPosition.toFixed(1)}m / {currentRace.trackLength}m
//           </Text>
//           <Text style={localStyles.speedText}>
//             Speed: {(currentPosition / Math.max(raceTime, 0.1)).toFixed(1)} m/s
//           </Text>
//         </View>
//       </View>
//     </View>
//   );

//   const falconSelection = () => (
//     <View style={localStyles.falconSelectionSection}>
//       <Text style={localStyles.sectionTitle}>SELECT falcon FOR RACE</Text>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//         <View style={localStyles.falconSelectionList}>
//           {falcons.map((falcon) => (
//             <TouchableOpacity
//               key={falcon.id}
//               style={[
//                 localStyles.falconSelectionCard,
//                 selectedFalcon?.id === falcon.id && localStyles.selectedFalconCard,
//                 isRaceActive && localStyles.disabledCard
//               ]}
//               onPress={() => selectfalconForRace(falcon)}
//               disabled={isRaceActive}
//             >
//               {/* <Image 
//                 source={{ uri: falcon.imagePath }} 
//                 style={localStyles.selectionfalconImage}
//                 defaultSource={require('./assets/falconplaceholder.png')}
//               /> */}
//               <View style={localStyles.selectionfalconInfo}>
//                 <Text style={localStyles.selectionfalconName}>{falcon.falconName}</Text>
//                 <Text style={localStyles.selectionfalconBreed}>{falcon.breed}</Text>
//                 <Text style={localStyles.selectionfalconWeight}>{falcon.weight}</Text>
//                 <View style={[
//                   localStyles.statusBadge,
//                   { backgroundColor: getStatusColor(falcon.status) }
//                 ]}>
//                   <Text style={localStyles.statusBadgeText}>
//                     {falcon.status.toUpperCase()}
//                   </Text>
//                 </View>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </ScrollView>
//     </View>
//   );

//   const RaceResults = () => (
//     <View style={localStyles.resultsSection}>
//       <Text style={localStyles.sectionTitle}>RACE RESULTS</Text>
//       {raceResults.length === 0 ? (
//         <Text style={localStyles.noResults}>No races completed yet</Text>
//       ) : (
//         <View style={localStyles.resultsList}>
//           {raceResults
//             .sort((a, b) => a.time - b.time)
//             .map((result, index) => (
//               <View key={index} style={localStyles.resultItem}>
//                 <View style={localStyles.resultPosition}>
//                   <Text style={localStyles.positionRank}>#{index + 1}</Text>
//                 </View>
//                 <View style={localStyles.resultInfo}>
//                   <Text style={localStyles.resultfalconName}>{result.falconName}</Text>
//                   <Text style={localStyles.resultDetails}>
//                     {result.distance} • {new Date(result.timestamp).toLocaleTimeString()}
//                   </Text>
//                 </View>
//                 <View style={localStyles.resultTime}>
//                   <Text style={localStyles.timeText}>{result.time}s</Text>
//                   <Text style={localStyles.timeLabel}>Time</Text>
//                 </View>
//               </View>
//             ))
//           }
//         </View>
//       )}
//     </View>
//   );

//   const DeviceStatus = () => (
//     <View style={localStyles.deviceStatusSection}>
//       <Text style={localStyles.sectionTitle}>LORA DEVICE NETWORK</Text>
//       <Text style={localStyles.deviceSubtitle}>Mesh Network - Real-time Tracking</Text>
//       <View style={localStyles.deviceGrid}>
//         {trackDevices.map(device => (
//           <View key={device.id} style={localStyles.deviceStatusItem}>
//             <View style={localStyles.deviceHeader}>
//               <Text style={localStyles.deviceName}>{device.name}</Text>
//               <View style={[
//                 localStyles.statusDot, 
//                 { backgroundColor: getStatusColor(device.status) }
//               ]} />
//             </View>
//             <Text style={localStyles.deviceType}>{device.type.toUpperCase()}</Text>
//             <Text style={localStyles.deviceDistance}>{device.distanceFromStart}</Text>
//             <Text style={localStyles.deviceStatus}>{device.status}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );

//   return (
//     <View style={styles.screen}>
//       <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
      
//       <ScrollView showsVerticalScrollIndicator={false}>
//         {/* Race Overview */}
//         <RaceOverview />

//         {/* falcon Selection */}
//         <falconSelection />

//         {/* Track Map */}
//         <TrackMap />

//         {/* Race Results */}
//         <RaceResults />

//         {/* Device Status */}
//         <DeviceStatus />

//         {/* Quick Actions */}
//         <View style={localStyles.quickActions}>
//           <TouchableOpacity 
//             style={localStyles.quickButton}
//             onPress={stopRace}
//             disabled={!isRaceActive}
//           >
//             <Text style={localStyles.quickButtonText}>EMERGENCY STOP</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={localStyles.quickButton}>
//             <Text style={localStyles.quickButtonText}>SAVE DATA</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={localStyles.quickButton}>
//             <Text style={localStyles.quickButtonText}>EXPORT REPORT</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// const localStyles = StyleSheet.create({
//   raceOverview: {
//     backgroundColor: COLORS.warmStone,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 18,
//     color: COLORS.charcoal,
//     marginBottom: 12,
//   },
//   selectedFalconInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.desertSand,
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 16,
//   },
//   falconImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     marginRight: 12,
//   },
//   selectedFalconDetails: {
//     flex: 1,
//   },
//   selectedFalconName: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 18,
//     color: COLORS.charcoal,
//     marginBottom: 4,
//   },
//   selectedFalconBreed: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal + '80',
//     marginBottom: 2,
//   },
//   deviceId: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.cobaltBlue,
//   },
//   nofalconSelected: {
//     fontFamily: FONTS.montserratItalic,
//     fontSize: 14,
//     color: COLORS.charcoal + '60',
//     textAlign: 'center',
//     padding: 20,
//   },
//   raceInfo: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   raceMainInfo: {
//     flex: 1,
//   },
//   raceName: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 20,
//     color: COLORS.charcoal,
//     marginBottom: 4,
//   },
//   raceDetails: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal + '80',
//   },
//   raceTimer: {
//     alignItems: 'center',
//   },
//   timerText: {
//     fontFamily: FONTS.orbitronBold,
//     fontSize: 24,
//     color: COLORS.cobaltBlue,
//   },
//   timerLabel: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.charcoal + '80',
//   },
//   raceControls: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   controlButton: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   startButton: {
//     backgroundColor: COLORS.oasisGreen,
//   },
//   stopButton: {
//     backgroundColor: COLORS.terracotta,
//   },
//   disabledButton: {
//     backgroundColor: COLORS.offlineGray,
//     opacity: 0.6,
//   },
//   controlButtonText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 14,
//     color: COLORS.desertSand,
//   },
//   falconSelectionSection: {
//     backgroundColor: COLORS.warmStone,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//   },
//   falconSelectionList: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   falconSelectionCard: {
//     width: 140,
//     backgroundColor: COLORS.desertSand,
//     borderRadius: 8,
//     padding: 12,
//     borderWidth: 2,
//     borderColor: 'transparent',
//   },
//   selectedFalconCard: {
//     borderColor: COLORS.cobaltBlue,
//   },
//   disabledCard: {
//     opacity: 0.6,
//   },
//   selectionfalconImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     alignSelf: 'center',
//     marginBottom: 8,
//   },
//   selectionfalconInfo: {
//     alignItems: 'center',
//   },
//   selectionfalconName: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 14,
//     color: COLORS.charcoal,
//     textAlign: 'center',
//     marginBottom: 2,
//   },
//   selectionfalconBreed: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.charcoal + '80',
//     textAlign: 'center',
//     marginBottom: 2,
//   },
//   selectionfalconWeight: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 11,
//     color: COLORS.charcoal + '60',
//     textAlign: 'center',
//     marginBottom: 6,
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 10,
//   },
//   statusBadgeText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 10,
//     color: COLORS.desertSand,
//   },
//   trackSection: {
//     backgroundColor: COLORS.warmStone,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//   },
//   trackContainer: {
//     backgroundColor: COLORS.desertSand,
//     borderRadius: 8,
//     overflow: 'hidden',
//     padding: 16,
//   },
//   straightTrack: {
//     height: 120,
//     marginBottom: 16,
//   },
//   trackLine: {
//     position: 'absolute',
//     top: 30,
//     left: 20,
//     right: 20,
//     height: 4,
//     backgroundColor: COLORS.charcoal + '40',
//     borderRadius: 2,
//   },
//   trackDevice: {
//     position: 'absolute',
//     top: 20,
//     alignItems: 'center',
//   },
//   deviceDot: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     marginBottom: 4,
//     borderWidth: 2,
//     borderColor: COLORS.desertSand,
//   },
//   deviceLabel: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 10,
//     color: COLORS.charcoal,
//     textAlign: 'center',
//   },
//   deviceDistance: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 8,
//     color: COLORS.charcoal + '60',
//     textAlign: 'center',
//   },
//   falconMarker: {
//     position: 'absolute',
//     top: 10,
//     width: 60,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: COLORS.desertSand,
//   },
//   falconMarkerText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 10,
//     color: COLORS.desertSand,
//     textAlign: 'center',
//   },
//   positionInfo: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   positionText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 14,
//     color: COLORS.charcoal,
//   },
//   speedText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.cobaltBlue,
//   },
//   resultsSection: {
//     backgroundColor: COLORS.warmStone,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//   },
//   noResults: {
//     fontFamily: FONTS.montserratItalic,
//     fontSize: 14,
//     color: COLORS.charcoal + '60',
//     textAlign: 'center',
//     padding: 20,
//   },
//   resultsList: {
//     gap: 8,
//   },
//   resultItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.desertSand,
//     padding: 12,
//     borderRadius: 8,
//   },
//   resultPosition: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: COLORS.cobaltBlue,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   positionRank: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.desertSand,
//   },
//   resultInfo: {
//     flex: 1,
//   },
//   resultfalconName: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.charcoal,
//     marginBottom: 2,
//   },
//   resultDetails: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.charcoal + '80',
//   },
//   resultTime: {
//     alignItems: 'flex-end',
//   },
//   timeText: {
//     fontFamily: FONTS.orbitronBold,
//     fontSize: 18,
//     color: COLORS.cobaltBlue,
//   },
//   timeLabel: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 10,
//     color: COLORS.charcoal + '80',
//   },
//   deviceStatusSection: {
//     backgroundColor: COLORS.warmStone,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//   },
//   deviceSubtitle: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.charcoal + '80',
//     marginBottom: 12,
//   },
//   deviceGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   deviceStatusItem: {
//     width: '48%',
//     backgroundColor: COLORS.desertSand,
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 8,
//   },
//   deviceHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   deviceName: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 14,
//     color: COLORS.charcoal,
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//   },
//   deviceType: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 10,
//     color: COLORS.charcoal + '60',
//     marginBottom: 4,
//   },
//   deviceStatus: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 12,
//     color: COLORS.charcoal,
//   },
//   quickActions: {
//     flexDirection: 'row',
//     gap: 8,
//     marginBottom: 24,
//   },
//   quickButton: {
//     flex: 1,
//     backgroundColor: COLORS.terracotta,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   quickButtonText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 12,
//     color: COLORS.desertSand,
//     textAlign: 'center',
//   },
// });

// export default RaceControlScreen;
/////////////////////////////////

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   Dimensions,
//   StatusBar,
//   Alert,
//   StyleSheet,
//   Image
// } from 'react-native';
// import { COLORS, FONTS, styles } from './theme';
// import realm from '../db/FalconRegistration'; // Import your Realm instance

// const { width } = Dimensions.get('window');

// const RaceControlScreen = () => {
//   const [selectedFalcon, setselectedFalcon] = useState(null);
//   const [raceTime, setRaceTime] = useState(0);
//   const [isRaceActive, setIsRaceActive] = useState(false);
//   const [raceResults, setRaceResults] = useState([]);
//   const [currentPosition, setCurrentPosition] = useState(0);
//   const [falcons, setFalcons] = useState([]);

//   // Load falcons from Realm database
//   useEffect(() => {
//     const loadfalconsFromRealm = () => {
//       try {
//         const falconsFromRealm = realm.objects('FalconRegistration');
//         const falconsWithStatus = falconsFromRealm.map(falcon => ({
//           id: falcon.id,
//           animalId: falcon.animalId,
//           falconName: falcon.falconName,
//           breed: falcon.breed,
//           weight: falcon.weight,
//           dateOfBirth: falcon.dateOfBirth,
//           sex: falcon.sex,
//           spayedNeutered: falcon.spayedNeutered,
//           distinguishingMarks: falcon.distinguishingMarks,
//           medicalNotes: falcon.medicalNotes,
//           imagePath: falcon.imagePath,
//           status: 'ready', // Add default status for racing
//           createdAt: falcon.createdAt
//         }));
//         setFalcons(falconsWithStatus);
//       } catch (error) {
//         console.error('Error loading falcons from Realm:', error);
//         Alert.alert('Error', 'Could not load registered falcons');
//       }
//     };

//     loadfalconsFromRealm();

//     // Optional: Add Realm listener for real-time updates
//     const falconsCollection = realm.objects('FalconRegistration');
//     falconsCollection.addListener(() => {
//       loadfalconsFromRealm();
//     });

//     return () => {
//       falconsCollection.removeAllListeners();
//     };
//   }, []);
import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { COLORS, FONTS, styles } from './theme';
import realm from '../db/database';
import ExportService from '../services/ExportService';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import uuid from 'react-native-uuid';
import { useBle } from '../src/ble/BleProvider';
import { useRace } from '../src/context/RaceContext';

const { width } = Dimensions.get('window');

const RaceControlScreen = () => {
  const { write, connectedDevice } = useBle();
  const { state: raceState, dispatch } = useRace();
  const [falcons, setFalcons] = useState([]);
  const [raceResults, setRaceResults] = useState([]); // Persisted historical results
  const [checkpoints, setCheckpoints] = useState([]); // Derived per-race from detections

  // Load falcons and race results from Realm
  React.useEffect(() => {
    const loadDataFromRealm = () => {
      try {
        const falconsFromRealm = realm.objects('FalconRegistration');
        const falconsWithStatus = falconsFromRealm.map(f => ({
          ...f,
          status: raceState.status.race_active && raceState.selectedFalcon?.animalId === f.animalId ? 'racing' : 'ready'
        }));
        setFalcons(Array.from(falconsWithStatus));
        const results = realm.objects('RaceResults').sorted('raceDate', true);
        setRaceResults(Array.from(results));
      } catch (e) {
        console.error('RaceControl loadData error', e);
      }
    };
    loadDataFromRealm();
    const falcCollection = realm.objects('FalconRegistration');
    const resCollection = realm.objects('RaceResults');
    falcCollection.addListener(loadDataFromRealm);
    resCollection.addListener(loadDataFromRealm);
    return () => {
      falcCollection.removeAllListeners();
      resCollection.removeAllListeners();
    };
  }, [raceState.status.race_active, raceState.selectedFalcon]);

  // Send command to BLE device
  const sendCommand = async (command) => {
    if (!connectedDevice) {
      Alert.alert('Not Connected', 'Please connect to the Master board first from Dashboard');
      return false;
    }
    try {
      const commandData = JSON.stringify({
        type: 'command',
        command: command
      });
      const success = await write(commandData);
      if (success) {
        console.log(`Command sent: ${command}`);
      }
      return success;
    } catch (error) {
      console.error('Send command error:', error);
      Alert.alert('Command Failed', 'Failed to send command to device');
      return false;
    }
  };

  // Build checkpoints from detection stream relative to race start
  const derivedCheckpoints = useMemo(() => {
    if (!raceState.currentRace?.startTimeMs) return [];
    const startMs = raceState.currentRace.startTimeMs;
    // Filter detections belonging to this race
    const raceDetections = raceState.currentRace.detections || [];
    // Map each detection to a checkpoint-like entry (node crossing)
    return raceDetections.slice().reverse().map(d => {
      const tsMs = d.ts_iso ? Date.parse(d.ts_iso) : Date.now();
      const elapsed = (tsMs - startMs) / 1000;
      return {
        id: `${tsMs}_${d.nodeId}`,
        nodeId: d.nodeId,
        type: d.type,
        splitTime: elapsed,
        timestamp: tsMs,
      };
    });
  }, [raceState.currentRace]);

  // Static track metadata (remove simulated movement; used for distance reference only)
  const trackDevices = useMemo(() => ([
    { id: 'gate-1', name: 'Start Gate', type: 'gate', position: 0 },
    { id: 'sensor-1', name: 'Checkpoint 1', type: 'sensor', position: 100 },
    { id: 'sensor-2', name: 'Checkpoint 2', type: 'sensor', position: 200 },
    { id: 'sensor-3', name: 'Checkpoint 3', type: 'sensor', position: 300 },
    { id: 'finish', name: 'Finish', type: 'sensor', position: 400 },
  ]), []);

  const currentRaceCfg = { distance: '400m', trackLength: 400 };

  // Derived race time from context
  const derivedRaceSeconds = useMemo(() => {
    const cr = raceState.currentRace;
    if (!cr?.startTimeMs) return 0;
    const endMs = cr.status === 'stopped' && cr.endTime ? cr.endTime : Date.now();
    return ((endMs - cr.startTimeMs) / 1000).toFixed(1);
  }, [raceState.currentRace]);

  const startRace = async () => {
    if (!raceState.selectedFalcon) {
      Alert.alert('No Falcon Selected', 'Select a falcon first');
      return;
    }
    const success = await sendCommand('START');
    if (!success) return;
    dispatch({
      type: 'START_RACE',
      payload: {
        id: `${Date.now()}`,
        falcon: raceState.selectedFalcon,
        startTimeMs: Date.now(),
      },
    });
    setCheckpoints([]); // reset local derived list
    Alert.alert('Race Started', `Falcon: ${raceState.selectedFalcon.falconName}`);
  };

  // const finishRace = async () => {
  //   setIsRaceActive(false);
    
  //   const result = {
  //     falconId: selectedFalcon.id,
  //     animalId: selectedFalcon.animalId,
  //     falconName: selectedFalcon.falconName,
  //     time: raceTime,
  //     distance: currentRace.distance,
  //     timestamp: new Date().toISOString()
  //   };

  //   setRaceResults(prev => [...prev, result]);
    
  //   // Update falcon status
  //   setFalcons(prev => prev.map(falcon => 
  //     falcon.id === selectedFalcon.id 
  //       ? { ...falcon, status: 'finished' }
  //       : falcon
  //   ));

  //   Alert.alert(
  //     'Race Completed', 
  //     `${selectedFalcon.falconName} finished in ${raceTime} seconds!`
  //   );
  // };
  const finishRace = async () => {
    const success = await sendCommand('STOP');
    if (!success) {
      Alert.alert('Warning', 'STOP command failed; ending locally');
    }
    dispatch({ type: 'STOP_RACE' });
    // Build result using currentRace & detections
    const cr = raceState.currentRace;
    if (!cr) return;
    const endMs = Date.now();
    const duration = (endMs - cr.startTimeMs) / 1000;
    const result = {
      id: uuid.v4(),
      animalId: cr.falcon?.animalId,
      falconName: cr.falcon?.falconName,
      breed: cr.falcon?.breed,
      weight: cr.falcon?.weight,
      raceDistance: currentRaceCfg.distance,
      trackLength: currentRaceCfg.trackLength,
      completionTime: duration.toFixed(2),
      averageSpeed: currentRaceCfg.trackLength / Math.max(duration, 0.001),
      maxSpeed: 0, // Placeholder until speed telemetry integrated
      raceDate: new Date(),
      checkpoints: derivedCheckpoints,
      weatherConditions: 'Normal',
      trackConditions: 'Good',
      notes: '',
      exported: false,
      createdAt: new Date(),
    };
    saveRaceResult(result);
    Alert.alert('Race Completed', `${cr.falcon?.falconName || 'Falcon'} time ${duration.toFixed(2)}s`);
  };
  const saveRaceResult = (result) => {
    try {
      realm.write(() => {
        // Save main race result
        const savedRace = realm.create('RaceResults', result);
        
        // Save checkpoints with race reference
        result.checkpoints.forEach(checkpoint => {
          realm.create('Checkpoint', {
            ...checkpoint,
            raceId: savedRace.id
          });
        });
      });
      
      console.log('Race result saved successfully');
    } catch (error) {
      console.error('Error saving race result:', error);
      Alert.alert('Error', 'Could not save race result locally');
    }
  };


  const stopRace = async () => { await finishRace(); };

  const selectFalconForRace = (falcon) => {
    if (raceState.status.race_active) {
      Alert.alert('Race Active', 'Cannot change falcon during an active race');
      return;
    }
    dispatch({ type: 'SELECT_FALCON', payload: falcon });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return COLORS.successGreen;
      case 'racing': return COLORS.cobaltBlue;
      case 'finished': return COLORS.oasisGreen;
      case 'inactive': return COLORS.offlineGray;
      default: return COLORS.warningYellow;
    }
  };

   const handleSaveData = () => {
    const totalRaces = realm.objects('RaceResults').length;
    Alert.alert(
      'Data Saved', 
      `All race data is stored locally.\n\nTotal races recorded: ${totalRaces}\n\nUse "EXPORT REPORT" to generate detailed reports.`
    );
  };

  const handleExportReport = async () => {
    try {
      if (raceResults.length === 0) {
        Alert.alert('No Data', 'No race results to export');
        return;
      }

      Alert.alert(
        'Export Report',
        'Choose export format:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'JSON', 
            onPress: () => exportReport('json')
          },
          { 
            text: 'CSV', 
            onPress: () => exportReport('csv')
          },
          { 
            text: 'TXT', 
            onPress: () => exportReport('txt')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const exportReport = async (format) => {
    try {
      const result = await ExportService.exportRaceData(raceResults, format);
      
      if (result.success) {
        // Share the file
        await Share.open({
          url: `file://${result.filePath}`,
          type: format === 'csv' ? 'text/csv' : format === 'txt' ? 'text/plain' : 'application/json',
          filename: result.fileName,
          subject: `Race Results Report - ${new Date().toLocaleDateString()}`,
          message: `Falcon Racing Performance Report - ${raceResults.length} races`
        });

        Alert.alert('Success', 'Report exported successfully!');
      } else {
        Alert.alert('Export Error', result.error);
      }
    } catch (error) {
      if (error.message !== 'User did not share') {
        Alert.alert('Export Error', 'Failed to export report');
      }
    }
  };

  const RaceOverview = () => (
    <View style={localStyles.raceOverview}>
      {/* Selected falcon Info */}
      {raceState && raceState.selectedFalcon ? (
        <View style={localStyles.selectedFalconInfo}>
          {raceState.selectedFalcon.imagePath ? (
            <Image 
              source={{ uri: raceState.selectedFalcon.imagePath }} 
              style={localStyles.falconImage}
              defaultSource={require('../assets/falconplaceholder.png')}
            />
          ) : (
            <View style={localStyles.falconImagePlaceholder}>
              <Text style={localStyles.placeholderText}>🦅</Text>
            </View>
          )}
          <View style={localStyles.selectedFalconDetails}>
            <Text style={localStyles.selectedFalconName}>{raceState.selectedFalcon.falconName ?? '-'}</Text>
          </View>
          <View style={localStyles.raceTimer}>
            <Text style={localStyles.timerText}>{derivedRaceSeconds}s</Text>
            <Text style={localStyles.timerLabel}>TIME</Text>
          </View>
        </View>
      ) : (
        <Text style={localStyles.nofalconSelected}>No falcon selected for race</Text>
      )}

      <View style={localStyles.raceControls}>
        <TouchableOpacity 
          style={[
            localStyles.controlButton, 
            localStyles.startButton,
            (!connectedDevice || !(raceState && raceState.selectedFalcon)) && localStyles.disabledButton
          ]}
          onPress={startRace}
          disabled={raceState.status.race_active || !connectedDevice || !(raceState && raceState.selectedFalcon)}
        >
          <Text style={localStyles.controlButtonText}>
            {raceState.status.race_active ? 'RACE IN PROGRESS' : 'START RACE'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            localStyles.controlButton, 
            localStyles.stopButton,
            (!connectedDevice || !raceState.status.race_active) && localStyles.disabledButton
          ]}
          onPress={stopRace}
          disabled={!connectedDevice || !raceState.status.race_active}
        >
          <Text style={localStyles.controlButtonText}>STOP RACE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const FalconSelection = () => (
    <View style={localStyles.falconSelectionSection}>
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
                  raceState.selectedFalcon?.id === falcon.id && localStyles.selectedFalconCard,
                  raceState.status.race_active && localStyles.disabledCard
                ]}
                onPress={() => selectFalconForRace(falcon)}
                disabled={raceState.status.race_active}
              >
                {falcon.imagePath ? (
                  <Image 
                    source={{ uri: falcon.imagePath }} 
                    style={localStyles.selectionfalconImage}
                    defaultSource={require('../assets/falconplaceholder.png')}
                  />
                ) : (
                  <View style={localStyles.selectionImagePlaceholder}>
                    <Text style={localStyles.placeholderTextSmall}>🦅</Text>
                  </View>
                )}
                <Text style={localStyles.selectionfalconName} numberOfLines={2}>{falcon.falconName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const DetectionTimeline = () => (
    <View style={localStyles.trackSection}>
      <Text style={localStyles.sectionTitle}>DETECTION TIMELINE</Text>
      {raceState.currentRace && derivedCheckpoints.length === 0 && (
        <Text style={localStyles.nofalconsAvailable}>No detections yet</Text>
      )}
      {derivedCheckpoints.length > 0 && (
        <View style={{ gap: 8 }}>
          {derivedCheckpoints.map(cp => (
            <View key={cp.id} style={localStyles.resultItem}>
              <View style={localStyles.resultPosition}>
                <Text style={localStyles.positionRank}>{cp.splitTime.toFixed ? cp.splitTime.toFixed(1) : cp.splitTime}s</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={localStyles.resultfalconName}>Node {cp.nodeId}</Text>
                <Text style={localStyles.resultDetails}>{new Date(cp.timestamp).toLocaleTimeString()}</Text>
              </View>
              <View style={localStyles.resultTime}>
                <Text style={localStyles.timeLabel}>{cp.type}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const RaceResults = () => (
    <View style={localStyles.resultsSection}>
      <Text style={localStyles.sectionTitle}>RACE RESULTS</Text>
      {raceResults.length === 0 ? (
        <Text style={localStyles.noResults}>No races completed yet</Text>
      ) : (
        <View style={localStyles.resultsList}>
          {raceResults
            .sort((a, b) => parseFloat(a.completionTime) - parseFloat(b.completionTime))
            .map((result, index) => (
              <View key={index} style={localStyles.resultItem}>
                <View style={localStyles.resultPosition}>
                  <Text style={localStyles.positionRank}>#{index + 1}</Text>
                </View>
                <View style={localStyles.resultInfo}>
                  <Text style={localStyles.resultfalconName}>{result.falconName}</Text>
                  <Text style={localStyles.resultAnimalId}>ID: {result.animalId}</Text>
                  <Text style={localStyles.resultDetails}>
                    {result.raceDistance} • {new Date(result.raceDate).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={localStyles.resultTime}>
                  <Text style={localStyles.timeText}>{result.completionTime}s</Text>
                  <Text style={localStyles.timeLabel}>Time</Text>
                </View>
              </View>
            ))
          }
        </View>
      )}
    </View>
  );

  const DeviceStatus = () => (
    <View style={localStyles.deviceStatusSection}>
      <Text style={localStyles.sectionTitle}>LORA DEVICE NETWORK</Text>
      <Text style={localStyles.deviceSubtitle}>Mesh Network - Real-time Tracking</Text>
      <View style={localStyles.deviceGrid}>
        {Object.values(raceState.nodes).length === 0 && (
          <Text style={localStyles.deviceStatus}>No nodes detected yet</Text>
        )}
        {Object.values(raceState.nodes).map(node => (
          <View key={node.id} style={localStyles.deviceStatusItem}>
            <View style={localStyles.deviceHeader}>
              <Text style={localStyles.deviceName}>Node {node.id}</Text>
              <View style={[
                localStyles.statusDot, 
                { backgroundColor: node.cameraPresent ? COLORS.successGreen : COLORS.offlineGray }
              ]} />
            </View>
            <Text style={localStyles.deviceType}>CAMERA: {node.cameraPresent ? 'YES' : 'NO'}</Text>
            <Text style={localStyles.deviceDistance}>RSSI: {node.rssi ?? 'N/A'}</Text>
            <Text style={localStyles.deviceStatus}>Last Seen: {node.lastSeen ? new Date(node.lastSeen).toLocaleTimeString() : '-'}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const QuickActions = () => (
    <View style={localStyles.quickActions}>
      <TouchableOpacity 
        style={[
          localStyles.quickButton,
          !raceState.status.race_active && localStyles.disabledButton
        ]}
        onPress={stopRace}
        disabled={!raceState.status.race_active}
      >
        <Text style={localStyles.quickButtonText}>EMERGENCY STOP</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={localStyles.quickButton}
        onPress={handleSaveData}
      >
        <Text style={localStyles.quickButtonText}>SAVE DATA</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          localStyles.quickButton,
          raceResults.length === 0 && localStyles.disabledButton
        ]}
        onPress={handleExportReport}
        disabled={raceResults.length === 0}
      >
        <Text style={localStyles.quickButtonText}>EXPORT REPORT</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Race Overview */}
        <RaceOverview />

        {/* falcon Selection */}
        <FalconSelection />

        {/* Detection Timeline */}
        <DetectionTimeline />

        {/* Race Results */}
        <RaceResults />

        {/* Quick Actions */}
             <QuickActions />

      </ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  raceOverview: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 20,
    color: COLORS.cobaltBlue,
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  selectedFalconInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cobaltBlue + '20',
  },
  falconImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.cobaltBlue,
  },
  falconImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cobaltBlue + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.cobaltBlue,
  },
  placeholderText: {
    fontSize: 24,
  },
  selectedFalconDetails: {
    flex: 1,
  },
  selectedFalconName: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 18,
    color: COLORS.charcoal,
    letterSpacing: 0.5,
  },
  nofalconSelected: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.terracotta,
    textAlign: 'center',
    padding: 24,
    backgroundColor: COLORS.terracotta + '10',
    borderRadius: 10,
  },
  nofalconsAvailable: {
    fontFamily: FONTS.montserratBold,
    fontSize: 15,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  raceTimer: {
    alignItems: 'center',
    backgroundColor: COLORS.cobaltBlue + '12',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.cobaltBlue + '40',
    minWidth: 100,
  },
  timerText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 32,
    color: COLORS.cobaltBlue,
    letterSpacing: 1,
  },
  timerLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 11,
    color: COLORS.cobaltBlue,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.successGreen + '30',
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  connectionText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 13,
    color: COLORS.charcoal,
    flex: 1,
  },
  raceControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  startButton: {
    backgroundColor: COLORS.oasisGreen,
  },
  stopButton: {
    backgroundColor: COLORS.terracotta,
  },
  disabledButton: {
    backgroundColor: '#D0D0D0',
    opacity: 0.5,
  },
  controlButtonText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  falconSelectionSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  falconSelectionList: {
    flexDirection: 'row',
    gap: 12,
  },
  falconSelectionCard: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  selectedFalconCard: {
    borderColor: COLORS.cobaltBlue,
    backgroundColor: '#FFFFFF',
    shadowColor: COLORS.cobaltBlue,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    transform: [{ scale: 1.02 }],
    borderWidth: 3,
  },
  disabledCard: {
    opacity: 0.5,
  },
  selectionfalconImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.cobaltBlue + '50',
  },
  selectionImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.cobaltBlue + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.cobaltBlue + '60',
  },
  placeholderTextSmall: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: COLORS.cobaltBlue,
  },
  selectionfalconInfo: {
    alignItems: 'center',
  },
  selectionfalconName: {
    fontFamily: FONTS.montserratBold,
    fontSize: 13,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 6,
    numberOfLines: 2,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  statusBadgeText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  trackSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  trackContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 20,
  },
  straightTrack: {
    height: 120,
    marginBottom: 16,
  },
  trackLine: {
    position: 'absolute',
    top: 30,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: COLORS.charcoal + '40',
    borderRadius: 2,
  },
  trackDevice: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
  },
  deviceDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  deviceLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: COLORS.charcoal,
    textAlign: 'center',
  },
  deviceDistance: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 8,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
  },
  falconMarker: {
    position: 'absolute',
    top: 10,
    width: 60,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  falconMarkerText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  positionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  positionText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  speedText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.cobaltBlue,
  },
  resultsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  noResults: {
    fontFamily: FONTS.montserratBold,
    fontSize: 15,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
    padding: 24,
    fontStyle: 'italic',
  },
  resultsList: {
    gap: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.oasisGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  resultPosition: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cobaltBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: COLORS.cobaltBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  positionRank: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  resultInfo: {
    flex: 1,
  },
  resultfalconName: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 17,
    color: COLORS.charcoal,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  resultAnimalId: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.cobaltBlue,
    marginBottom: 4,
  },
  resultDetails: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.charcoal + 'AA',
  },
  resultTime: {
    alignItems: 'flex-end',
    backgroundColor: COLORS.oasisGreen + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  timeText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 22,
    color: COLORS.oasisGreen,
    letterSpacing: 0.5,
  },
  timeLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: COLORS.oasisGreen,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  deviceStatusSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  deviceSubtitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 13,
    color: COLORS.charcoal + 'AA',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  deviceStatusItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cobaltBlue + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deviceName: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 15,
    color: COLORS.charcoal,
    letterSpacing: 0.3,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceType: {
    fontFamily: FONTS.montserratBold,
    fontSize: 11,
    color: COLORS.cobaltBlue,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceStatus: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.charcoal + 'CC',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  quickButton: {
    flex: 1,
    backgroundColor: COLORS.terracotta,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  quickButtonText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

export default RaceControlScreen;