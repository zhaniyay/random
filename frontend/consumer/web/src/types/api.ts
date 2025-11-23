import type { LinkStatusType, OrderStatusType, ComplaintStatusType, IncidentStatusType } from '../models/enums';

// API Response Types
export interface TokenOut {
  access_token: string;
}

export interface RegisterIn {
  email: string;
  password: string;
  role: 'OWNER' | 'MANAGER' | 'SALES' | 'CONSUMER';
  supplier_name?: string;
  consumer_name?: string;
}

export interface LinkRequestIn {
  supplier_id: number;
}

export interface LinkOut {
  id: number;
  supplier_id: number;
  consumer_id: number;
  status: LinkStatusType;
  created_at: string;
}

export interface ProductCreateIn {
  name: string;
  unit: string;
  price: number;
  moq: number;
  stock: number;
  is_active: boolean;
}

export interface ProductOut {
  id: number;
  supplier_id: number;
  name: string;
  unit: string;
  price: number;
  moq: number;
  stock: number;
  is_active: boolean;
}

export interface OrderItemCreateIn {
  product_id: number;
  quantity: number;
}

export interface OrderCreateIn {
  supplier_id: number;
  items: OrderItemCreateIn[];
  comment?: string;
}

export interface OrderItemOut {
  product_id: number;
  quantity: number;
  price: number;
  line_total: number;
}


export interface OrderOut {
  id: number;
  supplier_id: number;
  consumer_id: number;
  status: OrderStatusType;
  created_at: string;
  comment?: string;
  total_amount: number;
  items: OrderItemOut[];
}

export interface MessageCreateIn {
  body: string;
  link_id?: number;
  order_id?: number;
  message_type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
}

export interface MessageOut {
  id: number;
  sender_user_id: number;
  body: string;
  created_at: string;
  link_id?: number;
  order_id?: number;
  message_type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
  file_name?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
}

export interface ComplaintCreateIn {
  order_id: number;
  description: string;
}


export interface ComplaintOut {
  id: number;
  order_id: number;
  consumer_id: number;
  supplier_id: number;
  description: string;
  status: ComplaintStatusType;
  created_at: string;
}

export interface IncidentCreateIn {
  description: string;
  order_id?: number;
}

export interface IncidentOut {
  id: number;
  supplier_id: number;
  order_id?: number;
  description: string;
  status: IncidentStatusType;
  created_at: string;
}

// Additional types for extended functionality
export interface Supplier {
  id: number;
  name: string;
}

export interface Consumer {
  id: number;
  name: string;
}

export interface CartItem extends OrderItemCreateIn {
  product: ProductOut;
}

export interface User {
  id: number;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'SALES' | 'CONSUMER';
  supplier_id?: number;
  consumer_id?: number;
}
