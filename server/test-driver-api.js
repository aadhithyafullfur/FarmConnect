const axios = require('axios');

const testDriverAPI = async () => {
  try {
    console.log('Testing Driver Registration API...');
    
    const registrationData = {
      name: "Test Driver",
      email: "testdriver@example.com",
      password: "password123",
      phone: "1234567890",
      licenseNumber: "DL123456789",
      vehicle: {
        type: "motorcycle",
        make: "Honda",
        model: "Activa",
        plateNumber: "AB12CD3456",
        year: 2022
      }
    };

    const response = await axios.post('http://localhost:5000/api/drivers/register', registrationData);
    console.log('Registration successful:', response.data);

    // Test login with the same credentials
    console.log('\nTesting Driver Login API...');
    const loginData = {
      email: "testdriver@example.com",
      password: "password123"
    };

    const loginResponse = await axios.post('http://localhost:5000/api/drivers/login', loginData);
    console.log('Login successful:', loginResponse.data);

    console.log('\n✅ Driver authentication is working correctly!');

  } catch (error) {
    console.error('❌ Error testing driver API:');
    console.error('Error message:', error.message);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Full error:', error);
  }
};

testDriverAPI();
