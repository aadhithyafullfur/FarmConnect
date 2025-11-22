// Quick test to see what's happening with the chat
const API_URL = 'http://localhost:5004';

// Get token from localStorage (you need to be logged in)
const token = localStorage.getItem('token');

if (!token) {
  console.error('❌ No token found! Please login first.');
} else {
  console.log('✅ Token found:', token.substring(0, 20) + '...');
  
  // Test 1: Get users
  console.log('\n📥 Testing /api/auth/users...');
  fetch(`${API_URL}/api/auth/users`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => console.log('✅ Users:', data))
    .catch(err => console.error('❌ Error:', err));

  // Test 2: Get chats
  console.log('\n📥 Testing /api/messages/chats...');
  fetch(`${API_URL}/api/messages/chats`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => console.log('✅ Chats:', data))
    .catch(err => console.error('❌ Error:', err));

  // Test 3: Get current user
  console.log('\n📥 Testing token payload...');
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('✅ Token payload:', payload);
}
