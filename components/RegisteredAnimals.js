// // import React, { useState, useEffect, useMemo } from 'react';
// // import {
// //   View,
// //   Text,
// //   TextInput,
// //   ScrollView,
// //   TouchableOpacity,
// //   Image,
// //   StyleSheet,
// //   Animated,
// //   Platform,
// //   RefreshControl,
// // } from 'react-native';
// // import Icon from 'react-native-vector-icons/MaterialIcons';
// // import { COLORS, FONTS } from './theme';
// // import realm from '../db/FalconRegistration';

// // const RegisteredAnimalsScreen = () => {
// //   const [falcons, setfalcons] = useState([]);
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [refreshing, setRefreshing] = useState(false);
// //   const [selectedFilter, setSelectedFilter] = useState('all');
// //   const [sortBy, setSortBy] = useState('name');

// //   // Animation values
// //   const fadeAnim = useState(new Animated.Value(0))[0];
// //   const scaleAnim = useState(new Animated.Value(0.9))[0];

// //   useEffect(() => {
// //     loadfalcons();
// //     startAnimations();
// //   }, []);

// //   const startAnimations = () => {
// //     Animated.parallel([
// //       Animated.timing(fadeAnim, {
// //         toValue: 1,
// //         duration: 600,
// //         useNativeDriver: true,
// //       }),
// //       Animated.timing(scaleAnim, {
// //         toValue: 1,
// //         duration: 500,
// //         useNativeDriver: true,
// //       }),
// //     ]).start();
// //   };

// //   const loadfalcons = () => {
// //     const allfalcons = realm.objects('FalconRegistration').sorted('createdAt', true);
// //     setfalcons(Array.from(allfalcons));
// //   };

// //   const onRefresh = () => {
// //     setRefreshing(true);
// //     loadfalcons();
// //     setTimeout(() => setRefreshing(false), 1000);
// //   };

// //   // Filter and search falcons
// //   const filteredfalcons = useMemo(() => {
// //     let filtered = falcons.filter(falcon => {
// //       const matchesSearch = 
// //         falcon.falconName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //         falcon.animalId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //         falcon.breed?.toLowerCase().includes(searchQuery.toLowerCase());

// //       if (!matchesSearch) return false;

// //       switch (selectedFilter) {
// //         case 'male':
// //           return falcon.sex === 'Male';
// //         case 'female':
// //           return falcon.sex === 'Female';
// //         case 'trained':
// //           return falcon.trainingLevel !== 'Beginner';
// //         case 'synced':
// //           return falcon.synced === true;
// //         default:
// //           return true;
// //       }
// //     });

// //     // Sort falcons
// //     switch (sortBy) {
// //       case 'name':
// //         filtered.sort((a, b) => a.falconName?.localeCompare(b.falconName));
// //         break;
// //       case 'recent':
// //         filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
// //         break;
// //       case 'training':
// //         const trainingOrder = { 'Advanced': 3, 'Intermediate': 2, 'Beginner': 1 };
// //         filtered.sort((a, b) => trainingOrder[b.trainingLevel] - trainingOrder[a.trainingLevel]);
// //         break;
// //       default:
// //         break;
// //     }

// //     return filtered;
// //   }, [falcons, searchQuery, selectedFilter, sortBy]);

// //   const getTrainingLevelColor = (level) => {
// //     switch (level) {
// //       case 'Advanced': return COLORS.oasisGreen;
// //       case 'Intermediate': return COLORS.cobaltBlue;
// //       case 'Beginner': return COLORS.warmStone;
// //       default: return COLORS.charcoal;
// //     }
// //   };

// //   const getSexIcon = (sex) => {
// //     return sex === 'Male' ? 'male' : 'female';
// //   };

// //   const formatDate = (dateString) => {
// //     if (!dateString) return 'N/A';
// //     return dateString;
// //   };

// //   const falconCard = ({ falcon, index }) => (
// //     <Animated.View 
// //       style={[
// //         localStyles.card,
// //         {
// //           opacity: fadeAnim,
// //           transform: [
// //             { scale: scaleAnim },
// //             { translateY: fadeAnim.interpolate({
// //               inputRange: [0, 1],
// //               outputRange: [50, 0]
// //             })}
// //           ]
// //         }
// //       ]}
// //     >
// //       <View style={localStyles.cardHeader}>
// //         <View style={localStyles.nameContainer}>
// //           <Text style={localStyles.falconName} numberOfLines={1}>
// //             {falcon.falconName || 'Unnamed falcon'}
// //           </Text>
// //           <View style={localStyles.sexBadge}>
// //             <Icon 
// //               name={getSexIcon(falcon.sex)} 
// //               size={14} 
// //               color={COLORS.desertSand} 
// //             />
// //           </View>
// //         </View>
// //         <View style={[
// //           localStyles.trainingBadge,
// //           { backgroundColor: getTrainingLevelColor(falcon.trainingLevel) }
// //         ]}>
// //           <Text style={localStyles.trainingText}>
// //             {falcon.trainingLevel || 'Beginner'}
// //           </Text>
// //         </View>
// //       </View>

// //       <View style={localStyles.cardContent}>
// //         {falcon.imagePath ? (
// //           <Image 
// //             source={{ uri: falcon.imagePath }} 
// //             style={localStyles.falconImage}
// //             defaultSource={require('../assets/caninelogo.png')}
// //           />
// //         ) : (
// //           <View style={localStyles.imagePlaceholder}>
// //             <Icon name="pets" size={40} color={COLORS.charcoal + '40'} />
// //           </View>
// //         )}
        
// //         <View style={localStyles.falconDetails}>
// //           <View style={localStyles.detailRow}>
// //             <Icon name="fingerprint" size={16} color={COLORS.charcoal + '60'} />
// //             <Text style={localStyles.detailText}>ID: {falcon.animalId || 'N/A'}</Text>
// //           </View>
          
// //           <View style={localStyles.detailRow}>
// //             <Icon name="nature" size={16} color={COLORS.charcoal + '60'} />
// //             <Text style={localStyles.detailText}>{falcon.breed || 'Breed not specified'}</Text>
// //           </View>
          
