// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogBox } from 'react-native';
import SplashScreen from './components/splashscreen';
import LoginScreen from './components/login';
import AppNavigator from './components/sidebar'; // Import the sidebar navigator
import { RaceProvider } from './src/context/RaceContext';
import { BleProvider } from './src/ble/BleProvider';
import Realm from 'realm';

// Suppress InteractionManager deprecation warning (from React Navigation)
LogBox.ignoreLogs(['InteractionManager has been deprecated']);

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <RaceProvider>
      <BleProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="AppNavigator" component={AppNavigator} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </BleProvider>
    </RaceProvider>
  );
}
