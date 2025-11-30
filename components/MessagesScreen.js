import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native';
import { COLORS, FONTS, styles } from './theme';
import { useRace } from '../src/context/RaceContext';
import realm from '../db/database';

const { height } = Dimensions.get('window');

const MessagesScreen = () => {
  const { state: raceState } = useRace();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load recent raw messages from Realm
  const [rawMessages, setRawMessages] = useState([]);
  React.useEffect(() => {
    try {
      const raws = realm.objects('RawMessage').sorted('ts', true).slice(0, 50);
      const arr = raws.map(r => ({ ts: r.ts.toISOString(), raw: r.raw }));
      setRawMessages(arr);
    } catch (e) {
      setRawMessages([]);
    }
  }, []);

  // Use rawMessages instead of raceState.messages
  const messages = rawMessages || [];

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds();
  };

  const formatJSON = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getMessageTypeColor = (msg) => {
    const type = msg?.raw?.type || msg?.type;
    switch (type) {
      case 'system_status': return COLORS.cobaltBlue;
      case 'race': return COLORS.oasisGreen;
      case 'falcon': return COLORS.terracotta;
      case 'motion': return '#FF9800';
      case 'gps': return '#9C27B0';
      case 'camera_status': return '#00BCD4';
      case 'node_msg': return '#607D8B';
      default: return COLORS.charcoal;
    }
  };

  const getMessageType = (msg) => {
    return msg?.raw?.type || msg?.type || 'unknown';
  };

  const handleMessagePress = (msg) => {
    setSelectedMessage(msg);
    setShowModal(true);
  };

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
      
      <View style={localStyles.header}>
        <Text style={localStyles.headerTitle}>ESP Board Messages</Text>
        <Text style={localStyles.headerSubtitle}>
          {messages.length} message{messages.length !== 1 ? 's' : ''} received
        </Text>
      </View>

      <ScrollView 
        style={localStyles.messagesList}
        contentContainerStyle={localStyles.messagesContent}
      >
        {messages.length === 0 ? (
          <View style={localStyles.emptyState}>
            <Text style={localStyles.emptyIcon}>📭</Text>
            <Text style={localStyles.emptyText}>No messages received yet</Text>
            <Text style={localStyles.emptyHint}>Connect to ESP board to see messages</Text>
          </View>
        ) : (
          messages.slice().reverse().map((msg, index) => {
            const messageType = getMessageType(msg);
            const typeColor = getMessageTypeColor(msg);
            
            return (
              <TouchableOpacity
                key={index}
                style={localStyles.messageCard}
                onPress={() => handleMessagePress(msg)}
                activeOpacity={0.7}
              >
                <View style={localStyles.messageHeader}>
                  <View style={[localStyles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                    <Text style={[localStyles.typeBadgeText, { color: typeColor }]}>
                      {messageType.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={localStyles.timestamp}>
                    {formatTimestamp(msg.ts || Date.now())}
                  </Text>
                </View>
                
                <View style={localStyles.messagePreview}>
                  <Text style={localStyles.previewText} numberOfLines={3}>
                    {formatJSON(msg.raw || msg)}
                  </Text>
                </View>
                
                <View style={localStyles.messageFooter}>
                  <Text style={localStyles.tapHint}>Tap to view full message</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Full Message Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <View style={localStyles.modalHeader}>
              <Text style={localStyles.modalTitle}>Message Details</Text>
              <TouchableOpacity
                style={localStyles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={localStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={localStyles.modalBody}>
              {selectedMessage && (
                <>
                  <View style={localStyles.modalSection}>
                    <Text style={localStyles.modalLabel}>Type:</Text>
                    <View style={[
                      localStyles.typeBadge, 
                      { backgroundColor: getMessageTypeColor(selectedMessage) + '20', alignSelf: 'flex-start' }
                    ]}>
                      <Text style={[
                        localStyles.typeBadgeText, 
                        { color: getMessageTypeColor(selectedMessage) }
                      ]}>
                        {getMessageType(selectedMessage).toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={localStyles.modalSection}>
                    <Text style={localStyles.modalLabel}>Timestamp:</Text>
                    <Text style={localStyles.modalValue}>
                      {formatTimestamp(selectedMessage.ts || Date.now())}
                    </Text>
                  </View>

                  <View style={localStyles.modalSection}>
                    <Text style={localStyles.modalLabel}>Full Message:</Text>
                    <View style={localStyles.jsonContainer}>
                      <Text style={localStyles.jsonText}>
                        {formatJSON(selectedMessage.raw || selectedMessage)}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const localStyles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 22,
    color: COLORS.cobaltBlue,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 13,
    color: COLORS.charcoal + 'AA',
  },
  messagesList: {
    flex: 1,
    backgroundColor: COLORS.warmStone,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 18,
    color: COLORS.charcoal,
    marginBottom: 8,
  },
  emptyHint: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal + '80',
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  timestamp: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.charcoal + '80',
  },
  messagePreview: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.charcoal,
    lineHeight: 18,
  },
  messageFooter: {
    alignItems: 'center',
  },
  tapHint: {
    fontFamily: FONTS.montserratBold,
    fontSize: 11,
    color: COLORS.cobaltBlue,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 20,
    color: COLORS.cobaltBlue,
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.terracotta + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.terracotta,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.charcoal,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalValue: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal + 'CC',
  },
  jsonContainer: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#D4D4D4',
    lineHeight: 18,
  },
});

export default MessagesScreen;
