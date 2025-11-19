import { StyleSheet } from 'react-native';

export const COLORS = {
  desertSand: '#F5E6C5',
  warmStone: '#E6D9B8',
  charcoal: '#1C1C1C',
  cobaltBlue: '#1565C0',
  oasisGreen: '#2E7D32',
  terracotta: '#C1440E',
  sunYellow: '#F9A825',
};

export const FONTS = {
  montserratRegular: 'Montserrat-Regular',
  montserratBold: 'Montserrat-Bold',
  orbitronBold: 'Orbitron-Bold',
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.desertSand,
    padding: 16,
  },
  title: {
    fontFamily: FONTS.montserratBold,
    fontSize: 24,
    color: COLORS.charcoal,
  },
  number: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 20,
    color: COLORS.cobaltBlue,
  },
});
