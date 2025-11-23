import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ordersApi } from '../lib/api';
import type { Order } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

export default function OrdersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['supplier-orders', statusFilter],
    queryFn: () => ordersApi.getSupplierOrders(statusFilter || undefined),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'ACCEPTED':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'REJECTED':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'CANCELLED':
        return { bg: '#f3f4f6', text: '#374151' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.orderInfo}>
          Consumer #{item.consumer_id} • {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <View style={styles.orderFooter}>
          <Text style={styles.itemCount}>{item.items.length} item(s)</Text>
          <Text style={styles.totalAmount}>${formatPrice(item.total_amount)}</Text>
        </View>
        {item.comment && (
          <Text style={styles.comment} numberOfLines={1}>
            "{item.comment}"
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === '' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('')}
        >
          <Text style={[styles.filterText, statusFilter === '' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'PENDING' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('PENDING')}
        >
          <Text style={[styles.filterText, statusFilter === 'PENDING' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'ACCEPTED' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('ACCEPTED')}
        >
          <Text style={[styles.filterText, statusFilter === 'ACCEPTED' && styles.filterTextActive]}>
            Accepted
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  comment: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

