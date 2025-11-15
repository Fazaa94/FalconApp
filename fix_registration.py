import os
import stat

path = r'c:\Users\ELITEBOOK\FalconApp\components\registrationscreen.js'
temp_path = path + '.tmp'

content = '''import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, FlatList, StatusBar } from 'react-native';
import uuid from 'react-native-uuid';
import { useRace } from '../src/context/RaceContext';
import { COLORS } from './theme';
import realm from '../db/database';

const RegistrationScreen = () => {
  const { state: raceState, dispatch } = useRace();
  const [activeTab, setActiveTab] = useState('register');
  const [falcons, setFalcons] = useState([]);
  const [formData, setFormData] = useState({ name: '', breed: '', weight: '', notes: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFalcons();
  }, []);

  const loadFalcons = () => {
    try {
      setFalcons(Array.from(realm.objects('FalconRegistration')));
    } catch (error) {
      console.error('Error loading falcons:', error);
    }
  };

  const handleAddFalcon = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Falcon name is required');
      return;
    }

    try {
      realm.write(() => {
        realm.create('FalconRegistration', {
          id: uuid.v4(),
          name: formData.name,
          breed: formData.breed,
          weight: formData.weight,
          notes: formData.notes,
          createdAt: new Date(),
        });
      });
      Alert.alert('Success', `${formData.name} registered`);
      setFormData({ name: '', breed: '', weight: '', notes: '' });
      loadFalcons();
    } catch (error) {
      Alert.alert('Error', `Failed: ${error.message}`);
    }
  };

  const handleSelectFalcon = (falcon) => {
    dispatch({ type: 'SELECT_FALCON', payload: falcon });
    Alert.alert('Success', `${falcon.name} selected`);
  };

  const filteredFalcons = falcons.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBg} />
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'register' && styles.tabActive]} onPress={() => setActiveTab('register')}>
          <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'select' && styles.tabActive]} onPress={() => setActiveTab('select')}>
          <Text style={[styles.tabText, activeTab === 'select' && styles.tabTextActive]}>Select</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'register' && (
        <ScrollView style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Falcon Name *</Text>
            <TextInput style={styles.input} placeholder="e.g., Red Wing" placeholderTextColor={COLORS.surfaceBg} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
            <Text style={styles.label}>Breed</Text>
            <TextInput style={styles.input} placeholder="e.g., Peregrine" placeholderTextColor={COLORS.surfaceBg} value={formData.breed} onChangeText={(text) => setFormData({ ...formData, breed: text })} />
            <Text style={styles.label}>Weight (g)</Text>
            <TextInput style={styles.input} placeholder="e.g., 850" placeholderTextColor={COLORS.surfaceBg} keyboardType="decimal-pad" value={formData.weight} onChangeText={(text) => setFormData({ ...formData, weight: text })} />
            <Text style={styles.label}>Notes</Text>
            <TextInput style={[styles.input, styles.multilineInput]} placeholder="Additional notes..." placeholderTextColor={COLORS.surfaceBg} multiline numberOfLines={4} value={formData.notes} onChangeText={(text) => setFormData({ ...formData, notes: text })} />
            <TouchableOpacity style={styles.submitButton} onPress={handleAddFalcon}>
              <Text style={styles.submitButtonText}>Register Falcon</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Registered Falcons</Text>
            {falcons.length === 0 ? <Text style={styles.emptyText}>No falcons registered</Text> : (
              <FlatList scrollEnabled={false} data={falcons} keyExtractor={(item) => item.id} renderItem={({ item }) => (
                <View style={styles.falconCard}>
                  <Text style={styles.falconName}>{item.name}</Text>
                  {item.breed && <Text style={styles.falconDetail}>Breed: {item.breed}</Text>}
                  {item.weight && <Text style={styles.falconDetail}>Weight: {item.weight}g</Text>}
                </View>
              )} />
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === 'select' && (
        <ScrollView style={styles.content}>
          <View style={styles.trainContainer}>
            <Text style={styles.sectionTitle}>Select Falcon for Training</Text>
            <Text style={styles.subtitle}>Choose a falcon to track during races</Text>
            {falcons.length === 0 ? (
              <Text style={styles.emptyText}>No falcons registered. Register one first.</Text>
            ) : (
              <>
                <TextInput style={styles.searchInput} placeholder="Search falcon..." placeholderTextColor={COLORS.surfaceBg} value={searchQuery} onChangeText={setSearchQuery} />
                <FlatList scrollEnabled={false} data={filteredFalcons} keyExtractor={(item) => item.id} renderItem={({ item }) => (
                  <TouchableOpacity style={styles.selectCard} onPress={() => handleSelectFalcon(item)}>
                    <View>
                      <Text style={styles.selectCardName}>{item.name}</Text>
                      {item.breed && <Text style={styles.selectCardDetail}>{item.breed}</Text>}
                    </View>
                    <Text style={styles.arrow}>→</Text>
                  </TouchableOpacity>
                )} />
                {raceState.selectedFalcon && (
                  <View style={styles.banner}>
                    <Text style={styles.bannerLabel}>Selected:</Text>
                    <Text style={styles.bannerName}>{raceState.selectedFalcon.name}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBg },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.falcon },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.surfaceBg },
  tabTextActive: { color: COLORS.falcon },
  content: { flex: 1, padding: 16 },
  formContainer: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 20, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.electric, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: COLORS.surfaceBg, color: '#FFF', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontSize: 14, marginBottom: 8 },
  multilineInput: { minHeight: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: COLORS.falcon, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  listContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 16 },
  subtitle: { fontSize: 14, color: COLORS.surfaceBg, marginBottom: 16 },
  falconCard: { backgroundColor: COLORS.cardBg, borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.falcon },
  falconName: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  falconDetail: { fontSize: 13, color: COLORS.surfaceBg, marginTop: 2 },
  trainContainer: { flex: 1 },
  emptyText: { fontSize: 14, color: COLORS.surfaceBg, textAlign: 'center', paddingVertical: 20 },
  searchInput: { backgroundColor: COLORS.cardBg, color: '#FFF', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontSize: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.surfaceBg },
  selectCard: { backgroundColor: COLORS.cardBg, borderRadius: 10, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceBg },
  selectCardName: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  selectCardDetail: { fontSize: 13, color: COLORS.surfaceBg },
  arrow: { fontSize: 24, color: COLORS.falcon },
  banner: { backgroundColor: COLORS.falcon, borderRadius: 10, padding: 16, marginTop: 24 },
  bannerLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 4 },
  bannerName: { fontSize: 18, fontWeight: '700', color: '#FFF' },
});

export default RegistrationScreen;'''

try:
    with open(temp_path, 'w', encoding='utf-8') as f:
        f.write(content)
    os.replace(temp_path, path)
    print('File replaced successfully')
except Exception as e:
    print(f'Error: {e}')
