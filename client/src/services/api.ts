import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hemamatch_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired
      localStorage.removeItem('hemamatch_token');
      localStorage.removeItem('hemamatch_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
