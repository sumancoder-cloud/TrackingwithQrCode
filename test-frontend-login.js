// Test the exact same request the frontend makes
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testFrontendLogin() {
  console.log('🧪 Testing Frontend Login Flow...\n');

  try {
    // Simulate exactly what the frontend does
    console.log('1️⃣ Testing with username field (like frontend)...');
    
    const frontendRequest = {
      username: 'testadmin',
      password: 'Admin123!'
    };
    
    console.log('📤 Sending request:', frontendRequest);
    
    const response = await axios.post(`${BASE_URL}/auth/login`, frontendRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Frontend-style request successful!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    // Check response structure
    console.log('\n2️⃣ Checking response structure...');
    console.log('- response.data.success:', response.data.success);
    console.log('- response.data.data:', !!response.data.data);
    console.log('- response.data.data.user:', !!response.data.data?.user);
    console.log('- response.data.data.token:', !!response.data.data?.token);
    
    if (response.data.success && response.data.data) {
      const userData = response.data.data.user;
      console.log('✅ User data found:', userData.firstName, userData.lastName);
      console.log('✅ Role:', userData.role);
      console.log('✅ Token present:', !!response.data.data.token);
    }
    
  } catch (error) {
    console.error('❌ Frontend-style request failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full response:', error.response?.data);
  }
}

testFrontendLogin();
