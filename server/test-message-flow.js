/**
 * Test Message Flow
 * Tests complete message sending and fetching process
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5003';

// Test users
let buyerToken = '';
let farmerToken = '';
let buyerId = '';
let farmerId = '';

console.log('🚀 Starting Message Flow Test\n');

async function test() {
  try {
    // Step 1: Get login credentials for test
    console.log('📝 Step 1: Getting test users...');
    const usersRes = await axios.get(`${API_BASE}/api/auth/users`, {
      headers: { Authorization: `Bearer ${process.env.TEST_TOKEN || ''}` }
    });
    
    console.log(`✅ Found ${usersRes.data.length} users`);
    
    if (usersRes.data.length < 2) {
      console.error('❌ Need at least 2 users for testing');
      process.exit(1);
    }

    // Find a buyer and a farmer
    const buyerUser = usersRes.data.find(u => u.role === 'buyer');
    const farmerUser = usersRes.data.find(u => u.role === 'farmer');

    if (!buyerUser || !farmerUser) {
      console.error('❌ Need at least one buyer and one farmer');
      process.exit(1);
    }

    buyerId = buyerUser._id;
    farmerId = farmerUser._id;

    console.log(`\n👤 Buyer: ${buyerUser.name} (${buyerId})`);
    console.log(`👨‍🌾 Farmer: ${farmerUser.name} (${farmerId})\n`);

    // Step 2: Send a message from buyer to farmer
    console.log('📤 Step 2: Sending message from buyer to farmer...');
    const messageRes = await axios.post(
      `${API_BASE}/api/messages`,
      {
        senderId: buyerId,
        recipientId: farmerId,
        content: `Test message sent at ${new Date().toISOString()}`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || ''}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Message sent successfully:');
    console.log(`   ID: ${messageRes.data._id}`);
    console.log(`   From: ${messageRes.data.senderId}`);
    console.log(`   To: ${messageRes.data.recipientId}`);
    console.log(`   Content: ${messageRes.data.content}`);
    console.log(`   Time: ${messageRes.data.createdAt}\n`);

    // Step 3: Fetch messages
    console.log('📥 Step 3: Fetching messages between buyer and farmer...');
    const getRes = await axios.get(
      `${API_BASE}/api/messages/chat/${farmerId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || ''}`
        }
      }
    );

    console.log(`✅ Fetched ${getRes.data.length} messages:`);
    getRes.data.forEach((msg, idx) => {
      console.log(`   [${idx + 1}] ${msg.content.substring(0, 50)}...`);
      console.log(`       From: ${msg.senderId} → To: ${msg.recipientId}`);
      console.log(`       Time: ${msg.createdAt}`);
    });

    console.log('\n✅ Message flow test completed successfully!');

  } catch (err) {
    console.error('❌ Test failed:');
    console.error('Error:', err.response?.data || err.message);
    if (err.response?.status) {
      console.error('Status:', err.response.status);
    }
    process.exit(1);
  }
}

test();