// //           <View style={localStyles.detailRow}>
// //             <Icon name="cake" size={16} color={COLORS.charcoal + '60'} />
// //             <Text style={localStyles.detailText}>DOB: {formatDate(falcon.dateOfBirth)}</Text>
// //           </View>
          
// //           <View style={localStyles.detailRow}>
// //             <Icon name="fitness-center" size={16} color={COLORS.charcoal + '60'} />
// //             <Text style={localStyles.detailText}>
// //               {falcon.weight ? `${falcon.weight} kg` : 'Weight not set'}
// //             </Text>
// //           </View>

// //           {falcon.preferredDistance && (
// //             <View style={localStyles.detailRow}>
// //               <Icon name="flag" size={16} color={COLORS.charcoal + '60'} />
// //               <Text style={localStyles.detailText}>Prefers {falcon.preferredDistance}</Text>
// //             </View>
// //           )}
// //         </View>
// //       </View>

// //       {falcon.distinguishingMarks && (
// //         <View style={localStyles.marksContainer}>
// //           <Icon name="visibility" size={14} color={COLORS.charcoal + '60'} />
// //           <Text style={localStyles.marksText} numberOfLines={2}>
// //             {falcon.distinguishingMarks}
// //           </Text>
// //         </View>
// //       )}

// //       <View style={localStyles.cardFooter}>
// //         <View style={localStyles.statusContainer}>
// //           <View style={[
// //             localStyles.syncStatus,
// //             { backgroundColor: falcon.synced ? COLORS.oasisGreen : COLORS.warmStone }
// //           ]}>
// //             <Icon 
// //               name={falcon.synced ? "cloud-done" : "cloud-off"} 
// //               size={12} 
// //               color={COLORS.desertSand} 
// //             />
// //             <Text style={localStyles.syncText}>
// //               {falcon.synced ? 'Synced' : 'Offline'}
// //             </Text>
// //           </View>
          
// //           {falcon.spayedNeutered && (
// //             <View style={localStyles.medicalBadge}>
// //               <Icon name="medical-services" size={12} color={COLORS.desertSand} />
// //               <Text style={localStyles.medicalText}>Sterilized</Text>
// //             </View>
// //           )}
// //         </View>
        
// //         <Text style={localStyles.dateText}>
// //           {falcon.createdAt ? new Date(falcon.createdAt).toLocaleDateString() : 'Unknown date'}
// //         </Text>
// //       </View>
// //     </Animated.View>
// //   );

// //   const FilterButton = ({ label, value, icon }) => (
// //     <TouchableOpacity
// //       style={[
// //         localStyles.filterButton,
// //         selectedFilter === value && localStyles.filterButtonActive
// //       ]}
// //       onPress={() => setSelectedFilter(value)}
// //     >
// //       <Icon 
// //         name={icon} 
// //         size={16} 
// //         color={selectedFilter === value ? COLORS.desertSand : COLORS.charcoal} 
// //       />
// //       <Text style={[
// //         localStyles.filterText,
// //         selectedFilter === value && localStyles.filterTextActive
// //       ]}>
// //         {label}
// //       </Text>
// //     </TouchableOpacity>
// //   );

// //   const SortButton = ({ label, value, icon }) => (
// //     <TouchableOpacity
// //       style={[
// //         localStyles.sortButton,
// //         sortBy === value && localStyles.sortButtonActive
// //       ]}
// //       onPress={() => setSortBy(value)}
// //     >
// //       <Icon 
// //         name={icon} 
// //         size={16} 
// //         color={sortBy === value ? COLORS.desertSand : COLORS.charcoal} 
// //       />
// //       <Text style={[
// //         localStyles.sortText,
// //         sortBy === value && localStyles.sortTextActive
// //       ]}>
// //         {label}
// //       </Text>
// //     </TouchableOpacity>
// //   );

// //   return (
// //     <View style={localStyles.container}>


// //       {/* Search Bar */}
// //       <View style={localStyles.searchContainer}>
// //         <Icon name="search" size={20} color={COLORS.charcoal + '60'} style={localStyles.searchIcon} />
// //         <TextInput
// //           style={localStyles.searchInput}
// //           placeholder="Search by name, ID, or breed..."
// //           placeholderTextColor={COLORS.charcoal + '60'}
// //           value={searchQuery}
// //           onChangeText={setSearchQuery}
// //         />
// //         {searchQuery.length > 0 && (
// //           <TouchableOpacity onPress={() => setSearchQuery('')}>
// //             <Icon name="close" size={20} color={COLORS.charcoal + '60'} />
// //           </TouchableOpacity>
// //         )}
// //       </View>

// //       {/* Filter Row */}
// //       <ScrollView 
// //         horizontal 
// //         showsHorizontalScrollIndicator={false}
// //         style={localStyles.filterContainer}
// //         contentContainerStyle={localStyles.filterContent}
// //       >
// //         <FilterButton label="All" value="all" icon="all-inclusive" />
// //         <FilterButton label="Male" value="male" icon="male" />
// //         <FilterButton label="Female" value="female" icon="female" />
// //         <FilterButton label="Trained" value="trained" icon="school" />
// //         <FilterButton label="Synced" value="synced" icon="cloud-done" />
// //       </ScrollView>

// //       {/* Sort Row */}
 
// //       {/* falcons List */}
// //       <Animated.ScrollView
// //         style={localStyles.scrollView}
// //         showsVerticalScrollIndicator={false}
// //         refreshControl={
// //           <RefreshControl
// //             refreshing={refreshing}
// //             onRefresh={onRefresh}
// //             colors={[COLORS.cobaltBlue]}
// //             tintColor={COLORS.cobaltBlue}
// //           />
// //         }
// //         contentContainerStyle={localStyles.scrollContent}
// //       >
// //         {filteredfalcons.length === 0 ? (
// //           <View style={localStyles.emptyState}>
// //             <Icon name="pets" size={64} color={COLORS.charcoal + '30'} />
// //             <Text style={localStyles.emptyTitle}>
// //               {searchQuery ? 'No falcons found' : 'No falcons registered'}
// //             </Text>
// //             <Text style={localStyles.emptyText}>
// //               {searchQuery 
// //                 ? 'Try adjusting your search or filters'
// //                 : 'Register your first canine to get started'
// //               }
// //             </Text>
// //           </View>
// //         ) : (
// //           filteredfalcons.map((falcon, index) => (
// //             <falconCard key={falcon.id} falcon={falcon} index={index} />
// //           ))
// //         )}
// //       </Animated.ScrollView>
// //     </View>
// //   );
// // };

