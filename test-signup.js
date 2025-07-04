const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testSignup() {
  console.log('🧪 Testing Signup Functionality...\n');

  try {
    // Test signup with new user
    console.log('1️⃣ Testing User Registration...');
    
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits
    const newUser = {
      username: 'test_' + timestamp,
      email: `test_${timestamp}@gpstracker.com`,
      password: 'Test123!',
      confirmPassword: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      company: 'GPS Tracker Inc',
      phone: '+91 9876543210',
      role: 'user',
      agreeToTerms: true
    };

    try {
      const signupResponse = await axios.post(`${BASE_URL}/api/auth/register`, newUser, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Signup successful!');
      console.log('👤 User created:', signupResponse.data.data?.user?.firstName);
      console.log('🔑 Token received:', !!signupResponse.data.data?.token);
      console.log('📧 Email:', signupResponse.data.data?.user?.email);
      
      // Test login with the new user
      console.log('\n2️⃣ Testing Login with New User...');
      
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: newUser.username,
        password: newUser.password
      });
      
      console.log('✅ Login successful with new user!');
      console.log('👤 Logged in as:', loginResponse.data.data?.user?.firstName);
      
    } catch (error) {
      console.error('❌ Signup failed:', error.response?.data?.message || error.message);
      console.log('📊 Status Code:', error.response?.status);
      console.log('📋 Full Response:', error.response?.data);
    }

    // Test signup with duplicate email
    console.log('\n3️⃣ Testing Duplicate Email Handling...');
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        username: 'different_username',
        email: newUser.email, // Same email
        password: 'Test123!',
        firstName: 'Another',
        lastName: 'User',
        role: 'user'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Duplicate email properly rejected');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.data?.message);
      }
    }

    console.log('\n🎉 Signup Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSignup();
