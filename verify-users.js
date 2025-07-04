// Verify users in the database and test authentication
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to the same database as the server
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gpstracker');
    console.log('✅ Connected to MongoDB: gpstracker');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Import the User model from the server
const User = require('./server/models/User');

async function verifyUsers() {
  try {
    console.log('🔍 Verifying users in gpstracker database...\n');

    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.log('❌ Cannot verify users without database connection');
      process.exit(1);
    }

    // Get all users
    const users = await User.find({}).select('+password');
    console.log(`📊 Found ${users.length} users in database:\n`);

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('🔧 Run: node create-test-user.js to create test users');
      return;
    }

    // Display users
    for (const user of users) {
      console.log(`👤 User: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
      console.log(`   Created: ${user.createdAt}`);
      
      // Test password verification
      try {
        const isValidPassword = await bcrypt.compare('admin123', user.password);
        console.log(`   Password 'admin123' valid: ${isValidPassword ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`   Password test error: ${error.message}`);
      }
      console.log('');
    }

    // Test the findByCredentials method
    console.log('🧪 Testing findByCredentials method...\n');
    
    try {
      const testUser = await User.findByCredentials('admin', 'admin123');
      console.log('✅ findByCredentials test PASSED for admin/admin123');
      console.log(`   Found user: ${testUser.username} (${testUser.role})`);
    } catch (error) {
      console.log('❌ findByCredentials test FAILED for admin/admin123');
      console.log(`   Error: ${error.message}`);
    }

    try {
      const testUser2 = await User.findByCredentials('user', 'admin123');
      console.log('✅ findByCredentials test PASSED for user/admin123');
      console.log(`   Found user: ${testUser2.username} (${testUser2.role})`);
    } catch (error) {
      console.log('❌ findByCredentials test FAILED for user/admin123');
      console.log(`   Error: ${error.message}`);
    }

    try {
      await User.findByCredentials('admin', 'wrongpassword');
      console.log('❌ findByCredentials should have failed for wrong password');
    } catch (error) {
      console.log('✅ findByCredentials correctly rejected wrong password');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
  }
}

verifyUsers();
