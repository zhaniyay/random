import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';
import type { AuthResponse, Supplier, Link, Product, Order, Complaint } from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token and log requests
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log request for debugging
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`[API Base URL] ${config.baseURL}`);
    if (config.data) {
      console.log(`[API Request Data]`, JSON.stringify(config.data, null, 2));
    }
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
    // Enhanced error logging
    if (error.response) {
      // Server responded with error
      console.error(`[API Error Response] ${error.response.status} ${error.config?.url}`);
      console.error(`[API Error Data]`, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('[API Network Error] No response received');
      console.error(`[API Request URL] ${error.config?.baseURL}${error.config?.url}`);
      console.error('[API Error Details]', error.message);
    } else {
      // Error setting up request
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
    consumer_name: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', {
      ...data,
      role: 'CONSUMER',
    });
    return response.data;
  },
};

// Suppliers API
export const suppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    const response = await api.get('/suppliers');
    return response.data;
  },
};

// Links API
export const linksApi = {
  requestLink: async (supplierId: number): Promise<Link> => {
    const response = await api.post('/links/request', { supplier_id: supplierId });
    return response.data;
  },

  getMyLinks: async (status?: string): Promise<Link[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const response = await api.get(`/links/my?${params}`);
    return response.data;
  },
};

// Products API
export const productsApi = {
  getProducts: async (supplierId: number): Promise<Product[]> => {
    const response = await api.get(`/products?supplier_id=${supplierId}`);
    return response.data;
  },
};

// Orders API
export const ordersApi = {
  createOrder: async (data: {
    supplier_id: number;
    items: { product_id: number; quantity: number }[];
    comment?: string;
  }): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getMyOrders: async (status?: string): Promise<Order[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const response = await api.get(`/orders/my?${params}`);
    return response.data;
  },

  getOrder: async (orderId: number): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  cancelOrder: async (orderId: number): Promise<Order> => {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  },
};

// Complaints API
export const complaintsApi = {
  createComplaint: async (data: {
    order_id: number;
    description: string;
  }): Promise<Complaint> => {
    const response = await api.post('/complaints', data);
    return response.data;
  },

  getMyComplaints: async (status?: string): Promise<Complaint[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const response = await api.get(`/complaints/my?${params}`);
    return response.data;
  },
};

// Messages API
export const messagesApi = {
  // Get messages for a link or order
  getMessages: async (linkId?: number, orderId?: number): Promise<any[]> => {
    const params = new URLSearchParams();
    if (linkId) params.append('link_id', linkId.toString());
    if (orderId) params.append('order_id', orderId.toString());
    const response = await api.get(`/messages?${params}`);
    return response.data;
  },

  // Send text message
  sendMessage: async (data: {
    body: string;
    link_id?: number;
    order_id?: number;
  }): Promise<any> => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  // Upload file/image/audio message
  uploadFile: async (
    file: { uri: string; name: string; type: string },
    data: {
      body?: string;
      link_id?: number;
      order_id?: number;
    }
  ): Promise<any> => {
    const formData = new FormData();
    
    // Add file
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    // Add metadata
    if (data.body) formData.append('body', data.body);
    if (data.link_id) formData.append('link_id', data.link_id.toString());
    if (data.order_id) formData.append('order_id', data.order_id.toString());

    const response = await api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Download file
  getDownloadUrl: (messageId: number): string => {
    return `${API_BASE_URL}/messages/${messageId}/download`;
  },
};

export default api;

