// screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator,Image } from 'react-native';
import { COLORS, FONTS } from './theme';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000); // 2 sec splash

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}> 
       <Image 
        source={require('../assets/caninelogo.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />

      <Text style={styles.title}>FalconRace</Text>
      <ActivityIndicator size="large" color={COLORS.oasisGreen} style={{ marginTop: 30 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.desertSand,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
    logo: {
    width: 120,       // adjust size as needed
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 32,
    color: COLORS.terracotta,
  },
  subtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal,
    marginTop: 8,
  },
});
