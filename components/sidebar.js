// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   StatusBar,
//   SafeAreaView,
//   StyleSheet // Added missing import
// } from 'react-native';
// import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
// import { COLORS, FONTS } from './theme'; // Removed NavigationContainer import
// import RegistrationScreen from './registrationscreen'; // Import the sidebar navigator
// import IOTMonitorScreen from './iotmonitorscreen'; // Import the sidebar navigator
// import DashboardScreen from './dashboard'; // Import the sidebar navigator
// import RaceControlScreen from './racecontrol'; // Import the sidebar navigator
// import TrainingControl from './TrainingControlScreen'; // Import the sidebar navigator

// // Placeholder screens with proper content


// // function RegistrationScreen({ navigation }) {
// //   return (
// //     <SafeAreaView style={screenStyles.container}>
// //       {/* <TouchableOpacity onPress={() => navigation.openDrawer()} style={screenStyles.menuButton}>
// //         <Text style={screenStyles.menuIcon}>☰</Text>
// //       </TouchableOpacity>
// //       <Text style={screenStyles.title}>Registration</Text> */}
// //       <View style={screenStyles.content}>
// //         <Text style={screenStyles.contentText}>Register new falcons and manage existing registrations</Text>
// //       </View>
// //     </SafeAreaView>
// //   );
// // }

// // 


// function ScreensScreen({ navigation }) {
//   return (
//     <SafeAreaView style={screenStyles.container}>
//       {/* <TouchableOpacity onPress={() => navigation.openDrawer()} style={screenStyles.menuButton}>
//         <Text style={screenStyles.menuIcon}>☰</Text>
//       </TouchableOpacity>
//       <Text style={screenStyles.title}>Screens</Text> */}
//       <View style={screenStyles.content}>
//         <Text style={screenStyles.contentText}>Manage display screens and presentations</Text>
//       </View>
//     </SafeAreaView>
//   );
// }

// // Custom Drawer Content
// function CustomDrawerContent(props) {
//   const [activeRoute, setActiveRoute] = useState('Dashboard');

//   const menuItems = [
//     {
//       name: 'Dashboard',
//       icon: '📊',
//     },
//     {
//       name: 'Registration',
//       icon: '📝',
//     },
//     {
//       name: 'Race Control',
//       icon: '🏁',
//     },
//  {
//   name: 'Training Control',
//   icon: '🎯',
// },
//     // {
//     //   name: 'Screens',
//     //   icon: '🖥️',
//     // },
//   ];

//   return (
//     <DrawerContentScrollView 
//       {...props}
//       contentContainerStyle={drawerStyles.container}
//     >
//       {/* Header */}
//       <View style={drawerStyles.header}>
//         <View style={drawerStyles.logoContainer}>
//           <Text style={drawerStyles.logoIcon}>🐕</Text>
//           <Text style={drawerStyles.logoText}>CanineTracker</Text>
//         </View>
//         <Text style={drawerStyles.subtitle}>Professional Canine Management</Text>
//       </View>

//       {/* Menu Items */}
//       <View style={drawerStyles.menuContainer}>
//         {menuItems.map((item) => (
//           <TouchableOpacity
//             key={item.name}
//             style={[
//               drawerStyles.menuItem,
//               activeRoute === item.name && drawerStyles.menuItemActive
//             ]}
//             onPress={() => {
//               setActiveRoute(item.name);
//               props.navigation.navigate(item.name);
//             }}
//           >
//             <Text style={drawerStyles.menuIcon}>{item.icon}</Text>
//             <Text style={[
//               drawerStyles.menuText,
//               activeRoute === item.name && drawerStyles.menuTextActive
//             ]}>
//               {item.name}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Footer */}
//       <View style={drawerStyles.footer}>
//         <View style={drawerStyles.userInfo}>
//           <Text style={drawerStyles.userIcon}>👤</Text>
//           <View>
//             <Text style={drawerStyles.userName}>Admin User</Text>
//             <Text style={drawerStyles.userRole}>Canine Manager</Text>
//           </View>
//         </View>
//         <TouchableOpacity 
//           style={drawerStyles.logoutButton}
//           onPress={() => props.navigation.navigate('Login')}
//         >
//           <Text style={drawerStyles.logoutIcon}>🚪</Text>
//           <Text style={drawerStyles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>
//     </DrawerContentScrollView>
//   );
// }

// const Drawer = createDrawerNavigator();

