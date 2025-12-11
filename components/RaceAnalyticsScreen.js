// RaceAnalyticsScreen.js - Race Performance Analytics with Graphs
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import realm from '../db/database';
import { COLORS, FONTS, SPACING, RADIUS } from './theme';
import { formatTime } from '../src/utils/parser';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RaceAnalyticsScreen = ({ navigation }) => {
  const [races, setRaces] = useState([]);
  const [selectedFalcon, setSelectedFalcon] = useState(null);
  const [falconList, setFalconList] = useState([]);
  const [timeFilter, setTimeFilter] = useState('week'); // 'week', 'month', 'all'
  const [stats, setStats] = useState({
    totalRaces: 0,
    avgSpeed: 0,
    bestTime: null,
    totalDistance: 0,
    improvement: 0,
  });

  // Load races when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadRaces();
      loadFalcons();
    }, [timeFilter, selectedFalcon])
  );

  const loadFalcons = () => {
    try {
      const falcons = realm.objects('FalconRegistration').sorted('falconName');
      setFalconList([...falcons]);
    } catch (err) {
      console.error('❌ Failed to load falcons:', err);
    }
  };

  const loadRaces = () => {
    try {
      let query = realm.objects('RaceResults').sorted('raceDate', true);
      
      // Filter by falcon if selected
      if (selectedFalcon) {
        query = query.filtered('falconName == $0', selectedFalcon);
      }
      
      // Filter by time
      const now = new Date();
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.filtered('raceDate >= $0', weekAgo);
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.filtered('raceDate >= $0', monthAgo);
      }
      
      const raceData = [...query];
      setRaces(raceData);
      calculateStats(raceData);
    } catch (err) {
      console.error('❌ Failed to load races:', err);
    }
  };

  const calculateStats = (raceData) => {
    if (raceData.length === 0) {
      setStats({ totalRaces: 0, avgSpeed: 0, bestTime: null, totalDistance: 0, improvement: 0 });
      return;
    }

    const totalRaces = raceData.length;
    const avgSpeed = raceData.reduce((sum, r) => sum + (r.averageSpeed || 0), 0) / totalRaces;
    const bestTime = Math.min(...raceData.map(r => r.completionTime || Infinity));
    const totalDistance = raceData.reduce((sum, r) => sum + (r.trackLength || 0), 0);
    
    // Calculate improvement (compare first half vs second half of races)
    let improvement = 0;
    if (raceData.length >= 2) {
      const sortedByDate = [...raceData].sort((a, b) => new Date(a.raceDate) - new Date(b.raceDate));
      const midpoint = Math.floor(sortedByDate.length / 2);
      const firstHalf = sortedByDate.slice(0, midpoint);
      const secondHalf = sortedByDate.slice(midpoint);
      
      const firstAvg = firstHalf.reduce((sum, r) => sum + (r.averageSpeed || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, r) => sum + (r.averageSpeed || 0), 0) / secondHalf.length;
      
      if (firstAvg > 0) {
        improvement = ((secondAvg - firstAvg) / firstAvg) * 100;
      }
    }

    setStats({
      totalRaces,
      avgSpeed,
      bestTime: bestTime === Infinity ? null : bestTime,
      totalDistance,
      improvement,
    });
  };

  // Get daily race counts for the bar chart
  const getDailyRaceCounts = () => {
    const dailyCounts = {};
    const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 60;
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyCounts[key] = { count: 0, avgSpeed: 0, speeds: [] };
    }
    
    // Count races per day
    races.forEach(race => {
      const key = new Date(race.raceDate).toISOString().split('T')[0];
      if (dailyCounts[key]) {
        dailyCounts[key].count++;
        dailyCounts[key].speeds.push(race.averageSpeed || 0);
      }
    });
    
    // Calculate average speed per day
    Object.keys(dailyCounts).forEach(key => {
      if (dailyCounts[key].speeds.length > 0) {
        dailyCounts[key].avgSpeed = dailyCounts[key].speeds.reduce((a, b) => a + b, 0) / dailyCounts[key].speeds.length;
      }
    });
    
    return Object.entries(dailyCounts)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-7); // Show last 7 days
  };

  // Get speed trend data
  const getSpeedTrend = () => {
    return races
      .slice(0, 10)
      .reverse()
      .map((race, index) => ({
        index,
        speed: race.averageSpeed || 0,
        date: new Date(race.raceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));
  };

  const dailyData = getDailyRaceCounts();
  const speedTrend = getSpeedTrend();
  const maxSpeed = Math.max(...speedTrend.map(d => d.speed), 1);
  const maxDailyCount = Math.max(...dailyData.map(([_, d]) => d.count), 1);

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.cobaltBlue} barStyle="light-content" />
      
      {/* Premium Header */}
      <LinearGradient
        colors={[COLORS.cobaltBlue, '#0D47A1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>📊 Race Analytics</Text>
            <Text style={styles.headerSubtitle}>Performance Insights</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeValue}>{stats.totalRaces}</Text>
              <Text style={styles.statBadgeLabel}>RACES</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Time Filter */}
        <View style={styles.filterRow}>
          {['week', 'month', 'all'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, timeFilter === filter && styles.filterButtonActive]}
              onPress={() => setTimeFilter(filter)}
            >
              <Text style={[styles.filterText, timeFilter === filter && styles.filterTextActive]}>
                {filter === 'week' ? '7 Days' : filter === 'month' ? '30 Days' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Falcon Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.falconFilter}>
          <TouchableOpacity
            style={[styles.falconChip, !selectedFalcon && styles.falconChipActive]}
            onPress={() => setSelectedFalcon(null)}
          >
            <Text style={[styles.falconChipText, !selectedFalcon && styles.falconChipTextActive]}>All Falcons</Text>
          </TouchableOpacity>
          {falconList.map((falcon) => (
            <TouchableOpacity
              key={falcon.id}
              style={[styles.falconChip, selectedFalcon === falcon.falconName && styles.falconChipActive]}
              onPress={() => setSelectedFalcon(falcon.falconName)}
            >
              <Text style={[styles.falconChipText, selectedFalcon === falcon.falconName && styles.falconChipTextActive]}>
                🦅 {falcon.falconName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statValue}>{stats.avgSpeed.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg km/h</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{stats.bestTime ? formatTime(stats.bestTime) : '--'}</Text>
            <Text style={styles.statLabel}>Best Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📏</Text>
            <Text style={styles.statValue}>{(stats.totalDistance / 1000).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Total km</Text>
          </View>
          <View style={[styles.statCard, stats.improvement >= 0 ? styles.statCardPositive : styles.statCardNegative]}>
            <Text style={styles.statIcon}>{stats.improvement >= 0 ? '📈' : '📉'}</Text>
            <Text style={styles.statValue}>{stats.improvement >= 0 ? '+' : ''}{stats.improvement.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>

        {/* Daily Races Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📅 Daily Race Activity</Text>
          <View style={styles.barChart}>
            {dailyData.map(([date, data], index) => {
              const height = maxDailyCount > 0 ? (data.count / maxDailyCount) * 100 : 0;
              const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <View key={date} style={styles.barContainer}>
                  <Text style={styles.barValue}>{data.count > 0 ? data.count : ''}</Text>
                  <View style={styles.barWrapper}>
                    <View style={[styles.bar, { height: `${Math.max(height, 5)}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Speed Trend Line Chart (using bars) */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>🚀 Speed Trend (Last 10 Races)</Text>
          {speedTrend.length > 0 ? (
            <View style={styles.lineChart}>
              {speedTrend.map((data, index) => {
                const height = maxSpeed > 0 ? (data.speed / maxSpeed) * 100 : 0;
                return (
                  <View key={index} style={styles.lineBarContainer}>
                    <Text style={styles.lineBarValue}>{data.speed.toFixed(0)}</Text>
                    <View style={styles.lineBarWrapper}>
                      <LinearGradient
                        colors={[COLORS.oasisGreen, COLORS.cobaltBlue]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[styles.lineBar, { height: `${Math.max(height, 5)}%` }]}
                      />
                    </View>
                    <Text style={styles.lineBarLabel}>{data.date}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartIcon}>📊</Text>
              <Text style={styles.emptyChartText}>No race data yet</Text>
            </View>
          )}
        </View>

        {/* Recent Races List */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>🏁 Recent Races</Text>
          {races.slice(0, 5).map((race, index) => (
            <View key={race.id || index} style={styles.raceItem}>
              <View style={styles.raceRank}>
                <Text style={styles.raceRankText}>{index + 1}</Text>
              </View>
              <View style={styles.raceInfo}>
                <Text style={styles.raceFalcon}>🦅 {race.falconName || 'Unknown'}</Text>
                <Text style={styles.raceDate}>
                  {new Date(race.raceDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={styles.raceStats}>
                <Text style={styles.raceTime}>{formatTime(race.completionTime)}</Text>
                <Text style={styles.raceSpeed}>{(race.averageSpeed || 0).toFixed(1)} km/h</Text>
              </View>
            </View>
          ))}
          {races.length === 0 && (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartIcon}>🦅</Text>
              <Text style={styles.emptyChartText}>No races completed yet</Text>
              <Text style={styles.emptyChartSubtext}>Complete a race to see analytics</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.desertSand,
  },
  premiumHeader: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {},
  headerTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerRight: {},
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  statBadgeValue: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  statBadgeLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  
  // Filters
  filterRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.warmStone,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.cobaltBlue,
  },
  filterText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.charcoal,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  falconFilter: {
    marginBottom: SPACING.md,
  },
  falconChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.warmStone,
    marginRight: 8,
  },
  falconChipActive: {
    backgroundColor: COLORS.oasisGreen,
  },
  falconChipText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.charcoal,
  },
  falconChipTextActive: {
    color: '#FFFFFF',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    marginHorizontal: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardPositive: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.oasisGreen,
  },
  statCardNegative: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.terracotta,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 20,
    color: COLORS.charcoal,
  },
  statLabel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: SPACING.md,
  },

  // Bar Chart
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barWrapper: {
    width: '80%',
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: COLORS.cobaltBlue,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  barValue: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: COLORS.cobaltBlue,
    marginBottom: 4,
    height: 14,
  },
  barLabel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Line Chart (Speed Trend)
  lineChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  lineBarContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  lineBarWrapper: {
    width: '90%',
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  lineBar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  lineBarValue: {
    fontFamily: FONTS.montserratBold,
    fontSize: 8,
    color: COLORS.oasisGreen,
    marginBottom: 2,
    height: 12,
  },
  lineBarLabel: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 7,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Empty State
  emptyChart: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyChartIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyChartText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  emptyChartSubtext: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Race List
  raceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.desertSand,
  },
  raceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cobaltBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  raceRankText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 14,
    color: COLORS.cobaltBlue,
  },
  raceInfo: {
    flex: 1,
  },
  raceFalcon: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  raceDate: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  raceStats: {
    alignItems: 'flex-end',
  },
  raceTime: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 14,
    color: COLORS.oasisGreen,
  },
  raceSpeed: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

export default RaceAnalyticsScreen;
