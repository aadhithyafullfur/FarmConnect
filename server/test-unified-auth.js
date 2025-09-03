const axios = require('axios');

async function testUnifiedAuth() {
  console.log('Testing Unified Authentication System...\n');

  try {
    // Test 1: Register a driver through main auth route
    console.log('Test 1: Driver Registration through main auth route');
    const timestamp = Date.now();
    const driverData = {
      name: 'Test Driver United',
      email: `driver.unified.${timestamp}@test.com`,
      password: 'password123',
      role: 'driver'
    };

    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', driverData);
    console.log('✅ Driver registration successful!');
    console.log('Response:', registerResponse.data);
    
    const driverToken = registerResponse.data.token;
    
    // Test 2: Login with the registered driver
    console.log('\nTest 2: Driver Login through main auth route');
    const loginData = {
      email: `driver.unified.${timestamp}@test.com`,
      password: 'password123',
      role: 'driver'
    };

    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
    console.log('✅ Driver login successful!');
    console.log('Response:', loginResponse.data);
    
    // Test 3: Register a buyer
    console.log('\nTest 3: Buyer Registration');
    const buyerData = {
      name: 'Test Buyer',
      email: `buyer.unified.${timestamp}@test.com`,
      password: 'password123',
      role: 'buyer'
    };

    const buyerRegisterResponse = await axios.post('http://localhost:5000/api/auth/register', buyerData);
    console.log('✅ Buyer registration successful!');
    console.log('Response:', buyerRegisterResponse.data);
    
    // Test 4: Register a farmer
    console.log('\nTest 4: Farmer Registration');
    const farmerData = {
      name: 'Test Farmer',
      email: `farmer.unified.${timestamp}@test.com`,
      password: 'password123',
      role: 'farmer'
    };

    const farmerRegisterResponse = await axios.post('http://localhost:5000/api/auth/register', farmerData);
    console.log('✅ Farmer registration successful!');
    console.log('Response:', farmerRegisterResponse.data);
    
    console.log('\n🎉 All unified authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testUnifiedAuth();
