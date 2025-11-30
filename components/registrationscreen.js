// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   StyleSheet,
//   Alert,
//   Switch,
//   Platform,
// } from 'react-native';
// import realm from '../db/FalconRegistration';
// import uuid from 'react-native-uuid';
// import { COLORS, FONTS, styles } from './theme';
// import {launchImageLibrary} from 'react-native-image-picker';
// import RNFS from 'react-native-fs';

// const RegistrationScreen = () => {
//   const [formData, setFormData] = useState({
//     animalId: '', // New animalId field
//     falconName: '',
//     breed: '',
//     dateOfBirth: '',
//     weight: '',
//     distinguishingMarks: '',
//     // medicalNotes: '',
//     sex: 'Male',
//       trainingLevel: 'Beginner', // ✅ Default value added

//     spayedNeutered: false,
//   });

//   const [profileImage, setProfileImage] = useState(null);
//   const [vetRecords, setVetRecords] = useState(null);

//   const updateFormData = (field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   // Function to generate animal ID based on falcon name and timestamp
//   const generateAnimalId = (falconName) => {
//     const namePrefix = falconName.substring(0, 3).toUpperCase();
//     const timestamp = new Date().getTime().toString().slice(-6);
//     const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
//     return `${namePrefix}-${timestamp}${randomSuffix}`;
//   };

//   // Auto-generate animal ID when falcon name changes
//   React.useEffect(() => {
//     if (formData.falconName && formData.falconName.length >= 3) {
//       const generatedId = generateAnimalId(formData.falconName);
//       setFormData(prev => ({
//         ...prev,
//         animalId: generatedId
//       }));
//     }
//   }, [formData.falconName]);

//   const handleImageUpload = async () => {
//     const result = await launchImageLibrary({
//       mediaType: 'photo',
//       quality: 0.8,
//     });

//     if (result.assets && result.assets[0]) {
//       const sourcePath = result.assets[0].uri;
//       const newFileName = `${uuid.v4()}.jpg`;
//       const destinationPath = `${RNFS.DocumentDirectoryPath}/${newFileName}`;

//       try {
//         await RNFS.copyFile(sourcePath, destinationPath);
//         setProfileImage(`file://${destinationPath}`);
//       } catch (err) {
//         console.error('Error saving image:', err);
//       }
//     }
//   };

//   const handleFileUpload = () => {
//     Alert.alert('File Upload', 'This would open the file picker');
//   };

//   const handleSubmit = () => {
//     // Validation
//     if (!formData.animalId || !formData.falconName || !formData.breed) {
//       Alert.alert('Missing Information', 'Please fill in all required fields: Animal ID, falcon Name, and Breed');
//       return;
//     }

//     try {
//       realm.write(() => {
//         realm.create('FalconRegistration', {
//           id: uuid.v4(),
//           ...formData,
//           imagePath: profileImage || '',
//           synced: false,
//           createdAt: new Date(),
//             trainingLevel: 'Beginner', // ✅ Default value added

//         });
//       });

//       Alert.alert('Saved Locally', 'Registration saved offline!');
      
//       // Reset form
//       setFormData({
//         animalId: '',
//         falconName: '',
//         breed: '',
//         dateOfBirth: '',
//         weight: '',
//         distinguishingMarks: '',
//         // medicalNotes: '',
//         sex: 'Male',
//         spayedNeutered: false,
//       });
//       setProfileImage(null);
//     } catch (error) {
//       console.error('Error saving locally:', error);
//       Alert.alert('Error', 'Could not save registration. Please try again.');
//     }
//   };

//   const handleManualAnimalIdChange = (text) => {
//     // Allow manual override of animal ID
//     setFormData(prev => ({
//       ...prev,
//       animalId: text.toUpperCase()
//     }));
//   };

//   return (
//     <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
//       {/* Header */}
//       <View style={localStyles.header}>
//         <Text style={[styles.title, localStyles.mainTitle]}>Canine Race Tracker</Text>
//         <Text style={localStyles.subtitle}>New Racer Registration</Text>
//       </View>