// // const localStyles = StyleSheet.create({
// //   container: {
// //     backgroundColor: COLORS.desertSand,
// //     height:'100%'
// //   },
// //   header: {
// //     backgroundColor: COLORS.desertSand,
// //     paddingHorizontal: 20,
// //     paddingBottom: 16,
// //     borderBottomWidth: 1,
// //     borderBottomColor: COLORS.charcoal + '15',
// //   },
// //   headerContent: {
// //     marginTop: 10,
// //   },
// //   titleContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 12,
// //     marginBottom: 8,
// //   },
// //   title: {
// //     fontFamily: FONTS.montserratBold,
// //     fontSize: 28,
// //     color: COLORS.charcoal,
// //     letterSpacing: -0.5,
// //   },
// //   subtitle: {
// //     fontFamily: FONTS.montserratMedium,
// //     fontSize: 16,
// //     color: COLORS.charcoal + '70',
// //     marginLeft: 40,
// //   },
// //   searchContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     backgroundColor: COLORS.warmStone,
// //     margin: 20,
// //     marginBottom: 12,
// //     paddingHorizontal: 16,
// //     borderRadius: 12,
// //     borderWidth: 1.5,
// //     borderColor: COLORS.charcoal + '20',
// //   },
// //   searchIcon: {
// //     marginRight: 12,
// //   },
// //   searchInput: {
// //     flex: 1,
// //     paddingVertical: 14,
// //     fontFamily: FONTS.montserratRegular,
// //     fontSize: 16,
// //     color: COLORS.charcoal,
// //   },
// //   filterContainer: {
// //     flex:1,
// //     marginHorizontal: 20,
// //     paddingVertical:10
// //   },
 
// //   filterButton: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 6,
// //     paddingHorizontal: 16,
// //     height:50,
// //     backgroundColor: COLORS.warmStone,
// //     borderRadius: 20,
// //     borderWidth: 1.5,
// //     borderColor: COLORS.charcoal + '20',
// //     marginRight: 8,
// //   },
// //   filterButtonActive: {
// //     backgroundColor: COLORS.cobaltBlue,
// //     borderColor: COLORS.cobaltBlue,
// //   },
// //   filterText: {
// //     fontFamily: FONTS.montserratMedium,
// //     fontSize: 14,
// //     color: COLORS.charcoal,
// //   },
// //   filterTextActive: {
// //     color: COLORS.desertSand,
// //   },
// //   sortContainer: {
// //     marginHorizontal: 20,

   
// //   },

// //   sortButton: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 6,
// //     paddingHorizontal: 16,
// //    paddingBottom:20,
// //     backgroundColor: COLORS.warmStone,
// //     borderRadius: 20,
// //     borderWidth: 1.5,
// //     borderColor: COLORS.charcoal + '20',
// //     marginRight: 8,
// //      height:50
// //   },
// //   sortButtonActive: {
// //     backgroundColor: COLORS.oasisGreen,
// //     borderColor: COLORS.oasisGreen,
// //   },
// //   sortText: {
// //     fontFamily: FONTS.montserratMedium,
// //     fontSize: 14,
// //     color: COLORS.charcoal,
// //   },
// //   sortTextActive: {
// //     color: COLORS.desertSand,
// //   },
 
// //   scrollContent: {
// //     marginTop:20,
// //     paddingHorizontal: 20,
// //     paddingBottom: 30,
// //   },
// //   card: {
// //     backgroundColor: COLORS.warmStone,
// //     borderRadius: 16,
// //     padding: 16,
// //     marginBottom: 16,
// //     borderWidth: 1,
// //     borderColor: COLORS.charcoal + '15',
// //     shadowColor: COLORS.charcoal,
// //     shadowOffset: { width: 0, height: 4 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 12,
// //     elevation: 5,
// //   },
// //   cardHeader: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'flex-start',
// //     marginBottom: 12,
// //   },
// //   nameContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 8,
// //     flex: 1,
// //   },
// //   falconName: {
// //     fontFamily: FONTS.montserratBold,
// //     fontSize: 20,
// //     color: COLORS.charcoal,
// //     flex: 1,
// //   },
// //   sexBadge: {
// //     width: 24,
// //     height: 24,
// //     borderRadius: 12,
// //     backgroundColor: COLORS.cobaltBlue,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   trainingBadge: {
// //     paddingHorizontal: 10,
// //     paddingVertical: 6,
// //     borderRadius: 8,
// //     marginLeft: 8,
// //   },
// //   trainingText: {
// //     fontFamily: FONTS.montserratBold,
// //     fontSize: 12,
// //     color: COLORS.desertSand,
// //     textTransform: 'uppercase',
// //   },
// //   cardContent: {
// //     flexDirection: 'row',
// //     gap: 16,
// //     marginBottom: 12,
// //   },
// //   falconImage: {
// //     width: 80,
// //     height: 80,
// //     borderRadius: 12,
// //     backgroundColor: COLORS.charcoal + '10',
// //   },
// //   imagePlaceholder: {
// //     width: 80,
// //     height: 80,
// //     borderRadius: 12,
// //     backgroundColor: COLORS.charcoal + '10',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   falconDetails: {
// //     flex: 1,
// //     gap: 6,
// //   },
// //   detailRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 8,
// //   },
// //   detailText: {
// //     fontFamily: FONTS.montserratRegular,
// //     fontSize: 14,
// //     color: COLORS.charcoal + '80',
// //     flex: 1,
// //   },
// //   marksContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'flex-start',
// //     gap: 6,
// //     backgroundColor: COLORS.desertSand,
// //     padding: 10,
// //     borderRadius: 8,
// //     marginBottom: 12,
// //   },
// //   marksText: {
// //     fontFamily: FONTS.montserratItalic,
// //     fontSize: 13,
// //     color: COLORS.charcoal + '70',
// //     flex: 1,
// //     fontStyle: 'italic',
// //   },
// //   cardFooter: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //   },
// //   statusContainer: {
// //     flexDirection: 'row',
// //     gap: 8,
// //   },
// //   syncStatus: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 4,
// //     paddingHorizontal: 8,
// //     paddingVertical: 4,
// //     borderRadius: 6,
// //   },
// //   syncText: {
// //     fontFamily: FONTS.montserratMedium,
// //     fontSize: 10,
// //     color: COLORS.desertSand,
// //     textTransform: 'uppercase',
// //   },
// //   medicalBadge: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 4,
// //     paddingHorizontal: 8,
// //     paddingVertical: 4,
// //     borderRadius: 6,
// //     backgroundColor: COLORS.charcoal + '60',
// //   },
// //   medicalText: {
// //     fontFamily: FONTS.montserratMedium,
// //     fontSize: 10,
// //     color: COLORS.desertSand,
// //     textTransform: 'uppercase',
// //   },
// //   dateText: {
// //     fontFamily: FONTS.montserratRegular,
// //     fontSize: 12,
// //     color: COLORS.charcoal + '50',
// //   },
// //   emptyState: {
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     paddingVertical: 80,
// //     paddingHorizontal: 40,
// //   },
// //   emptyTitle: {
// //     fontFamily: FONTS.montserratBold,
// //     fontSize: 20,
// //     color: COLORS.charcoal,
// //     marginTop: 16,
// //     marginBottom: 8,
// //     textAlign: 'center',
// //   },
// //   emptyText: {
// //     fontFamily: FONTS.montserratRegular,
// //     fontSize: 16,
// //     color: COLORS.charcoal + '60',
// //     textAlign: 'center',
// //     lineHeight: 22,
// //   },
// // });

