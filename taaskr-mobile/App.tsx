import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home, CalendarDays, Sparkles, User } from 'lucide-react-native';
import { useAuthStore } from './src/store/useAuthStore';
import { colors } from './src/theme/colors';
import { tokens } from './src/theme/tokens';
import { ThemeProvider } from './src/theme/ThemeContext';

import LoginScreen from './src/screens/auth/LoginScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/customer/HomeScreen';
import BookingScreen from './src/screens/customer/BookingScreen';
import MyBookingsScreen from './src/screens/customer/MyBookingsScreen';
import LiveTrackingScreen from './src/screens/customer/LiveTrackingScreen';
import VehicleTransportScreen from './src/screens/customer/VehicleTransportScreen';
import AddressBookScreen from './src/screens/customer/AddressBookScreen';
import ProviderDashboardScreen from './src/screens/provider/ProviderDashboardScreen';
import WorkerTasksScreen from './src/screens/partner/WorkerTasksScreen';
import AdminConsoleScreen from './src/screens/admin/AdminConsoleScreen';
import AIChatScreen from './src/screens/ai/AIChatScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

function CustomerHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="BookingFlow" component={BookingScreen} />
      <Stack.Screen name="VehicleTransport" component={VehicleTransportScreen} />
    </Stack.Navigator>
  );
}

function CustomerBookingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <Stack.Screen name="AddressBook" component={AddressBookScreen} />
    </Stack.Navigator>
  );
}

function CustomerProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AddressBook" component={AddressBookScreen} />
      <Stack.Screen name="VehicleTransport" component={VehicleTransportScreen} />
    </Stack.Navigator>
  );
}

function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tokens.colors.dark.bgSurface,
          borderTopColor: tokens.colors.dark.borderSubtle,
          paddingBottom: 8,
          paddingTop: 8,
          height: 62,
        },
        tabBarActiveTintColor: tokens.colors.brand.primary,
        tabBarInactiveTintColor: tokens.colors.dark.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        }
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={CustomerHomeStack} 
        options={{ 
          tabBarLabel: 'Explore', 
          tabBarIcon: ({ color, size }) => <Home size={20} color={color} /> 
        }}
      />
      <Tab.Screen 
        name="BookingsTab" 
        component={CustomerBookingsStack} 
        options={{ 
          tabBarLabel: 'Bookings', 
          tabBarIcon: ({ color, size }) => <CalendarDays size={20} color={color} /> 
        }}
      />
      <Tab.Screen 
        name="AIChatTab" 
        component={AIChatScreen} 
        options={{ 
          tabBarLabel: 'AI Help', 
          tabBarIcon: ({ color, size }) => <Sparkles size={20} color={color} /> 
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={CustomerProfileStack} 
        options={{ 
          tabBarLabel: 'Profile', 
          tabBarIcon: ({ color, size }) => <User size={20} color={color} /> 
        }}
      />
    </Tab.Navigator>
  );
}

function ProviderTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#18181B',
          borderTopColor: '#27272A',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#71717A',
      }}
    >
      <Tab.Screen 
        name="ProviderTab" 
        component={ProviderDashboardScreen} 
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: () => <Text style={{ fontSize: 16 }}>💼</Text> }}
      />
      <Tab.Screen 
        name="AIChatTab" 
        component={AIChatScreen} 
        options={{ tabBarLabel: 'AI Help', tabBarIcon: () => <Text style={{ fontSize: 16 }}>🤖</Text> }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen} 
        options={{ tabBarLabel: 'Settings', tabBarIcon: () => <Text style={{ fontSize: 16 }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  );
}

function WorkerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#18181B',
          borderTopColor: '#27272A',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#71717A',
      }}
    >
      <Tab.Screen 
        name="WorkerTab" 
        component={WorkerTasksScreen} 
        options={{ tabBarLabel: 'My Tasks', tabBarIcon: () => <Text style={{ fontSize: 16 }}>👷</Text> }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen} 
        options={{ tabBarLabel: 'Settings', tabBarIcon: () => <Text style={{ fontSize: 16 }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  );
}

function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#18181B',
          borderTopColor: '#27272A',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#71717A',
      }}
    >
      <Tab.Screen 
        name="AdminTab" 
        component={AdminConsoleScreen} 
        options={{ tabBarLabel: 'Admin Console', tabBarIcon: () => <Text style={{ fontSize: 16 }}>🛡️</Text> }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen} 
        options={{ tabBarLabel: 'Settings', tabBarIcon: () => <Text style={{ fontSize: 16 }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  );
}

import { pushNotificationService } from './src/services/pushNotifications';

function RootNavigator() {
  const { isAuthenticated, isLoading, role, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      pushNotificationService.registerForPushNotificationsAsync();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Connecting to Taaskr Network...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : role === 'ADMIN' ? (
          <Stack.Screen name="Main" component={AdminTabNavigator} />
        ) : role === 'PROVIDER' ? (
          <Stack.Screen name="Main" component={ProviderTabNavigator} />
        ) : role === 'SERVICE_PARTNER' ? (
          <Stack.Screen name="Main" component={WorkerTabNavigator} />
        ) : (
          <Stack.Screen name="Main" component={CustomerTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <View style={styles.appContainer}>
          <StatusBar style="light" />
          <RootNavigator />
        </View>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: colors.dark.bgPage,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dark.bgPage,
  },
  loadingText: {
    color: colors.dark.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
});
