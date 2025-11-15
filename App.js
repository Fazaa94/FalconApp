// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './components/splashscreen';
import LoginScreen from './components/login';
import AppNavigator from './components/sidebar'; // Import the sidebar navigator
import { RaceProvider } from './src/context/RaceContext';
import { BleProvider } from './src/ble/BleProvider';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const Stack = createNativeStackNavigator();

function AppStack() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="AppNavigator" component={AppNavigator} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <RaceProvider>
        <BleProvider>
          <NavigationContainer>
            <AppStack />
          </NavigationContainer>
        </BleProvider>
      </RaceProvider>
    </ErrorBoundary>
  );
}
