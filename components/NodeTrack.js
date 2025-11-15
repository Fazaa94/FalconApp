import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { COLORS } from './theme';

const { width } = Dimensions.get('window');
const TRACK_PADDING = 40;
const TRACK_WIDTH = width - TRACK_PADDING * 2;

/**
 * NodesTrackView - Horizontal track visualization (Option D)
 * Shows nodes positioned by distance with START → FINISH layout
 */
const NodesTrackView = ({ nodes, onNodePress }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'online', 'offline'
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'id', 'battery'

  // Convert nodes object to array and calculate status
  const nodeArray = useMemo(() => {
    const now = Date.now();
    return Object.entries(nodes).map(([id, node]) => {
      const timeSince = node.lastSeen ? now - node.lastSeen : Infinity;
      const isOnline = timeSince < 60000; // 60s timeout (matches firmware)
      
      return {
        ...node,
        id: parseInt(id),
        isOnline,
        timeSince,
      };
    });
  }, [nodes]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    let result = [...nodeArray];
    
    if (filter === 'online') {
      result = result.filter(n => n.isOnline);
    } else if (filter === 'offline') {
      result = result.filter(n => !n.isOnline);
    }
    
    return result;
  }, [nodeArray, filter]);

  // Sort nodes
  const sortedNodes = useMemo(() => {
    const result = [...filteredNodes];
    
    switch (sortBy) {
      case 'id':
        return result.sort((a, b) => a.id - b.id);
      case 'battery':
        return result.sort((a, b) => (b.battery || 0) - (a.battery || 0));
      case 'distance':
      default:
        return result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
  }, [filteredNodes, sortBy]);

  // Calculate track positions
  const { maxDistance, positions } = useMemo(() => {
    const distances = sortedNodes.map(n => n.distance || 0);
    const max = Math.max(...distances, 800); // Default to 800m if no distances
    
    const pos = sortedNodes.map(node => {
      const dist = node.distance || 0;
      const percentage = max > 0 ? dist / max : 0;
      return {
        ...node,
        x: percentage * TRACK_WIDTH,
      };
    });
    
    return { maxDistance: max, positions: pos };
  }, [sortedNodes]);

  const onlineCount = nodeArray.filter(n => n.isOnline).length;
  const totalCount = nodeArray.length;

  if (totalCount === 0) {
    return (
      <View style={[ss.container, { backgroundColor: COLORS.cardBg }]}>
        <Text style={[ss.title, { color: COLORS.textSecondary }]}>
          No sensor nodes detected yet
        </Text>
      </View>
    );
  }

  return (
    <View style={[ss.container, { backgroundColor: COLORS.cardBg }]}>
      {/* Header */}
      <View style={ss.header}>
        <Text style={[ss.title, { color: COLORS.textPrimary }]}>
          Track View
        </Text>
        <Text style={[ss.subtitle, { color: COLORS.electric }]}>
          {onlineCount} / {totalCount} Online
        </Text>
      </View>

      {/* Track Visualization */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={ss.trackScrollView}
        contentContainerStyle={ss.trackScrollContent}
      >
        <View style={ss.trackContainer}>
          {/* Track Line */}
          <View style={[ss.trackLine, { backgroundColor: COLORS.surfaceBg }]} />
          
          {/* START Marker */}
          <View style={[ss.trackMarker, { left: 0 }]}>
            <View style={[ss.markerDot, { backgroundColor: COLORS.falcon }]} />
            <Text style={[ss.markerLabel, { color: COLORS.textPrimary }]}>
              START
            </Text>
            <Text style={[ss.markerDistance, { color: COLORS.textSecondary }]}>
              0m
            </Text>
          </View>

          {/* Node Markers */}
          {positions.map((node) => (
            <TouchableOpacity
              key={node.id}
              style={[ss.nodeMarker, { left: node.x }]}
              onPress={() => onNodePress(node)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  ss.nodeDot,
                  {
                    backgroundColor: node.isOnline
                      ? COLORS.success
                      : COLORS.danger,
                  },
                ]}
              >
                <Text style={[ss.nodeDotText, { color: COLORS.textPrimary }]}>
                  {node.id}
                </Text>
              </View>
              <Text style={[ss.nodeLabel, { color: COLORS.textPrimary }]}>
                Node {node.id}
              </Text>
              <Text style={[ss.nodeDistance, { color: COLORS.textSecondary }]}>
                {(node.distance || 0).toFixed(0)}m
              </Text>
              {!node.isOnline && (
                <Text style={[ss.nodeOffline, { color: COLORS.danger }]}>
                  ⚠ Offline
                </Text>
              )}
            </TouchableOpacity>
          ))}

          {/* FINISH Marker */}
          <View style={[ss.trackMarker, { left: TRACK_WIDTH }]}>
            <View style={[ss.markerDot, { backgroundColor: COLORS.falcon }]} />
            <Text style={[ss.markerLabel, { color: COLORS.textPrimary }]}>
              FINISH
            </Text>
            <Text style={[ss.markerDistance, { color: COLORS.textSecondary }]}>
              {maxDistance.toFixed(0)}m
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Controls */}
      <View style={ss.controls}>
        {/* Filter */}
        <View style={ss.controlGroup}>
          <Text style={[ss.controlLabel, { color: COLORS.textSecondary }]}>
            Filter:
          </Text>
          <View style={ss.buttonGroup}>
            {['all', 'online', 'offline'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  ss.controlButton,
                  filter === f && {
                    backgroundColor: COLORS.falcon,
                  },
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    ss.controlButtonText,
                    {
                      color:
                        filter === f ? COLORS.textPrimary : COLORS.textSecondary,
                    },
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sort */}
        <View style={ss.controlGroup}>
          <Text style={[ss.controlLabel, { color: COLORS.textSecondary }]}>
            Sort:
          </Text>
          <View style={ss.buttonGroup}>
            {[
              { key: 'distance', label: 'Distance' },
              { key: 'id', label: 'ID' },
              { key: 'battery', label: 'Battery' },
            ].map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[
                  ss.controlButton,
                  sortBy === s.key && {
                    backgroundColor: COLORS.falcon,
                  },
                ]}
                onPress={() => setSortBy(s.key)}
              >
                <Text
                  style={[
                    ss.controlButtonText,
                    {
                      color:
                        sortBy === s.key
                          ? COLORS.textPrimary
                          : COLORS.textSecondary,
                    },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={ss.legend}>
        <View style={ss.legendItem}>
          <View style={[ss.legendDot, { backgroundColor: COLORS.success }]} />
          <Text style={[ss.legendText, { color: COLORS.textSecondary }]}>
            Online
          </Text>
        </View>
        <View style={ss.legendItem}>
          <View style={[ss.legendDot, { backgroundColor: COLORS.danger }]} />
          <Text style={[ss.legendText, { color: COLORS.textSecondary }]}>
            Offline
          </Text>
        </View>
        <View style={ss.legendItem}>
          <View style={[ss.legendDot, { backgroundColor: COLORS.falcon }]} />
          <Text style={[ss.legendText, { color: COLORS.textSecondary }]}>
            Start/Finish
          </Text>
        </View>
      </View>
    </View>
  );
};

const ss = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  trackScrollView: {
    marginBottom: 20,
  },
  trackScrollContent: {
    paddingHorizontal: TRACK_PADDING,
  },
  trackContainer: {
    width: TRACK_WIDTH + TRACK_PADDING * 2,
    height: 120,
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    top: 40,
    left: TRACK_PADDING,
    right: TRACK_PADDING,
    height: 4,
    borderRadius: 2,
  },
  trackMarker: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    width: 60,
    marginLeft: -30, // Center the marker
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  markerLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  markerDistance: {
    fontSize: 10,
    fontWeight: '500',
  },
  nodeMarker: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    width: 60,
    marginLeft: -30, // Center the marker
  },
  nodeDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 3,
    borderColor: COLORS.darkBg,
  },
  nodeDotText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  nodeDistance: {
    fontSize: 10,
    fontWeight: '500',
  },
  nodeOffline: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  controls: {
    gap: 12,
    marginBottom: 16,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 50,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceBg,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 53, 0.2)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default NodesTrackView;
