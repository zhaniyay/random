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
import { linksApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { Link } from '../types';

export default function LinksScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Check if user can manage links (OWNER or MANAGER only)
  const canManageLinks = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const { data: links, isLoading, refetch } = useQuery({
    queryKey: ['links', statusFilter],
    queryFn: () => linksApi.getMyLinks(statusFilter || undefined),
  });

  const approveLinkMutation = useMutation({
    mutationFn: (linkId: number) => linksApi.approveLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      Alert.alert('Success', 'Link approved');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to approve link');
    },
  });

  const rejectLinkMutation = useMutation({
    mutationFn: (linkId: number) => linksApi.rejectLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      Alert.alert('Success', 'Link rejected');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reject link');
    },
  });

  const blockLinkMutation = useMutation({
    mutationFn: (linkId: number) => linksApi.blockLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      Alert.alert('Success', 'Link blocked');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to block link');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleApprove = (linkId: number) => {
    Alert.alert('Approve Link', 'Approve this consumer link request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => approveLinkMutation.mutate(linkId) },
    ]);
  };

  const handleReject = (linkId: number) => {
    Alert.alert('Reject Link', 'Reject this consumer link request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => rejectLinkMutation.mutate(linkId) },
    ]);
  };

  const handleBlock = (linkId: number) => {
    Alert.alert('Block Link', 'Block this consumer?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => blockLinkMutation.mutate(linkId) },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'APPROVED':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'REJECTED':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'BLOCKED':
        return { bg: '#f3f4f6', text: '#374151' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const renderLinkItem = ({ item }: { item: Link }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <View style={styles.linkCard}>
        <View style={styles.linkHeader}>
          <Text style={styles.linkId}>Link #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.linkInfo}>
          Consumer #{item.consumer_id}
        </Text>
        <Text style={styles.linkDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>

        {item.status === 'PENDING' && canManageLinks && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item.id)}
              disabled={approveLinkMutation.isPending}
            >
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item.id)}
              disabled={rejectLinkMutation.isPending}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'APPROVED' && canManageLinks && (
          <TouchableOpacity
            style={[styles.actionButton, styles.blockButton]}
            onPress={() => handleBlock(item.id)}
            disabled={blockLinkMutation.isPending}
          >
            <Text style={styles.actionButtonText}>Block</Text>
          </TouchableOpacity>
        )}

        {item.status === 'PENDING' && !canManageLinks && (
          <Text style={styles.infoText}>Only Owner/Manager can approve/reject links</Text>
        )}
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
          style={[styles.filterButton, statusFilter === 'APPROVED' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('APPROVED')}
        >
          <Text style={[styles.filterText, statusFilter === 'APPROVED' && styles.filterTextActive]}>
            Approved
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={links || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLinkItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No links found</Text>
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
  linkCard: {
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
  linkHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  linkId: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  linkInfo: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  linkDate: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  approveButton: { backgroundColor: '#4CAF50' },
  rejectButton: { backgroundColor: '#ef4444' },
  blockButton: { backgroundColor: '#6b7280', marginTop: 8 },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  infoText: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 8, textAlign: 'center' },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
});

