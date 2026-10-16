/**
 * @file api.js
 * @description Centralized API client service for Government Scheme Finder backend.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

/**
 * Standard HTTP request wrapper with automatic Authorization header injection.
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${normalizedEndpoint}`;

  const res = await fetch(url, config);
  let data;
  try {
    data = await res.json();
  } catch {
    data = { message: res.statusText || `Request failed with status ${res.status}` };
  }

  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication endpoints
  auth: {
    signup: (payload) => apiRequest('/auth/signup', { method: 'POST', body: payload }),
    login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
    getMe: () => apiRequest('/auth/me', { method: 'GET' }),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
    changePassword: (payload) => apiRequest('/auth/change-password', { method: 'POST', body: payload }),
    sendPasswordResetEmail: (payload) => apiRequest('/auth/reset-password-email', { method: 'POST', body: payload }),
  },

  // Citizen Profile endpoints
  profile: {
    get: () => apiRequest('/profile', { method: 'GET' }),
    update: (payload) => apiRequest('/profile', { method: 'PATCH', body: payload }),
  },

  // Government Scheme Discovery endpoints
  schemes: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/schemes${query ? `?${query}` : ''}`, { method: 'GET' });
    },
    search: (q, params = {}) => {
      const query = new URLSearchParams({ q, ...params }).toString();
      return apiRequest(`/schemes/search?${query}`, { method: 'GET' });
    },
    filter: (criteria = {}) => {
      const query = new URLSearchParams(criteria).toString();
      return apiRequest(`/schemes/filter?${query}`, { method: 'GET' });
    },
    getById: (id) => apiRequest(`/schemes/${id}`, { method: 'GET' }),
    compare: (ids = []) => {
      const query = ids.join(',');
      return apiRequest(`/schemes/compare?ids=${query}`, { method: 'GET' });
    },
    getMetadataFilters: () => apiRequest('/schemes/metadata/filters', { method: 'GET' }),
  },

  // Authenticated Saved Schemes endpoints
  savedSchemes: {
    list: () => apiRequest('/saved-schemes', { method: 'GET' }),
    save: (schemeId) => apiRequest(`/saved-schemes/${schemeId}`, { method: 'POST' }),
    remove: (schemeId) => apiRequest(`/saved-schemes/${schemeId}`, { method: 'DELETE' }),
  },

  // Authenticated Application Tracking endpoints
  applications: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/applications${query ? `?${query}` : ''}`, { method: 'GET' });
    },
    create: (payload) => apiRequest('/applications', { method: 'POST', body: payload }),
    update: (id, payload) => apiRequest(`/applications/${id}`, { method: 'PATCH', body: payload }),
    delete: (id) => apiRequest(`/applications/${id}`, { method: 'DELETE' }),
  },

  // Authenticated AI Chat Assistant endpoints
  chat: {
    getStatus: () => apiRequest('/chat/status', { method: 'GET' }),
    sendMessage: (payload) => apiRequest('/chat/message', { method: 'POST', body: payload }),
  },

  // RAG / AI Subsystem endpoints
  rag: {
    getStatus: () => apiRequest('/rag/status', { method: 'GET' }),
    ask: (payload) => apiRequest('/rag/ask', { method: 'POST', body: payload }),
    semanticSearch: (payload) => apiRequest('/rag/semantic-search', { method: 'POST', body: payload }),
  },
};
