import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  StatusBar
} from 'react-native';
import { styles, COLORS, FONTS } from './theme';
import realm from '../db/database';

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appVersion] = useState('2.0.0');
  const [buildInfo] = useState('FalconRace ESP32 Edition');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Basic password validation
    if (password.length < 3) {
      Alert.alert('Error', 'Password must be at least 3 characters');
      return;
    }

    setIsLoading(true);

    // Simulate authentication process
    setTimeout(() => {
      setIsLoading(false);

      // Replace with your real authentication logic
      if (email && password) {
        try {
          realm.write(() => {
            // Clear old sessions
            let existing = realm.objects('UserSession');
            realm.delete(existing);

            // Save new session with additional info
            realm.create('UserSession', {
              id: 1,
              email: email.toLowerCase().trim(),
              isLoggedIn: true,
              loginTime: new Date(),
              appVersion: appVersion
            });

            // Log login event for analytics
            realm.create('AppEvent', {
              id: Date.now().toString(),
              type: 'user_login',
              timestamp: new Date(),
              details: `User ${email} logged in`,
              synced: false
            });
          });

          Alert.alert(
            'Welcome to FalconRace!', 
            'Successfully logged in\n\nESP32 Master Control Ready\nLoRa Mesh Network Available',
            [{ text: 'Continue', onPress: () => navigateToApp() }]
          );
        } catch (err) {
          console.log('Realm write error:', err);
          Alert.alert('Error', 'Failed to save session data');
        }
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    }, 1500);
  };

  const navigateToApp = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'AppNavigator' }],
    });
  };

  useEffect(() => {
    const checkSession = () => {
      try {
        const session = realm.objects('UserSession').filtered('isLoggedIn == true');
        if (session.length > 0) {
          console.log('Found active session for:', session[0].email);
          navigateToApp();
        }
      } catch (error) {
        console.log('Session check error:', error);
      }
    };
    
    checkSession();
  }, []);

  const handleForgotPassword = () => {
    Alert.alert(
      'Account Recovery', 
      'Please contact system administrator for password reset.\n\nSupport: admin@falconrace.com',
      [{ text: 'OK' }]
    );
  };

  const handleDemoLogin = () => {
    setEmail('trainer@falconrace.com');
    setPassword('demo123');
    Alert.alert(
      'Demo Credentials Loaded',
      'Demo credentials have been pre-filled. Tap LOGIN to continue.',
      [{ text: 'OK' }]
    );
  };

  const handleSystemInfo = () => {
    Alert.alert(
      'FalconRace System Info',
      `Version: ${appVersion}\nBuild: ${buildInfo}\n\nHardware Support:\n• ESP32 T-Beam Master\n• LoRa RFM95 433MHz\n• OpenMX Camera Module\n• GPS NEO-6M/7M\n• BLE Connectivity\n\nDatabase: Realm Local Storage`,
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={loginStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={loginStyles.header}>
          <View style={loginStyles.logoContainer}>
            <Image
              source={require('../assets/caninelogo.png')}
              style={loginStyles.logoImage}
              resizeMode="contain"
            />
            <View style={loginStyles.logoTextContainer}>
              <Text style={loginStyles.logoText}>FalconRace</Text>
              <Text style={loginStyles.logoSubtitle}>ESP32 Control System</Text>
            </View>
          </View>
          <Text style={loginStyles.subtitle}>Professional Falcon Racing & Training Platform</Text>
        </View>

        {/* Login Form */}
        <View style={loginStyles.formContainer}>
          <Text style={loginStyles.formTitle}>Master Control Login</Text>
          <Text style={loginStyles.formSubtitle}>Access ESP32 Falcon Tracking System</Text>
          
          {/* Email Input */}
          <View style={loginStyles.inputContainer}>
            <Text style={loginStyles.inputLabel}>Email Address</Text>
            <TextInput
              style={loginStyles.input}
              placeholder="Enter your registered email"
              placeholderTextColor={COLORS.charcoal + '80'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={loginStyles.inputContainer}>
            <Text style={loginStyles.inputLabel}>Password</Text>
            <TextInput
              style={loginStyles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.charcoal + '80'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              editable={!isLoading}
              onSubmitEditing={handleLogin}
            />
          </View>

          {/* Action Buttons */}
          <View style={loginStyles.actionButtons}>
            <TouchableOpacity 
              style={loginStyles.demoButton}
              onPress={handleDemoLogin}
              disabled={isLoading}
            >
              <Text style={loginStyles.demoButtonText}>LOAD DEMO CREDENTIALS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={loginStyles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={loginStyles.forgotPasswordText}>Need Help Accessing?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              loginStyles.loginButton,
              isLoading && loginStyles.loginButtonDisabled,
              (!email || !password) && loginStyles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <View style={loginStyles.loadingContainer}>
                <Text style={loginStyles.loginButtonText}>AUTHENTICATING...</Text>
              </View>
            ) : (
              <Text style={loginStyles.loginButtonText}>
                {email && password ? 'ACCESS FALCONRACE SYSTEM' : 'ENTER CREDENTIALS'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Quick Info */}
          <View style={loginStyles.quickInfo}>
            <Text style={loginStyles.quickInfoText}>
              🦅 Real-time Falcon Tracking{'\n'}
              📡 LoRa Mesh Network{'\n'}
              🎯 ESP32 Master Control{'\n'}
              📷 Motion Detection{'\n'}
              🛰️ GPS Positioning
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={loginStyles.footer}>
          <TouchableOpacity onPress={handleSystemInfo}>
            <Text style={loginStyles.footerText}>
              FalconRace Control System v{appVersion}
            </Text>
          </TouchableOpacity>
          <Text style={loginStyles.footerSubtext}>
            ESP32 Hardware • LoRa Connectivity • Professional Racing Platform
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const loginStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 60,
    height: 70,
    marginRight: 16,
  },
  logoTextContainer: {
    alignItems: 'flex-start',
  },
  logoText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 32,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  logoSubtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.cobaltBlue,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal + 'CC',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: COLORS.warmStone,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 8,
    shadowColor: COLORS.charcoal,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 24,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.desertSand,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  demoButton: {
    backgroundColor: COLORS.cobaltBlue + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cobaltBlue,
  },
  demoButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: COLORS.cobaltBlue,
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.cobaltBlue,
  },
  loginButton: {
    backgroundColor: COLORS.oasisGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.oasisGreen,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.offlineGray,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.desertSand,
    fontWeight: '700',
  },
  quickInfo: {
    backgroundColor: COLORS.desertSand,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  quickInfoText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 13,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.cobaltBlue,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '60',
    textAlign: 'center',
    lineHeight: 16,
  },
});

// ✅ ONLY ONE export default - at the very end
export default LoginScreen;