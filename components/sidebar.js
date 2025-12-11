import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  StyleSheet,
} from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/FontAwesome5'; // ✅ FontAwesome5 icons
import { COLORS, FONTS } from './theme';

import RegistrationScreen from './registrationscreen';
import DashboardScreen from './dashboard';
import RaceControlScreen from './racecontrol';
import TrainingControl from './TrainingControlScreen';
import Animals from './RegisteredAnimals';
import MessagesScreen from './MessagesScreen';
import RaceAnalyticsScreen from './RaceAnalyticsScreen';
import realm from '../db/database';

const Drawer = createDrawerNavigator();

// 🧭 Custom Drawer Content
function CustomDrawerContent(props) {
  const [activeRoute, setActiveRoute] = useState('Dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: 'tachometer-alt' },
    { name: 'Registration', icon: 'user-plus' },
    { name: 'Registered Falcons', icon: 'paw'},
    { name: 'Race Control', icon: 'flag-checkered' },
    { name: 'Race Analytics', icon: 'chart-line' },
    { name: 'Training Control', icon: 'dumbbell' },
    { name: 'Messages', icon: 'envelope' },
  ];

const handleLogout = () => {
  realm.write(() => {
    const sessions = realm.objects('UserSession');
    realm.delete(sessions);
  });
  props.navigation.navigate('Login')
  // props.navigation.navigate({
  //   index: 0,
  //   routes: [{ name: 'LoginScreen' }],
  // });
};
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={drawerStyles.container}>
      {/* Header */}
      <View style={drawerStyles.header}>
        <Image
          source={require('../assets/caninelogo.png')}
          style={drawerStyles.logo}
          resizeMode="contain"
        />
        <Text style={drawerStyles.logoText}>Falcon Tracker</Text>
        <Text style={drawerStyles.subtitle}>Professional Falcon Management</Text>
      </View>

      {/* Menu Items */}
      <View style={drawerStyles.menuContainer}>
        {menuItems.map((item) => {
          const isActive = activeRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[drawerStyles.menuItem, isActive && drawerStyles.menuItemActive]}
              onPress={() => {
                setActiveRoute(item.name);
                props.navigation.navigate(item.name);
              }}
            >
              <Icon
                name={item.icon}
                size={18}
                color={isActive ? COLORS.oasisGreen : COLORS.charcoal}
                style={drawerStyles.menuIcon}
              />
              <Text
                style={[drawerStyles.menuText, isActive && drawerStyles.menuTextActive]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={drawerStyles.footer}>
        <View style={drawerStyles.userInfo}>
          <Icon
            name="user-circle"
            size={22}
            color={COLORS.cobaltBlue}
            style={drawerStyles.userIcon}
          />
          <View>
            <Text style={drawerStyles.userName}>Admin User</Text>
            <Text style={drawerStyles.userRole}>Canine Manager</Text>
          </View>
        </View>

        <TouchableOpacity
          style={drawerStyles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="sign-out-alt" size={16} color={COLORS.terracotta} style={{ marginRight: 10 }} />
          <Text style={drawerStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function AppNavigator() {
  return (
    <>
      <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.desertSand,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerShadowVisible: false,
          headerTintColor: COLORS.charcoal,
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          drawerStyle: {
            width: 300,
          },
          drawerType: 'front',
        }}
        initialRouteName="Dashboard"
      >
        <Drawer.Screen name="Dashboard" component={DashboardScreen} />
        <Drawer.Screen name="Registration" component={RegistrationScreen} />
        <Drawer.Screen name="Registered Falcons" component={Animals} />
        <Drawer.Screen name="Race Control" component={RaceControlScreen} />
        <Drawer.Screen name="Race Analytics" component={RaceAnalyticsScreen} />
        <Drawer.Screen name="Training Control" component={TrainingControl} />
        <Drawer.Screen name="Messages" component={MessagesScreen} />
      </Drawer.Navigator>
    </>
  );
}

const drawerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.desertSand,
  },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warmStone,
    backgroundColor: COLORS.warmStone,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  logoText: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 22,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 13,
    color: COLORS.charcoal + '99',
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  menuItemActive: {
    backgroundColor: COLORS.oasisGreen + '25',
    shadowColor: COLORS.oasisGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.oasisGreen,
  },
  menuIcon: {
    width: 28,
    textAlign: 'center',
  },
  menuText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 16,
    color: COLORS.charcoal,
    marginLeft: 8,
  },
  menuTextActive: {
    color: COLORS.oasisGreen,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.warmStone,
    backgroundColor: COLORS.warmStone,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  userIcon: {
    marginRight: 12,
  },
  userName: {
    fontFamily: FONTS.montserratBold,
    fontSize: 15,
    color: COLORS.charcoal,
  },
  userRole: {
    fontFamily: FONTS.montserratRegular,
    fontSize: 12,
    color: COLORS.charcoal + '80',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.terracotta + '15',
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.terracotta,
  },
});
