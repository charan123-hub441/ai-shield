import axios from 'axios';

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API = axios.create({
  baseURL: isDev ? 'http://127.0.0.1:8000' : '',
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ai_shield_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ai_shield_token');
      localStorage.removeItem('ai_shield_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