//       {/* Profile Image Section */}
//       <View style={localStyles.section}>
//         <Text style={localStyles.sectionTitle}>Upload Profile Image</Text>
//         <TouchableOpacity 
//           style={localStyles.uploadArea}
//           onPress={handleImageUpload}
//         >
//           {profileImage ? (
//             <Image source={{ uri: profileImage }} style={localStyles.imagePreview} />
//           ) : (
//             <View style={localStyles.uploadPlaceholder}>
//               <Text style={localStyles.uploadText}>Click to upload image</Text>
//             </View>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* falcon Details Section */}
//       <View style={localStyles.section}>
//         <Text style={localStyles.sectionTitle}>falcon Details</Text>
        
//         {/* Animal ID Field */}
//         <View style={localStyles.inputGroup}>
//           <View style={localStyles.labelRow}>
//             <Text style={localStyles.label}>Animal ID *</Text>
//             <Text style={localStyles.autoGenerateText}>Auto-generated from name</Text>
//           </View>
//           <TextInput
//             style={localStyles.input}
//             placeholder="Animal ID will be auto-generated"
//             placeholderTextColor={COLORS.charcoal + '80'}
//             value={formData.animalId}
//             onChangeText={handleManualAnimalIdChange}
//             editable={true} // Allow manual editing if needed
//           />
//           {formData.animalId && (
//             <Text style={localStyles.animalIdNote}>
//               Official ID: {formData.animalId}
//             </Text>
//           )}
//         </View>

//         <View style={localStyles.inputGroup}>
//           <Text style={localStyles.label}>falcon's Name *</Text>
//           <TextInput
//             style={localStyles.input}
//             placeholder="Enter name (min 3 characters)"
//             placeholderTextColor={COLORS.charcoal + '80'}
//             value={formData.falconName}
//             onChangeText={(text) => updateFormData('falconName', text)}
//           />
//         </View>

//         <View style={localStyles.inputGroup}>
//           <Text style={localStyles.label}>Breed *</Text>
//           <TextInput
//             style={localStyles.input}
//             placeholder="Enter breed"
//             placeholderTextColor={COLORS.charcoal + '80'}
//             value={formData.breed}
//             onChangeText={(text) => updateFormData('breed', text)}
//           />
//         </View>

//         <View style={localStyles.inputGroup}>
//           <Text style={localStyles.label}>Date of Birth</Text>
//           <TextInput
//             style={localStyles.input}
//             placeholder="dd/mm/yyyy"
//             placeholderTextColor={COLORS.charcoal + '80'}
//             value={formData.dateOfBirth}
//             onChangeText={(text) => updateFormData('dateOfBirth', text)}
//           />
//         </View>

//         <View style={localStyles.inputGroup}>
//           <Text style={localStyles.label}>Weight (kg)</Text>
//           <TextInput
//             style={localStyles.input}
//             placeholder="Weight"
//             placeholderTextColor={COLORS.charcoal + '80'}
//             keyboardType="numeric"
//             value={formData.weight}
//             onChangeText={(text) => updateFormData('weight', text)}
//           />
//         </View>

//         <View style={localStyles.inputGroup}>
//           <Text style={localStyles.label}>Distinguishing Marks</Text>
//           <TextInput
//             style={[localStyles.input, localStyles.textArea]}
//             placeholder="Marks"
//             placeholderTextColor={COLORS.charcoal + '80'}
//             multiline
//             numberOfLines={3}
//             value={formData.distinguishingMarks}
//             onChangeText={(text) => updateFormData('distinguishingMarks', text)}
//           />
//         </View>

//         <View style={localStyles.inputGroup}>
//           <Text style={localStyles.label}>Medical Notes</Text>
//           <TextInput
//             style={[localStyles.input, localStyles.textArea]}
//             placeholder="Notes"
//             placeholderTextColor={COLORS.charcoal + '80'}
//             multiline
//             numberOfLines={3}
//             // value={formData.medicalNotes}
//             // onChangeText={(text) => updateFormData('medicalNotes', text)}
//           />
//         </View>
//       </View>

