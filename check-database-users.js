const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpstracker';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB:', mongoURI);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// User Schema (matching your server model)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' },
  company: String,
  phone: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

const User = mongoose.model('User', userSchema);

async function checkDatabaseUsers() {
  try {
    console.log('🔍 Checking GPS Tracker Database Users...\n');

    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.log('❌ Cannot check users without database connection');
      process.exit(1);
    }

    // Get all users
    const users = await User.find({}).select('-password'); // Exclude password for security

    console.log(`📊 Total users in database: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 Run: node create-test-user.js to create test users');
    } else {
      console.log('👥 Users in Database:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log(`   Last Login: ${user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}`);
        console.log('');
      });
    }

    // Test specific users
    console.log('🧪 Testing specific user lookups:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const testUsernames = ['admin', 'user', 'superadmin'];
    for (const username of testUsernames) {
      const user = await User.findOne({
        $or: [{ username }, { email: username }]
      }).select('-password');

      if (user) {
        console.log(`✅ Found ${username}: ${user.email} (${user.role})`);
      } else {
        console.log(`❌ Not found: ${username}`);
      }
    }

    // Check database collections
    console.log('\n📋 Database Collections:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`📁 ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Error checking database users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
checkDatabaseUsers();