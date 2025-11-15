import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRace } from '../src/context/RaceContext';
import { useBle } from '../src/ble/BleProvider';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MessagesScreen = () => {
  const { state: raceState } = useRace();
  const { isConnected } = useBle();
  const [filter, setFilter] = useState('all'); // all, status, node_msg, falcon, gps
  const [autoScroll, setAutoScroll] = useState(true);
  const flatListRef = useRef(null);

  // Debug: Log when messages arrive
  useEffect(() => {
    console.log('📊 Messages Screen - RaceState:', raceState);
    console.log('📊 Messages Screen - Total messages:', raceState?.messages?.length || 0);
    console.log('📊 Messages Screen - Is Connected:', isConnected);
    if (raceState?.messages && raceState.messages.length > 0) {
      console.log('📊 Latest 3 messages:', raceState.messages.slice(0, 3));
    }
  }, [raceState?.messages, isConnected]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && flatListRef.current && raceState.messages.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [raceState.messages.length, autoScroll]);

  // Filter messages based on type
  const allMessages = raceState.messages || [];
  const filteredMessages = filter === 'all' 
    ? allMessages 
    : allMessages.filter(msg => msg.data?.type === filter);

  // Get message type color
  const getMessageColor = (type) => {
    switch (type) {
      case 'status': return '#4ECDC4';
      case 'node_msg': return '#FFD93D';
      case 'falcon': return '#FF6B6B';
      case 'falcon_analytics': return '#6BCF7F';
      case 'gps': return '#A78BFA';
      case 'motion': return '#FB923C';
      case 'camera_msg': return '#F472B6';
      default: return '#8B92B0';
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // Render individual message
  const renderMessage = ({ item, index }) => {
    const msgType = item.data?.type || 'unknown';
    const msgColor = getMessageColor(msgType);
    
    return (
      <View style={styles.messageItem}>
        <View style={styles.messageHeader}>
          <View style={[styles.typeBadge, { backgroundColor: msgColor }]}>
            <Text style={styles.typeBadgeText}>{msgType.toUpperCase()}</Text>
          </View>
          <Text style={styles.messageTime}>{formatTime(item.ts_received)}</Text>
          {item.data?.src && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>SRC:{item.data.src}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.messageBody}>
          <Text style={styles.messageJson}>
            {JSON.stringify(item.data, null, 2)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor={COLORS.desertSand} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Live Messages</Text>
          <View style={styles.headerStats}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#4ECDC4' : '#FF6B6B' }]} />
            <Text style={styles.messageCount}>{filteredMessages.length} messages</Text>
          </View>
        </View>
        
        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'status', 'node_msg', 'falcon', 'falcon_analytics', 'gps', 'motion', 'camera_msg'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, filter === type && styles.filterButtonActive]}
              onPress={() => setFilter(type)}
            >
              <Text style={[styles.filterButtonText, filter === type && styles.filterButtonTextActive]}>
                {type === 'all' ? 'ALL' : type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="message" size={64} color="#2A3554" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            {isConnected ? 'Waiting for data from master device...' : 'Connect to master device to receive messages'}
          </Text>
          <Text style={styles.debugText}>
            Debug: Connected={isConnected ? 'YES' : 'NO'}, Messages={raceState?.messages?.length || 0}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `msg-${index}-${item.ts_received}`}
          contentContainerStyle={styles.messagesList}
          inverted
          showsVerticalScrollIndicator={true}
          onScrollBeginDrag={() => setAutoScroll(false)}
          onScrollEndDrag={(e) => {
            if (e.nativeEvent.contentOffset.y < 100) {
              setAutoScroll(true);
            }
          }}
        />
      )}

      {/* Auto-scroll toggle */}
      <TouchableOpacity
        style={[styles.autoScrollButton, autoScroll && styles.autoScrollButtonActive]}
        onPress={() => setAutoScroll(!autoScroll)}
      >
        <Icon name={autoScroll ? 'pause' : 'play-arrow'} size={20} color="#FFF" />
        <Text style={styles.autoScrollText}>{autoScroll ? 'LIVE' : 'PAUSED'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.desertSand,
  },
  header: {
    backgroundColor: COLORS.warmStone,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2E3A59',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  messageCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B92B0',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: COLORS.desertSand,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.warmStone,
  },
  filterButtonActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B92B0',
    letterSpacing: 0.5,
  },
  filterButtonTextActive: {
    color: '#0A0E27',
  },
  messagesList: {
    padding: 16,
  },
  messageItem: {
    backgroundColor: COLORS.warmStone,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E3A59',
    overflow: 'hidden',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.desertSand,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warmStone,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0A0E27',
    letterSpacing: 0.8,
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
    fontFamily: 'monospace',
  },
  sourceBadge: {
    marginLeft: 'auto',
    backgroundColor: COLORS.warmStone,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  messageBody: {
    padding: 12,
  },
  messageJson: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8B92B0',
    textAlign: 'center',
    lineHeight: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#FFD93D',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'monospace',
  },
  autoScrollButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmStone,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  autoScrollButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  autoScrollText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

export default MessagesScreen;
