const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testUserPasswords() {
  console.log('🔐 Testing User Passwords...\n');

  const users = [
    { username: 'suman_admin3', passwords: ['admin123', 'password123', 'suman123', '123456', 'admin'] },
    { username: 'suman_admin123', passwords: ['admin123', 'password123', 'suman123', '123456', 'admin'] },
    { username: 'suman_superadmin', passwords: ['admin123', 'password123', 'suman123', '123456', 'admin'] },
    { username: 'suman_coder1', passwords: ['admin123', 'password123', 'suman123', '123456', 'admin'] }
  ];

  for (const user of users) {
    console.log(`\n👤 Testing user: ${user.username}`);
    
    for (const password of user.passwords) {
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
          username: user.username,
          password: password
        }, {
          timeout: 5000
        });
        
        if (response.data.success) {
          console.log(`✅ FOUND! ${user.username} password: ${password}`);
          console.log(`👤 User: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
          console.log(`📧 Email: ${response.data.data.user.email}`);
          console.log(`🔑 Role: ${response.data.data.user.role}`);
          break;
        }
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`❌ ${password} - Wrong password`);
        } else {
          console.log(`⚠️ ${password} - Error: ${error.response?.data?.message || error.message}`);
        }
      }
    }
  }

  console.log('\n🎉 Password test complete!');
}

testUserPasswords();
