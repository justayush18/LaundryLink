const BASE_URL = ''; // Uses Vite proxy for local dev (routes /api to backend)

async function request(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const token = localStorage.getItem('token');
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const errorMsg = (data && data.message) || response.statusText || 'An error occurred';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) => request('/api/v1/auth/login', { method: 'POST', body: credentials }),
    register: (details) => request('/api/v1/auth/register', { method: 'POST', body: details }),
    verifyOtp: (email, otpCode) => request('/api/v1/auth/verify-otp', { method: 'POST', body: { email, otpCode } }),
    resendOtp: (email) => request('/api/v1/auth/resend-otp', { method: 'POST', body: { email } }),
  },

  // User Management
  users: {
    getProfile: (role) => request(`/api/v1/users/${role}/profile`),
    getAddresses: (role) => request(`/api/v1/users/${role}/addresses`),
    acceptTerms: (acceptedVersion) => request('/api/v1/users/accept-terms', { method: 'POST', body: { acceptedVersion } }),
  },

  // Partners
  partners: {
    list: () => request('/api/v1/partners'),
    getProfile: () => request('/api/v1/partners/profile'),
    updateProfile: (profile) => request('/api/v1/partners/profile', { method: 'PUT', body: profile }),
    getPublicProfile: (email) => request(`/api/v1/partners/${email}/profile`),
    getServiceAreas: () => request('/api/v1/partners/service-areas'),
    updateServiceAreas: (zipcodes) => request('/api/v1/partners/service-areas', { method: 'PUT', body: zipcodes }),
    getAvailability: () => request('/api/v1/partners/availability'),
    updateAvailability: (slots) => request('/api/v1/partners/availability', { method: 'PUT', body: slots }),
    getDocuments: () => request('/api/v1/partners/documents'),
    uploadDocument: (doc) => request('/api/v1/partners/documents', { method: 'POST', body: doc }),
    getPricing: () => request('/api/v1/partners/pricing'),
    getPartnerPricing: (email) => request(`/api/v1/partners/${email}/pricing`),
    updatePricing: (pricing) => request('/api/v1/partners/pricing', { method: 'PUT', body: pricing }),
  },

  // Orders
  orders: {
    placeOrder: (order) => request('/api/v1/orders', { method: 'POST', body: order }),
    getOrder: (orderId) => request(`/api/v1/orders/${orderId}`),
    getMyOrders: () => request('/api/v1/orders/history'),
    getHistory: (orderId) => request(`/api/v1/orders/history`), // List of order overview and count
    updateStatus: (orderId, statusUpdate) => {
      const payload = {
        status: statusUpdate.status,
        statusNotes: statusUpdate.statusNotes || statusUpdate.notes || ''
      };
      return request(`/api/v1/orders/${orderId}/status`, { method: 'PUT', body: payload });
    },
    assignDelivery: (orderId, assignRequest) => request(`/api/v1/orders/${orderId}/assign-delivery`, { method: 'PUT', body: assignRequest }),
    getCancellationEstimate: (orderId) => request(`/api/v1/orders/${orderId}/cancellation-estimate`),
  },

  // Deliveries
  deliveries: {
    getDashboard: () => request('/api/v1/deliveries/dashboard'),
    getTracking: (orderId) => request(`/api/v1/deliveries/${orderId}/tracking`),
    updateAvailability: (online) => request(`/api/v1/deliveries/availability?online=${online}`, { method: 'PUT' }),
    acceptTask: (orderId) => request(`/api/v1/deliveries/${orderId}/accept`, { method: 'PUT' }),
    cancelTask: (orderId) => request(`/api/v1/deliveries/${orderId}/cancel`, { method: 'PUT' }),
  },

  // Payments & Invoices
  payments: {
    initiate: (req) => request('/api/v1/payments/initiate', { method: 'POST', body: req }),
    process: (paymentId, body) => {
      const simulateSuccess = body && body.simulateSuccess !== undefined ? body.simulateSuccess : true;
      return request(`/api/v1/payments/${paymentId}/process?simulateSuccess=${simulateSuccess}`, { method: 'POST', body });
    },
    getInvoice: (orderId) => request(`/api/v1/payments/orders/${orderId}/invoice`),
    getPayment: (paymentId) => request(`/api/v1/payments/${paymentId}`),
  },

  // Reviews
  reviews: {
    submit: (review) => request('/api/v1/reviews', { method: 'POST', body: review }),
    getHistory: () => request('/api/v1/reviews/history'),
    getPartnerReviews: (email) => request(`/api/v1/reviews/partners/${email}`),
    getReviewDetails: (id) => request(`/api/v1/reviews/${id}`),
  },

  // Notifications
  notifications: {
    getHistory: () => request('/api/v1/notifications/history'),
    markRead: (id) => request(`/api/v1/notifications/history/${id}/read`, { method: 'PUT' }),
    getPreferences: () => request('/api/v1/notifications/preferences'),
    updatePreferences: (prefs) => request('/api/v1/notifications/preferences', { method: 'PUT', body: prefs }),
  },

  // Admin Module
  admin: {
    getDashboard: () => request('/api/v1/admin/dashboard'),
    getUsers: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.active !== undefined && filters.active !== null) params.append('active', filters.active);
      const query = params.toString();
      return request(`/api/v1/admin/users${query ? '?' + query : ''}`);
    },
    searchUsers: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.email) params.append('email', filters.email);
      if (filters.displayName) params.append('displayName', filters.displayName);
      const query = params.toString();
      return request(`/api/v1/admin/users/search${query ? '?' + query : ''}`);
    },
    updateUserRole: (email, role) => request(`/api/v1/admin/users/${email}/role?role=${role}`, { method: 'PUT' }),
    updateUserStatus: (email, active) => request(`/api/v1/admin/users/${email}/status?active=${active}`, { method: 'PUT' }),
    deleteUser: (email) => request(`/api/v1/admin/users/${email}`, { method: 'DELETE' }),
    getPartners: () => request('/api/v1/admin/partners'),
    getPartner: (email) => request(`/api/v1/admin/partners/${email}`),
    updatePartnerStatus: (email, status) => request(`/api/v1/admin/partners/${email}/status?status=${status}`, { method: 'PUT' }),
    updateCancellationPenalty: (email, penalty) => request(`/api/v1/admin/partners/${email}/cancellation-penalty?penalty=${penalty}`, { method: 'PUT' }),
    verifyDocument: (email, docId, verifyReq) => request(`/api/v1/admin/partners/${email}/documents/${docId}/verify`, { method: 'PUT', body: verifyReq }),
    getOrders: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.customerEmail) params.append('customerEmail', filters.customerEmail);
      if (filters.partnerEmail) params.append('partnerEmail', filters.partnerEmail);
      if (filters.deliveryPartnerEmail) params.append('deliveryPartnerEmail', filters.deliveryPartnerEmail);
      const query = params.toString();
      return request(`/api/v1/admin/orders${query ? '?' + query : ''}`);
    },
    getOrder: (orderId) => request(`/api/v1/admin/orders/${orderId}`),
    getPayments: (status) => {
      const query = status ? `?status=${status}` : '';
      return request(`/api/v1/admin/payments${query}`);
    },
    getInvoices: () => request('/api/v1/admin/invoices'),
    refundPayment: (paymentId) => request(`/api/v1/payments/${paymentId}/refund`, { method: 'POST' }),
    getReviews: () => request('/api/v1/admin/reviews'),
    getPartnerReviews: (email) => request(`/api/v1/admin/reviews/partners/${email}`),
    getNotifications: () => request('/api/v1/admin/notifications'),
    getNotificationSummary: () => request('/api/v1/admin/notifications/summary'),
    getRevenueReport: () => request('/api/v1/admin/reports/revenue'),
    getPartnerAnalytics: () => request('/api/v1/admin/analytics/partners'),
    getAnalyticsSummary: () => request('/api/v1/admin/analytics/summary'),
  },
};

