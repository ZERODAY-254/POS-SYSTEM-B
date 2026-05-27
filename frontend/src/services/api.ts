import type { UserRole } from '../types/auth';
import type { CompletedSale, POSProduct } from '../components/pages/POSPageEnhanced';
import type { Product } from '../components/pages/ProductsPageEnhanced';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'pos_access_token';
const REFRESH_TOKEN_KEY = 'pos_refresh_token';

export type RegistrationRole = 'admin' | 'accountant' | 'cashier' | 'storekeeper' | 'manager' | 'customer';
export type BackendRole = RegistrationRole | 'inventory_clerk' | 'viewer' | 'super_admin';

export interface BackendUser {
  id: number;
  username: string;
  email: string;
  role: BackendRole;
  access_tier?: string;
  two_factor_enabled?: boolean;
  is_active: boolean;
  last_login?: string | null;
}

export interface LoginResult {
  success: boolean;
  user?: BackendUser;
  twoFactorRequired?: boolean;
  verificationCode?: string;
  message?: string;
}

export interface BackendNotification {
  id: number;
  title: string;
  message: string;
  channel: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  is_read?: boolean;
  created_at: string;
}

export interface ProductExcelImportResult {
  created?: number;
  updated?: number;
  errors?: Array<{ row?: number | string; message: string }>;
  message?: string;
}

export interface BackendCustomer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  account_reference?: string;
  is_active?: boolean;
}

export interface BackendSupplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

