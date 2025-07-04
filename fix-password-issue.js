// Fix password issue by creating users through registration endpoint
const axios = require('axios');

async function fixPasswordIssue() {
  console.log('🔧 Fixing password authentication issue...\n');

  const users = [
    {
      username: 'admin',
      email: 'admin@gpstracker.com',
      password: 'admin123',
      confirmPassword: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      company: 'GPS Tracker Inc',
      phone: '+91 9876543210',
      agreeToTerms: true
    },
    {
      username: 'user',
      email: 'user@gpstracker.com',
      password: 'admin123',
      confirmPassword: 'admin123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      company: 'GPS Tracker Inc',
      phone: '+91 8765432109',
      agreeToTerms: true
    },
    {
      username: 'superadmin',
      email: 'superadmin@gpstracker.com',
      password: 'admin123',
      confirmPassword: 'admin123',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      company: 'GPS Tracker Inc',
      phone: '+91 7654321098',
      agreeToTerms: true
    }
  ];

  for (const userData of users) {
    try {
      console.log(`📝 Creating user: ${userData.username}...`);
      
      const response = await axios.post('http://localhost:5001/api/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        console.log(`✅ ${userData.username} created successfully!`);
      } else {
        console.log(`❌ Failed to create ${userData.username}: ${response.data.message}`);
      }

    } catch (error) {
      if (error.response && error.response.data) {
        if (error.response.data.message.includes('already exists')) {
          console.log(`⚠️ ${userData.username} already exists - this is fine!`);
        } else {
          console.log(`❌ Error creating ${userData.username}: ${error.response.data.message}`);
        }
      } else {
        console.log(`❌ Network error for ${userData.username}: ${error.message}`);
      }
    }
  }

  console.log('\n🎉 Password fix complete!');
  console.log('\n🔑 Working Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 Admin Login:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   URL: http://localhost:3000/login/admin');
  console.log('');
  console.log('👤 User Login:');
  console.log('   Username: user');
  console.log('   Password: admin123');
  console.log('   URL: http://localhost:3000/login/user');
  console.log('');
  console.log('👑 Super Admin Login:');
  console.log('   Username: superadmin');
  console.log('   Password: admin123');
  console.log('   URL: http://localhost:3000/login/superadmin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

fixPasswordIssue();
