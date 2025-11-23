import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { Complaint } from '../types';

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

export default function ComplaintsScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const isSales = user?.role === 'SALES';
  const isManager = user?.role === 'MANAGER';
  const canResolveEscalated = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const { data: complaints, isLoading, refetch } = useQuery({
    queryKey: ['complaints', statusFilter],
    queryFn: () => complaintsApi.getMyComplaints(statusFilter || undefined),
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: (complaintId: number) => complaintsApi.resolveComplaint(complaintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      Alert.alert('Success', 'Complaint resolved');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to resolve complaint');
    },
  });

  const escalateComplaintMutation = useMutation({
    mutationFn: (complaintId: number) => complaintsApi.escalateComplaint(complaintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      Alert.alert('Success', 'Complaint escalated');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to escalate complaint');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleResolve = (complaintId: number) => {
    Alert.alert('Resolve Complaint', 'Mark this complaint as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resolve', onPress: () => resolveComplaintMutation.mutate(complaintId) },
    ]);
  };

  const handleEscalate = (complaintId: number) => {
    Alert.alert('Escalate Complaint', 'Escalate this complaint to management?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Escalate', onPress: () => escalateComplaintMutation.mutate(complaintId) },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'ESCALATED':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'RESOLVED':
        return { bg: '#d1fae5', text: '#065f46' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const renderComplaintItem = ({ item }: { item: Complaint }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <View style={styles.complaintCard}>
        <View style={styles.complaintHeader}>
          <Text style={styles.complaintId}>Complaint #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.complaintInfo}>
          Order #{item.order_id} • Consumer #{item.consumer_id}
        </Text>
        <Text style={styles.complaintDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>

        <Text style={styles.complaintDescription}>{item.description}</Text>

        <View style={styles.actionButtons}>
          {item.status === 'NEW' && (
            <>
              {isSales && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.escalateButton]}
                  onPress={() => handleEscalate(item.id)}
                  disabled={escalateComplaintMutation.isPending}
                >
                  <Text style={styles.actionButtonText}>Escalate</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.resolveButton]}
                onPress={() => handleResolve(item.id)}
                disabled={resolveComplaintMutation.isPending}
              >
                <Text style={styles.actionButtonText}>Resolve</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'ESCALATED' && canResolveEscalated && (
            <TouchableOpacity
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => handleResolve(item.id)}
              disabled={resolveComplaintMutation.isPending}
            >
              <Text style={styles.actionButtonText}>Resolve</Text>
            </TouchableOpacity>
          )}
          {item.status === 'ESCALATED' && isSales && (
            <Text style={styles.escalatedText}>Escalated to Manager/Owner</Text>
          )}
        </View>
      </View>
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
            {isManager ? 'All Escalated' : 'All'}
          </Text>
        </TouchableOpacity>
        {!isManager && (
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'NEW' && styles.filterButtonActive]}
            onPress={() => setStatusFilter('NEW')}
          >
            <Text style={[styles.filterText, statusFilter === 'NEW' && styles.filterTextActive]}>
              New
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'ESCALATED' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('ESCALATED')}
        >
          <Text style={[styles.filterText, statusFilter === 'ESCALATED' && styles.filterTextActive]}>
            Escalated
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'RESOLVED' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('RESOLVED')}
        >
          <Text style={[styles.filterText, statusFilter === 'RESOLVED' && styles.filterTextActive]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={complaints || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderComplaintItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isManager ? 'No escalated complaints' : 'No complaints found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterContainer: { flexDirection: 'row', padding: 16, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' },
  filterButtonActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  filterText: { fontSize: 14, color: '#6b7280' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { padding: 16 },
  complaintCard: {
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
  complaintHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  complaintId: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  complaintInfo: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  complaintDate: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  complaintDescription: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  escalateButton: { backgroundColor: '#f59e0b' },
  resolveButton: { backgroundColor: '#4CAF50' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  escalatedText: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', padding: 10 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
});

