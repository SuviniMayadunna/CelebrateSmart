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
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELED';
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
  eventDate:  string | null;
  eventTime:  string | null;
  eventVenue: string | null;
}

export interface AdminOrdersResponse {
  success: boolean;
  data: {
    orders: AdminOrder[];
  };
}

export interface AdminOrderDetail extends AdminOrder {
  customerEmail:   string;
  deliveryAddress: string | null;
  event:  { id: string; name: string; type: string; date: string; time: string | null; venue: string | null; guestCount: number | null; colorTheme: string | null } | null;
  items:  { id: string; productName: string; categoryName: string; quantity: number; unitPrice: number }[];
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
  description?: string | null;
  imageUrl?: string | null;
  venueAddress?: string | null;
}

export interface CreateProductRequest {
  name: string;
  category: ProductCategory;
  price: number;
  sku?: string;
  description?: string;
  imageUrl?: string;
  venueAddress?: string;
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
  description?: string | null;
  imageUrl?: string | null;
  venueAddress?: string | null;
  isActive?: boolean;
}

export interface AdminProductsResponse {
  success: boolean;
  data: {
    products: AdminProduct[];
  };
}

export interface AdminCustomer {
  id:         string;
  name:       string;
  email:      string;
  phone:      string | null;
  orderCount: number;
  eventCount: number;
  joinedAt:   string;
}

export interface NotificationBroadcast {
  id:             string;
  title:          string;
  content:        string;
  recipientType:  string;
  recipientCount: number;
  sentBy:         string;
  createdAt:      string;
}

export interface PackagePhoto {
  id:        string;
  url:       string;
  publicId:  string;
  caption:   string | null;
  sortOrder: number;
}

export interface AdminPackage {
  id:          string;
  name:        string;
  eventType:   string;
  tier:        PackageTier;
  description: string;
  highlights:  string[];
  isActive:    boolean;
  itemCount:   number;
  bookedCount: number;
  items:       { id: string; productId: string; name: string; price: number; category: string; quantity: number; isCore: boolean }[];
  photos:      PackagePhoto[];
  createdAt:   string;
}

export interface AdminPackagesResponse {
  success: boolean;
  data: { packages: AdminPackage[] };
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

export interface TemplateStepInput {
  category: string;
  title: string;
}

export interface CreateTemplateRequest {
  name: string;
  emoji?: string;
  description?: string;
  steps: TemplateStepInput[];
}

export interface UpdateTemplateRequest {
  name?: string;
  emoji?: string | null;
  description?: string;
  isActive?: boolean;
  steps?: TemplateStepInput[];
}

// ── Package types ────────────────────────────────────────────────────────────

export type PackageTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface PackageItem {
  id:          string;
  productId:   string;
  sku:         string;
  name:        string;
  description: string | null;
  category:    ProductCategory;
  imageUrl:    string | null;
  price:       number;
  quantity:    number;
  isCore:      boolean;
}

export interface Package {
  id:          string;
  name:        string;
  eventType:   string;
  tier:        PackageTier;
  description: string;
  highlights:  string[];
  totalPrice:  number;
  items:       PackageItem[];
  photos:      { id: string; url: string; caption: string | null; sortOrder: number }[];
}

export interface BookPackageRequest {
  packageId:          string;
  name:               string;
  date:               string;
  time:               string;
  guestCount:         number;
  colorTheme?:        string;
  venue?:             string;
  notes?:             string;
  selectedProductIds: string[];
  extraItems?:        { productId: string; quantity: number }[];
}

export interface PlanStep {
  id:          string;
  weeksBefore: number;
  timeOfDay:   string | null;
  title:       string;
  description: string | null;
  category:    string | null;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder:   number;
}

export interface EventPlan {
  id:    string;
  steps: PlanStep[];
}

// ── Customer-facing types ────────────────────────────────────────────────────

export interface EventData {
  id:             string;
  name:           string;
  type:           string;
  date:           string;
  time:           string;
  venue:          string;
  venueBooked?:   string;
  notes:          string;
  status:         string;
  completedTasks: string[];
  packageId?:              string | null;
  guestCount?:             number | null;
  paidOrderId?:            string | null;
  orderTotalAmount?:        number | null;
  orderOriginalGuestCount?: number | null;
}

export interface CreateEventRequest {
  name:    string;
  type:    string;
  date:    string;
  time:    string;
  venue?:  string;
  notes?:  string;
}

export interface Product {
  id:          string;
  sku:         string;
  name:        string;
  description: string;
  category:    ProductCategory;
  imageUrl:    string | null;
  venueAddress: string | null;
  price:       number;
  isActive:    boolean;
}

export interface CartItem {
  id:       string;
  quantity: number;
  eventId:  string | null;
  product:  Pick<Product, 'id' | 'name' | 'category' | 'price' | 'imageUrl' | 'description'>;
}

export interface CartResponse {
  success: boolean;
  data: { items: CartItem[]; total: number };
}

export interface OrderItem {
  id:           string;
  productId:    string;
  productName:  string;
  categoryName: string;
  unitPrice:    number;
  quantity:     number;
  imageUrl:     string | null;
}

export interface Order {
  id:               string;
  orderNumber:      string;
  status:           OrderStatus;
  totalAmount:      number;
  currency:         string;
  paymentStatus:    PaymentState;
  eventId:          string | null;
  eventName:        string | null;
  eventType:        string | null;
  eventDate:        string | null;
  eventTime:        string | null;
  eventGuestCount:  number | null;
  eventColorTheme:  string | null;
  cancellationFee?: number | null;
  refundAmount?:    number | null;
  createdAt:        string;
  items:            OrderItem[];
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

