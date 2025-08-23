import React from 'react';
import { registerRootComponent } from 'expo';
import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { COLORS } from './src/config/constants';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import PickupTrashScreen from './src/screens/PickupTrashScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReportTrashScreen from './src/screens/ReportTrashScreen';
import TrashDetailScreen from './src/screens/TrashDetailScreen';
import PickupVerificationScreen from './src/screens/PickupVerificationScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = 'home'; // Default icon
        
        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Report':
            iconName = 'add-circle';
            break;
          case 'Pickup':
            iconName = 'cleaning-services';
            break;
          case 'Profile':
            iconName = 'person';
            break;
        }
        
        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.PRIMARY,
      tabBarInactiveTintColor: COLORS.TEXT_DISABLED,
      tabBarStyle: {
        backgroundColor: COLORS.SURFACE,
        borderTopColor: COLORS.BORDER,
        borderTopWidth: 1,
        paddingBottom: 35,
        paddingTop: 0,
        height: 85,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 2,
        marginTop: -3,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Report" component={ReportTrashScreen} />
    <Tab.Screen name="Pickup" component={PickupTrashScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user } = useAuth();
  
  // Debug user state changes
  React.useEffect(() => {
    console.log("🟢 App.js - User state changed:", user ? `Logged in as ${user.email}` : "Not logged in");
    console.log("🟢 Current user object:", user);
  }, [user]);
  
  const darkTheme = {
    dark: true,
    colors: {
      primary: COLORS.PRIMARY,
      background: COLORS.BACKGROUND,
      card: COLORS.SURFACE,
      text: COLORS.TEXT_PRIMARY,
      border: COLORS.BORDER,
      notification: COLORS.PRIMARY,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '600',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900',
      },
    },
  };

  return (
    <NavigationContainer theme={darkTheme}>
      <Stack.Navigator screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.BACKGROUND }
      }}>
        {user ? (
          <>
            {console.log("🟢 Rendering authenticated screens for user:", user.email)}
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="TrashDetail" component={TrashDetailScreen} />
            <Stack.Screen name="PickupVerification" component={PickupVerificationScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        ) : (
          <>
            {console.log("🟢 Rendering login screen - user is null")}
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => (
  <Provider store={store}>
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  </Provider>
);

registerRootComponent(App);

export default App;