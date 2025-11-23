import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../stores/authStore';
import { linksApi, ordersApi, productsApi, complaintsApi } from '../lib/api';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

// Helper function to safely format price
const formatPrice = (value: number | string | null | undefined): string => {
  try {
    let numPrice: number;
    if (value === null || value === undefined) {
      numPrice = 0;
    } else if (typeof value === 'number') {
      numPrice = isNaN(value) ? 0 : value;
    } else {
      const parsed = parseFloat(String(value));
      numPrice = isNaN(parsed) ? 0 : parsed;
    }
    if (typeof numPrice !== 'number' || isNaN(numPrice)) {
      return '0.00';
    }
    return numPrice.toFixed(2);
  } catch (error) {
    return '0.00';
  }
};

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user, logout } = useAuthStore();

  const { data: pendingLinks } = useQuery({
    queryKey: ['pending-links'],
    queryFn: () => linksApi.getMyLinks('PENDING'),
  });

  const { data: orders } = useQuery({
    queryKey: ['supplier-orders'],
    queryFn: () => ordersApi.getSupplierOrders(undefined, 20),
  });

  const { data: products } = useQuery({
    queryKey: ['products', user?.supplier_id],
    queryFn: () => productsApi.getMyProducts(user!.supplier_id, false),
    enabled: !!user?.supplier_id,
  });

  const { data: complaints } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintsApi.getMyComplaints(),
  });

  const pendingLinksCount = pendingLinks?.length || 0;
  const pendingOrdersCount = orders?.filter((o: any) => o.status === 'PENDING').length || 0;
  const activeComplaintsCount = complaints?.filter((c: any) => c.status !== 'RESOLVED').length || 0;
  const activeProductsCount = products?.length || 0;

  const roleDisplay = user?.role === 'OWNER' ? 'Owner' : user?.role === 'MANAGER' ? 'Manager' : 'Sales';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.userName}>{user?.email || 'Supplier'}</Text>
        <Text style={styles.role}>{roleDisplay}</Text>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Links')}
        >
          <Text style={styles.statIcon}>🔗</Text>
          <Text style={styles.statNumber}>{pendingLinksCount}</Text>
          <Text style={styles.statLabel}>Pending Links</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.statIcon}>📦</Text>
          <Text style={styles.statNumber}>{pendingOrdersCount}</Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Complaints')}
        >
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={styles.statNumber}>{activeComplaintsCount}</Text>
          <Text style={styles.statLabel}>Active Complaints</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statNumber}>{activeProductsCount}</Text>
          <Text style={styles.statLabel}>Active Products</Text>
        </TouchableOpacity>
      </View>

      {user?.role === 'OWNER' && (
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation.navigate('StaffManagement')}
          >
            <Text style={styles.menuIcon}>👥</Text>
            <Text style={styles.menuTitle}>Staff Management</Text>
            <Text style={styles.menuDescription}>Manage team members</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuTitle}>Settings</Text>
            <Text style={styles.menuDescription}>Account settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
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
  role: {
    fontSize: 14,
    color: '#e8f5e9',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
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
    borderWidth: 2,
    borderColor: '#4CAF50',
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
    color: '#4CAF50',
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

