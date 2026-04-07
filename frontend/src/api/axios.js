import axios from 'axios';

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const BASE_URL = isDev ? 'http://127.0.0.1:8000' : '';

const API = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ai_shield_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (unauthenticated) — NOT on 403 (banned/forbidden)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('ai_shield_token');
        localStorage.removeItem('ai_shield_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default API;
