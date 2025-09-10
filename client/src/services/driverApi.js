import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance for driver API
const driverAPI = axios.create({
  baseURL: `${API_BASE_URL}/drivers`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
driverAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('driverToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Driver Authentication
export const driverAuth = {
  register: async (driverData) => {
    const response = await driverAPI.post('/register', driverData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await driverAPI.post('/login', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await driverAPI.get('/profile');
    return response.data;
  }
};

// Orders Management
export const driverOrders = {
  getAssignedOrders: async (page = 1, limit = 10, status = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    const response = await driverAPI.get(`/orders?${params}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, statusData) => {
    const response = await driverAPI.patch(`/orders/${orderId}/status`, statusData);
    return response.data;
  },

  respondToOrder: async (orderId, action) => {
    const response = await driverAPI.patch(`/orders/${orderId}/respond`, { action });
    return response.data;
  },

  getDeliveryHistory: async (page = 1, limit = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await driverAPI.get(`/history?${params}`);
    return response.data;
  }
};

// Location and Availability
export const driverLocation = {
  updateLocation: async (latitude, longitude) => {
    const response = await driverAPI.patch('/location', { latitude, longitude });
    return response.data;
  },

  toggleAvailability: async () => {
    const response = await driverAPI.patch('/availability');
    return response.data;
  }
};

// Geolocation helper
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Watch location changes
export const watchLocation = (callback, errorCallback) => {
  if (!navigator.geolocation) {
    errorCallback(new Error('Geolocation is not supported by this browser.'));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};

const driverApiService = {
  auth: driverAuth,
  orders: driverOrders,
  location: driverLocation,
  getCurrentLocation,
  watchLocation
};

export default driverApiService;
