import type { User } from './api';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; supplier_name: string; role: 'OWNER' | 'MANAGER' | 'SALES' }) => Promise<void>;
  logout: () => void;
}