export const getFriendlyErrorMessage = (error) => {
  const msg = typeof error === 'string' ? error : (error?.message || '');
  const msgLower = msg.toLowerCase();

  if (msgLower.includes('forbidden') || msgLower.includes('access denied')) {
    if (msgLower.includes('this order is not assigned to you') || msgLower.includes('not the assigned delivery partner')) {
      return 'This order appears to be assigned to another partner or rider. Please check your current dashboard ledger.';
    }
    return 'You do not have permission to modify this order. Please make sure you are logged into the correct account.';
  }
  if (msgLower.includes('conflict')) {
    return 'This order is currently being updated or has already been claimed by another agent. Please refresh your dashboard.';
  }
  if (msgLower.includes('invalid status transition') || msgLower.includes('cannot be transitioned') || msgLower.includes('cannot cancel')) {
    if (msgLower.includes('placed state')) {
      return 'This order can only be cancelled before it has been accepted by the laundry partner.';
    }
    return 'This action cannot be taken in the order\'s current state. It might have been updated by another user.';
  }
  if (msgLower.includes('must be online to claim')) {
    return 'Please toggle your availability status to "Online" first to claim tasks.';
  }
  if (msgLower.includes('delivery partners can only assign themselves')) {
    return 'You can only assign tasks to your own rider account.';
  }
  if (msgLower.includes('only admin or delivery partners')) {
    return 'Only delivery agents or administrators can claim or assign these tasks.';
  }
  if (msgLower.includes('authentication required') || msgLower.includes('unauthorized')) {
    return 'Your session has expired or is invalid. Please log in again to continue.';
  }
  if (msgLower.includes('failed to fetch') || msgLower.includes('network error')) {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }
  
  // Return original msg if it's already a clean custom sentence, or fallback to general clean error
  if (msg && msg.length > 5 && !msg.includes('Http') && !msg.includes('Status') && !msg.includes('Exception') && !msg.includes('500') && !msg.includes('403')) {
    return msg;
  }
  return 'Something went wrong while processing your request. Please try again in a moment.';
};
