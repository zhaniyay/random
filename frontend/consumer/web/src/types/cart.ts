import type { CartItem } from './api';

export interface CartState {
  items: CartItem[];
  supplierId: number | null;
  addItem: (productId: number, quantity: number, product: any) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}
