// Create users using the exact same User model as the server
const mongoose = require('mongoose');

// Import the exact User model from the server
const User = require('./server/models/User');

async function createServerUsers() {
  try {
    console.log('🚀 Creating users with server User model...\n');

    // Connect to the same database as the server
    await mongoose.connect('mongodb://localhost:27017/gpstracker');
    console.log('✅ Connected to MongoDB: gpstracker');

    // Clear existing test users
    console.log('🗑️ Clearing existing test users...');
    await User.deleteMany({ 
      username: { $in: ['admin', 'user', 'superadmin'] } 
    });

    // Create test users using the server's User model (which has password hashing)
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@gpstracker.com',
        password: 'admin123', // This will be hashed by the User model
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        company: 'GPS Tracker Inc',
        phone: '+91 9876543210',
        isVerified: true
      },
      {
        username: 'user',
        email: 'user@gpstracker.com',
        password: 'admin123', // This will be hashed by the User model
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        company: 'GPS Tracker Inc',
        phone: '+91 8765432109',
        isVerified: true
      },
      {
        username: 'superadmin',
        email: 'superadmin@gpstracker.com',
        password: 'admin123', // This will be hashed by the User model
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        company: 'GPS Tracker Inc',
        phone: '+91 7654321098',
        isVerified: true
      }
    ];

    // Create users using the User model (password will be automatically hashed)
    console.log('👥 Creating new test users...\n');
    for (const userData of testUsers) {
      try {
        const user = new User(userData);
        await user.save(); // This will trigger the password hashing middleware
        console.log(`✅ Created: ${userData.username} (${userData.role}) - ${userData.email}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️ User ${userData.username} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to create ${userData.username}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Users created successfully with server User model!');
    console.log('\n🔑 Login Credentials:');
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

  } catch (error) {
    console.error('❌ Failed to create users:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
  }
}

createServerUsers();
