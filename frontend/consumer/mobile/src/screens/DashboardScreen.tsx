import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../stores/authStore';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.userName}>{user?.email || 'Consumer'}</Text>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate('SupplierLinks')}
        >
          <Text style={styles.menuIcon}>🔗</Text>
          <Text style={styles.menuTitle}>Supplier Links</Text>
          <Text style={styles.menuDescription}>Connect with suppliers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.menuIcon}>🛒</Text>
          <Text style={styles.menuTitle}>Shopping Cart</Text>
          <Text style={styles.menuDescription}>View your cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={styles.menuTitle}>My Orders</Text>
          <Text style={styles.menuDescription}>Track your orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate('Complaints')}
        >
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={styles.menuTitle}>Complaints</Text>
          <Text style={styles.menuDescription}>Submit complaints</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 24,
    paddingTop: 32,
  },
  greeting: {
    fontSize: 16,
    color: '#e8f5e9',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

