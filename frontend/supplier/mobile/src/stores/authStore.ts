import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../lib/api';
import { API_BASE_URL } from '../config/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, supplierName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const token = response.access_token;

      // Decode JWT to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      if (!['OWNER', 'MANAGER', 'SALES'].includes(payload.role)) {
        throw new Error('Only supplier staff can access this app');
      }

      const user: User = {
        id: parseInt(payload.sub),
        email: email,
        role: payload.role,
        supplier_id: payload.supplier_id,
      };

      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.message?.includes('Only supplier')) {
        throw new Error('This account is not a supplier account');
      }
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (email: string, password: string, supplierName: string) => {
    try {
      const response = await authApi.register({
        email,
        password,
        supplier_name: supplierName,
      });
      
      const token = response.access_token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      if (payload.role !== 'OWNER') {
        throw new Error('Registration failed: Only OWNER accounts can be created');
      }

      const user: User = {
        id: parseInt(payload.sub),
        email,
        role: 'OWNER',
        supplier_id: payload.supplier_id,
      };

      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
      });
    } catch (error: any) {
      let errorMessage = 'Registration failed';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('Network Error')) {
        errorMessage = `Cannot connect to server. Please check:\n1. Backend is running\n2. API URL is correct\n3. Device and server are on same network`;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  loadAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const userStr = await SecureStore.getItemAsync('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));

