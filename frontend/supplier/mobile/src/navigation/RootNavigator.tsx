import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/authStore';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ComplaintsScreen from '../screens/ComplaintsScreen';
import LinksScreen from '../screens/LinksScreen';
import StaffManagementScreen from '../screens/StaffManagementScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Orders: undefined;
  OrderDetails: { orderId: number };
  Products: undefined;
  Complaints: undefined;
  Links: undefined;
  StaffManagement: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, loadAuth } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: 'Dashboard' }}
          />
          <Stack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ title: 'Orders' }}
          />
          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{ title: 'Order Details' }}
          />
          <Stack.Screen
            name="Products"
            component={ProductsScreen}
            options={{ title: 'Products' }}
          />
          <Stack.Screen
            name="Complaints"
            component={ComplaintsScreen}
            options={{ title: 'Complaints' }}
          />
          <Stack.Screen
            name="Links"
            component={LinksScreen}
            options={{ title: 'Linked Consumers' }}
          />
          <Stack.Screen
            name="StaffManagement"
            component={StaffManagementScreen}
            options={{ title: 'Staff Management' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

