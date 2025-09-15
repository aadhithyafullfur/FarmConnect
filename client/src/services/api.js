import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5003/api',
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is expired or invalid, redirect to login
    if (error.response?.status === 401) {
      // Clear expired token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show user-friendly message
      console.log('Session expired. Please log in again.');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;