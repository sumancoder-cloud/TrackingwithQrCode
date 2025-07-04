// Quick setup to create a test user
const axios = require('axios');

async function createTestUser() {
  console.log('🚀 Creating test user for GPS Tracker...\n');

  try {
    const userData = {
      username: 'testuser',
      email: 'testuser@gpstracker.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      company: 'GPS Tracker Inc',
      phone: '+91 9876543210',
      agreeToTerms: true
    };

    const response = await axios.post('http://localhost:5001/api/auth/register', userData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data.success) {
      console.log('✅ Test user created successfully!');
      console.log('\n🔑 Login Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 Username: testuser');
      console.log('🔒 Password: TestPass123!');
      console.log('🌐 Login URL: http://localhost:3001/login/user');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🎉 You can now login to the GPS Tracker application!');
    } else {
      console.log('❌ Failed to create user:', response.data.message);
    }

  } catch (error) {
    if (error.response && error.response.data) {
      console.log('❌ Registration failed:', error.response.data.message);
      if (error.response.data.message.includes('already exists')) {
        console.log('\n✅ User already exists! You can login with:');
        console.log('👤 Username: testuser');
        console.log('🔒 Password: TestPass123!');
        console.log('🌐 Login URL: http://localhost:3001/login/user');
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

createTestUser();
