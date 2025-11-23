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
import { suppliersApi, linksApi } from '../lib/api';
import type { Supplier, Link } from '../types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SupplierLinksScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch suppliers
  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getAll,
  });

  // Fetch my links
  const { data: links, isLoading: loadingLinks, refetch } = useQuery({
    queryKey: ['links'],
    queryFn: () => linksApi.getMyLinks(),
  });

  // Request link mutation
  const requestLinkMutation = useMutation({
    mutationFn: (supplierId: number) => linksApi.requestLink(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      Alert.alert('Success', 'Link request sent to supplier');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send request');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRequestLink = (supplierId: number, supplierName: string) => {
    Alert.alert(
      'Request Link',
      `Send a link request to ${supplierName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: () => requestLinkMutation.mutate(supplierId),
        },
      ]
    );
  };

  const handleViewProducts = (supplierId: number) => {
    navigation.navigate('Products', { supplierId });
  };

  const getLinkForSupplier = (supplierId: number): Link | undefined => {
    if (!links) return undefined;
    return links.find(link => link.supplier_id === supplierId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '#4CAF50';
      case 'PENDING':
        return '#f59e0b';
      case 'REJECTED':
        return '#ef4444';
      case 'BLOCKED':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const renderSupplierItem = ({ item }: { item: Supplier }) => {
    const link = getLinkForSupplier(item.id);

    return (
      <View style={styles.supplierCard}>
        <View style={styles.supplierHeader}>
          <Text style={styles.supplierName}>{item.name}</Text>
          {link && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(link.status) }]}>
              <Text style={styles.statusText}>{link.status}</Text>
            </View>
          )}
        </View>

        <View style={styles.supplierActions}>
          {!link && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleRequestLink(item.id, item.name)}
              disabled={requestLinkMutation.isPending}
            >
              {requestLinkMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Request Link</Text>
              )}
            </TouchableOpacity>
          )}

          {link?.status === 'APPROVED' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleViewProducts(item.id)}
            >
              <Text style={styles.secondaryButtonText}>View Products</Text>
            </TouchableOpacity>
          )}

          {link?.status === 'PENDING' && (
            <Text style={styles.waitingText}>Waiting for supplier approval...</Text>
          )}

          {link?.status === 'REJECTED' && (
            <Text style={styles.rejectedText}>Link request was rejected</Text>
          )}

          {link?.status === 'BLOCKED' && (
            <Text style={styles.blockedText}>This supplier has blocked you</Text>
          )}
        </View>
      </View>
    );
  };

  if (loadingSuppliers || loadingLinks) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading suppliers...</Text>
      </View>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No suppliers available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Suppliers</Text>
        <Text style={styles.headerSubtitle}>
          Request links to view products and place orders
        </Text>
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSupplierItem}
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
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
  },
  supplierCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  supplierActions: {
    gap: 8,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingText: {
    color: '#f59e0b',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rejectedText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  blockedText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
