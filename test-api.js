#!/usr/bin/env node

/**
 * API TEST SCRIPT
 * Tests if the message API is working correctly
 * Usage: node test-api.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5002';

// Test data - you'll need to replace with real IDs
const TEST_DATA = {
  token: null, // Will be filled from localStorage simulation
  senderId: 'YOUR_USER_ID_HERE', // Replace with actual user ID
  recipientId: 'FARMER_ID_HERE', // Replace with actual farmer ID
  content: 'Test message from API test script'
};

async function testAPI() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 FARMCONNECT API TEST SCRIPT');
  console.log('='.repeat(60) + '\n');

  // Test 1: Health Check
  console.log('Test 1: Server Health Check');
  console.log('─'.repeat(60));
  try {
    const healthResponse = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    console.log('✅ Server is running!');
    console.log('Response:', healthResponse.data);
  } catch (error) {
    console.error('❌ Server is NOT responding!');
    console.error('Error:', error.message);
    console.error('\nMake sure to run: node startup.js (or node server.js in /server)');
    process.exit(1);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('Test 2: Message API (Requires valid token)');
  console.log('─'.repeat(60));
  console.log('\nTo test message sending, you need:');
  console.log('1. Valid JWT token from login');
  console.log('2. Valid senderId (your user ID)');
  console.log('3. Valid recipientId (farmer user ID)');
  console.log('\n⚠️  Cannot proceed without authentication token');
  console.log('\nTo get these values:');
  console.log('1. Log in to http://localhost:3000');
  console.log('2. Open browser console (F12)');
  console.log('3. Run: localStorage.getItem("token")');
  console.log('4. Run: localStorage.getItem("userId") or check Network tab');

  console.log('\n' + '='.repeat(60));
  console.log('✅ API Server is responding correctly on port 5002');
  console.log('='.repeat(60) + '\n');
}

testAPI().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
