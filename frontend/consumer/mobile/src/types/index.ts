export interface User {
  id: number;
  email: string;
  role: 'CONSUMER';
  consumer_id: number;
}

export interface AuthResponse {
  access_token: string;
}

export interface Supplier {
  id: number;
  name: string;
}

export interface Link {
  id: number;
  consumer_id: number;
  supplier_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
  created_at: string;
  supplier?: { id: number; name: string };
}

export interface Product {
  id: number;
  supplier_id: number;
  name: string;
  unit: string;
  price: number | string; // Backend returns Decimal which may be string in JSON
  discount_price?: number | string;
  moq: number;
  stock: number;
  is_active: boolean;
  delivery_option?: string;
  lead_time_days?: number;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  line_total: number;
}

export interface Order {
  id: number;
  consumer_id: number;
  supplier_id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  total_amount: number;
  comment?: string;
  created_at: string;
  items: OrderItem[];
}

export interface Complaint {
  id: number;
  order_id: number;
  consumer_id: number;
  supplier_id: number;
  description: string;
  status: 'NEW' | 'ESCALATED' | 'RESOLVED';
  created_at: string;
}

export interface Message {
  id: number;
  sender_user_id: number;
  body: string | null;
  created_at: string;
  link_id: number | null;
  order_id: number | null;
  message_type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
}

export interface CartItem {
  productId: number;
  quantity: number;
  product: Product;
}

