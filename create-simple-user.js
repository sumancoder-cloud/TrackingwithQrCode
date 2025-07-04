// Create a simple test user for authentication
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('./server/models/User');

async function createSimpleUser() {
  try {
    console.log('🔍 Creating simple test user...');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/gpstracker');
    console.log('✅ Connected to MongoDB: gpstracker');
    
    // Remove existing simple_user if exists
    await User.deleteOne({ username: 'simple_user' });
    await User.deleteOne({ email: 'simple@test.com' });
    
    // Create a simple user with known credentials
    const simpleUser = await User.create({
      username: 'simple_user',
      email: 'simple@test.com',
      password: '12345678',
      firstName: 'Simple',
      lastName: 'User',
      role: 'user',
      isVerified: true
    });
    
    console.log('✅ Simple user created successfully!');
    console.log('📋 User details:');
    console.log(`   Username: ${simpleUser.username}`);
    console.log(`   Email: ${simpleUser.email}`);
    console.log(`   Password: 12345678`);
    console.log(`   Role: ${simpleUser.role}`);
    
    // Test login immediately
    console.log('\n🧪 Testing login...');
    const loginTest = await User.findByCredentials('simple_user', '12345678');
    console.log('✅ Login test successful!');
    console.log(`   Logged in as: ${loginTest.firstName} ${loginTest.lastName}`);
    
    // Also create admin user with known password
    await User.deleteOne({ username: 'test_admin' });
    await User.deleteOne({ email: 'testadmin@test.com' });
    
    const adminUser = await User.create({
      username: 'test_admin',
      email: 'testadmin@test.com',
      password: '12345678',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
      isVerified: true
    });
    
    console.log('\n✅ Admin user created successfully!');
    console.log('📋 Admin details:');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: 12345678`);
    console.log(`   Role: ${adminUser.role}`);
    
    // Test admin login
    const adminLoginTest = await User.findByCredentials('test_admin', '12345678');
    console.log('✅ Admin login test successful!');
    
    console.log('\n🎉 Test users created successfully!');
    console.log('\n💡 Use these credentials to login:');
    console.log('   User Login - Username: simple_user, Password: 12345678');
    console.log('   Admin Login - Username: test_admin, Password: 12345678');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
}

createSimpleUser();
