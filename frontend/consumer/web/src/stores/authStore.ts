import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../lib/api';
import type { AuthState } from '../types/auth';
import type { User } from '../types/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login(email, password);
          const token = response.access_token;

          // Decode token to get user info (simplified - in production use a proper JWT library)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user: User = {
            id: parseInt(payload.sub),
            email: email,
            role: payload.role,
            supplier_id: payload.supplier_id,
            consumer_id: payload.consumer_id,
          };

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          throw new Error('Login failed');
        }
      },

      register: async (data) => {
        try {
          const response = await authApi.register(data);
          const token = response.access_token;

          // Decode token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user: User = {
            id: parseInt(payload.sub),
            email: data.email,
            role: 'CONSUMER',
            consumer_id: payload.consumer_id,
          };

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error: any) {
          // Pass through the actual backend error message
          const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
