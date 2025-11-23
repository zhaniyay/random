import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  
  addItem: (productId: number, quantity: number, product: Product) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  loadCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (productId: number, quantity: number, product: Product) => {
    const items = get().items;
    const existingItem = items.find(item => item.productId === productId);

    let newItems: CartItem[];
    if (existingItem) {
      newItems = items.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newItems = [...items, { productId, quantity, product }];
    }

    set({ items: newItems });
    SecureStore.setItemAsync('cart', JSON.stringify(newItems));
  },

  updateQuantity: (productId: number, quantity: number) => {
    const items = get().items;
    const newItems = items.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    set({ items: newItems });
    SecureStore.setItemAsync('cart', JSON.stringify(newItems));
  },

  removeItem: (productId: number) => {
    const items = get().items;
    const newItems = items.filter(item => item.productId !== productId);
    set({ items: newItems });
    SecureStore.setItemAsync('cart', JSON.stringify(newItems));
  },

  clearCart: () => {
    set({ items: [] });
    SecureStore.deleteItemAsync('cart');
  },

  getTotal: () => {
    const items = get().items;
    return items.reduce((total, item) => {
      const price = item.product.discount_price || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  },

  loadCart: async () => {
    try {
      const cartStr = await SecureStore.getItemAsync('cart');
      if (cartStr) {
        const items = JSON.parse(cartStr);
        set({ items });
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  },
}));

