import React, { useState ,useEffect} from 'react';
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
  Image
} from 'react-native';
import { styles, COLORS, FONTS } from './theme'; // Adjust import path
import realm from '../db/database'; // Adjust path to your Realm instance

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  setIsLoading(true);

  setTimeout(() => {
    setIsLoading(false);

    // Replace with your real authentication logic
    if (email && password) {
      try {
        realm.write(() => {
          // Clear old sessions
          let existing = realm.objects('UserSession');
          realm.delete(existing);

          // Save new session
          realm.create('UserSession', {
            id: 1,
            email: email,
            isLoggedIn: true,
          });
        });

        Alert.alert('Success', 'Welcome back!');
        navigation.reset({
          index: 0,
          routes: [{ name: 'AppNavigator' }],
        });
      } catch (err) {
        console.log('Realm write error:', err);
      }
    } else {
      Alert.alert('Error', 'Invalid credentials');
    }
  }, 1500);
};


useEffect(() => {
  const checkSession = () => {
    const session = realm.objects('UserSession').filtered('isLoggedIn == true');
    if (session.length > 0) {
      navigation.replace('AppNavigator');
    }
  };
  checkSession();
}, []);


  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset feature coming soon!');
  };

  const handleSignUp = () => {
    Alert.alert('Sign Up', 'Registration feature coming soon!');
    // navigation.navigate('SignUp');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={loginStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
       {/* Header Section */}
<View style={loginStyles.header}>
  <View style={loginStyles.logoContainer}>
    <Image
      source={require('../assets/caninelogo.png')}
      style={loginStyles.logoImage}
      resizeMode="contain"
    />
    <Text style={loginStyles.logoText}>Falcon Tracker</Text>
  </View>
  <Text style={loginStyles.subtitle}>Track your falcon's performance</Text>
</View>

        {/* Login Form */}
        <View style={loginStyles.formContainer}>
          <Text style={loginStyles.formTitle}>Welcome Back</Text>
          
          {/* Email Input */}
          <View style={loginStyles.inputContainer}>
            <Text style={loginStyles.inputLabel}>Email</Text>
            <TextInput
              style={loginStyles.input}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.charcoal + '80'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
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
            />
          </View>

          {/* Forgot Password */}
          {/* <TouchableOpacity 
            style={loginStyles.forgotPasswordContainer}
            onPress={handleForgotPassword}
          >
            <Text style={loginStyles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity> */}

          {/* Login Button */}
          <TouchableOpacity
            style={[
              loginStyles.loginButton,
              isLoading && loginStyles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={loginStyles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          {/* <View style={loginStyles.dividerContainer}>
            <View style={loginStyles.divider} />
            <Text style={loginStyles.dividerText}>or</Text>
            <View style={loginStyles.divider} />
          </View>

          {/* Sign Up Option */}
          {/* <View style={loginStyles.signUpContainer}>
            <Text style={loginStyles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={loginStyles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View> */} 
        </View>

        {/* Footer */}
        <View style={loginStyles.footer}>
          <Text style={loginStyles.footerText}>
            Track Race, Training of your falcon companion
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
    paddingVertical: 60,
  }
  ,logoImage: {
  width: 50,       // adjust size as needed
  height: 60,
  marginRight: 12,
},

  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  logoText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 28,
    color: COLORS.charcoal,
  },
  subtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 16,
    color: COLORS.charcoal + 'CC',
    textAlign: 'center',
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
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  formTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 22,
    color: COLORS.charcoal,
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
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
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 18,
    color: COLORS.desertSand,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.charcoal + '40',
  },
  dividerText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal + '80',
    marginHorizontal: 16,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal,
  },
  signUpLink: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.terracotta,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 14,
    color: COLORS.charcoal + '80',
    textAlign: 'center',
    lineHeight: 20,
  },
});