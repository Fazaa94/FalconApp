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
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, FONTS } from './theme';
import realm from '../db/database';

const RegisteredFalconsScreen = () => {
  const [falcons, setFalcons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    loadFalcons();
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

  const loadFalcons = () => {
    try {
      const allFalcons = realm.objects('FalconRegistration').sorted('createdAt', true);
      setFalcons(Array.from(allFalcons));
    } catch (error) {
      console.error('Error loading falcons:', error);
      setFalcons([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFalcons();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const deleteFalcon = (falconId) => {
    Alert.alert(
      'Delete Falcon',
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
                  loadFalcons();
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

  const filteredFalcons = useMemo(() => {
    if (!falcons || falcons.length === 0) return [];

    let filtered = falcons.filter(falcon => {
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

  const FalconCard = ({ falcon }) => (
    <Animated.View 
      style={[
        styles.card,
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
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteFalcon(falcon.id)}
      >
        <Icon name="delete-outline" size={20} color={COLORS.charcoal + '60'} />
      </TouchableOpacity>

      <View style={styles.cardHeader}>
        <View style={styles.nameContainer}>
          <Text style={styles.falconName} numberOfLines={1}>
            {falcon.falconName || 'Unnamed Falcon'}
          </Text>
          <View style={styles.sexBadge}>
            <Icon 
              name={getSexIcon(falcon.sex)} 
              size={14} 
              color={COLORS.desertSand} 
            />
          </View>
        </View>
        <View style={[
          styles.trainingBadge,
          { backgroundColor: getTrainingLevelColor(falcon.trainingLevel) }
        ]}>
          <Text style={styles.trainingText}>
            {falcon.trainingLevel || 'Beginner'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        {falcon.imagePath ? (
          <Image 
            source={{ uri: falcon.imagePath }} 
            style={styles.falconImage}
            defaultSource={require('../assets/caninelogo.png')}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="pets" size={40} color={COLORS.charcoal + '40'} />
          </View>
        )}
        
        <View style={styles.falconDetails}>
          <View style={styles.detailRow}>
            <Icon name="fingerprint" size={16} color={COLORS.charcoal + '60'} />
            <Text style={styles.detailText}>ID: {falcon.animalId || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="nature" size={16} color={COLORS.charcoal + '60'} />
            <Text style={styles.detailText}>{falcon.breed || 'Breed not specified'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="cake" size={16} color={COLORS.charcoal + '60'} />
            <Text style={styles.detailText}>DOB: {formatDate(falcon.dateOfBirth)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="fitness-center" size={16} color={COLORS.charcoal + '60'} />
            <Text style={styles.detailText}>
              {falcon.weight ? `${falcon.weight} kg` : 'Weight not set'}
            </Text>
          </View>

          {falcon.preferredDistance && (
            <View style={styles.detailRow}>
              <Icon name="flag" size={16} color={COLORS.charcoal + '60'} />
              <Text style={styles.detailText}>Prefers {falcon.preferredDistance}</Text>
            </View>
          )}
        </View>
      </View>

      {falcon.distinguishingMarks && (
        <View style={styles.marksContainer}>
          <Icon name="visibility" size={14} color={COLORS.charcoal + '60'} />
          <Text style={styles.marksText} numberOfLines={2}>
            {falcon.distinguishingMarks}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.syncStatus,
            { backgroundColor: falcon.synced ? COLORS.oasisGreen : COLORS.warmStone }
          ]}>
            <Icon 
              name={falcon.synced ? "cloud-done" : "cloud-off"} 
              size={12} 
              color={COLORS.desertSand} 
            />
            <Text style={styles.syncText}>
              {falcon.synced ? 'Synced' : 'Offline'}
            </Text>
          </View>
          
          {falcon.spayedNeutered && (
            <View style={styles.medicalBadge}>
              <Icon name="medical-services" size={12} color={COLORS.desertSand} />
              <Text style={styles.medicalText}>Sterilized</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.dateText}>
          {falcon.createdAt ? formatDate(falcon.createdAt) : 'Unknown date'}
        </Text>
      </View>
    </Animated.View>
  );

  const FilterButton = ({ label, value, icon }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === value && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Icon 
        name={icon} 
        size={16} 
        color={selectedFilter === value ? COLORS.desertSand : COLORS.charcoal} 
      />
      <Text style={[
        styles.filterText,
        selectedFilter === value && styles.filterTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const SortButton = ({ label, value, icon }) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortBy === value && styles.sortButtonActive
      ]}
      onPress={() => setSortBy(value)}
    >
      <Icon 
        name={icon} 
        size={16} 
        color={sortBy === value ? COLORS.desertSand : COLORS.charcoal} 
      />
      <Text style={[
        styles.sortText,
        sortBy === value && styles.sortTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={COLORS.charcoal + '60'} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
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

      <View style={styles.filterSortContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <FilterButton label="All" value="all" icon="all-inclusive" />
          <FilterButton label="Male" value="male" icon="male" />
          <FilterButton label="Female" value="female" icon="female" />
          <FilterButton label="Trained" value="trained" icon="school" />
          <FilterButton label="Synced" value="synced" icon="cloud-done" />
        </ScrollView>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.sortScroll}
          contentContainerStyle={styles.sortContent}
        >
          <SortButton label="Name" value="name" icon="sort-by-alpha" />
          <SortButton label="Recent" value="recent" icon="access-time" />
          <SortButton label="Training" value="training" icon="trending-up" />
        </ScrollView>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
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
          styles.scrollContent,
          filteredFalcons.length === 0 && styles.emptyScrollContent
        ]}
      >
        {filteredFalcons.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="pets" size={64} color={COLORS.charcoal + '30'} />
            <Text style={styles.emptyTitle}>
              {falcons.length === 0 ? 'No Falcons Registered' : 'No Falcons Found'}
            </Text>
            <Text style={styles.emptyText}>
              {falcons.length === 0 
                ? 'Register your first falcon to get started'
                : 'Try adjusting your search or filters'
              }
            </Text>
          </View>
        ) : (
          filteredFalcons.map((falcon, index) => (
            <FalconCard key={falcon.id} falcon={falcon} />
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.desertSand,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.warmStone,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.charcoal + '20',
    marginRight: 8,
    height: 36,
  },
  filterButtonActive: {
    backgroundColor: COLORS.cobaltBlue,
    borderColor: COLORS.cobaltBlue,
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
    height: 36,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.charcoal + '15',
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
    paddingRight: 20,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  trainingText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.desertSand,
    textTransform: 'uppercase',
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
    borderRadius: 12,
    backgroundColor: COLORS.charcoal + '10',
    justifyContent: 'center',
    alignItems: 'center',
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

export default RegisteredFalconsScreen;