// // export default RegisteredAnimalsScreen;

// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   ScrollView,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   Animated,
//   Platform,
//   RefreshControl,
//   Alert,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { COLORS, FONTS } from './theme';
// import realm from '../db/FalconRegistration';

// const RegisteredAnimalsScreen = () => {
//   const [falcons, setfalcons] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [refreshing, setRefreshing] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState('all');
//   const [sortBy, setSortBy] = useState('name');

//   // Animation values
//   const fadeAnim = useState(new Animated.Value(0))[0];
//   const scaleAnim = useState(new Animated.Value(0.9))[0];

//   useEffect(() => {
//     loadfalcons();
//     startAnimations();
//   }, []);

//   const startAnimations = () => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.timing(scaleAnim, {
//         toValue: 1,
//         duration: 500,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const loadfalcons = () => {
//     try {
//       const allfalcons = realm.objects('FalconRegistration').sorted('createdAt', true);
//       setfalcons(Array.from(allfalcons));
//     } catch (error) {
//       console.error('Error loading falcons:', error);
//       setfalcons([]);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     loadfalcons();
//     setTimeout(() => setRefreshing(false), 1000);
//   };

//   const deletefalcon = (falconId) => {
//     Alert.alert(
//       'Delete falcon',
//       'Are you sure you want to delete this falcon? This action cannot be undone.',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: () => {
//             try {
//               realm.write(() => {
//                 const falconToDelete = realm.objectForPrimaryKey('FalconRegistration', falconId);
//                 if (falconToDelete) {
//                   realm.delete(falconToDelete);
//                   loadfalcons(); // Refresh the list
//                 }
//               });
//             } catch (error) {
//               console.error('Error deleting falcon:', error);
//               Alert.alert('Error', 'Failed to delete falcon. Please try again.');
//             }
//           },
//         },
//       ]
//     );
//   };

//   // Filter and search falcons
//   const filteredfalcons = useMemo(() => {
//     if (!falcons || falcons.length === 0) return [];

//     let filtered = falcons.filter(falcon => {
//       // Safe access to falcon properties
//       const falconName = falcon.falconName || '';
//       const animalId = falcon.animalId || '';
//       const breed = falcon.breed || '';
//       const sex = falcon.sex || '';
//       const trainingLevel = falcon.trainingLevel || 'Beginner';
//       const synced = falcon.synced || false;

//       const matchesSearch = 
//         falconName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         animalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         breed.toLowerCase().includes(searchQuery.toLowerCase());

//       if (!matchesSearch) return false;

//       switch (selectedFilter) {
//         case 'male':
//           return sex === 'Male';
//         case 'female':
//           return sex === 'Female';
//         case 'trained':
//           return trainingLevel !== 'Beginner';
//         case 'synced':
//           return synced === true;
//         default:
//           return true;
//       }
//     });

//     // Sort falcons
//     switch (sortBy) {
//       case 'name':
//         filtered.sort((a, b) => (a.falconName || '').localeCompare(b.falconName || ''));
//         break;
//       case 'recent':
//         filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
//         break;
//       case 'training':
//         const trainingOrder = { 'Advanced': 3, 'Intermediate': 2, 'Beginner': 1 };
//         filtered.sort((a, b) => 
//           (trainingOrder[b.trainingLevel] || 1) - (trainingOrder[a.trainingLevel] || 1)
//         );
//         break;
//       default:
//         break;
//     }

//     return filtered;
//   }, [falcons, searchQuery, selectedFilter, sortBy]);

//   const getTrainingLevelColor = (level) => {
//     switch (level) {
//       case 'Advanced': return COLORS.oasisGreen;
//       case 'Intermediate': return COLORS.cobaltBlue;
//       case 'Beginner': return COLORS.warmStone;
//       default: return COLORS.charcoal;
//     }
//   };

