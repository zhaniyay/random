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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsApi, ordersApi } from '../lib/api';
import type { Complaint, Order } from '../types';

export default function ComplaintsScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [description, setDescription] = useState('');

  // Fetch complaints
  const { data: complaints, isLoading: loadingComplaints, refetch } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintsApi.getMyComplaints(),
  });

  // Fetch orders for complaint creation
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getMyOrders(),
  });

  // Create complaint mutation
  const createComplaintMutation = useMutation({
    mutationFn: (data: { order_id: number; description: string }) => 
      complaintsApi.createComplaint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setShowCreateModal(false);
      setSelectedOrderId(null);
      setDescription('');
      Alert.alert('Success', 'Complaint submitted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit complaint');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreateComplaint = () => {
    if (!selectedOrderId) {
      Alert.alert('Error', 'Please select an order');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    createComplaintMutation.mutate({
      order_id: selectedOrderId,
      description: description.trim(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return '#f59e0b';
      case 'ESCALATED':
        return '#ef4444';
      case 'RESOLVED':
        return '#4CAF50';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':
        return '🆕';
      case 'ESCALATED':
        return '⚠️';
      case 'RESOLVED':
        return '✅';
      default:
        return '📝';
    }
  };

  const renderComplaintItem = ({ item }: { item: Complaint }) => {
    return (
      <View style={styles.complaintCard}>
        <View style={styles.complaintHeader}>
          <View style={styles.complaintInfo}>
            <Text style={styles.complaintId}>Complaint #{item.id}</Text>
            <Text style={styles.complaintDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {getStatusIcon(item.status)} {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.orderRef}>
          <Text style={styles.orderRefLabel}>Order #</Text>
          <Text style={styles.orderRefValue}>{item.order_id}</Text>
        </View>

        <Text style={styles.descriptionLabel}>Description:</Text>
        <Text style={styles.descriptionText}>{item.description}</Text>

        {item.status === 'RESOLVED' && (
          <View style={styles.resolvedBanner}>
            <Text style={styles.resolvedText}>✓ This complaint has been resolved</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCreateModal = () => {
    const acceptedOrders = (orders || []).filter(o => o.status === 'ACCEPTED');

    return (
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Complaint</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Select Order:</Text>
              {loadingOrders ? (
                <ActivityIndicator color="#4CAF50" style={{ marginVertical: 20 }} />
              ) : acceptedOrders.length === 0 ? (
                <Text style={styles.noOrdersText}>
                  No accepted orders available. You can only complain about accepted orders.
                </Text>
              ) : (
                <View style={styles.ordersList}>
                  {acceptedOrders.map((order) => (
                    <TouchableOpacity
                      key={order.id}
                      style={[
                        styles.orderOption,
                        selectedOrderId === order.id && styles.orderOptionSelected,
                      ]}
                      onPress={() => setSelectedOrderId(order.id)}
                    >
                      <View style={styles.orderOptionInfo}>
                        <Text style={styles.orderOptionId}>Order #{order.id}</Text>
                        <Text style={styles.orderOptionDate}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.orderOptionAmount}>${order.total_amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Description:</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the issue with your order..."
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.submitButton,
                    (!selectedOrderId || !description.trim()) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleCreateComplaint}
                  disabled={!selectedOrderId || !description.trim() || createComplaintMutation.isPending}
                >
                  {createComplaintMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  if (loadingComplaints) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading complaints...</Text>
      </View>
    );
  }

  const newComplaints = (complaints || []).filter(c => c.status === 'NEW');
  const escalatedComplaints = (complaints || []).filter(c => c.status === 'ESCALATED');
  const resolvedComplaints = (complaints || []).filter(c => c.status === 'RESOLVED');

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{newComplaints.length}</Text>
          <Text style={styles.statLabel}>New</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{escalatedComplaints.length}</Text>
          <Text style={styles.statLabel}>Escalated</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{resolvedComplaints.length}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {(!complaints || complaints.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>No complaints</Text>
          <Text style={styles.emptySubtext}>
            Submit a complaint about an order if you have any issues
          </Text>
        </View>
      ) : (
        <FlatList
          data={complaints || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComplaintItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {renderCreateModal()}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 80,
  },
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
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  complaintInfo: {
    flex: 1,
  },
  complaintId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  complaintDate: {
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
  orderRef: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  orderRefLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  orderRefValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  resolvedBanner: {
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  resolvedText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalClose: {
    fontSize: 28,
    color: '#6b7280',
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  ordersList: {
    marginBottom: 20,
  },
  orderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  orderOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#eff6ff',
  },
  orderOptionInfo: {
    flex: 1,
  },
  orderOptionId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderOptionDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderOptionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  noOrdersText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
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