  updateProfile: async (data: { name?: string; phone?: string }): Promise<UserResponse> =>
    apiRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> =>
    apiRequest('/auth/password', { method: 'PATCH', body: JSON.stringify(data) }),

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string; data?: { resetToken?: string } }> =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: async (data: { token: string; newPassword: string }): Promise<{ success: boolean; message: string }> =>
    apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
};

// Admin API endpoints (requires admin role)
export const adminAPI = {
  getStats: async (): Promise<AdminStatsResponse> => {
    return apiRequest<AdminStatsResponse>('/admin/stats', { method: 'GET' });
  },

  listOrders: async (limit = 20): Promise<AdminOrdersResponse> => {
    return apiRequest<AdminOrdersResponse>(`/admin/orders?limit=${limit}`, { method: 'GET' });
  },

  getOrder: async (orderId: string): Promise<{ success: boolean; data: { order: AdminOrderDetail } }> =>
    apiRequest(`/admin/orders/${orderId}`, { method: 'GET' }),

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<{ success: boolean; data: { order: AdminOrder } }> => {
    return apiRequest(`/admin/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  listProducts: async (limit = 100): Promise<AdminProductsResponse> => {
    return apiRequest<AdminProductsResponse>(`/admin/products?limit=${limit}`, { method: 'GET' });
  },

  createProduct: async (data: CreateProductRequest): Promise<{ success: boolean; data: { product: AdminProduct } }> =>
    apiRequest('/admin/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: async (productId: string, data: UpdateProductRequest): Promise<{ success: boolean; data: { product: AdminProduct } }> =>
    apiRequest(`/admin/products/${productId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  setProductActive: async (productId: string, isActive: boolean): Promise<{ success: boolean; data: { product: AdminProduct } }> =>
    apiRequest(`/admin/products/${productId}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),

  listTemplates: async (limit = 100): Promise<AdminTemplatesResponse> => {
    return apiRequest<AdminTemplatesResponse>(`/admin/templates?limit=${limit}`, { method: 'GET' });
  },

  setTemplateActive: async (templateId: string, isActive: boolean): Promise<{ success: boolean; data: { template: AdminTemplate } }> => {
    return apiRequest(`/admin/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  createTemplate: async (data: CreateTemplateRequest): Promise<{ success: boolean; data: { template: AdminTemplate } }> =>
    apiRequest('/admin/templates', { method: 'POST', body: JSON.stringify(data) }),

  updateTemplate: async (templateId: string, data: UpdateTemplateRequest): Promise<{ success: boolean; data: { template: AdminTemplate } }> =>
    apiRequest(`/admin/templates/${templateId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  sendNotification: async (payload: { recipientType: string; title: string; content: string }): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getBroadcasts: async (): Promise<{ success: boolean; data: { broadcasts: NotificationBroadcast[] } }> =>
    apiRequest('/admin/notification-broadcasts', { method: 'GET' }),

  listCustomers: async (limit = 100): Promise<{ success: boolean; data: { customers: AdminCustomer[] } }> =>
    apiRequest(`/admin/customers?limit=${limit}`, { method: 'GET' }),

  listPackages: async (): Promise<AdminPackagesResponse> =>
    apiRequest<AdminPackagesResponse>('/admin/packages', { method: 'GET' }),

  updatePackage: async (
    packageId: string,
    data: { isActive?: boolean; name?: string; description?: string; highlights?: string[]; items?: { productId: string; quantity: number; isCore?: boolean }[] }
  ): Promise<{ success: boolean; data: { package: AdminPackage } }> =>
    apiRequest(`/admin/packages/${packageId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  addPackagePhoto: async (
    packageId: string,
    data: { url: string; publicId: string; caption?: string }
  ): Promise<{ success: boolean; data: { photo: PackagePhoto } }> =>
    apiRequest(`/admin/packages/${packageId}/photos`, { method: 'POST', body: JSON.stringify(data) }),

  deletePackagePhoto: async (packageId: string, photoId: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/admin/packages/${packageId}/photos/${photoId}`, { method: 'DELETE' }),
};

// Events API endpoints
export const eventsAPI = {
  list: async (): Promise<{ success: boolean; data: { events: EventData[] } }> =>
    apiRequest('/events', { method: 'GET' }),

  create: async (data: CreateEventRequest): Promise<{ success: boolean; data: { event: EventData } }> =>
    apiRequest('/events', { method: 'POST', body: JSON.stringify(data) }),

  get: async (id: string): Promise<{ success: boolean; data: { event: EventData } }> =>
    apiRequest(`/events/${id}`, { method: 'GET' }),

  update: async (id: string, data: Partial<CreateEventRequest & { venueBooked?: string; status?: string }>): Promise<{ success: boolean; data: { event: EventData } }> =>
    apiRequest(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: async (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/events/${id}`, { method: 'DELETE' }),

  completeTask: async (
    eventId: string,
    taskId: string,
    extras?: { venueBooked?: string }
  ): Promise<{ success: boolean; data: { event: EventData } }> =>
    apiRequest(`/events/${eventId}/tasks/${taskId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(extras ?? {}),
    }),

  uncompleteTask: async (
    eventId: string,
    taskId: string
  ): Promise<{ success: boolean; data: { event: EventData } }> =>
    apiRequest(`/events/${eventId}/tasks/${taskId}/uncomplete`, { method: 'PATCH' }),

  adjustGuests: async (
    eventId: string,
    newGuestCount: number
  ): Promise<{
    success: boolean;
    data: {
      type:             'UPDATED' | 'REFUNDED' | 'CHARGE';
      newGuestCount:    number;
      refundAmount?:    number;
      stripeRefundId?:  string;
      adjustmentAmount?: number;
      clientSecret?:    string;
      paymentIntentId?: string;
    };
  }> =>
    apiRequest(`/events/${eventId}/adjust-guests`, {
      method: 'POST',
      body: JSON.stringify({ newGuestCount }),
    }),

  confirmGuestAdjustment: async (
    eventId: string,
    newGuestCount: number,
    paymentIntentId: string
  ): Promise<{ success: boolean; data: { newGuestCount: number } }> =>
    apiRequest(`/events/${eventId}/confirm-guest-adjustment`, {
      method: 'POST',
      body: JSON.stringify({ newGuestCount, paymentIntentId }),
    }),
};

// Products API endpoints
export const productsAPI = {
  list: async (category?: ProductCategory): Promise<{ success: boolean; data: { products: Product[] } }> =>
    apiRequest(`/products${category ? `?category=${category}` : ''}`, { method: 'GET' }),

  get: async (id: string): Promise<{ success: boolean; data: { product: Product } }> =>
    apiRequest(`/products/${id}`, { method: 'GET' }),
};

// Cart API endpoints
export const cartAPI = {
  get: async (eventId?: string): Promise<CartResponse> =>
    apiRequest(`/cart${eventId ? `?eventId=${eventId}` : ''}`, { method: 'GET' }),

  addItem: async (productId: string, quantity = 1, eventId?: string): Promise<{ success: boolean; data: { item: CartItem } }> =>
    apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, ...(eventId && { eventId }) }),
    }),

  updateItem: async (itemId: string, quantity: number): Promise<{ success: boolean; data: { item: CartItem } }> =>
    apiRequest(`/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),

  removeItem: async (itemId: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/cart/${itemId}`, { method: 'DELETE' }),

  clear: async (eventId?: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/cart${eventId ? `?eventId=${eventId}` : ''}`, { method: 'DELETE' }),
};

// ── Notification types ───────────────────────────────────────────────────────

export interface AppNotification {
  id:        string;
  title:     string;
  content:   string;
  isRead:    boolean;
  readAt:    string | null;
  createdAt: string;
}

// Orders API endpoints
export const ordersAPI = {
  create: async (eventId?: string, deliveryAddress?: string): Promise<{ success: boolean; data: { order: Order } }> =>
    apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...(eventId         && { eventId }),
        ...(deliveryAddress && { deliveryAddress }),
      }),
    }),

  list: async (): Promise<{ success: boolean; data: { orders: Order[] } }> =>
    apiRequest('/orders', { method: 'GET' }),

  get: async (id: string): Promise<{ success: boolean; data: { order: Order } }> =>
    apiRequest(`/orders/${id}`, { method: 'GET' }),

  pay: async (id: string): Promise<{ success: boolean; data: { clientSecret: string; orderId: string } }> =>
    apiRequest(`/orders/${id}/pay`, { method: 'POST' }),

  cancel: async (id: string): Promise<{ success: boolean; data: { cancellationFee: number; refundAmount: number; stripeRefundId: string } }> =>
    apiRequest(`/orders/${id}/cancel`, { method: 'POST' }),
};

// Templates API (customer-facing)
export interface EventTemplate {
  id:          string;
  slug:        string;
  name:        string;
  emoji:       string | null;
  description: string;
  steps:       string[];
}

export const templatesAPI = {
  list: async (): Promise<{ success: boolean; data: { templates: EventTemplate[] } }> =>
    apiRequest('/templates', { method: 'GET' }),
};

// Packages API
export const packagesAPI = {
  listPublic: async (): Promise<{ success: boolean; data: { packages: Package[] } }> => {
    const res = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}/api/packages-public`);
    if (!res.ok) throw new Error('Failed to load packages');
    return res.json();
  },

  list: async (eventType?: string): Promise<{ success: boolean; data: { packages: Package[] } }> =>
    apiRequest(`/packages${eventType ? `?eventType=${eventType}` : ''}`, { method: 'GET' }),

  get: async (id: string): Promise<{ success: boolean; data: { package: Package } }> =>
    apiRequest(`/packages/${id}`, { method: 'GET' }),

  eventTypes: async (): Promise<{ success: boolean; data: { eventTypes: string[] } }> =>
    apiRequest('/packages/event-types', { method: 'GET' }),

  bookPackage: async (data: BookPackageRequest): Promise<{
    success: boolean;
    data: {
      event:        EventData;
      order:        { id: string; orderNumber: string; totalAmount: number };
      clientSecret: string | null;
    };
  }> =>
    apiRequest('/events/book-package', { method: 'POST', body: JSON.stringify(data) }),

  confirmPayment: async (eventId: string, orderId: string): Promise<{ success: boolean; data: { event: EventData; plan: EventPlan } }> =>
    apiRequest(`/events/${eventId}/confirm-payment`, { method: 'POST', body: JSON.stringify({ orderId }) }),
};

// Event plan API
export const eventPlanAPI = {
  get: async (eventId: string): Promise<{ success: boolean; data: { plan: EventPlan } }> =>
    apiRequest(`/events/${eventId}/plan`, { method: 'GET' }),

  completeStep: async (eventId: string, stepId: string): Promise<{ success: boolean; data: { step: PlanStep } }> =>
    apiRequest(`/events/${eventId}/plan/steps/${stepId}/complete`, { method: 'PATCH' }),

  uncompleteStep: async (eventId: string, stepId: string): Promise<{ success: boolean; data: { step: PlanStep } }> =>
    apiRequest(`/events/${eventId}/plan/steps/${stepId}/uncomplete`, { method: 'PATCH' }),

  generateReminders: async (eventId: string): Promise<void> => {
    try { await apiRequest(`/events/${eventId}/reminders`, { method: 'POST' }); } catch { /* non-critical */ }
  },

  addCustomStep: (eventId: string, data: { title: string; weeksBefore: number; description?: string }): Promise<{ success: boolean; data: { step: PlanStep } }> =>
    apiRequest(`/events/${eventId}/plan/steps`, { method: 'POST', body: JSON.stringify(data) }),

  deleteCustomStep: (eventId: string, stepId: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/events/${eventId}/plan/steps/${stepId}`, { method: 'DELETE' }),
};

// ── Workspace types ──────────────────────────────────────────────────────────

export type PinSection = 'MOOD' | 'DECOR' | 'OUTFIT' | 'LAYOUT' | 'FOOD' | 'ENTERTAINMENT';
export type GuestStatus = 'INVITED' | 'CONFIRMED' | 'DECLINED' | 'PENDING' | 'ATTENDED' | 'NO_SHOW';
export type GuestCategory = 'FAMILY' | 'RELATIVES' | 'FRIENDS' | 'COLLEAGUES' | 'VIP' | 'KIDS';
export type ExpenseCategory = 'VENUE' | 'CATERING' | 'PHOTOGRAPHY' | 'DECORATIONS' | 'ENTERTAINMENT' | 'ATTIRE' | 'INVITATIONS' | 'MISCELLANEOUS';
export type ExpenseSource = 'MANUAL' | 'ORDER';

export interface VisionPin {
  id:        string;
  boardId:   string;
  section:   PinSection;
  imageUrl:  string | null;
  caption:   string | null;
  notes:     string | null;
  sortOrder: number;
  createdAt: string;
}

export interface VisionBoard {
  id:            string;
  eventId:       string;
  colorPalette:  string[];
  styleKeywords: string[];
  pins:          VisionPin[];
}

export interface BudgetExpense {
  id:          string;
  budgetId:    string;
  category:    ExpenseCategory;
  description: string;
  amount:      number;
  paidAt:      string | null;
  receiptNote: string | null;
  source:      ExpenseSource;
  orderId:     string | null;
  createdAt:   string;
}

export interface EventBudget {
  id:          string;
  eventId:     string;
  totalBudget: number;
  currency:    string;
  totalSpent:  number;
  remaining:   number | null;
  expenses:    BudgetExpense[];
}

export interface Guest {
  id:                  string;
  guestListId:         string;
  name:                string;
  email:               string | null;
  phone:               string | null;
  status:              GuestStatus;
  category:            GuestCategory;
  tableNumber:         string | null;
  mealPreference:      string | null;
  dietaryRestrictions: string | null;
  plusOnes:            number;
  notes:               string | null;
  rsvpToken:           string | null;
  invitationSentAt:    string | null;
  rsvpAt:              string | null;
  createdAt:           string;
}

export interface GuestStats {
  total:          number;
  invited:        number;
  confirmed:      number;
  declined:       number;
  pending:        number;
  attended:       number;
  totalAttending: number;
}

export interface WorkspaceDashboard {
  event: {
    id:          string;
    name:        string;
    type:        string;
    date:        string;
    time:        string;
    venue:       string;
    guestCount:  number | null;
    colorTheme:  string | null;
    packageName: string | null;
    daysUntil:   number;
  };
  readiness: {
    score:       number;
    tasks:       { score: number; done: number;      total: number };
    vendors:     { score: number; done: number;      total: number };
    guests:      { score: number; confirmed: number; total: number; target: number };
    budget:      { score: number; isSet: boolean };
    visionBoard: { score: number; pinCount: number };
  };
  budget: {
    total:       number;
    spent:       number;
    remaining:   number | null;
    packageCost: number | null;
  };
  guests: {
    total:     number;
    confirmed: number;
    declined:  number;
    pending:   number;
    invited:   number;
  };
  upcomingSteps: { id: string; title: string; weeksBefore: number; dueDate: string }[];
  visionBoard:   { pinCount: number; colorPalette: string[]; styleKeywords: string[] };
}

// Workspace API
export const workspaceAPI = {
  getDashboard: (eventId: string): Promise<{ success: boolean; data: { dashboard: WorkspaceDashboard } }> =>
    apiRequest(`/workspace/${eventId}/dashboard`, { method: 'GET' }).then((r: any) => ({ success: r.success, data: { dashboard: r.data } })),
};

// Vision Board API
export const visionBoardAPI = {
  get: (eventId: string): Promise<{ success: boolean; data: { board: VisionBoard } }> =>
    apiRequest(`/vision-board/${eventId}`, { method: 'GET' }),

  updatePalette: (eventId: string, colorPalette: string[]): Promise<{ success: boolean; data: { board: VisionBoard } }> =>
    apiRequest(`/vision-board/${eventId}/palette`, { method: 'PUT', body: JSON.stringify({ colorPalette }) }),

  updateKeywords: (eventId: string, styleKeywords: string[]): Promise<{ success: boolean; data: { board: VisionBoard } }> =>
    apiRequest(`/vision-board/${eventId}/keywords`, { method: 'PUT', body: JSON.stringify({ styleKeywords }) }),

  addPin: (eventId: string, data: { section: PinSection; imageUrl?: string; caption?: string; notes?: string }): Promise<{ success: boolean; data: { pin: VisionPin } }> =>
    apiRequest(`/vision-board/${eventId}/pins`, { method: 'POST', body: JSON.stringify(data) }),

  updatePin: (eventId: string, pinId: string, data: Partial<Pick<VisionPin, 'caption' | 'notes' | 'imageUrl' | 'section'>>): Promise<{ success: boolean; data: { pin: VisionPin } }> =>
    apiRequest(`/vision-board/${eventId}/pins/${pinId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deletePin: (eventId: string, pinId: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/vision-board/${eventId}/pins/${pinId}`, { method: 'DELETE' }),
};

// Budget API
export const budgetAPI = {
  get: (eventId: string): Promise<{ success: boolean; data: { budget: EventBudget } }> =>
    apiRequest(`/budget/${eventId}`, { method: 'GET' }),

  setTotal: (eventId: string, totalBudget: number): Promise<{ success: boolean; data: { budget: EventBudget } }> =>
    apiRequest(`/budget/${eventId}`, { method: 'PUT', body: JSON.stringify({ totalBudget }) }),

  addExpense: (eventId: string, data: { description: string; amount: number; category: ExpenseCategory; paidAt?: string; receiptNote?: string }): Promise<{ success: boolean; data: { expense: BudgetExpense } }> =>
    apiRequest(`/budget/${eventId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),

  updateExpense: (eventId: string, expenseId: string, data: Partial<{ description: string; amount: number; category: ExpenseCategory; paidAt: string | null; receiptNote: string }>): Promise<{ success: boolean; data: { expense: BudgetExpense } }> =>
    apiRequest(`/budget/${eventId}/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteExpense: (eventId: string, expenseId: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/budget/${eventId}/expenses/${expenseId}`, { method: 'DELETE' }),
};

// Guests API
export const guestsAPI = {
  list: (eventId: string): Promise<{ success: boolean; data: { guests: Guest[]; stats: GuestStats; guestListId: string } }> =>
    apiRequest(`/guests/${eventId}`, { method: 'GET' }),

  add: (eventId: string, data: { name: string; email?: string; phone?: string; category?: GuestCategory; plusOnes?: number; notes?: string; tableNumber?: string; mealPreference?: string; dietaryRestrictions?: string }): Promise<{ success: boolean; data: { guest: Guest } }> =>
    apiRequest(`/guests/${eventId}`, { method: 'POST', body: JSON.stringify(data) }),

  update: (eventId: string, guestId: string, data: Partial<Omit<Guest, 'id' | 'guestListId' | 'rsvpToken' | 'createdAt'>>): Promise<{ success: boolean; data: { guest: Guest } }> =>
    apiRequest(`/guests/${eventId}/${guestId}`, { method: 'PUT', body: JSON.stringify(data) }),

  remove: (eventId: string, guestId: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/guests/${eventId}/${guestId}`, { method: 'DELETE' }),

  importCSV: (eventId: string, csv: string): Promise<{ success: boolean; data: { imported: number; skipped: number } }> =>
    apiRequest(`/guests/${eventId}/import`, { method: 'POST', body: JSON.stringify({ csv }) }),
};

// Public RSVP API (no auth required)
export const rsvpAPI = {
  get: (token: string): Promise<{ success: boolean; data: { guestName: string; currentStatus: string; event: { name: string; date: string; venue: string | null; type: string } }; message?: string }> =>
    apiRequest(`/guests/rsvp/${token}`),

  submit: (token: string, status: 'CONFIRMED' | 'DECLINED'): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/guests/rsvp/${token}`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// Admin Operations API (MANAGEMENT plan steps)
export interface AdminOperationStep {
  id:          string;
  title:       string;
  description: string | null;
  weeksBefore: number;
  timeOfDay:   string | null;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface AdminOperationOrderItem {
  productName:  string;
  categoryName: string;
  quantity:     number;
  unitPrice:    number;
  venueAddress: string | null;
}

export interface AdminOperationEvent {
  id:              string;
  name:            string;
  type:            string;
  date:            string;
  time:            string | null;
  guestCount:      number | null;
  colorTheme:      string | null;
  venue:           string | null;
  customer:        { id: string; name: string; email: string };
  orderItems:      AdminOperationOrderItem[];
  managementSteps: AdminOperationStep[];
}

export const adminOperationsAPI = {
  list: (): Promise<{ success: boolean; data: { events: AdminOperationEvent[] } }> =>
    apiRequest('/admin/operations'),
  completeStep: (stepId: string): Promise<{ success: boolean; data: { step: AdminOperationStep } }> =>
    apiRequest(`/admin/operations/steps/${stepId}/complete`, { method: 'POST' }),
  uncompleteStep: (stepId: string): Promise<{ success: boolean; data: { step: AdminOperationStep } }> =>
    apiRequest(`/admin/operations/steps/${stepId}/uncomplete`, { method: 'POST' }),
};

// Notifications API endpoints
export const notificationsAPI = {
  list: async (): Promise<{ success: boolean; data: { notifications: AppNotification[]; unreadCount: number } }> =>
    apiRequest('/notifications', { method: 'GET' }),

  unreadCount: async (): Promise<{ success: boolean; data: { count: number } }> =>
    apiRequest('/notifications/unread-count', { method: 'GET' }),

  markRead: async (id: string): Promise<{ success: boolean; data: { notification: AppNotification } }> =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: async (): Promise<{ success: boolean; message: string }> =>
    apiRequest('/notifications/read-all', { method: 'PATCH' }),
};
