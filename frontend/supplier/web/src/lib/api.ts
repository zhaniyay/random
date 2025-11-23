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
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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
    supplier_name: string;
    role: 'OWNER' | 'MANAGER' | 'SALES';
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};

// Links API functions (supplier side)
export const linksApi = {
  getPendingLinks: async () => {
    // Use /links/my with status filter for PENDING
    const response = await api.get('/links/my?status=PENDING');
    return response.data;
  },

  getAllLinks: async (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const response = await api.get(`/links/my?${params}`);
    return response.data;
  },

  approveLink: async (linkId: number) => {
    const response = await api.post(`/links/${linkId}/approve`);
    return response.data;
  },

  rejectLink: async (linkId: number) => {
    const response = await api.post(`/links/${linkId}/reject`);
    return response.data;
  },

  blockLink: async (linkId: number) => {
    const response = await api.post(`/links/${linkId}/block`);
    return response.data;
  },

  deleteLink: async (linkId: number) => {
    const response = await api.delete(`/links/${linkId}`);
    return response.data;
  },
};

// Products API functions
export const productsApi = {
  createProduct: async (data: {
    name: string;
    unit: string;
    price: number;
    moq: number;
    stock: number;
    is_active: boolean;
  }) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  getMyProducts: async (supplierId: number) => {
    const response = await api.get(`/products?supplier_id=${supplierId}`);
    return response.data;
  },

  updateProduct: async (productId: number, data: {
    name?: string;
    unit?: string;
    price?: number;
    moq?: number;
    stock?: number;
  }) => {
    const response = await api.patch(`/products/${productId}`, data);
    return response.data;
  },

  deleteProduct: async (productId: number) => {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  },
};

// Orders API functions (supplier side)
export const ordersApi = {
  getSupplierOrders: async (status?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    // Use /orders/my - backend determines supplier vs consumer based on token
    const response = await api.get(`/orders/my?${params}`);
    return response.data;
  },

  getOrder: async (orderId: number) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  acceptOrder: async (orderId: number) => {
    const response = await api.post(`/orders/${orderId}/accept`);
    return response.data;
  },

  rejectOrder: async (orderId: number) => {
    const response = await api.post(`/orders/${orderId}/reject`);
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

// Complaints API (suppliers view only, consumers create)
export const complaintsApi = {
  // Suppliers only view complaints (consumers create them via consumer portal)
  getMyComplaints: async (status?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    // Use /complaints/my - backend returns complaints for this supplier
    const response = await api.get(`/complaints/my?${params}`);
    return response.data;
  },

  escalateComplaint: async (complaintId: number) => {
    const response = await api.post(`/complaints/${complaintId}/escalate`);
    return response.data;
  },

  resolveComplaint: async (complaintId: number) => {
    const response = await api.post(`/complaints/${complaintId}/resolve`);
    return response.data;
  },
};

// Suppliers API functions
export const suppliersApi = {
  deleteAccount: async () => {
    const response = await api.delete('/suppliers/me');
    return response.data;
  },
};

