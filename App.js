// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogBox, Alert } from 'react-native';
import SplashScreen from './components/splashscreen';
import LoginScreen from './components/login';
import AppNavigator from './components/sidebar'; // Import the sidebar navigator
import { RaceProvider } from './src/context/RaceContext';
import { BleProvider } from './src/ble/BleProvider';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import Realm from 'realm';

// Suppress InteractionManager deprecation warning (from React Navigation)
LogBox.ignoreLogs(['InteractionManager has been deprecated']);

// Suppress BLE library NullPointerException spam when disconnecting
LogBox.ignoreLogs([
  'Possible unhandled promise rejection',
  'NullPointerException',
  'Parameter specified as non-null is null',
  'Non-Error exception',
  'Require cycle',
]);

const Stack = createNativeStackNavigator();

// Global error handler for unhandled promise rejections
const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
  
  global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    console.error('🔴 Global error caught:', error?.message || error);
    
    // Don't crash for non-fatal errors
    if (!isFatal) {
      console.warn('⚠️ Non-fatal error suppressed');
      return;
    }
    
    // For fatal errors, call original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  // Handle unhandled promise rejections (prevents crashes)
  if (!global.__rejectionHandlerSet) {
    global.__rejectionHandlerSet = true;
    
    const rejectionTracking = require('promise/setimmediate/rejection-tracking');
    rejectionTracking.disable();
    rejectionTracking.enable({
      allRejections: true,
      onUnhandled: (id, error) => {
        console.warn('⚠️ Unhandled promise rejection:', error?.message || error);
        // Silently log instead of crashing
      },
      onHandled: () => {},
    });
  }
};

function AppContent() {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="AppNavigator" component={AppNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <RaceProvider>
        <BleProvider>
          <AppContent />
        </BleProvider>
      </RaceProvider>
    </ErrorBoundary>
  );
}