//   const getSexIcon = (sex) => {
//     return sex === 'Male' ? 'male' : 'female';
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     try {
//       return new Date(dateString).toLocaleDateString();
//     } catch (error) {
//       return dateString;
//     }
//   };

//   const falconCard = ({ falcon, index }) => (
//     <Animated.View 
//       style={[
//         localStyles.card,
//         {
//           opacity: fadeAnim,
//           transform: [
//             { scale: scaleAnim },
//             { translateY: fadeAnim.interpolate({
//               inputRange: [0, 1],
//               outputRange: [50, 0]
//             })}
//           ]
//         }
//       ]}
//     >
//       {/* Delete Button */}
//       <TouchableOpacity 
//         style={localStyles.deleteButton}
//         onPress={() => deletefalcon(falcon.id)}
//       >
//         <Icon name="delete-outline" size={20} color={COLORS.charcoal + '60'} />
//       </TouchableOpacity>

//       <View style={localStyles.cardHeader}>
//         <View style={localStyles.nameContainer}>
//           <Text style={localStyles.falconName} numberOfLines={1}>
//             {falcon.falconName || 'Unnamed falcon'}
//           </Text>
//           <View style={localStyles.sexBadge}>
//             <Icon 
//               name={getSexIcon(falcon.sex)} 
//               size={14} 
//               color={COLORS.desertSand} 
//             />
//           </View>
//         </View>
//         <View style={[
//           localStyles.trainingBadge,
//           { backgroundColor: getTrainingLevelColor(falcon.trainingLevel) }
//         ]}>
//           <Text style={localStyles.trainingText}>
//             {falcon.trainingLevel || 'Beginner'}
//           </Text>
//         </View>
//       </View>

//       <View style={localStyles.cardContent}>
//         {falcon.imagePath ? (
//           <Image 
//             source={{ uri: falcon.imagePath }} 
//             style={localStyles.falconImage}
//             defaultSource={require('../assets/caninelogo.png')}
//           />
//         ) : (
//           <View style={localStyles.imagePlaceholder}>
//             <Icon name="pets" size={40} color={COLORS.charcoal + '40'} />
//           </View>
//         )}
        
//         <View style={localStyles.falconDetails}>
//           <View style={localStyles.detailRow}>
//             <Icon name="fingerprint" size={16} color={COLORS.charcoal + '60'} />
//             <Text style={localStyles.detailText}>ID: {falcon.animalId || 'N/A'}</Text>
//           </View>
          
//           <View style={localStyles.detailRow}>
//             <Icon name="nature" size={16} color={COLORS.charcoal + '60'} />
//             <Text style={localStyles.detailText}>{falcon.breed || 'Breed not specified'}</Text>
//           </View>
          
//           <View style={localStyles.detailRow}>
//             <Icon name="cake" size={16} color={COLORS.charcoal + '60'} />
//             <Text style={localStyles.detailText}>DOB: {formatDate(falcon.dateOfBirth)}</Text>
//           </View>
          
//           <View style={localStyles.detailRow}>
//             <Icon name="fitness-center" size={16} color={COLORS.charcoal + '60'} />
//             <Text style={localStyles.detailText}>
//               {falcon.weight ? `${falcon.weight} kg` : 'Weight not set'}
//             </Text>
//           </View>

//           {falcon.preferredDistance && (
//             <View style={localStyles.detailRow}>
//               <Icon name="flag" size={16} color={COLORS.charcoal + '60'} />
//               <Text style={localStyles.detailText}>Prefers {falcon.preferredDistance}</Text>
//             </View>
//           )}
//         </View>
//       </View>

//       {falcon.distinguishingMarks && (
//         <View style={localStyles.marksContainer}>
//           <Icon name="visibility" size={14} color={COLORS.charcoal + '60'} />
//           <Text style={localStyles.marksText} numberOfLines={2}>
//             {falcon.distinguishingMarks}
//           </Text>
//         </View>
//       )}

//       <View style={localStyles.cardFooter}>
//         <View style={localStyles.statusContainer}>
//           <View style={[
//             localStyles.syncStatus,
//             { backgroundColor: falcon.synced ? COLORS.oasisGreen : COLORS.warmStone }
//           ]}>
//             <Icon 
//               name={falcon.synced ? "cloud-done" : "cloud-off"} 
//               size={12} 
//               color={COLORS.desertSand} 
//             />
//             <Text style={localStyles.syncText}>
//               {falcon.synced ? 'Synced' : 'Offline'}
//             </Text>
//           </View>
          
//           {falcon.spayedNeutered && (
//             <View style={localStyles.medicalBadge}>
//               <Icon name="medical-services" size={12} color={COLORS.desertSand} />
//               <Text style={localStyles.medicalText}>Sterilized</Text>
//             </View>
//           )}
//         </View>
        
//         <Text style={localStyles.dateText}>
//           {falcon.createdAt ? formatDate(falcon.createdAt) : 'Unknown date'}
//         </Text>
//       </View>
//     </Animated.View>
//   );

//   const FilterButton = ({ label, value, icon }) => (
//     <TouchableOpacity
//       style={[
//         localStyles.filterButton,
//         selectedFilter === value && localStyles.filterButtonActive
//       ]}
//       onPress={() => setSelectedFilter(value)}
//     >
//       <Icon 
//         name={icon} 
//         size={16} 
//         color={selectedFilter === value ? COLORS.desertSand : COLORS.charcoal} 
//       />
//       <Text style={[
//         localStyles.filterText,
//         selectedFilter === value && localStyles.filterTextActive
//       ]}>
//         {label}
//       </Text>
//     </TouchableOpacity>
//   );

//   const SortButton = ({ label, value, icon }) => (
//     <TouchableOpacity
//       style={[
//         localStyles.sortButton,
//         sortBy === value && localStyles.sortButtonActive
//       ]}
//       onPress={() => setSortBy(value)}
//     >
//       <Icon 
//         name={icon} 
//         size={16} 
//         color={sortBy === value ? COLORS.desertSand : COLORS.charcoal} 
//       />
//       <Text style={[
//         localStyles.sortText,
//         sortBy === value && localStyles.sortTextActive
//       ]}>
//         {label}
//       </Text>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={localStyles.container}>
//       {/* Search Bar */}
//       <View style={localStyles.searchContainer}>
//         <Icon name="search" size={20} color={COLORS.charcoal + '60'} style={localStyles.searchIcon} />
//         <TextInput
//           style={localStyles.searchInput}
//           placeholder="Search by name, ID, or breed..."
//           placeholderTextColor={COLORS.charcoal + '60'}
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity onPress={() => setSearchQuery('')}>
//             <Icon name="close" size={20} color={COLORS.charcoal + '60'} />
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Filter Row */}
//       <ScrollView 
//         horizontal 
//         showsHorizontalScrollIndicator={false}
//         style={localStyles.filterContainer}
//         contentContainerStyle={localStyles.filterContent}
//       >
//         <FilterButton label="All" value="all" icon="all-inclusive" />
//         <FilterButton label="Male" value="male" icon="male" />
//         <FilterButton label="Female" value="female" icon="female" />
//         <FilterButton label="Trained" value="trained" icon="school" />
//         <FilterButton label="Synced" value="synced" icon="cloud-done" />
//       </ScrollView>

