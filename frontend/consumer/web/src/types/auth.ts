import type { User } from './api';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    consumer_name: string;
  }) => Promise<void>;
  logout: () => void;
}

export interface TokenData {
  sub: string;
  role: string;
  supplier_id?: number;
  consumer_id?: number;
}
