import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', null, {
      params: { email, password }
    });
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    consumer_name: string;
  }) => {
    const response = await api.post('/auth/register', {
      ...data,
      role: 'CONSUMER',
    });
    return response.data;
  },
};

// Suppliers API functions
export const suppliersApi = {
  getAllSuppliers: async (limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await api.get(`/suppliers?${params}`);
    return response.data;
  },
};

// Links API functions
export const linksApi = {
  requestLink: async (supplierId: number) => {
    const response = await api.post('/links/request', { supplier_id: supplierId });
    return response.data;
  },

  getMyLinks: async (status?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await api.get(`/links/my?${params}`);
    return response.data;
  },
};

// Products API functions
export const productsApi = {
  getProducts: async (supplierId: number) => {
    const response = await api.get(`/products?supplier_id=${supplierId}`);
    return response.data;
  },
};

// Orders API functions
export const ordersApi = {
  createOrder: async (data: { supplier_id: number; items: any[]; comment?: string }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getMyOrders: async (status?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await api.get(`/orders/my?${params}`);
    return response.data;
  },

  getOrder: async (orderId: number) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  cancelOrder: async (orderId: number) => {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  },
};

// Messages API functions
export const messagesApi = {
  createMessage: async (data: { body: string; link_id?: number; order_id?: number; message_type?: string }) => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  createMessageWithFile: async (
    file: File,
    data: {
      body?: string;
      link_id?: number;
      order_id?: number;
      message_type: 'IMAGE' | 'FILE' | 'AUDIO';
    }
  ) => {
    const formData = new FormData();
    formData.append('file', file);
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

  downloadFile: async (messageId: number) => {
    const response = await api.get(`/messages/${messageId}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  getMessages: async (linkId?: number, orderId?: number) => {
    const params = new URLSearchParams();
    if (linkId) params.append('link_id', linkId.toString());
    if (orderId) params.append('order_id', orderId.toString());

    const response = await api.get(`/messages?${params}`);
    return response.data;
  },
};

// Complaints API functions
export const complaintsApi = {
  createComplaint: async (data: { order_id: number; description: string }) => {
    const response = await api.post('/complaints', data);
    return response.data;
  },

  getMyComplaints: async (status?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await api.get(`/complaints/my?${params}`);
    return response.data;
  },
};