const tokenStorage = {
  get access() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(tokens?: { access?: string; refresh?: string }) {
    if (!tokens) return;
    if (tokens.access) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    if (tokens.refresh) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false && tokenStorage.access) {
    headers.set('Authorization', `Bearer ${tokenStorage.access}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'omit'
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok || (data && typeof data === 'object' && data.success === false)) {
    const message = typeof data === 'object'
      ? data?.message || data?.detail || `Request failed: ${response.status}`
      : data || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

function normalizeRole(role?: string): UserRole {
  const allowed: UserRole[] = ['admin', 'manager', 'cashier', 'storekeeper', 'accountant', 'customer'];
  return allowed.includes(role as UserRole) ? role as UserRole : 'cashier';
}

function normalizeProduct(product: any): POSProduct {
  const retail = Number(product.price ?? product.selling_price ?? product.retail_price ?? product.unit_price ?? 0);
  const wholesale = Number(product.wholesale_price ?? retail);
  const corporate = Number(product.corporate_price ?? (wholesale || retail));
  const loyal = Number(product.loyal_price ?? product.loyal_customer_price ?? retail);
  const stock = Number(product.stock ?? product.quantity ?? product.current_stock ?? 0);
  const tax = Number(product.tax ?? product.tax_rate ?? product.tax_percent ?? 0);
  const category = product.category_name ?? product.category?.name ?? product.category ?? 'General';
  const uom = product.base_unit_name ?? product.uom ?? product.unit ?? product.unit_name ?? 'pcs';

  return {
    id: String(product.id),
    name: product.name ?? product.product_name ?? 'Unnamed product',
    sku: product.sku ?? product.barcode ?? String(product.id),
    category: String(category || 'General'),
    uom: String(uom || 'pcs'),
    prices: {
      retail,
      wholesale,
      corporate,
      loyal
    },
    stock,
    tax,
    image: product.image_data || product.image_url || product.image || 'https://placehold.co/300x200?text=Product'
  };
}

function saleToCompletedSale(sale: any): CompletedSale {
  return {
    id: String(sale.id ?? sale.invoice_number ?? Date.now()),
    customer: sale.customer_name ?? sale.customer ?? 'Walk-in Customer',
    amount: Number(sale.grand_total ?? sale.amount ?? sale.total ?? 0),
    cashAmount: Number(sale.amount_paid ?? sale.cash_amount ?? sale.amount ?? 0),
    method: sale.payment_method ?? 'cash',
    timestamp: new Date(sale.created_at ?? sale.date ?? sale.timestamp ?? Date.now()),
    items: Array.isArray(sale.items) ? sale.items.map((item: any) => ({
      productId: String(item.product_id ?? item.productId ?? item.id ?? ''),
      name: item.name ?? item.product_name ?? 'Item',
      quantity: Number(item.quantity ?? 1),
      stockUnits: Number(item.stockUnits ?? item.quantity ?? 1),
      price: Number(item.price ?? 0),
      total: Number(item.total ?? item.price ?? 0)
    })) : [],
    cashier: sale.cashier ?? sale.cashier_name
  };
}

export async function login(username: string, password: string, _role?: UserRole): Promise<LoginResult> {
  const data = await request<any>('/accounts/login/', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ username, password })
  });
  tokenStorage.set(data.tokens);

  return {
    success: true,
    user: data.user,
    twoFactorRequired: Boolean(data.two_factor_required),
    verificationCode: data.verification_code || '',
    message: data.message
  };
}

export async function verifyTwoFactor(username: string, code: string, _role?: UserRole): Promise<LoginResult> {
  const data = await request<any>('/accounts/two-factor/verify/', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ username, code })
  });
  tokenStorage.set(data.tokens);
  return { success: true, user: data.user, message: data.message };
}

export async function loadCurrentUser(): Promise<BackendUser | null> {
  if (!tokenStorage.access) return null;
  try {
    const data = await request<any>('/accounts/me/');
    return data.user ?? null;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

export async function logout() {
  try {
    await request('/accounts/logout/', { method: 'POST' });
  } finally {
    tokenStorage.clear();
  }
}

export async function registerAccount(payload: {
  username: string;
  email?: string;
  password: string;
  role: RegistrationRole;
}) {
  return request('/accounts/register/', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload)
  });
}

export async function loadProducts(): Promise<POSProduct[]> {
  const data = await request<any>('/products/');
  const rows = Array.isArray(data) ? data : data.results ?? data.products ?? [];
  return rows.map(normalizeProduct);
}

export async function createProduct(product: Product): Promise<POSProduct> {
  const payload = {
    name: product.name,
    sku: product.sku,
    barcode: product.sku,
    description: product.category,
    price: product.prices.retail,
    wholesale_price: product.prices.wholesale,
    corporate_price: product.prices.corporate,
    loyal_price: product.prices.loyal,
    cost_price: product.buyingPrice,
    stock: product.stock,
    quantity: product.stock,
    minimum_stock: product.reorderLevel,
    image_data: product.image,
    tax: product.tax
  };
  const data = await request<any>('/products/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return normalizeProduct(data.data ?? data.product ?? data);
}

export async function createSale(sale: CompletedSale): Promise<CompletedSale> {
  const subtotal = sale.items.reduce((sum, item) => sum + item.total, 0);
  const payload = {
    customer_name: sale.customer,
    amount: sale.amount,
    subtotal,
    discount: 0,
    tax: Math.max(0, sale.amount - subtotal),
    grand_total: sale.amount,
    amount_paid: sale.cashAmount || sale.amount,
    payment_method: sale.method,
    items: sale.items.map(item => ({
      product_id: Number(item.productId) || item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.total
    }))
  };
  const data = await request<any>('/sales/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return saleToCompletedSale(data.sale ?? data);
}

export async function loadSales(): Promise<CompletedSale[]> {
  const data = await request<any>('/sales/');
  const rows = Array.isArray(data) ? data : data.results ?? data.sales ?? [];
  return rows.map(saleToCompletedSale);
}

export async function loadCustomers(): Promise<BackendCustomer[]> {
  try {
    const data = await request<any>('/customers/');
    return Array.isArray(data) ? data : data.results ?? data.customers ?? [];
  } catch {
    return [];
  }
}

export async function createCustomer(payload: {
  name: string;
  email: string;
  phone: string;
  address?: string;
  account_reference?: string;
}): Promise<BackendCustomer> {
  const data = await request<any>('/customers/', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      account_reference: payload.account_reference || `CUS-${Date.now()}`
    })
  });
  return data.data ?? data.customer ?? data;
}

export async function loadSuppliers(): Promise<BackendSupplier[]> {
  try {
    const data = await request<any>('/suppliers/');
    return Array.isArray(data) ? data : data.results ?? data.suppliers ?? [];
  } catch {
    return [];
  }
}

export async function createSupplier(payload: {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}): Promise<BackendSupplier> {
  const data = await request<any>('/products/suppliers/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.data ?? data.supplier ?? data;
}

export async function loadUsers(): Promise<BackendUser[]> {
  try {
    const data = await request<any>('/users/');
    return Array.isArray(data) ? data : data.results ?? data.users ?? [];
  } catch {
    return [];
  }
}

export async function createUser(payload: {
  username: string;
  email?: string;
  password: string;
  role: RegistrationRole | BackendRole;
}): Promise<BackendUser> {
  const apiRole = payload.role === 'inventory_clerk' || payload.role === 'viewer' || payload.role === 'super_admin'
    ? 'storekeeper'
    : payload.role;
  const data = await registerAccount({ ...payload, role: apiRole as RegistrationRole });
  return (data as any).user;
}

export async function updateUser(_userId: number, user: Partial<BackendUser>): Promise<BackendUser> {
  return user as BackendUser;
}

export async function deactivateUser(userId: number) {
  return request(`/accounts/users/${userId}/deactivate/`, { method: 'POST' });
}

export async function initiateMpesaPayment(payload: any) {
  const body = typeof payload === 'object' && payload !== null
    ? {
        phone_number: payload.phone_number || payload.phoneNumber || payload.phone || payload.mpesaPhone || payload.customerPhone || '',
        amount: payload.amount || payload.totalAmount || payload.total || 0,
        customer_name: payload.customer_name || payload.customerName || 'M-Pesa Customer',
        account_reference: payload.account_reference || payload.accountReference || `POS-${Date.now()}`
      }
    : payload;

  return request('/mpesa-transactions/stk-push/', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function verifyMpesaPayment(transactionId: number | string, status: 'success' | 'failed' = 'success') {
  return request(`/mpesa-transactions/${transactionId}/verify/`, {
    method: 'POST',
    body: JSON.stringify({ status })
  });
}

export async function simulateMpesaCallback(transactionId: number | string, status: 'success' | 'failed' = 'success') {
  return request(`/mpesa-transactions/${transactionId}/simulate-callback/`, {
    method: 'POST',
    body: JSON.stringify({ status })
  });
}

export async function loadNotifications(unreadOnly = false): Promise<BackendNotification[]> {
  try {
    const data = await request<any>(`/payment-notifications/${unreadOnly ? '?is_read=false' : ''}`);
    const rows = Array.isArray(data) ? data : data.results ?? data.notifications ?? [];
    return rows;
  } catch {
    return [];
  }
}

export async function markNotificationRead(notificationId: number) {
  return request(`/payment-notifications/${notificationId}/mark-read/`, { method: 'POST' });
}

export async function markAllNotificationsRead() {
  return request('/payment-notifications/mark-all-read/', { method: 'POST' });
}

export async function loadAppSettings() {
  try {
    return await request('/react/payment-config/');
  } catch {
    return null;
  }
}

export async function saveBackendAppSettings(settings: unknown) {
  return settings;
}

export { normalizeRole };
