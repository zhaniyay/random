import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ordersApi } from '../lib/api';
import type { Order } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper function to safely format price as string
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
    console.error('[Orders] Error formatting price:', { value, error });
    return '0.00';
  }
};

export default function OrdersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // Fetch orders
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getMyOrders(),
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Success', 'Order cancelled successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel order');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const toggleOrderDetails = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleCancelOrder = (orderId: number) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelOrderMutation.mutate(orderId),
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'ACCEPTED':
        return '#4CAF50';
      case 'REJECTED':
        return '#ef4444';
      case 'CANCELLED':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏱️';
      case 'ACCEPTED':
        return '✅';
      case 'REJECTED':
        return '❌';
      case 'CANCELLED':
        return '🚫';
      default:
        return '📦';
    }
  };

  const handleViewOrder = (orderId: number) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isExpanded = expandedOrders.has(item.id);
    const canCancel = item.status === 'PENDING';

    return (
      <View style={styles.orderCard}>
        <TouchableOpacity
          onPress={() => handleViewOrder(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <Text style={styles.orderDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>
                {getStatusIcon(item.status)} {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.orderSummary}>
            <Text style={styles.supplierText}>Supplier #{item.supplier_id}</Text>
            <Text style={styles.orderTotal}>${item.total_amount}</Text>
          </View>

          <View style={styles.itemsSummary}>
            <Text style={styles.itemsCount}>
              {item.items.length} item{item.items.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.expandText}>
              {isExpanded ? '▼ Hide Details' : '▶ View Details'}
            </Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.orderDetails}>
            <View style={styles.divider} />
            
            {item.comment && (
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>Comment:</Text>
                <Text style={styles.commentText}>{item.comment}</Text>
              </View>
            )}

            <Text style={styles.itemsHeader}>Items:</Text>
            {item.items.map((orderItem, index) => (
              <View key={index} style={styles.orderItemRow}>
                <Text style={styles.orderItemName}>
                  Product #{orderItem.product_id}
                </Text>
                <Text style={styles.orderItemDetails}>
                  {orderItem.quantity} × ${formatPrice(orderItem.price)}
                </Text>
                <Text style={styles.orderItemTotal}>
                  ${formatPrice(orderItem.line_total)}
                </Text>
              </View>
            ))}

            {canCancel && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelOrder(item.id)}
                  disabled={cancelOrderMutation.isPending}
                >
                  {cancelOrderMutation.isPending ? (
                    <ActivityIndicator color="#ef4444" />
                  ) : (
                    <Text style={styles.cancelButtonText}>Cancel Order</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyText}>No orders yet</Text>
        <Text style={styles.emptySubtext}>
          Create your first order from the products page
        </Text>
      </View>
    );
  }

  // Sort orders by date (newest first)
  const sortedOrders = [...(orders || [])].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Group orders by status
  const pendingOrders = sortedOrders.filter(o => o.status === 'PENDING');
  const acceptedOrders = sortedOrders.filter(o => o.status === 'ACCEPTED');
  const otherOrders = sortedOrders.filter(o => 
    o.status !== 'PENDING' && o.status !== 'ACCEPTED'
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pendingOrders.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{acceptedOrders.length}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={sortedOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplierText: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  itemsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  expandText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  orderDetails: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  commentSection: {
    marginBottom: 12,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  itemsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderItemName: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  orderItemDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
