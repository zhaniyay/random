import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useCartStore } from '../stores/cartStore';
import { ordersApi } from '../lib/api';
import type { CartItem } from '../types';

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
    console.error('[Cart] Error formatting price:', { value, error });
    return '0.00';
  }
};

export default function CartScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);
  
  const [comment, setComment] = useState('');

  // Group items by supplier
  const itemsBySupplier = items.reduce((acc, item) => {
    const supplierId = item.product.supplier_id;
    if (!acc[supplierId]) {
      acc[supplierId] = [];
    }
    acc[supplierId].push(item);
    return acc;
  }, {} as Record<number, CartItem[]>);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: { supplierId: number; items: CartItem[]; comment: string }) => {
      return ordersApi.createOrder({
        supplier_id: data.supplierId,
        items: data.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        comment: data.comment || undefined,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Remove ordered items from cart
      variables.items.forEach(item => removeItem(item.product.id));
      Alert.alert(
        'Success',
        'Order created successfully!',
        [
          { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
          { text: 'OK' },
        ]
      );
      setComment('');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to create order';
      Alert.alert('Error', errorMsg);
    },
  });

  const handleUpdateQuantity = (productId: number, quantity: number, product: any) => {
    if (quantity < product.moq) {
      Alert.alert('Invalid Quantity', `Minimum order quantity is ${product.moq}`);
      return;
    }
    if (quantity > product.stock) {
      Alert.alert('Insufficient Stock', `Only ${product.stock} units available`);
      return;
    }
    updateQuantity(productId, quantity);
  };

  const handleRemoveItem = (productId: number, productName: string) => {
    Alert.alert(
      'Remove Item',
      `Remove ${productName} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(productId) },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Remove all items from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const handleCreateOrder = (supplierId: number, supplierItems: CartItem[]) => {
    const total = supplierItems.reduce((sum, item) => {
      const price = item.product.discount_price || item.product.price;
      const numPrice = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
      return sum + (numPrice * item.quantity);
    }, 0);

    Alert.alert(
      'Create Order',
      `Create order for $${formatPrice(total)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Order',
          onPress: () => createOrderMutation.mutate({
            supplierId,
            items: supplierItems,
            comment,
          }),
        },
      ]
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const price = item.product.discount_price || item.product.price;
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
    const lineTotal = numPrice * item.quantity;

    return (
      <View style={styles.cartItem}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.product.name}</Text>
          <TouchableOpacity
            onPress={() => handleRemoveItem(item.product.id, item.product.name)}
          >
            <Text style={styles.removeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.itemUnit}>{item.product.unit}</Text>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemPrice}>${formatPrice(price)}</Text>
          
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(
                item.product.id,
                item.quantity - item.product.moq,
                item.product
              )}
              disabled={item.quantity <= item.product.moq}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(
                item.product.id,
                item.quantity + item.product.moq,
                item.product
              )}
              disabled={item.quantity >= item.product.stock}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.lineTotal}>${formatPrice(lineTotal)}</Text>
        </View>

        {item.quantity >= item.product.stock && (
          <Text style={styles.maxStockText}>Max stock reached</Text>
        )}
      </View>
    );
  };

  const renderSupplierGroup = (supplierId: string) => {
    const supplierItems = itemsBySupplier[parseInt(supplierId)];
    const supplierName = supplierItems[0].product.supplier_id; // We could fetch supplier name
    const subtotal = supplierItems.reduce((sum, item) => {
      const price = item.product.discount_price || item.product.price;
      const numPrice = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
      return sum + (numPrice * item.quantity);
    }, 0);

    return (
      <View key={supplierId} style={styles.supplierGroup}>
        <View style={styles.supplierHeader}>
          <Text style={styles.supplierName}>Supplier #{supplierName}</Text>
          <Text style={styles.supplierTotal}>${formatPrice(subtotal)}</Text>
        </View>

        <FlatList
          data={supplierItems}
          keyExtractor={(item) => item.product.id.toString()}
          renderItem={renderCartItem}
          scrollEnabled={false}
        />

        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => handleCreateOrder(parseInt(supplierId), supplierItems)}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.orderButtonText}>Create Order for this Supplier</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Text style={styles.emptySubtext}>Add some products to get started</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('SupplierLinks')}
        >
          <Text style={styles.shopButtonText}>Browse Suppliers</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearButton}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={Object.keys(itemsBySupplier)}
        keyExtractor={(supplierId) => supplierId}
        renderItem={({ item }) => renderSupplierGroup(item)}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>Order Comment (Optional):</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a note for the supplier..."
              multiline
              numberOfLines={3}
            />
          </View>
        }
      />

      <View style={styles.totalBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${formatPrice(getTotal())}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
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
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  clearButton: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  supplierGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  supplierTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  cartItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  removeButton: {
    fontSize: 20,
    color: '#ef4444',
    padding: 4,
  },
  itemUnit: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 30,
    textAlign: 'center',
  },
  lineTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  maxStockText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  orderButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  totalBar: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
});
