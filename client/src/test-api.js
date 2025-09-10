// Simple API test script
import api from './services/api';

const testRegistration = async () => {
  try {
    console.log('Testing API connection...');
    const response = await api.post('/auth/register', {
      name: 'Test Frontend User',
      email: 'frontend-test@example.com',
      password: 'password123',
      role: 'buyer'
    });
    console.log('API test successful:', response.data);
  } catch (error) {
    console.error('API test failed:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
  }
};

// Export for manual testing
window.testApi = testRegistration;

export default testRegistration;
