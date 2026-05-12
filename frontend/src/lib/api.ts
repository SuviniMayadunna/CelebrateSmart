// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types
export interface LoginRequest {
  email: string;
  password: string;
  role?: 'customer' | 'admin';
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: 'customer' | 'admin';
    };
  };
}

export interface UserResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: 'customer' | 'admin';
    };
  };
}

// Admin API types
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'COMPLETED' | 'CANCELED';
export type PaymentState =
  | 'PENDING'
  | 'REQUIRES_ACTION'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELED'
  | 'REFUNDED';

export interface AdminStatsResponse {
  success: boolean;
  data: {
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number | string;
    pendingOrders: number;
  };
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: string;
  totalAmount: number | string;
  status: OrderStatus;
  paymentStatus: PaymentState;
  date: string;
}

export interface AdminOrdersResponse {
  success: boolean;
  data: {
    orders: AdminOrder[];
  };
}

export type ProductCategory =
  | 'CAKES'
  | 'DECORATIONS'
  | 'FOOD'
  | 'GIFTS'
  | 'PHOTOGRAPHY'
  | 'ENTERTAINMENT'
  | 'VENUE';

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number | string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminProductsResponse {
  success: boolean;
  data: {
    products: AdminProduct[];
  };
}

export interface AdminTemplate {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  isActive: boolean;
  steps: number;
  createdAt: string;
}

export interface AdminTemplatesResponse {
  success: boolean;
  data: {
    templates: AdminTemplate[];
  };
}

// Token management
export const setAuthToken = (token: string) => {
  // Persist across tabs/windows for better UX.
  // Note: storing tokens in localStorage has security tradeoffs; acceptable for this demo app.
  localStorage.setItem('token', token);
  // Back-compat: clear any old session token.
  sessionStorage.removeItem('token');
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

// API helper function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers);
  // Ensure JSON requests by default
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Auth API endpoints
export const authAPI = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Save token for this browser tab
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Save token for this browser tab
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    return apiRequest<UserResponse>('/auth/me', {
      method: 'GET',
    });
  },

  /**
   * Logout user
   */
  logout: () => {
    removeAuthToken();
  },
};

// Admin API endpoints (requires admin role)
export const adminAPI = {
  getStats: async (): Promise<AdminStatsResponse> => {
    return apiRequest<AdminStatsResponse>('/admin/stats', { method: 'GET' });
  },

  listOrders: async (limit = 20): Promise<AdminOrdersResponse> => {
    return apiRequest<AdminOrdersResponse>(`/admin/orders?limit=${limit}`, { method: 'GET' });
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<{ success: boolean; data: { order: AdminOrder } }> => {
    return apiRequest(`/admin/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  listProducts: async (limit = 100): Promise<AdminProductsResponse> => {
    return apiRequest<AdminProductsResponse>(`/admin/products?limit=${limit}`, { method: 'GET' });
  },

  setProductActive: async (productId: string, isActive: boolean): Promise<{ success: boolean; data: { product: AdminProduct } }> => {
    return apiRequest(`/admin/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  listTemplates: async (limit = 100): Promise<AdminTemplatesResponse> => {
    return apiRequest<AdminTemplatesResponse>(`/admin/templates?limit=${limit}`, { method: 'GET' });
  },

  setTemplateActive: async (templateId: string, isActive: boolean): Promise<{ success: boolean; data: { template: AdminTemplate } }> => {
    return apiRequest(`/admin/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  sendNotification: async (payload: { recipientType: string; title: string; content: string }): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
