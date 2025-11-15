import { StyleSheet } from 'react-native';

// Modern Falcon Racing Theme - Contemporary UAE Desert Style
export const COLORS = {
  // Primary Backgrounds - Burgundy Red & Cream
  primary: '#8B2835',         // Burgundy red (main background)
  primaryDark: '#6B1A22',     // Darker burgundy
  primaryLight: '#A0252F',    // Lighter burgundy
  
  // Card Backgrounds
  cardBg: '#FFFFFF',          // White cards for contrast
  cardSecondary: '#F8F9FA',   // Light gray card variant
  surfaceBg: '#F5E6D3',       // Cream surface
  
  // Accent Colors - Modern & Bold
  accent: '#DC3545',          // Modern red accent
  accentGreen: '#28A745',     // Success green
  accentBlue: '#007BFF',      // Info blue
  warning: '#FFC107',         // Amber warning
  danger: '#DC3545',          // Danger red
  
  // Status Colors
  success: '#28A745',         // Green success
  error: '#DC3545',           // Red error
  info: '#17A2B8',           // Cyan info
  
  // Text Colors - Modern Hierarchy
  textPrimary: '#1A1A1A',     // Almost black for main text
  textSecondary: '#6C757D',   // Gray for secondary text
  textMuted: '#ADB5BD',       // Light gray for muted text
  textWhite: '#FFFFFF',       // White text
  textCream: '#F5E6D3',       // Cream text for dark backgrounds
  
  // Border Colors
  border: '#E9ECEF',          // Light gray border
  borderDark: '#DEE2E6',      // Slightly darker border
  
  // Special Colors
  falcon: '#8B2835',          // Burgundy for falcon theme
  desert: '#F5E6D3',          // Desert cream
  gold: '#FFD700',            // Gold accent
  
  // Legacy (kept for compatibility)
  darkBg: '#1A1A1A',
  electric: '#007BFF',
  white: '#FFFFFF',
  desertSand: '#F5E6C3',
  warmStone: '#E6D9B8',
  charcoal: '#1C1C1C',
  cobaltBlue: '#007BFF',
  oasisGreen: '#28A745',
  terracotta: '#8B2835',
  sunYellow: '#FFC107',
  successGreen: '#28A745',
  red: '#DC3545',
  offlineGray: '#6C757D',      // Added missing property
  warningYellow: '#FFC107',    // Added missing property
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  semibold: 'System',
  
  // Legacy font names (fallback to System)
  montserratRegular: 'System',
  montserratMedium: 'System',
  montserratBold: 'System',
  orbitronBold: 'System',
};

// Modern spacing scale (8px base)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Modern border radius scale
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadow presets
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.desertSand,
    padding: SPACING.lg,
  },
  screenLight: {
    flex: 1,
    backgroundColor: COLORS.surfaceBg,
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  cardSecondary: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: FONTS.semibold,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
  },
  label: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  number: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  button: {
    backgroundColor: COLORS.accentGreen,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
    letterSpacing: 0.5,
  },
});
