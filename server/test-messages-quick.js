#!/usr/bin/env node

/**
 * 📞 FarmConnect Message System - Quick Test
 * 
 * This script tests the complete message flow:
 * 1. Check server health
 * 2. Get list of users
 * 3. Send a test message from buyer to farmer
 * 4. Fetch the message back
 * 
 * Usage: node test-messages-quick.js
 */

const http = require('http');

const API_BASE = 'http://localhost:5003';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data ? JSON.parse(data) : null,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function runTests() {
  log('\n🚀 FarmConnect Message System Test\n', 'cyan');

  try {
    // Step 1: Check server health
    log('📊 Step 1: Checking server health...', 'blue');
    let response = await makeRequest('GET', '/health');
    
    if (response.status !== 200) {
      throw new Error(`Server not responding. Status: ${response.status}`);
    }
    log(`✅ Server is healthy\n   Uptime: ${response.data.uptime}s`, 'green');

    // Step 2: Get users
    log('\n👥 Step 2: Loading users...', 'blue');
    response = await makeRequest('GET', '/api/auth/users');
    
    if (response.status !== 200) {
      throw new Error(`Failed to get users. Status: ${response.status}`);
    }
    
    const users = response.data;
    log(`✅ Loaded ${users.length} users`, 'green');
    
    if (users.length < 2) {
      throw new Error('Need at least 2 users to test messaging');
    }

    // Find a buyer and farmer
    const buyer = users.find(u => u.role === 'buyer') || users[0];
    const farmer = users.find(u => u.role === 'farmer') || users[1];

    log(`\n   Buyer: ${buyer.name} (${buyer._id.substring(0, 8)}...)`);
    log(`   Farmer: ${farmer.name} (${farmer._id.substring(0, 8)}...)\n`);

    // Step 3: Send message
    log('📤 Step 3: Sending test message...', 'blue');
    const messageContent = `Test message from ${buyer.name} at ${new Date().toLocaleTimeString()}`;
    
    response = await makeRequest('POST', '/api/messages', {
      senderId: buyer._id,
      recipientId: farmer._id,
      content: messageContent
    });

    if (response.status !== 201) {
      throw new Error(`Failed to send message. Status: ${response.status}`);
    }

    const sentMessage = response.data;
    log(`✅ Message sent successfully`, 'green');
    log(`   Message ID: ${sentMessage._id.substring(0, 8)}...`);
    log(`   Content: ${sentMessage.content}\n`);

    // Step 4: Fetch messages
    log('📥 Step 4: Fetching messages...', 'blue');
    response = await makeRequest('GET', `/api/messages/chat/${farmer._id}`);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch messages. Status: ${response.status}`);
    }

    const messages = response.data;
    log(`✅ Fetched ${messages.length} message(s)\n`, 'green');

    messages.forEach((msg, idx) => {
      const sender = msg.senderId === buyer._id ? buyer.name : farmer.name;
      const prefix = msg.senderId === buyer._id ? '→ To farmer' : '← From farmer';
      log(`   [${idx + 1}] ${sender} ${prefix}: "${msg.content}"`);
      log(`       Time: ${new Date(msg.createdAt).toLocaleString()}\n`);
    });

    log('✅ All tests passed! Message system is working correctly.\n', 'green');
    log('💡 Next: Open http://localhost:3000 and test from the React app\n', 'cyan');

  } catch (err) {
    log(`❌ Test failed: ${err.message}\n`, 'red');
    process.exit(1);
  }
}

// Run tests
runTests();
