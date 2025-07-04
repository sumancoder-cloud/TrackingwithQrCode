// Reset passwords for existing users to known values
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('./server/models/User');

async function resetPasswords() {
  try {
    console.log('🔧 Resetting passwords for existing users...');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/gpstracker');
    console.log('✅ Connected to MongoDB: gpstracker');
    
    // Find some existing users and reset their passwords
    const usersToUpdate = [
      { username: 'testuser', newPassword: 'password123' },
      { username: 'admin', newPassword: 'admin123' },
      { username: 'suman_coder1', newPassword: 'password123' },
      { username: 'user', newPassword: 'user123' },
      { username: 'superadmin', newPassword: 'super123' }
    ];
    
    for (const userInfo of usersToUpdate) {
      try {
        const user = await User.findOne({ username: userInfo.username });
        if (user) {
          // Hash the new password
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(userInfo.newPassword, salt);
          
          // Update the password directly in the database
          await User.updateOne(
            { username: userInfo.username },
            { password: hashedPassword }
          );
          
          console.log(`✅ Password reset for ${userInfo.username} -> ${userInfo.newPassword}`);
        } else {
          console.log(`❌ User ${userInfo.username} not found`);
        }
      } catch (error) {
        console.log(`❌ Failed to reset password for ${userInfo.username}:`, error.message);
      }
    }
    
    // Test the updated passwords
    console.log('\n🧪 Testing updated passwords...');
    
    for (const userInfo of usersToUpdate) {
      try {
        const user = await User.findByCredentials(userInfo.username, userInfo.newPassword);
        console.log(`✅ Login test successful for ${userInfo.username} with password ${userInfo.newPassword}`);
      } catch (error) {
        console.log(`❌ Login test failed for ${userInfo.username}:`, error.message);
      }
    }
    
    console.log('\n🎉 Password reset complete!');
    console.log('\n📝 Updated User Credentials:');
    console.log('   Username: testuser, Password: password123');
    console.log('   Username: admin, Password: admin123');
    console.log('   Username: suman_coder1, Password: password123');
    console.log('   Username: user, Password: user123');
    console.log('   Username: superadmin, Password: super123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
}

resetPasswords();
