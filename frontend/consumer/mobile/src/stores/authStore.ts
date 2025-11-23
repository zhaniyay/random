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
  register: (email: string, password: string, consumerName: string) => Promise<void>;
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
      
      if (payload.role !== 'CONSUMER') {
        throw new Error('Only consumers can access this app');
      }

      const user: User = {
        id: parseInt(payload.sub),
        email: email,
        role: 'CONSUMER',
        consumer_id: payload.consumer_id,
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
      } else if (error.message?.includes('Only consumers')) {
        throw new Error('This account is not a consumer account');
      }
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (email: string, password: string, consumerName: string) => {
    try {
      console.log('[Auth] Attempting registration...');
      console.log('[Auth] Email:', email);
      console.log('[Auth] Consumer Name:', consumerName);
      
      const response = await authApi.register({
        email,
        password,
        consumer_name: consumerName,
      });
      
      console.log('[Auth] Registration successful');
      const token = response.access_token;

      const payload = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        id: parseInt(payload.sub),
        email,
        role: 'CONSUMER',
        consumer_id: payload.consumer_id,
      };

      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
      });
    } catch (error: any) {
      console.error('[Auth] Registration error:', error);
      console.error('[Auth] Error type:', error.constructor.name);
      console.error('[Auth] Error message:', error.message);
      console.error('[Auth] Error response:', error.response?.data);
      console.error('[Auth] Error request:', error.request);
      console.error('[Auth] Full error:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Registration failed';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('Network Error')) {
        errorMessage = `Cannot connect to server. Please check:\n1. Backend is running\n2. API URL is correct (currently: ${API_BASE_URL})\n3. Device and server are on same network`;
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

