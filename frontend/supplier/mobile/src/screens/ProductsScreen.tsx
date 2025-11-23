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
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { productsApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { Product } from '../types';

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

export default function ProductsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    price: '',
    moq: '',
    stock: '',
  });

  // Check if user can manage products (OWNER or MANAGER only)
  const canManageProducts = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['products', user?.supplier_id],
    queryFn: () => productsApi.getMyProducts(user!.supplier_id),
    enabled: !!user?.supplier_id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productsApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update product');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Success', 'Product deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete product';
      Alert.alert('Error', errorMessage);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({ name: '', unit: '', price: '', moq: '', stock: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      unit: product.unit,
      price: String(product.price),
      moq: String(product.moq),
      stock: String(product.stock),
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      unit: formData.unit,
      price: parseFloat(formData.price),
      moq: parseInt(formData.moq),
      stock: parseInt(formData.stock),
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Product', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productUnit}>{item.unit}</Text>
        </View>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>${formatPrice(item.price)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>MOQ:</Text>
          <Text style={styles.detailValue}>{item.moq}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stock:</Text>
          <Text style={[styles.detailValue, { color: item.stock > 0 ? '#065f46' : '#991b1b' }]}>
            {item.stock}
          </Text>
        </View>
      </View>

      {canManageProducts && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id, item.name)}
            disabled={deleteMutation.isPending}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {canManageProducts && (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Add Product</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={products || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Unit (e.g., kg, pcs)"
              value={formData.unit}
              onChangeText={(text) => setFormData({ ...formData, unit: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="MOQ"
              value={formData.moq}
              onChangeText={(text) => setFormData({ ...formData, moq: text })}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Stock"
              value={formData.stock}
              onChangeText={(text) => setFormData({ ...formData, stock: text })}
              keyboardType="number-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Save</Text>
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
  addButton: { backgroundColor: '#4CAF50', padding: 16, alignItems: 'center', borderRadius: 12 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  listContent: { padding: 16 },
  productCard: {
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
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  productUnit: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  productDetails: { marginTop: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailLabel: { fontSize: 14, color: '#6b7280' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  editButton: { backgroundColor: '#4CAF50' },
  deleteButton: { backgroundColor: '#ef4444' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  cancelButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  submitButton: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#4CAF50', alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