// // Remove NavigationContainer from here since it's already in App.js
// export default function AppNavigator() {
//   return (
//     <>
//       <StatusBar backgroundColor={COLORS.desertSand} barStyle="dark-content" />
//       <Drawer.Navigator
//         drawerContent={(props) => <CustomDrawerContent {...props} />}
//             screenOptions={{
//     headerShown: true,
//     headerStyle: {
//       backgroundColor: COLORS.desertSand,
//       elevation: 0,   // Android
//       shadowOpacity: 0, // iOS
//       borderBottomWidth: 0, // iOS extra
//     },
//     headerShadowVisible: false, // RN v6+ (best way)
//     headerTintColor: '#000',
//     headerTitleAlign: 'center',
//     headerTitleStyle: {
//       fontWeight: 'bold',
//       fontSize: 18,
//     },
//     drawerStyle: {
//       width: 300,
//     },
//     drawerType: 'front',
//   }}
//   initialRouteName="Dashboard"
// >
//         <Drawer.Screen name="Dashboard" component={DashboardScreen} />
//         <Drawer.Screen name="Registration" component={RegistrationScreen} />
//         <Drawer.Screen name="Race Control" component={RaceControlScreen} />
//         <Drawer.Screen name="Training Control" component={TrainingControl} />
//         {/* <Drawer.Screen name="Screens" component={TrainingControl} /> */}
//       </Drawer.Navigator>
//     </>
//   );
// }

// const drawerStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.desertSand,
//   },
//   header: {
//     padding: 20,
//     paddingTop: 40,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.warmStone,
//     backgroundColor: COLORS.warmStone,
//   },
//   logoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   logoIcon: {
//     fontSize: 28,
//     marginRight: 12,
//   },
//   logoText: {
//     fontFamily: FONTS.orbitronBold,
//     fontSize: 22,
//     color: COLORS.charcoal,
//   },
//   subtitle: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 14,
//     color: COLORS.charcoal + 'CC',
//   },
//   menuContainer: {
//     flex: 1,
//     paddingVertical: 20,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     marginHorizontal: 10,
//     marginVertical: 4,
//     borderRadius: 12,
//     backgroundColor: 'transparent',
//   },
//   menuItemActive: {
//     backgroundColor: COLORS.oasisGreen + '20',
//     borderLeftWidth: 4,
//     borderLeftColor: COLORS.oasisGreen,
//   },
//   menuIcon: {
//     fontSize: 20,
//     marginRight: 16,
//     width: 24,
//     textAlign: 'center',
//   },
//   menuText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 16,
//     color: COLORS.charcoal,
//   },
//   menuTextActive: {
//     color: COLORS.oasisGreen,
//   },
//   footer: {
//     padding: 20,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.warmStone,
//     backgroundColor: COLORS.warmStone,
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   userIcon: {
//     fontSize: 20,
//     marginRight: 12,
//     backgroundColor: COLORS.cobaltBlue + '20',
//     padding: 8,
//     borderRadius: 20,
//   },
//   userName: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 14,
//     color: COLORS.charcoal,
//   },
//   userRole: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 12,
//     color: COLORS.charcoal + '80',
//   },
//   logoutButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     backgroundColor: COLORS.terracotta + '20',
//     borderRadius: 10,
//   },
//   logoutIcon: {
//     fontSize: 16,
//     marginRight: 12,
//   },
//   logoutText: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 14,
//     color: COLORS.terracotta,
//   },
// });

// const screenStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.desertSand,
//   },
//   menuButton: {
//     padding: 16,
//     marginTop: 10,
//   },
//   menuIcon: {
//     fontSize: 20,
//     color: COLORS.charcoal,
//   },
//   title: {
//     fontFamily: FONTS.montserratBold,
//     fontSize: 24,
//     color: COLORS.charcoal,
//     textAlign: 'center',
//     marginTop: 10,
//     marginBottom: 20,
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   contentText: {
//     fontFamily: FONTS.montserratRegular,
//     fontSize: 16,
//     color: COLORS.charcoal + '80',
//     textAlign: 'center',
//     marginBottom: 10,
//     lineHeight: 22,
//   },
// }); 
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
import IOTMonitorScreen from './iotmonitorscreen';
import DashboardScreen from './dashboard';
import RaceControlScreen from './racecontrol';
import TrainingControl from './TrainingControlScreen';
import RegisteredAnimals from './RegisteredAnimals';
import MessagesScreen from './MessagesScreen';
import realm from '../db/database';

const Drawer = createDrawerNavigator();

// 🧭 Custom Drawer Content
function CustomDrawerContent(props) {
  const [activeRoute, setActiveRoute] = useState('Dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: 'tachometer-alt' },
    { name: 'Registration', icon: 'user-plus' },
    { name: 'Registered Birds', icon: 'paw' },
    { name: 'Race Control', icon: 'flag-checkered' },
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
        <Text style={drawerStyles.logoText}>FalconRace</Text>
        <Text style={drawerStyles.subtitle}>Professional Falcon Racing Platform</Text>
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
            <Text style={drawerStyles.userRole}>Race Manager</Text>
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
        <Drawer.Screen name="Registered Birds" component={RegisteredAnimals} />
        <Drawer.Screen name="Race Control" component={RaceControlScreen} />
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