//       {/* Owner Information Section */}
//       <View style={localStyles.section}>
//         <Text style={localStyles.sectionTitle}>Owner Information</Text>
        
//         <View style={localStyles.row}>
//           <Text style={localStyles.label}>Sex</Text>
//           <View style={localStyles.sexButtons}>
//             <TouchableOpacity
//               style={[
//                 localStyles.sexButton,
//                 formData.sex === 'Male' && localStyles.sexButtonActive
//               ]}
//               onPress={() => updateFormData('sex', 'Male')}
//             >
//               <Text style={[
//                 localStyles.sexButtonText,
//                 formData.sex === 'Male' && localStyles.sexButtonTextActive
//               ]}>Male</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[
//                 localStyles.sexButton,
//                 formData.sex === 'Female' && localStyles.sexButtonActive
//               ]}
//               onPress={() => updateFormData('sex', 'Female')}
//             >
//               <Text style={[
//                 localStyles.sexButtonText,
//                 formData.sex === 'Female' && localStyles.sexButtonTextActive
//               ]}>Female</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={localStyles.row}>
//           <Text style={localStyles.label}>Spayed/Neutered</Text>
//           <Switch
//             value={formData.spayedNeutered}
//             onValueChange={(value) => updateFormData('spayedNeutered', value)}
//             trackColor={{ false: COLORS.warmStone, true: COLORS.oasisGreen }}
//             thumbColor={formData.spayedNeutered ? COLORS.desertSand : COLORS.desertSand}
//           />
//           <Text style={localStyles.switchLabel}>
//             {formData.spayedNeutered ? 'Yes' : 'No'}
//           </Text>
//         </View>
//       </View>

//       {/* Verification Section */}
//       <View style={localStyles.verificationSection}>
//         <View style={localStyles.verifiedBadge}>
//           <Text style={localStyles.verifiedText}>VERIFIED</Text>
//         </View>
//         <Text style={localStyles.vaccinationText}>Vaccination Status</Text>
//         <View style={localStyles.approvedSection}>
//           <View style={localStyles.approvedBadge}>
//             <Text style={localStyles.approvedText}>Approved</Text>
//           </View>
//         </View>
//       </View>

//       {/* Submit Button */}
//       <TouchableOpacity style={localStyles.submitButton} onPress={handleSubmit}>
//         <Text style={localStyles.submitButtonText}>Complete Registration</Text>
//       </TouchableOpacity>

//       {/* Required Fields Note */}
//       <Text style={localStyles.requiredNote}>* Required fields</Text>
//     </ScrollView>
//   );
// };

