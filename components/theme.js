import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Light Theme Colors
export const COLORS = {
  // Primary Palette
  desertSand: '#F5E6C5',
  warmStone: '#E6D9B8',
  charcoal: '#1C1C1C',
  cobaltBlue: '#1565C0',
  oasisGreen: '#2E7D32',
  terracotta: '#C1440E',
  sunYellow: '#F9A825',
  
  // Status Colors (always use these for consistent meaning)
  statusOnline: '#2E7D32',    // Same as oasisGreen - means "good/online/ready"
  statusWarning: '#F9A825',   // Same as sunYellow - means "weak/caution"
  statusOffline: '#C1440E',   // Same as terracotta - means "error/offline"
  statusInfo: '#1565C0',      // Same as cobaltBlue - means "info/neutral"
  
  // UI Colors
  cardBg: '#FFFFFF',
  cardBorder: '#E6D9B8',      // warmStone for subtle borders
  inputBg: '#F5E6C5',         // desertSand for input backgrounds
  textMuted: '#666666',
  
  // Premium Gradient Colors
  gradientStart: '#1565C0',   // cobaltBlue
  gradientEnd: '#0D47A1',     // darker blue
  gradientGold: '#FFD700',    // gold accent
  gradientSuccess: '#43A047', // bright green
  
  // Dark Mode Colors (for future use)
  darkBg: '#121212',
  darkCard: '#1E1E1E',
  darkCardBorder: '#2D2D2D',
  darkText: '#FFFFFF',
  darkTextMuted: '#B0B0B0',
};

// Dark Theme Colors
export const DARK_COLORS = {
  ...COLORS,
  desertSand: '#121212',
  warmStone: '#1E1E1E',
  cardBg: '#1E1E1E',
  cardBorder: '#2D2D2D',
  charcoal: '#FFFFFF',
  textMuted: '#B0B0B0',
  inputBg: '#2D2D2D',
};

export const FONTS = {
  montserratRegular: 'Montserrat-Regular',
  montserratBold: 'Montserrat-Bold',
  orbitronBold: 'Orbitron-Bold',
};

// Consistent spacing values
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Consistent border radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 50,
};

// Shared styles for consistency across screens
export const styles = StyleSheet.create({
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: COLORS.desertSand,
  },
  
  // Cards - consistent look everywhere
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Section titles - always the same
  sectionTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  
  // Page titles
  pageTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 22,
    color: COLORS.charcoal,
  },
  
  // Numbers - always Orbitron
  number: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 24,
    color: COLORS.cobaltBlue,
  },
  numberLarge: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 36,
    color: COLORS.cobaltBlue,
  },
  numberSmall: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 16,
    color: COLORS.cobaltBlue,
  },
  
  // Buttons - pill shaped, big touch target
  buttonPrimary: {
    backgroundColor: COLORS.cobaltBlue,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonSuccess: {
    backgroundColor: COLORS.oasisGreen,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDanger: {
    backgroundColor: COLORS.terracotta,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Status badges - rounded, colored backgrounds
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOnline: {
    backgroundColor: COLORS.statusOnline + '20',
  },
  badgeWarning: {
    backgroundColor: COLORS.statusWarning + '20',
  },
  badgeOffline: {
    backgroundColor: COLORS.statusOffline + '20',
  },
  badgeText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
  },
  
  // Status dots
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotOnline: {
    backgroundColor: COLORS.statusOnline,
  },
  statusDotWarning: {
    backgroundColor: COLORS.statusWarning,
  },
  statusDotOffline: {
    backgroundColor: COLORS.statusOffline,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyStateText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.cobaltBlue,
    textAlign: 'center',
  },
  
  // Input fields
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal,
  },
  inputLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  
  // Row layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // === PREMIUM UI STYLES ===
  
  // Premium Header
  premiumHeader: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  premiumHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumHeaderTitle: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  premiumHeaderSubtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  
  // Connection Badge
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    fontSize: 11,
    color: '#FFFFFF',
  },
  
  // Battery Indicator
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  batteryIcon: {
    width: 24,
    height: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 3,
    padding: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryLevel: {
    height: '100%',
    borderRadius: 1,
  },
  batteryTip: {
    width: 3,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    marginLeft: 1,
  },
  batteryText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  
  // Premium Cards
  premiumCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0,
  },
  premiumCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  premiumCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  premiumCardTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    letterSpacing: 0.3,
  },
  
  // Big Timer Display
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  timerDisplay: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 56,
    color: COLORS.cobaltBlue,
    letterSpacing: 2,
  },
  timerLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  timerRunning: {
    color: COLORS.oasisGreen,
  },
  timerStopped: {
    color: COLORS.terracotta,
  },
  
  // Falcon Cards Premium
  falconCardPremium: {
    width: 130,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  falconCardPremiumSelected: {
    borderColor: COLORS.oasisGreen,
    backgroundColor: COLORS.oasisGreen + '10',
  },
  falconAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.cobaltBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  falconAvatarSelected: {
    backgroundColor: COLORS.oasisGreen + '20',
  },
  falconAvatarEmoji: {
    fontSize: 32,
  },
  falconNamePremium: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 2,
  },
  falconBreedPremium: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  falconCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.oasisGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Node Grid
  nodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    padding: SPACING.md,
  },
  nodeGridItem: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeGridOnline: {
    borderWidth: 2,
    borderColor: COLORS.oasisGreen,
  },
  nodeGridOffline: {
    borderWidth: 2,
    borderColor: COLORS.terracotta + '40',
    opacity: 0.6,
  },
  nodeGridNumber: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 20,
    color: COLORS.cobaltBlue,
  },
  nodeGridLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  nodeGridDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Action Buttons Premium
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 100,
  },
  actionButtonStart: {
    backgroundColor: COLORS.oasisGreen,
    shadowColor: COLORS.oasisGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonStop: {
    backgroundColor: COLORS.terracotta,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonStatus: {
    backgroundColor: COLORS.cobaltBlue,
    shadowColor: COLORS.cobaltBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.cobaltBlue + '08',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statBoxValue: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 22,
    color: COLORS.cobaltBlue,
  },
  statBoxLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statBoxIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  
  // Empty State Premium
  emptyStatePremium: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateIconPremium: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyStateTitlePremium: {
    fontFamily: FONTS.montserratBold,
    fontSize: 18,
    color: COLORS.charcoal,
    marginBottom: 8,
  },
  emptyStateSubtextPremium: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 250,
  },
});

// Screen Width export for responsive layouts
export { SCREEN_WIDTH };