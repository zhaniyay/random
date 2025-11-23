import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { staffApi } from '../lib/api';

interface StaffUser {
  id: number;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'SALES';
  supplier_id: number;
}

export default function StaffManagementScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'MANAGER' as 'MANAGER' | 'SALES',
  });

  // Only OWNER can access
  if (user?.role !== 'OWNER') {
    return (
      <View style={styles.container}>
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>
            Only the OWNER can access staff management.
          </Text>
        </View>
      </View>
    );
  }

  const { data: staff, isLoading, refetch } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getStaff(),
  });

  const createStaffMutation = useMutation({
    mutationFn: (data: typeof formData) => staffApi.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      resetForm();
      Alert.alert('Success', 'Staff member created successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create staff member');
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (userId: number) => staffApi.deleteStaff(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      Alert.alert('Success', 'Staff member deleted successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to delete staff member');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', role: 'MANAGER' });
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    createStaffMutation.mutate(formData);
  };

  const handleDelete = (userId: number, userEmail: string) => {
    Alert.alert('Delete Staff', `Are you sure you want to delete ${userEmail}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteStaffMutation.mutate(userId),
      },
    ]);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'MANAGER':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'SALES':
        return { bg: '#d1fae5', text: '#065f46' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const renderStaffItem = ({ item }: { item: StaffUser }) => {
    const roleStyle = getRoleColor(item.role);
    const isCurrentUser = item.id === user?.id;
    const canDelete = !isCurrentUser && item.role !== 'OWNER';

    return (
      <View style={styles.staffCard}>
        <View style={styles.staffHeader}>
          <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
            <Text style={[styles.roleText, { color: roleStyle.text }]}>
              {item.role === 'OWNER' ? '👑' : '👤'} {item.role}
            </Text>
          </View>
          {isCurrentUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youText}>You</Text>
            </View>
          )}
        </View>

        <Text style={styles.staffEmail}>{item.email}</Text>
        <Text style={styles.staffId}>User ID: {item.id}</Text>

        {canDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.email)}
            disabled={deleteStaffMutation.isPending}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
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
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Only OWNER accounts can create MANAGER and SALES users. MANAGER and SALES cannot self-register or manage other staff members.
        </Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
        <Text style={styles.addButtonText}>+ Add Staff Member</Text>
      </TouchableOpacity>

      <FlatList
        data={staff || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStaffItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No staff members yet</Text>
            <Text style={styles.emptySubtext}>Click "Add Staff" to create MANAGER or SALES accounts</Text>
          </View>
        }
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Staff Member</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
            />

            <View style={styles.roleSelector}>
              <Text style={styles.roleLabel}>Role:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    formData.role === 'MANAGER' && styles.roleButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'MANAGER' })}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      formData.role === 'MANAGER' && styles.roleButtonTextActive,
                    ]}
                  >
                    MANAGER
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    formData.role === 'SALES' && styles.roleButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'SALES' })}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      formData.role === 'SALES' && styles.roleButtonTextActive,
                    ]}
                  >
                    SALES
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={createStaffMutation.isPending}
              >
                {createStaffMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 24,
    margin: 16,
    alignItems: 'center',
  },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#991b1b', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#991b1b', textAlign: 'center' },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  infoText: { fontSize: 12, color: '#1e40af', lineHeight: 18 },
  addButton: { backgroundColor: '#4CAF50', padding: 16, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  listContent: { padding: 16 },
  staffCard: {
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
  staffHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  roleText: { fontSize: 12, fontWeight: '600' },
  youBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  youText: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
  staffEmail: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  staffId: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
  deleteButton: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', marginBottom: 8 },
  emptySubtext: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  roleSelector: { marginBottom: 20 },
  roleLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  roleButtons: { flexDirection: 'row', gap: 8 },
  roleButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  roleButtonActive: { backgroundColor: '#e8f5e9', borderColor: '#4CAF50' },
  roleButtonText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  roleButtonTextActive: { color: '#1e40af' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  cancelButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  submitButton: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#4CAF50', alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

