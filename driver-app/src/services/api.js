import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5001/api'; // Change this to your server URL

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('driverToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage
      await AsyncStorage.multiRemove(['driverToken', 'driverData']);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/drivers/login', credentials),
  register: (userData) => api.post('/drivers/register', userData),
  getProfile: () => api.get('/drivers/profile'),
  updateProfile: (profileData) => api.put('/drivers/profile', profileData),
};

export const orderAPI = {
  getOrders: () => api.get('/drivers/orders'),
  getOrderDetails: (orderId) => api.get(`/drivers/orders/${orderId}`),
  acceptOrder: (orderId) => api.post(`/drivers/orders/${orderId}/accept`),
  updateOrderStatus: (orderId, status) => api.put(`/drivers/orders/${orderId}/status`, { status }),
  getEarnings: () => api.get('/drivers/earnings'),
};

export const locationAPI = {
  updateLocation: (location) => api.put('/drivers/location', location),
  toggleAvailability: (isAvailable) => api.put('/drivers/availability', { isAvailable }),
};

export default api;