//       {/* Sort Row */}
//       <ScrollView 
//         horizontal 
//         showsHorizontalScrollIndicator={false}
//         style={localStyles.sortContainer}
//         contentContainerStyle={localStyles.sortContent}
//       >
//         <SortButton label="Name" value="name" icon="sort-by-alpha" />
//         <SortButton label="Recent" value="recent" icon="access-time" />
//         <SortButton label="Training" value="training" icon="trending-up" />
//       </ScrollView>

//       {/* falcons List */}
//       <Animated.ScrollView
//         style={localStyles.scrollView}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={[COLORS.cobaltBlue]}
//             tintColor={COLORS.cobaltBlue}
//           />
//         }
//         contentContainerStyle={[
//           localStyles.scrollContent,
//           filteredfalcons.length === 0 && localStyles.emptyScrollContent
//         ]}
//       >
//         {filteredfalcons.length === 0 ? (
//           <View style={localStyles.emptyState}>
//             <Icon name="pets" size={64} color={COLORS.charcoal + '30'} />
//             <Text style={localStyles.emptyTitle}>
//               {falcons.length === 0 ? 'No falcons registered' : 'No falcons found'}
//             </Text>
//             <Text style={localStyles.emptyText}>
//               {falcons.length === 0 
//                 ? 'Register your first canine to get started'
//                 : 'Try adjusting your search or filters'
//               }
//             </Text>
//           </View>
//         ) : (
//           filteredfalcons.map((falcon, index) => (
//             <falconCard key={falcon.id} falcon={falcon} index={index} />
//           ))
//         )}
//       </Animated.ScrollView>
//     </View>
//   );
// };

// const localStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.desertSand,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.warmStone,
//     margin: 20,
//     marginBottom: 12,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     borderWidth: 1.5,
//     borderColor: COLORS.charcoal + '20',
//   },
//   searchIcon: {
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 14,
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 16,
//     color: COLORS.charcoal,
//   },
//   filterContainer: {
//     marginHorizontal: 20,
//     marginBottom: 12,
//   },
//   filterContent: {
//     paddingVertical: 4,
//   },
//   filterButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     backgroundColor: COLORS.warmStone,
//     borderRadius: 20,
//     borderWidth: 1.5,
//     borderColor: COLORS.charcoal + '20',
//     marginRight: 8,
//   },
//   filterButtonActive: {
//     backgroundColor: COLORS.cobaltBlue,
//     borderColor: COLORS.cobaltBlue,
//   },
//   filterText: {
//     fontFamily: FONTS.montserratMedium,
//     fontSize: 14,
//     color: COLORS.charcoal,
//   },
//   filterTextActive: {
//     color: COLORS.desertSand,
//   },
//   sortContainer: {
//     marginHorizontal: 20,
//     marginBottom: 16,
//   },
//   sortContent: {
//     paddingVertical: 4,
//   },
//   sortButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     backgroundColor: COLORS.warmStone,
//     borderRadius: 20,
//     borderWidth: 1.5,
//     borderColor: COLORS.charcoal + '20',
//     marginRight: 8,
//   },
//   sortButtonActive: {
//     backgroundColor: COLORS.oasisGreen,
//     borderColor: COLORS.oasisGreen,
//   },
//   sortText: {
//     fontFamily: FONTS.montserratMedium,
//     fontSize: 14,
//     color: COLORS.charcoal,
//   },
//   sortTextActive: {
//     color: COLORS.desertSand,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 30,
//   },
//   emptyScrollContent: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   card: {
//     backgroundColor: COLORS.warmStone,
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: COLORS.charcoal + '15',
//     shadowColor: COLORS.charcoal,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 5,
//   },
//   deleteButton: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     zIndex: 1,
//     padding: 4,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//     paddingRight: 20, // Space for delete button
//   },
//   nameContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     flex: 1,
//   },
//   falconName: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 20,
//     color: COLORS.charcoal,
//     flex: 1,
//   },
//   sexBadge: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: COLORS.cobaltBlue,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   trainingBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 8,
//     marginLeft: 8,
//   },
//   trainingText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 12,
//     color: COLORS.desertSand,
//     textTransform: 'uppercase',
//   },
//   cardContent: {
//     flexDirection: 'row',
//     gap: 16,
//     marginBottom: 12,
//   },
//   falconImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 12,
//     backgroundColor: COLORS.charcoal + '10',
//   },
//   imagePlaceholder: {
//     width: 80,
//     height: 80,
//     borderRadius: 12,
//     backgroundColor: COLORS.charcoal + '10',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   falconDetails: {
//     flex: 1,
//     gap: 6,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   detailText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal + '80',
//     flex: 1,
//   },
//   marksContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 6,
//     backgroundColor: COLORS.desertSand,
//     padding: 10,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   marksText: {
//     fontFamily: FONTS.montserratItalic,
//     fontSize: 13,
//     color: COLORS.charcoal + '70',
//     flex: 1,
//     fontStyle: 'italic',
//   },
//   cardFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   statusContainer: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   syncStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   syncText: {
//     fontFamily: FONTS.montserratMedium,
//     fontSize: 10,
//     color: COLORS.desertSand,
//     textTransform: 'uppercase',
//   },
//   medicalBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//     backgroundColor: COLORS.charcoal + '60',
//   },
//   medicalText: {
//     fontFamily: FONTS.montserratMedium,
//     fontSize: 10,
//     color: COLORS.desertSand,
//     textTransform: 'uppercase',
//   },
//   dateText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.charcoal + '50',
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 80,
//     paddingHorizontal: 40,
//   },
//   emptyTitle: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 20,
//     color: COLORS.charcoal,
//     marginTop: 16,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptyText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 16,
//     color: COLORS.charcoal + '60',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
// });

// export default RegisteredAnimalsScreen;
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, FONTS } from './theme';
import realm from '../db/database';

