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
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { productsApi } from '../lib/api';
import { useCartStore } from '../stores/cartStore';
import type { Product } from '../types';

type ProductsRouteProp = RouteProp<RootStackParamList, 'Products'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProductsScreen() {
  const route = useRoute<ProductsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { supplierId } = route.params;
  
  const [refreshing, setRefreshing] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  // Fetch products for this supplier
  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['products', supplierId],
    queryFn: () => productsApi.getProducts(supplierId),
    onSuccess: (data) => {
      // Log products for debugging
      console.log('[Products] Fetched products:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('[Products] First product sample:', {
          id: data[0].id,
          name: data[0].name,
          price: data[0].price,
          priceType: typeof data[0].price,
          discount_price: data[0].discount_price,
        });
      }
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleQuantityChange = (productId: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setQuantities({ ...quantities, [productId]: quantity });
  };

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || product.moq;
    
    if (quantity < product.moq) {
      Alert.alert('Invalid Quantity', `Minimum order quantity is ${product.moq}`);
      return;
    }
    
    if (quantity > product.stock) {
      Alert.alert('Insufficient Stock', `Only ${product.stock} units available`);
      return;
    }

    addItem(product.id, quantity, product);
    Alert.alert('Success', `Added ${quantity} ${product.unit} to cart`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
    ]);
    
    // Reset quantity
    setQuantities({ ...quantities, [product.id]: product.moq });
  };

  const getItemInCart = (productId: number) => {
    return cartItems.find(item => item.product.id === productId);
  };

  // Helper function to safely convert price to number
  const safePrice = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined) {
      console.warn('[Products] Price is null/undefined, defaulting to 0');
      return 0;
    }
    if (typeof value === 'number') {
      if (isNaN(value)) {
        console.warn('[Products] Price is NaN, defaulting to 0');
        return 0;
      }
      return value;
    }
    const parsed = parseFloat(String(value));
    if (isNaN(parsed)) {
      console.warn('[Products] Price string could not be parsed, defaulting to 0. Value:', value);
      return 0;
    }
    return parsed;
  };

  // Helper function to safely format price as string
  const formatPrice = (value: number | string | null | undefined): string => {
    try {
      // First ensure we have a valid number
      let numPrice: number;
      if (value === null || value === undefined) {
        numPrice = 0;
      } else if (typeof value === 'number') {
        numPrice = isNaN(value) ? 0 : value;
      } else {
        const parsed = parseFloat(String(value));
        numPrice = isNaN(parsed) ? 0 : parsed;
      }
      
      // Double-check it's a valid number before calling toFixed
      if (typeof numPrice !== 'number' || isNaN(numPrice)) {
        console.error('[Products] formatPrice: numPrice is invalid:', { value, numPrice });
        return '0.00';
      }
      
      return numPrice.toFixed(2);
    } catch (error) {
      console.error('[Products] Error formatting price:', { value, error });
      return '0.00';
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    try {
      const quantity = quantities[item.id] || item.moq;
      // Ensure price is always a number, default to 0 if undefined
      const basePrice = safePrice(item.price);
      const discountPrice = item.discount_price ? safePrice(item.discount_price) : null;
      // Use formatPrice helper to ensure we always have a valid number
      const finalPrice = discountPrice !== null && discountPrice < basePrice ? discountPrice : basePrice;
      // Double-check finalPrice is valid
      const price = typeof finalPrice === 'number' && !isNaN(finalPrice) ? finalPrice : 0;
      
      // Log for debugging if price is still invalid
      if (price === 0 && item.price) {
        console.warn('[Products] Price resolved to 0 for item:', {
          itemId: item.id,
          itemName: item.name,
          originalPrice: item.price,
          basePrice,
          discountPrice,
          finalPrice,
          resolvedPrice: price
        });
      }
      
      const hasDiscount = discountPrice !== null && discountPrice < basePrice && basePrice > 0;
      const itemInCart = getItemInCart(item.id);
      const canAddToCart = item.stock >= item.moq && quantity <= item.stock;

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productUnit}>{item.unit}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>
              ${formatPrice(price || 0)}
            </Text>
            {hasDiscount && discountPrice !== null && basePrice > 0 && (
              <Text style={styles.originalPrice}>
                ${formatPrice(basePrice || 0)}
              </Text>
            )}
          </View>
          {hasDiscount && discountPrice !== null && basePrice > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round((1 - discountPrice / basePrice) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>MOQ: {item.moq}</Text>
          <Text style={styles.detailText}>Stock: {item.stock}</Text>
          {item.lead_time_days && (
            <Text style={styles.detailText}>Lead: {item.lead_time_days}d</Text>
          )}
        </View>

        {item.delivery_option && (
          <Text style={styles.deliveryText}>🚚 {item.delivery_option}</Text>
        )}

        {itemInCart && (
          <View style={styles.inCartBadge}>
            <Text style={styles.inCartText}>
              In cart: {itemInCart.quantity} {item.unit}
            </Text>
          </View>
        )}

        {item.is_active && item.stock >= item.moq && (
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityInput}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item.id, String(Math.max(item.moq, quantity - item.moq)))}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.quantityValue}
                value={String(quantity)}
                onChangeText={(value) => handleQuantityChange(item.id, value)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item.id, String(Math.min(item.stock, quantity + item.moq)))}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.totalPrice}>
              ${formatPrice((price || 0) * quantity)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.addButton,
            !canAddToCart && styles.addButtonDisabled,
          ]}
          onPress={() => handleAddToCart(item)}
          disabled={!canAddToCart}
        >
          <Text style={styles.addButtonText}>
            {item.stock < item.moq ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    );
    } catch (error) {
      console.error('[Products] Error rendering product:', item.id, error);
      return (
        <View style={styles.productCard}>
          <Text style={styles.errorText}>Error loading product</Text>
          <Text style={styles.productName}>{item.name || 'Unknown'}</Text>
        </View>
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (!products || products.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No products available</Text>
        <Text style={styles.emptySubtext}>This supplier hasn't added any products yet</Text>
      </View>
    );
  }

  // Filter out products with invalid prices and log them
  const validProducts = products.filter(p => {
    const hasValidPrice = p.price !== null && p.price !== undefined && 
                         (typeof p.price === 'number' || typeof p.price === 'string');
    if (!hasValidPrice) {
      console.warn('[Products] Filtering out product with invalid price:', {
        id: p.id,
        name: p.name,
        price: p.price,
        priceType: typeof p.price
      });
    }
    return hasValidPrice;
  });

  if (validProducts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No valid products available</Text>
        <Text style={styles.emptySubtext}>All products have invalid pricing data</Text>
      </View>
    );
  }

  // All products are now active, no need to filter
  const allProducts = validProducts;

  return (
    <View style={styles.container}>
      <FlatList
        data={allProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartButtonText}>
            View Cart ({cartItems.length} items)
          </Text>
        </TouchableOpacity>
      </View>
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
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
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  inactiveBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactiveText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  originalPrice: {
    fontSize: 16,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  deliveryText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  inCartBadge: {
    backgroundColor: '#dbeafe',
    padding: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  inCartText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  quantityInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    flex: 1,
  },
  quantityButton: {
    padding: 12,
    backgroundColor: '#f3f4f6',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  quantityValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    padding: 8,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  cartButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 8,
  },
});
