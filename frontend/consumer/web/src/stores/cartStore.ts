import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartState } from '../types/cart';
import type { CartItem, ProductOut } from '../types/api';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      supplierId: null,

  addItem: (productId: number, quantity: number, product: ProductOut) => {
    const { items, supplierId } = get();

    // If cart has items from different supplier, clear it
    if (supplierId && supplierId !== product.supplier_id) {
      set({ items: [], supplierId: null });
    }

    const existingItem = items.find(item => item.product_id === productId);

    if (existingItem) {
      // Update quantity if item already exists
      const updatedItems = items.map(item =>
        item.product_id === productId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      set({ items: updatedItems, supplierId: product.supplier_id });
    } else {
      // Add new item
      const newItem: CartItem = {
        product_id: productId,
        quantity,
        product,
      };
      set({
        items: [...items, newItem],
        supplierId: product.supplier_id,
      });
    }
  },

  updateQuantity: (productId: number, quantity: number) => {
    const { items } = get();

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const updatedItems = items.filter(item => item.product_id !== productId);
      const newSupplierId = updatedItems.length > 0 ? updatedItems[0].product.supplier_id : null;
      set({ items: updatedItems, supplierId: newSupplierId });
    } else {
      // Update quantity
      const updatedItems = items.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      );
      set({ items: updatedItems });
    }
  },

  removeItem: (productId: number) => {
    const { items } = get();
    const updatedItems = items.filter(item => item.product_id !== productId);
    const newSupplierId = updatedItems.length > 0 ? updatedItems[0].product.supplier_id : null;
    set({ items: updatedItems, supplierId: newSupplierId });
  },

  clearCart: () => {
    set({ items: [], supplierId: null });
  },

  getTotal: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      return total + (item.quantity * item.product.price);
    }, 0);
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((count, item) => count + item.quantity, 0);
  },
}),
    {
      name: 'cart-storage', // localStorage key
      partialize: (state) => ({
        items: state.items,
        supplierId: state.supplierId,
      }),
    }
  )
);
