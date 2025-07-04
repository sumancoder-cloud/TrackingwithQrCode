const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Add findByCredentials method
userSchema.statics.findByCredentials = async function(username, password) {
  const user = await this.findOne({
    $or: [{ username }, { email: username }]
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

const User = mongoose.model('User', userSchema);

async function createTestUsers() {
  try {
    console.log('🚀 Creating test users for GPS Tracker...\n');

    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.log('❌ Cannot create users without database connection');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('🔐 Password hashed successfully');

    // Test users to create
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@gpstracker.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        company: 'GPS Tracker Inc',
        phone: '+91 9876543210'
      },
      {
        username: 'user',
        email: 'user@gpstracker.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        company: 'GPS Tracker Inc',
        phone: '+91 8765432109'
      },
      {
        username: 'superadmin',
        email: 'superadmin@gpstracker.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        company: 'GPS Tracker Inc',
        phone: '+91 7654321098'
      }
    ];

    // Clear existing test users
    console.log('🗑️ Clearing existing test users...');
    await User.deleteMany({ 
      username: { $in: ['admin', 'user', 'superadmin'] } 
    });

    // Create new users
    console.log('👥 Creating new test users...\n');
    for (const userData of testUsers) {
      try {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created: ${userData.username} (${userData.role}) - ${userData.email}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️ User ${userData.username} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to create ${userData.username}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Database users created successfully!');
    console.log('\n📋 Professional Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 Admin Login:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@gpstracker.com');
    console.log('');
    console.log('👤 User Login:');
    console.log('   Username: user');
    console.log('   Password: admin123');
    console.log('   Email: user@gpstracker.com');
    console.log('');
    console.log('👑 Super Admin Login:');
    console.log('   Username: superadmin');
    console.log('   Password: admin123');
    console.log('   Email: superadmin@gpstracker.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Server URLs:');
    console.log('   Backend API: http://localhost:5000');
    console.log('   Frontend App: http://localhost:3000');
    console.log('   Login Page: http://localhost:3000/login/admin');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createTestUsers();
