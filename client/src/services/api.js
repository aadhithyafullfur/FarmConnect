import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token expiration and other errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different types of authentication errors
    if (error.response?.status === 401) {
      // Clear expired or invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenTimestamp');
      localStorage.removeItem('rememberMe');
      
      // Show user-friendly message
      console.log('🔒 Session expired. Please log in again.');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      console.log('❌ Access denied. Insufficient permissions.');
    } else if (error.code === 'ERR_NETWORK') {
      console.log('🌐 Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default api;