// const localStyles = StyleSheet.create({
//   header: {
//     marginBottom: 24,
//     alignItems: 'center',
//   },
//   mainTitle: {
//     fontSize: 28,
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 18,
//     color: COLORS.charcoal,
//     textAlign: 'center',
//   },
//   section: {
//     backgroundColor: COLORS.warmStone,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: COLORS.charcoal + '20',
//   },
//   sectionTitle: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 20,
//     color: COLORS.charcoal,
//     marginBottom: 16,
//   },
//   inputGroup: {
//     marginBottom: 16,
//   },
//   labelRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   label: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.charcoal,
//   },
//   autoGenerateText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.charcoal + '60',
//     fontStyle: 'italic',
//   },
//   input: {
//     backgroundColor: COLORS.desertSand,
//     borderWidth: 1,
//     borderColor: COLORS.charcoal + '40',
//     borderRadius: 8,
//     padding: 12,
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 16,
//     color: COLORS.charcoal,
//   },
//   textArea: {
//     minHeight: 80,
//     textAlignVertical: 'top',
//   },
//   uploadArea: {
//     height: 120,
//     borderWidth: 2,
//     borderColor: COLORS.charcoal + '40',
//     borderStyle: 'dashed',
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: COLORS.desertSand,
//   },
//   uploadPlaceholder: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   uploadText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 16,
//     color: COLORS.charcoal + '80',
//   },
//   imagePreview: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//   },
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   sexButtons: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   sexButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//     borderWidth: 1,
//     borderColor: COLORS.charcoal + '40',
//     borderRadius: 8,
//     backgroundColor: COLORS.desertSand,
//   },
//   sexButtonActive: {
//     backgroundColor: COLORS.cobaltBlue,
//     borderColor: COLORS.cobaltBlue,
//   },
//   sexButtonText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal,
//   },
//   sexButtonTextActive: {
//     color: COLORS.desertSand,
//     fontFamily: FONTS.montserratBold,
//   },
//   switchLabel: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal,
//     marginLeft: 8,
//   },
//   animalIdNote: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.cobaltBlue,
//     marginTop: 4,
//     fontStyle: 'italic',
//   },
//   verificationSection: {
//     backgroundColor: COLORS.warmStone,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: COLORS.charcoal + '20',
//   },
//   verifiedBadge: {
//     backgroundColor: COLORS.oasisGreen,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//     alignSelf: 'flex-start',
//     marginBottom: 12,
//   },
//   verifiedText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 12,
//     color: COLORS.desertSand,
//     textTransform: 'uppercase',
//   },
//   vaccinationText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.charcoal,
//     marginBottom: 12,
//   },
//   approvedSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   approvedBadge: {
//     backgroundColor: COLORS.oasisGreen,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   approvedText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 14,
//     color: COLORS.desertSand,
//   },
//   submitButton: {
//     backgroundColor: COLORS.cobaltBlue,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   submitButtonText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 18,
//     color: COLORS.desertSand,
//   },
//   requiredNote: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.charcoal + '60',
//     textAlign: 'center',
//     marginBottom: 30,
//     fontStyle: 'italic',
//   },
// });