const RegisteredAnimalsScreen = () => {
  const [falcons, setfalcons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    loadfalcons();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadfalcons = () => {
    try {
      const allfalcons = realm.objects('FalconRegistration').sorted('createdAt', true);
      setfalcons(Array.from(allfalcons));
    } catch (error) {
      console.error('Error loading falcons:', error);
      setfalcons([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadfalcons();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const deletefalcon = (falconId) => {
    Alert.alert(
      'Delete falcon',
      'Are you sure you want to delete this falcon? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              realm.write(() => {
                const falconToDelete = realm.objectForPrimaryKey('FalconRegistration', falconId);
                if (falconToDelete) {
                  realm.delete(falconToDelete);
                  loadfalcons(); // Refresh the list
                }
              });
            } catch (error) {
              console.error('Error deleting falcon:', error);
              Alert.alert('Error', 'Failed to delete falcon. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Filter and search falcons
  const filteredfalcons = useMemo(() => {
    if (!falcons || falcons.length === 0) return [];

    let filtered = falcons.filter(falcon => {
      // Safe access to falcon properties
      const falconName = falcon.falconName || '';
      const animalId = falcon.animalId || '';
      const breed = falcon.breed || '';
      const sex = falcon.sex || '';
      const trainingLevel = falcon.trainingLevel || 'Beginner';
      const synced = falcon.synced || false;

      const matchesSearch = 
        falconName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        breed.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      switch (selectedFilter) {
        case 'male':
          return sex === 'Male';
        case 'female':
          return sex === 'Female';
        case 'trained':
          return trainingLevel !== 'Beginner';
        case 'synced':
          return synced === true;
        default:
          return true;
      }
    });

    // Sort falcons
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => (a.falconName || '').localeCompare(b.falconName || ''));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'training':
        const trainingOrder = { 'Advanced': 3, 'Intermediate': 2, 'Beginner': 1 };
        filtered.sort((a, b) => 
          (trainingOrder[b.trainingLevel] || 1) - (trainingOrder[a.trainingLevel] || 1)
        );
        break;
      default:
        break;
    }

    return filtered;
  }, [falcons, searchQuery, selectedFilter, sortBy]);

  const getTrainingLevelColor = (level) => {
    switch (level) {
      case 'Advanced': return COLORS.oasisGreen;
      case 'Intermediate': return COLORS.cobaltBlue;
      case 'Beginner': return COLORS.warmStone;
      default: return COLORS.charcoal;
    }
  };

  const getSexIcon = (sex) => {
    return sex === 'Male' ? 'male' : 'female';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  const FalconCard = ({ falcon, index }) => (
    <Animated.View 
      style={[
        localStyles.card,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })}
          ]
        }
      ]}
    >
      {/* Delete Button */}
      <TouchableOpacity 
        style={localStyles.deleteButton}
        onPress={() => deletefalcon(falcon.id)}
      >
        <Icon name="delete-outline" size={20} color={COLORS.charcoal + '60'} />
      </TouchableOpacity>

      <View style={localStyles.cardHeader}>
        <View style={localStyles.nameContainer}>
          <Text style={localStyles.falconName} numberOfLines={1}>
            {falcon.falconName || 'Unnamed falcon'}
          </Text>
          <View style={localStyles.sexBadge}>
            <Icon 
              name={getSexIcon(falcon.sex)} 
              size={14} 
              color={COLORS.desertSand} 
            />
          </View>
        </View>
        <View style={[
          localStyles.trainingBadge,
          { backgroundColor: getTrainingLevelColor(falcon.trainingLevel) }
        ]}>
          <Text style={localStyles.trainingText}>
            {falcon.trainingLevel || 'Beginner'}
          </Text>
        </View>
      </View>

      <View style={localStyles.cardContent}>
        {falcon.imagePath ? (
          <Image 
            source={{ uri: falcon.imagePath }} 
            style={localStyles.falconImage}
            defaultSource={require('../assets/caninelogo.png')}
          />
        ) : (
          <View style={[
            localStyles.imagePlaceholder,
            { backgroundColor: getTrainingLevelColor(falcon.trainingLevel) + '40' }
          ]}>
            <Text style={localStyles.avatarText}>
              {(falcon.falconName || 'F')[0].toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={localStyles.falconDetails}>
          <View style={localStyles.detailRow}>
            <Icon name="fingerprint" size={16} color={COLORS.charcoal + '60'} />
            <Text style={localStyles.detailText}>ID: {falcon.animalId || 'N/A'}</Text>
          </View>
          
          <View style={localStyles.detailRow}>
            <Icon name="nature" size={16} color={COLORS.charcoal + '60'} />
            <Text style={localStyles.detailText}>{falcon.breed || 'Breed not specified'}</Text>
          </View>
          
          <View style={localStyles.detailRow}>
            <Icon name="cake" size={16} color={COLORS.charcoal + '60'} />
            <Text style={localStyles.detailText}>DOB: {formatDate(falcon.dateOfBirth)}</Text>
          </View>
          
          <View style={localStyles.detailRow}>
            <Icon name="fitness-center" size={16} color={COLORS.charcoal + '60'} />
            <Text style={localStyles.detailText}>
              {falcon.weight ? `${falcon.weight} kg` : 'Weight not set'}
            </Text>
          </View>

          {falcon.preferredDistance && (
            <View style={localStyles.detailRow}>
              <Icon name="flag" size={16} color={COLORS.charcoal + '60'} />
              <Text style={localStyles.detailText}>Prefers {falcon.preferredDistance}</Text>
            </View>
          )}
        </View>
      </View>

      {falcon.distinguishingMarks && (
        <View style={localStyles.marksContainer}>
          <Icon name="visibility" size={14} color={COLORS.charcoal + '60'} />
          <Text style={localStyles.marksText} numberOfLines={2}>
            {falcon.distinguishingMarks}
          </Text>
        </View>
      )}

      <View style={localStyles.cardFooter}>
        <View style={localStyles.statusContainer}>
          <View style={[
            localStyles.syncStatus,
            { backgroundColor: falcon.synced ? COLORS.oasisGreen : COLORS.warmStone }
          ]}>
            <Icon 
              name={falcon.synced ? "cloud-done" : "cloud-off"} 
              size={12} 
              color={COLORS.desertSand} 
            />
            <Text style={localStyles.syncText}>
              {falcon.synced ? 'Synced' : 'Offline'}
            </Text>
          </View>
        </View>
        
        <Text style={localStyles.dateText}>
          {falcon.createdAt ? formatDate(falcon.createdAt) : 'Unknown date'}
        </Text>
      </View>
    </Animated.View>
  );

  const FilterButton = ({ label, value, icon }) => (
    <TouchableOpacity
      style={[
        localStyles.filterButton,
        selectedFilter === value && localStyles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Icon 
        name={icon} 
        size={16} 
        color={selectedFilter === value ? COLORS.desertSand : COLORS.charcoal} 
      />
      <Text style={[
        localStyles.filterText,
        selectedFilter === value && localStyles.filterTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const SortButton = ({ label, value, icon }) => (
    <TouchableOpacity
      style={[
        localStyles.sortButton,
        sortBy === value && localStyles.sortButtonActive
      ]}
      onPress={() => setSortBy(value)}
    >
      <Icon 
        name={icon} 
        size={16} 
        color={sortBy === value ? COLORS.desertSand : COLORS.charcoal} 
      />
      <Text style={[
        localStyles.sortText,
        sortBy === value && localStyles.sortTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={localStyles.container}>
      {/* Header with Count */}
      <View style={localStyles.headerContainer}>
        <Text style={localStyles.headerTitle}>Registered Birds</Text>
        <View style={localStyles.countBadge}>
          <Text style={localStyles.countText}>{falcons.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={localStyles.searchContainer}>
        <Icon name="search" size={20} color={COLORS.charcoal + '60'} style={localStyles.searchIcon} />
        <TextInput
          style={localStyles.searchInput}
          placeholder="Search by name, ID, or breed..."
          placeholderTextColor={COLORS.charcoal + '60'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color={COLORS.charcoal + '60'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter and Sort Container */}
      <View style={localStyles.filterSortContainer}>
        {/* Filter Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={localStyles.filterScroll}
          contentContainerStyle={localStyles.filterContent}
        >
          <FilterButton label="All" value="all" icon="all-inclusive" />
          <FilterButton label="Male" value="male" icon="male" />
          <FilterButton label="Female" value="female" icon="female" />
          <FilterButton label="Trained" value="trained" icon="school" />
          <FilterButton label="Synced" value="synced" icon="cloud-done" />
        </ScrollView>

        {/* Sort Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={localStyles.sortScroll}
          contentContainerStyle={localStyles.sortContent}
        >
          <SortButton label="Name" value="name" icon="sort-by-alpha" />
          <SortButton label="Recent" value="recent" icon="access-time" />
          <SortButton label="Training" value="training" icon="trending-up" />
        </ScrollView>
      </View>

      {/* falcons List */}
      <Animated.ScrollView
        style={localStyles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.cobaltBlue]}
            tintColor={COLORS.cobaltBlue}
          />
        }
        contentContainerStyle={[
          localStyles.scrollContent,
          filteredfalcons.length === 0 && localStyles.emptyScrollContent
        ]}
      >
        {filteredfalcons.length === 0 ? (
          <View style={localStyles.emptyState}>
            <Icon name="pets" size={64} color={COLORS.charcoal + '30'} />
            <Text style={localStyles.emptyTitle}>
              {falcons.length === 0 ? 'No falcons registered' : 'No falcons found'}
            </Text>
            <Text style={localStyles.emptyText}>
              {falcons.length === 0 
                ? 'Register your first falcon to get started'
                : 'Try adjusting your search or filters'
              }
            </Text>
          </View>
        ) : (
          filteredfalcons.map((falcon, index) => (
            <FalconCard key={falcon.id} falcon={falcon} index={index} />
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.desertSand,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.cobaltBlue,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.desertSand,
  },
  countBadge: {
    backgroundColor: COLORS.desertSand,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  countText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.cobaltBlue,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmStone,
    margin: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.charcoal + '20',
    height: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal,
  },
  filterSortContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterContent: {
    paddingVertical: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: COLORS.warmStone,
    borderRadius: 24,
    borderWidth: 0,
    marginRight: 10,
    height: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButtonActive: {
    backgroundColor: COLORS.cobaltBlue,
    elevation: 4,
    shadowOpacity: 0.2,
  },
  filterText: {
    fontFamily: FONTS.montserratMedium,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  filterTextActive: {
    color: COLORS.desertSand,
  },
  sortScroll: {
    marginBottom: 8,
  },
  sortContent: {
    paddingVertical: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.warmStone,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.charcoal + '20',
    marginRight: 8,
    height: 36, // Fixed height for sort buttons
  },
  sortButtonActive: {
    backgroundColor: COLORS.oasisGreen,
    borderColor: COLORS.oasisGreen,
  },
  sortText: {
    fontFamily: FONTS.montserratMedium,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  sortTextActive: {
    color: COLORS.desertSand,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.warmStone,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 20, // Space for delete button
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  falconName: {
    fontFamily: FONTS.montserratBold,
    fontSize: 20,
    color: COLORS.charcoal,
    flex: 1,
  },
  sexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cobaltBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainingBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  trainingText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 11,
    color: COLORS.desertSand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  falconImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.charcoal + '10',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  avatarText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 32,
    color: COLORS.charcoal,
  },
  falconDetails: {
    flex: 1,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal + '80',
    flex: 1,
  },
  marksContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.desertSand,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  marksText: {
    fontFamily: FONTS.montserratItalic,
    fontSize: 13,
    color: COLORS.charcoal + '70',
    flex: 1,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncText: {
    fontFamily: FONTS.montserratMedium,
    fontSize: 10,
    color: COLORS.desertSand,
    textTransform: 'uppercase',
  },
  medicalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.charcoal + '60',
  },
  medicalText: {
    fontFamily: FONTS.montserratMedium,
    fontSize: 10,
    color: COLORS.desertSand,
    textTransform: 'uppercase',
  },
  dateText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '50',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 20,
    color: COLORS.charcoal,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal + '60',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default RegisteredAnimalsScreen;