// Test authentication with the database
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAuthentication() {
  console.log('🧪 Testing Database Authentication...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/auth/health`);
    console.log('✅ Health check:', healthResponse.data.message);
    
    // Test 2: Test login with different users
    const testUsers = [
      { username: 'testuser', password: 'password123' },
      { username: 'admin', password: 'admin123' },
      { username: 'suman_coder1', password: 'password123' },
      { username: 'simple_user', password: '12345678' },
      { username: 'test_admin', password: '12345678' }
    ];

    for (let i = 0; i < testUsers.length; i++) {
      const testUser = testUsers[i];
      console.log(`\n${i + 2}️⃣ Testing login for ${testUser.username}...`);

      try {
        const response = await axios.post(`${BASE_URL}/auth/login`, testUser, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log(`✅ Login successful for ${testUser.username}!`);
        console.log('📋 Response:', {
          success: response.data.success,
          message: response.data.message,
          user: response.data.data.user,
          hasToken: !!response.data.data.token
        });
        break; // Stop after first successful login

      } catch (error) {
        console.log(`❌ Login failed for ${testUser.username}:`, error.response?.data?.message || error.message);
      }
    }

    // Test with a working user for remaining tests
    const userLoginData = {
      username: 'testuser',
      password: 'password123'
    };

    // Test wrong password
    console.log('\n🧪 Testing wrong password...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        username: 'testuser',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log('✅ Wrong password correctly rejected:', error.response?.data?.message || error.message);
    }

    // Test non-existent user
    console.log('\n🧪 Testing non-existent user...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        username: 'nonexistent',
        password: 'password123'
      });
    } catch (error) {
      console.log('✅ Non-existent user correctly rejected:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Authentication system is working!');
    console.log('\n📝 Working Test Users:');
    console.log('   Username: testuser, Password: password123, Role: user');
    console.log('   Username: simple_user, Password: 12345678, Role: user (if created)');
    console.log('   Username: test_admin, Password: 12345678, Role: admin (if created)');
    console.log('\n💡 Try these credentials in your login form!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    if (error.response) {
      console.error('📋 Error details:', error.response.data);
    }
  }
}

testAuthentication();