// export default RegistrationScreen;
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Switch,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import realm from '../db/database';
import uuid from 'react-native-uuid';
import { COLORS, FONTS, styles } from './theme';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RegistrationScreen = () => {
  const [formData, setFormData] = useState({
    animalId: '',
    falconName: '',
    weight: '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  React.useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAnimalId = (falconName) => {
    const namePrefix = falconName.substring(0, 3).toUpperCase();
    const timestamp = new Date().getTime().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${namePrefix}-${timestamp}${randomSuffix}`;
  };

  React.useEffect(() => {
    if (formData.falconName && formData.falconName.length >= 3) {
      const generatedId = generateAnimalId(formData.falconName);
      setFormData(prev => ({
        ...prev,
        animalId: generatedId
      }));
    }
  }, [formData.falconName]);

  const handleImageUpload = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets[0]) {
      const sourcePath = result.assets[0].uri;
      const newFileName = `${uuid.v4()}.jpg`;
      const destinationPath = `${RNFS.DocumentDirectoryPath}/${newFileName}`;

      try {
        await RNFS.copyFile(sourcePath, destinationPath);
        setProfileImage(`file://${destinationPath}`);
      } catch (err) {
        console.error('Error saving image:', err);
      }
    }
  };

  const handleSubmit = async () => {
      if (!formData.animalId || !formData.falconName || !formData.weight) {
        Alert.alert('Missing Information', 'Please fill in all required fields: Animal ID, falcon Name, and Weight');
        return;
      }

    setIsSubmitting(true);
    try {
      realm.write(() => {
          realm.create('FalconRegistration', {
            id: uuid.v4(),
            animalId: formData.animalId,
            falconName: formData.falconName,
            weight: formData.weight,
            imagePath: profileImage || '',
            synced: false,
            createdAt: new Date(),
          });
      });

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert('🎉 Success!', 'Registration saved offline!', [
        { text: 'OK', onPress: resetForm }
      ]);
    } catch (error) {
      console.error('Error saving locally:', error);
      Alert.alert('Error', 'Could not save registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
      setFormData({
        animalId: '',
        falconName: '',
        weight: '',
      });
    setProfileImage(null);
  };

  const handleManualAnimalIdChange = (text) => {
    setFormData(prev => ({
      ...prev,
      animalId: text.toUpperCase()
    }));
  };

  return (
    <ScrollView 
      style={localStyles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={localStyles.scrollContent}
    >
      <Animated.View 
        style={[
          localStyles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Enhanced Header */}
        {/* <View style={localStyles.header}>
          <View style={localStyles.headerIcon}>
            <Icon name="pets" size={32} color={COLORS.cobaltBlue} />
          </View>
          <Text style={localStyles.mainTitle}>Falcon Race Tracker</Text>
          <Text style={localStyles.subtitle}>New Racer Registration</Text>
        </View> */}

        {/* Profile Image Section with Enhanced Design */}
        <View style={localStyles.section}>
          <View style={localStyles.sectionHeader}>
            <Icon name="photo-camera" size={20} color={COLORS.charcoal} />
            <Text style={localStyles.sectionTitle}>Profile Image</Text>
          </View>
          <TouchableOpacity 
            style={localStyles.uploadArea}
            onPress={handleImageUpload}
            activeOpacity={0.7}
          >
            {profileImage ? (
              <View style={localStyles.imageContainer}>
                <Image source={{ uri: profileImage }} style={localStyles.imagePreview} />
                <View style={localStyles.imageOverlay}>
                  <Icon name="edit" size={24} color={COLORS.desertSand} />
                </View>
              </View>
            ) : (
              <View style={localStyles.uploadPlaceholder}>
                <Icon name="add-a-photo" size={40} color={COLORS.charcoal + '60'} />
                <Text style={localStyles.uploadText}>Tap to upload photo</Text>
                <Text style={localStyles.uploadSubtext}>JPG, PNG • Max 5MB</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* falcon Details Section */}
        <View style={localStyles.section}>
          <View style={localStyles.sectionHeader}>
            <Icon name="pets" size={20} color={COLORS.charcoal} />
            <Text style={localStyles.sectionTitle}>falcon Details</Text>
          </View>
          
          {/* Animal ID Field */}
          <View style={localStyles.inputGroup}>
            <View style={localStyles.labelRow}>
              <Text style={localStyles.label}>Animal ID</Text>
              <View style={localStyles.requiredBadge}>
                <Text style={localStyles.requiredText}>Required</Text>
              </View>
            </View>
            <View style={localStyles.inputContainer}>
              <Icon name="fingerprint" size={20} color={COLORS.charcoal + '60'} style={localStyles.inputIcon} />
              <TextInput
                style={localStyles.input}
                placeholder="Auto-generated from name"
                placeholderTextColor={COLORS.charcoal + '60'}
                value={formData.animalId}
                onChangeText={handleManualAnimalIdChange}
              />
            </View>
            {formData.animalId && (
              <View style={localStyles.animalIdContainer}>
                <Icon name="check-circle" size={16} color={COLORS.oasisGreen} />
                <Text style={localStyles.animalIdNote}>Official ID: {formData.animalId}</Text>
              </View>
            )}
          </View>

            {/* Falcon Name Field */}
            <View style={localStyles.inputGroup}>
              <View style={localStyles.labelRow}>
                <Text style={localStyles.label}>Falcon's Name</Text>
                <View style={localStyles.requiredBadge}>
                  <Text style={localStyles.requiredText}>Required</Text>
                </View>
              </View>
              <View style={localStyles.inputContainer}>
                <Icon name="badge" size={20} color={COLORS.charcoal + '60'} style={localStyles.inputIcon} />
                <TextInput
                  style={localStyles.input}
                  placeholder="Enter falcon name (min 3 characters)"
                  placeholderTextColor={COLORS.charcoal + '60'}
                  value={formData.falconName}
                  onChangeText={(text) => updateFormData('falconName', text)}
                />
              </View>
            </View>

            {/* Weight Field */}
            <View style={localStyles.inputGroup}>
              <View style={localStyles.labelRow}>
                <Text style={localStyles.label}>Weight</Text>
                <View style={localStyles.requiredBadge}>
                  <Text style={localStyles.requiredText}>Required</Text>
                </View>
              </View>
              <View style={localStyles.inputContainer}>
                <Icon name="fitness-center" size={20} color={COLORS.charcoal + '60'} style={localStyles.inputIcon} />
                <TextInput
                  style={localStyles.input}
                  placeholder="Weight in kg"
                  placeholderTextColor={COLORS.charcoal + '60'}
                  value={formData.weight}
                  onChangeText={(text) => updateFormData('weight', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>

          {/* Text Area: Distinguishing Marks only */}
          <View style={localStyles.inputGroup} key={'distinguishingMarks'}>
            <View style={localStyles.labelRow}>
              <Icon name={'visibility'} size={18} color={COLORS.charcoal} />
              <Text style={localStyles.label}>Distinguishing Marks</Text>
            </View>
            <TextInput
              style={[localStyles.input, localStyles.textArea]}
              placeholder={'Enter distinguishing marks'}
              placeholderTextColor={COLORS.charcoal + '60'}
              multiline
              numberOfLines={3}
              value={formData['distinguishingMarks']}
              onChangeText={(text) => updateFormData('distinguishingMarks', text)}
            />
          </View>
        </View>

        {/* ...existing code... */}

        {/* ...existing code... */}

        {/* Enhanced Submit Button */}
        <TouchableOpacity 
          style={[
            localStyles.submitButton,
            isSubmitting && localStyles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <View style={localStyles.loadingContainer}>
              <Icon name="pets" size={20} color={COLORS.desertSand} />
              <Text style={localStyles.submitButtonText}>Registering...</Text>
            </View>
          ) : (
            <View style={localStyles.buttonContent}>
              <Icon name="how-to-reg" size={20} color={COLORS.desertSand} />
              <Text style={localStyles.submitButtonText}>Complete Registration</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Footer Note */}
        <View style={localStyles.footer}>
          <Icon name="info" size={14} color={COLORS.charcoal + '60'} />
          <Text style={localStyles.footerText}>
            All information is stored securely and synchronized when online
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.desertSand,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
    paddingTop: 10,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.desertSand,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.cobaltBlue + '20',
  },
  mainTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 32,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.warmStone,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.charcoal + '15',
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 20,
    color: COLORS.charcoal,
    letterSpacing: -0.3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 15,
    color: COLORS.charcoal,
  },
  requiredBadge: {
    backgroundColor: COLORS.cobaltBlue + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  requiredText: {
    fontFamily: FONTS.montserratMedium,
    fontSize: 10,
    color: COLORS.cobaltBlue,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.desertSand,
    borderWidth: 1.5,
    borderColor: COLORS.charcoal + '20',
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputIcon: {
    padding: 12,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
        backgroundColor: COLORS.desertSand, 
            borderRadius: 12,

  },
  uploadArea: {
    height: 140,
    borderWidth: 2,
    borderColor: COLORS.charcoal + '25',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.desertSand,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 16,
    color: COLORS.charcoal + '70',
    marginTop: 8,
  },
  uploadSubtext: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '50',
    marginTop: 4,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sexButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sexButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.charcoal + '30',
    borderRadius: 10,
    backgroundColor: COLORS.desertSand,
    minWidth: 80,
    justifyContent: 'center',
  },
  sexButtonActive: {
    backgroundColor: COLORS.cobaltBlue,
    borderColor: COLORS.cobaltBlue,
  },
  sexButtonText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  sexButtonTextActive: {
    color: COLORS.desertSand,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontFamily: FONTS.montserratMedium,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  animalIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  animalIdNote: {
    fontFamily: FONTS.montserratMedium,
    fontSize: 12,
    color: COLORS.oasisGreen,
  },
  verificationSection: {
    backgroundColor: COLORS.warmStone,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.charcoal + '15',
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  verificationTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 18,
    color: COLORS.charcoal,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.oasisGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  verifiedText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.desertSand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vaccinationText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
  },
  approvedSubtext: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '60',
    marginTop: 2,
  },
  approvedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  approvedInfo: {
    flex: 1,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.oasisGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  approvedText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.desertSand,
  },
  submitButton: {
    backgroundColor: COLORS.cobaltBlue,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.cobaltBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 18,
    color: COLORS.desertSand,
    letterSpacing: -0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '60',
    textAlign: 'center',
    flex: 1,
  },
});

export default RegistrationScreen;