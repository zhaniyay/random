import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';
import type { AuthResponse, Link, Product, Order, Complaint, Message } from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.response) {
      console.error(`[API Error Response] ${error.response.status} ${error.config?.url}`);
      console.error(`[API Error Data]`, error.response.data);
    } else if (error.request) {
      console.error('[API Network Error] No response received');
    } else {
      console.error('[API Setup Error]', error.message);
    }
    
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', null, {
      params: { email, password }
    });
    return response.data;
  },
  register: async (data: {
    email: string;
    password: string;
    supplier_name: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', {
      ...data,
      role: 'OWNER',
    });
    return response.data;
  },
};

// Links API
export const linksApi = {
  getMyLinks: async (status?: string): Promise<Link[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const response = await api.get(`/links/my?${params}`);
    return response.data;
  },

  approveLink: async (linkId: number): Promise<Link> => {
    const response = await api.post(`/links/${linkId}/approve`);
    return response.data;
  },

  rejectLink: async (linkId: number): Promise<Link> => {
    const response = await api.post(`/links/${linkId}/reject`);
    return response.data;
  },

  blockLink: async (linkId: number): Promise<Link> => {
    const response = await api.post(`/links/${linkId}/block`);
    return response.data;
  },
};

// Products API
export const productsApi = {
  getMyProducts: async (supplierId: number): Promise<Product[]> => {
    const response = await api.get(`/products?supplier_id=${supplierId}`);
    return response.data;
  },

  createProduct: async (data: {
    name: string;
    unit: string;
    price: number;
    moq: number;
    stock: number;
  }): Promise<Product> => {
    const response = await api.post('/products', data);
    return response.data;
  },

  updateProduct: async (productId: number, data: {
    name?: string;
    unit?: string;
    price?: number;
    moq?: number;
    stock?: number;
  }): Promise<Product> => {
    const response = await api.patch(`/products/${productId}`, data);
    return response.data;
  },

  deleteProduct: async (productId: number): Promise<void> => {
    await api.delete(`/products/${productId}`);
  },
};

// Orders API
export const ordersApi = {
  getSupplierOrders: async (status?: string, limit?: number): Promise<Order[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    const response = await api.get(`/orders/my?${params}`);
    return response.data;
  },

  getOrder: async (orderId: number): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  acceptOrder: async (orderId: number): Promise<Order> => {
    const response = await api.post(`/orders/${orderId}/accept`);
    return response.data;
  },

  rejectOrder: async (orderId: number): Promise<Order> => {
    const response = await api.post(`/orders/${orderId}/reject`);
    return response.data;
  },
};

// Complaints API
export const complaintsApi = {
  getMyComplaints: async (status?: string): Promise<Complaint[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const response = await api.get(`/complaints/my?${params}`);
    return response.data;
  },

  escalateComplaint: async (complaintId: number): Promise<Complaint> => {
    const response = await api.post(`/complaints/${complaintId}/escalate`);
    return response.data;
  },

  resolveComplaint: async (complaintId: number): Promise<Complaint> => {
    const response = await api.post(`/complaints/${complaintId}/resolve`);
    return response.data;
  },
};

// Messages API
export const messagesApi = {
  getMessages: async (linkId?: number, orderId?: number): Promise<Message[]> => {
    const params = new URLSearchParams();
    if (linkId) params.append('link_id', linkId.toString());
    if (orderId) params.append('order_id', orderId.toString());
    const response = await api.get(`/messages?${params}`);
    return response.data;
  },

  sendMessage: async (data: {
    body: string;
    link_id?: number;
    order_id?: number;
  }): Promise<Message> => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  uploadFile: async (
    file: { uri: string; name: string; type: string },
    data: {
      body?: string;
      link_id?: number;
      order_id?: number;
      message_type: 'IMAGE' | 'FILE' | 'AUDIO';
    }
  ): Promise<Message> => {
    const formData = new FormData();
    
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    if (data.body) formData.append('body', data.body);
    if (data.link_id) formData.append('link_id', data.link_id.toString());
    if (data.order_id) formData.append('order_id', data.order_id.toString());
    formData.append('message_type', data.message_type);

    const response = await api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDownloadUrl: (messageId: number): string => {
    return `${API_BASE_URL}/messages/${messageId}/download`;
  },
};

// Staff API (OWNER only)
export const staffApi = {
  getStaff: async (): Promise<any[]> => {
    const response = await api.get('/users/staff');
    return response.data;
  },

  createStaff: async (data: {
    email: string;
    password: string;
    role: 'MANAGER' | 'SALES';
  }): Promise<any> => {
    const response = await api.post('/users/staff', data);
    return response.data;
  },

  deleteStaff: async (userId: number): Promise<void> => {
    await api.delete(`/users/staff/${userId}`);
  },
};

// Suppliers API
export const suppliersApi = {
  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await api.delete('/suppliers/me');
    return response.data;
  },
};

export default api;

