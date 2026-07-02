// In dev: empty → '/api' is proxied to the backend by vite.config.js.
// In prod: set VITE_API_URL to the backend's origin (e.g. https://thriftlink-api.onrender.com),
//          which makes every fetch absolute.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const BASE_URL = `${API_ORIGIN}/api`;

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running on port 5000.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error (${res.status}): backend is unreachable or returned an unexpected response. Ensure the backend server is running.`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function upload(path, formData, method = 'POST') {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running on port 5000.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Upload failed (${res.status}): unexpected server response.`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

// --- Auth ---
export const auth = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
  oauthExchange: (accessToken) => request('/auth/oauth', { method: 'POST', body: JSON.stringify({ access_token: accessToken }) }),
  changePassword: (payload) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(payload) }),
};

// --- Vendors (public) ---
export const vendors = {
  list: (params = {}) => request('/vendors?' + new URLSearchParams(params)),
  get: (id) => request(`/vendors/${id}`),
  trackWhatsapp: (id) => request(`/vendors/${id}/whatsapp-click`, { method: 'POST' }),
};

// --- Vendor (authenticated) ---
export const vendorMe = {
  getProfile: () => request('/vendors/me/profile'),
  updateProfile: (data) => request('/vendors/me/profile', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: (file) => { const fd = new FormData(); fd.append('logo', file); return upload('/vendors/me/logo', fd); },
  getProducts: () => request('/vendors/me/products'),
  addProduct: (formData) => upload('/vendors/me/products', formData),
  updateProduct: (id, data) => request(`/vendors/me/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/vendors/me/products/${id}`, { method: 'DELETE' }),
  getAnalytics: () => request('/vendors/me/analytics'),
  getOrders: () => request('/vendors/me/orders'),
  updateOrderStatus: (id, status, note) => request(`/vendors/me/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, note }) }),
  getKyc: () => request('/vendors/me/kyc'),
  submitKyc: (formData) => upload('/vendors/me/kyc', formData),
};

// --- Products (public) ---
export const products = {
  list: (params = {}) => request('/products?' + new URLSearchParams(params)),
  get: (id) => request(`/products/${id}`),
  categories: () => request('/products/categories/list'),
};

// --- Users (authenticated) ---
export const users = {
  search: (q, role) => {
    const params = new URLSearchParams({ q });
    if (role) params.set('role', role);
    return request('/users/search?' + params.toString());
  },
};

export const userMe = {
  getProfile: () => request('/users/me/profile'),
  updateProfile: (data) => request('/users/me/profile', { method: 'PUT', body: JSON.stringify(data) }),
  uploadAvatar: (file) => { const fd = new FormData(); fd.append('avatar', file); return upload('/users/me/avatar', fd); },
  getOrders: () => request('/orders/my-orders'),
  getSaved: () => request('/users/me/saved'),
  saveItem: (data) => request('/users/me/saved', { method: 'POST', body: JSON.stringify(data) }),
  unsaveItem: (id) => request(`/users/me/saved/${id}`, { method: 'DELETE' }),
};

// --- Messages (authenticated) ---
export const messages = {
  getConversations: () => request('/messages'),
  getMessages: (partnerId) => request(`/messages/${partnerId}`),
  sendMessage: (partnerId, payload) =>
    request(`/messages/${partnerId}`, {
      method: 'POST',
      body: JSON.stringify(typeof payload === 'string' ? { content: payload } : payload),
    }),
  pingTyping: (partnerId) =>
    request(`/messages/${partnerId}/typing`, { method: 'POST' }),
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return upload('/messages/upload-image', fd);
  },
};

// --- Cart (authenticated) ---
export const cart = {
  getAll: () => request('/cart'),
  add: (productId, quantity) => request('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  update: (id, quantity) => request(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  remove: (id) => request(`/cart/${id}`, { method: 'DELETE' }),
  clear: () => request('/cart', { method: 'DELETE' }),
};

// --- Orders ---
export const orders = {
  create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getMyOrders: () => request('/orders/my-orders'),
  get: (id) => request(`/orders/${id}`),
  updateStatus: (id, status, note) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, note }) }),
};

// Alias to match `ordersAPI.updateStatus(...)` naming convention used elsewhere.
export const ordersAPI = orders;

// --- Subscriptions (vendor premium plans, manual bank transfer) ---
export const subscriptions = {
  getPlans: () => request('/subscriptions/plans'),
  getMine: () => request('/subscriptions/me'),
  submitPayment: ({ plan, reference, note }) =>
    request('/subscriptions/payment-reference', {
      method: 'POST',
      body: JSON.stringify({ plan, reference, note }),
    }),
  // admin
  adminList: (status) =>
    request('/subscriptions/admin/payments' + (status ? `?status=${encodeURIComponent(status)}` : '')),
  adminReview: (id, decision, notes) =>
    request(`/subscriptions/admin/payments/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ decision, notes }),
    }),
};

// --- Auth (password reset) ---
export const passwordReset = {
  request: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  complete: (uid, token, newPassword) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ uid, token, newPassword }) }),
};

// --- Reviews ---
export const reviews = {
  getForVendor: (vendorId, params = {}) => request(`/reviews/vendor/${vendorId}?` + new URLSearchParams(params)),
  submit: (vendorId, data) => request(`/reviews/vendor/${vendorId}`, { method: 'POST', body: JSON.stringify(data) }),
};

// --- Admin ---
export const admin = {
  stats: () => request('/admin/stats'),
  vendors: (params = {}) => request('/admin/vendors?' + new URLSearchParams(params)),
  verifyVendor: (id, status) => request(`/admin/vendors/${id}/verify`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateSubscription: (id, plan) => request(`/admin/vendors/${id}/subscription`, { method: 'PUT', body: JSON.stringify({ plan }) }),
  featureVendor: (id, is_featured, featured_rank) =>
    request(`/admin/vendors/${id}/feature`, { method: 'PUT', body: JSON.stringify({ is_featured, featured_rank }) }),
  users: (params = {}) => request('/admin/users?' + new URLSearchParams(params)),
  setUserStatus: (id, is_active) => request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ is_active }) }),
  warnUser: (id, message) => request(`/admin/users/${id}/warn`, { method: 'POST', body: JSON.stringify({ message }) }),
  reviews: (params = {}) => request('/admin/reviews?' + new URLSearchParams(params)),
  updateReview: (id, is_approved) => request(`/admin/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ is_approved }) }),
  deleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
  reports: (params = {}) => request('/admin/reports?' + new URLSearchParams(params)),
  updateReport: (id, status) => request(`/admin/reports/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  removeListing: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
};

// --- Reports (authenticated users) ---
export const reports = {
  submit: (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
};
