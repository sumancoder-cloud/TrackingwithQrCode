const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testServerConnection() {
  console.log('🧪 Testing GPS Tracker Server Connection...\n');

  try {
    // Test 1: Server Health Check
    console.log('1️⃣ Testing Server Health...');
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/health`, {
        timeout: 5000
      });
      console.log('✅ Server is running:', response.data.message);
      console.log('📊 Status:', response.status);
    } catch (error) {
      console.error('❌ Server health check failed:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('🔧 Server is not running on port 5000');
        console.log('💡 Start server with: cd server && npm start');
        return;
      }
    }

    // Test 2: Test Login API
    console.log('\n2️⃣ Testing Login API...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'suman_admin3',
        password: 'admin123'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Login API working:', loginResponse.data.success);
      console.log('👤 User:', loginResponse.data.data?.user?.firstName);
      console.log('🔑 Token received:', !!loginResponse.data.data?.token);
    } catch (error) {
      console.error('❌ Login API failed:', error.response?.data?.message || error.message);
      console.log('📊 Status Code:', error.response?.status);
      console.log('📋 Response:', error.response?.data);
    }

    // Test 3: Test with wrong credentials
    console.log('\n3️⃣ Testing Wrong Credentials...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'admin',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Wrong credentials properly rejected');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.data?.message);
      }
    }

    // Test 4: Test GPS API
    console.log('\n4️⃣ Testing GPS API...');
    try {
      const gpsResponse = await axios.get(`${BASE_URL}/api/gps/health`);
      console.log('✅ GPS API working:', gpsResponse.data.message);
    } catch (error) {
      console.error('❌ GPS API failed:', error.message);
    }

    // Test 5: CORS Check
    console.log('\n5️⃣ Testing CORS Headers...');
    try {
      const corsResponse = await axios.get(`${BASE_URL}/api/auth/health`);
      const corsHeaders = corsResponse.headers['access-control-allow-origin'];
      console.log('✅ CORS Headers:', corsHeaders || 'Not set');
    } catch (error) {
      console.log('⚠️ CORS check failed');
    }

    console.log('\n🎉 Server Connection Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testServerConnection();
