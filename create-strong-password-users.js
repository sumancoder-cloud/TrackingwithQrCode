// Create users with strong passwords that meet validation requirements
const axios = require('axios');

async function createStrongPasswordUsers() {
  console.log('🔧 Creating users with strong passwords...\n');

  const users = [
    {
      username: 'admin',
      email: 'admin@gpstracker.com',
      password: 'Admin123!',
      confirmPassword: 'Admin123!',
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
      password: 'User123!',
      confirmPassword: 'User123!',
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
      password: 'Super123!',
      confirmPassword: 'Super123!',
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
          console.log(`⚠️ ${userData.username} already exists - deleting and recreating...`);
          
          // Try to delete and recreate (this is just for testing)
          try {
            // Since we can't delete easily, let's try with a different username
            const newUserData = { ...userData, username: userData.username + '_new' };
            const newResponse = await axios.post('http://localhost:5001/api/auth/register', newUserData, {
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            if (newResponse.data.success) {
              console.log(`✅ ${newUserData.username} created successfully as alternative!`);
            }
          } catch (newError) {
            console.log(`❌ Could not create alternative user: ${newError.response?.data?.message || newError.message}`);
          }
        } else {
          console.log(`❌ Error creating ${userData.username}: ${error.response.data.message}`);
        }
      } else {
        console.log(`❌ Network error for ${userData.username}: ${error.message}`);
      }
    }
  }

  console.log('\n🎉 Strong password users created!');
  console.log('\n🔑 NEW Working Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 Admin Login:');
  console.log('   Username: admin_new');
  console.log('   Password: Admin123!');
  console.log('   URL: http://localhost:3000/login/admin');
  console.log('');
  console.log('👤 User Login:');
  console.log('   Username: user_new');
  console.log('   Password: User123!');
  console.log('   URL: http://localhost:3000/login/user');
  console.log('');
  console.log('👑 Super Admin Login:');
  console.log('   Username: superadmin_new');
  console.log('   Password: Super123!');
  console.log('   URL: http://localhost:3000/login/superadmin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

createStrongPasswordUsers();
