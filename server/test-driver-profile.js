const axios = require('axios');

async function testDriverProfile() {
  console.log('Testing Driver Profile Creation...\n');

  try {
    // First, register a new driver
    const timestamp = Date.now();
    const driverData = {
      name: 'Test Driver Profile',
      email: `driver.profile.${timestamp}@test.com`,
      password: 'password123',
      role: 'driver'
    };

    console.log('Registering driver...');
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', driverData);
    console.log('✅ Driver registered successfully!');
    
    const token = registerResponse.data.token;
    const userId = registerResponse.data.user._id;
    
    // Now check if driver profile was created in the Driver collection
    console.log('\nChecking driver profile in Driver collection...');
    
    const driverProfileResponse = await axios.get(`http://localhost:5000/api/drivers/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Driver profile found!');
    console.log('Driver Profile:', driverProfileResponse.data);
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Driver profile not found - this might be expected if the driver profile endpoint doesn\'t exist');
    } else {
      console.error('❌ Test failed:', error.response?.data || error.message);
    }
  }
}

testDriverProfile();
