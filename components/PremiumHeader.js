import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, SPACING, styles as themeStyles } from './theme';
import { useBle } from '../src/ble/BleProvider';
import { useRace } from '../src/context/RaceContext';

/**
 * Premium Header Component
 * Shows connection status, battery level, and title
 * Uses gradient background for premium look
 */
const PremiumHeader = ({ title = 'FalconRace', subtitle }) => {
  const { connectedDevice } = useBle();
  const { state } = useRace();
  
  const isConnected = !!connectedDevice || state?.status?.connected;
  const battery = state?.status?.battery;
  const batteryPercent = battery ? Math.min(100, Math.max(0, ((battery - 3.0) / 1.2) * 100)) : null;
  
  // Battery color based on level
  const getBatteryColor = () => {
    if (!batteryPercent) return COLORS.textMuted;
    if (batteryPercent > 60) return '#4CAF50';
    if (batteryPercent > 30) return COLORS.sunYellow;
    return COLORS.terracotta;
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        {/* Left: Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>🦅 {title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        
        {/* Right: Status indicators */}
        <View style={styles.statusContainer}>
          {/* Connection Badge */}
          <View style={styles.connectionBadge}>
            <View style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? '#4CAF50' : COLORS.terracotta }
            ]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'CONNECTED' : 'OFFLINE'}
            </Text>
          </View>
          
          {/* Battery Indicator */}
          {battery && (
            <View style={styles.batteryContainer}>
              <View style={styles.batteryIcon}>
                <View style={[
                  styles.batteryLevel,
                  { 
                    width: `${batteryPercent || 0}%`,
                    backgroundColor: getBatteryColor()
                  }
                ]} />
              </View>
              <View style={styles.batteryTip} />
              <Text style={styles.batteryText}>
                {battery.toFixed(1)}V
              </Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  batteryIcon: {
    width: 28,
    height: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 4,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  batteryLevel: {
    height: '100%',
    borderRadius: 2,
  },
  batteryTip: {
    width: 3,
    height: 7,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    marginLeft: 1,
  },
  batteryText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 11,
    color: '#FFFFFF',
    marginLeft: 6,
  },
});

export default PremiumHeader;
