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

          // Decode token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          // Validate that this is a supplier staff user
          if (!['OWNER', 'MANAGER', 'SALES'].includes(payload.role)) {
            throw new Error('Invalid user role. Only supplier staff can access this portal.');
          }

          if (!payload.supplier_id) {
            throw new Error('User has no supplier profile.');
          }

          const user: User = {
            id: parseInt(payload.sub),
            email: email,
            role: payload.role,
            supplier_id: payload.supplier_id,
          };

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error: any) {
          // Provide better error messages
          if (error.response?.status === 401) {
            throw new Error('Invalid email or password');
          } else if (error.message?.includes('Invalid user role')) {
            throw new Error('This account is not a supplier account. Please use the consumer portal.');
          } else if (error.message?.includes('no supplier profile')) {
            throw new Error('User has no supplier profile.');
          } else {
            throw new Error(error.response?.data?.detail || error.message || 'Login failed. Please try again.');
          }
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
            role: data.role,
            supplier_id: payload.supplier_id,
          };

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error: any) {
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

