const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Device = require('./models/Device');
const DeviceRequest = require('./models/DeviceRequest');
const Location = require('./models/Location');

const installDatabase = async () => {
  try {
    console.log('🚀 Starting GPS Tracker Backend Installation...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gps_tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Device.deleteMany({});
    await DeviceRequest.deleteMany({});
    await Location.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create default users
    console.log('👥 Creating default users...');
    
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@assettrack.com',
        password: await bcrypt.hash('Admin@123', 12),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        company: 'Addwise Tracker',
        phone: '1234567890',
        status: 'active',
        isVerified: true
      },
      {
        username: 'superadmin',
        email: 'superadmin@assettrack.com',
        password: await bcrypt.hash('SuperAdmin@123', 12),
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        company: 'Addwise Tracker',
        phone: '1234567891',
        status: 'active',
        isVerified: true
      },
      {
        username: 'suman2_user',
        email: 'suman@example.com',
        password: await bcrypt.hash('Suman123!', 12),
        firstName: 'Suman',
        lastName: 'Yadav',
        role: 'user',
        company: 'Your Company',
        phone: '1234567892',
        status: 'active',
        isVerified: true
      },
      {
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('Test123!', 12),
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        company: 'Test Company',
        phone: '1234567893',
        status: 'active',
        isVerified: true
      }
    ];

    const createdUsers = await User.insertMany(defaultUsers);
    console.log(`✅ Created ${createdUsers.length} default users:`);
    createdUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role}): ${user.email}`);
    });
    console.log();

    // Create sample device requests
    console.log('📱 Creating sample device requests...');
    
    const sampleRequests = [
      {
        requestedBy: createdUsers.find(u => u.username === 'suman2_user')._id,
        devices: [
          {
            name: 'GPS Tracker Pro',
            description: 'High-precision GPS tracking device',
            purpose: 'Vehicle tracking',
            model: 'GT-2000',
            category: 'vehicle',
            status: 'pending'
          },
          {
            name: 'Asset Tracker',
            description: 'Compact asset tracking device',
            purpose: 'Equipment monitoring',
            model: 'AT-500',
            category: 'asset',
            status: 'pending'
          }
        ],
        additionalInfo: 'Need these devices for fleet management project',
        priority: 'high',
        department: 'Operations'
      },
      {
        requestedBy: createdUsers.find(u => u.username === 'testuser')._id,
        devices: [
          {
            name: 'Personal GPS',
            description: 'Personal safety GPS device',
            purpose: 'Personal safety',
            model: 'PG-100',
            category: 'personal',
            status: 'pending'
          }
        ],
        additionalInfo: 'For personal safety during field work',
        priority: 'medium',
        department: 'Field Operations'
      }
    ];

    const createdRequests = await DeviceRequest.insertMany(sampleRequests);
    console.log(`✅ Created ${createdRequests.length} sample device requests\n`);

    // Create approved devices with QR codes
    console.log('🔧 Creating approved devices with QR codes...');
    
    const adminUser = createdUsers.find(u => u.username === 'admin');
    const sumanUser = createdUsers.find(u => u.username === 'suman2_user');
    
    const approvedDevices = [
      {
        deviceId: '1234567890123456',
        name: 'GPS Tracker Pro - Approved',
        description: 'High-precision GPS tracking device',
        purpose: 'Vehicle tracking',
        model: 'GT-2000',
        category: 'vehicle',
        status: 'approved',
        assignedTo: sumanUser._id,
        requestedBy: sumanUser._id,
        approvedBy: adminUser._id,
        approvedAt: new Date(),
        qrCode: {
          data: JSON.stringify({
            requestId: createdRequests[0]._id,
            deviceId: '1234567890123456',
            deviceName: 'GPS Tracker Pro - Approved',
            assignedTo: 'suman2_user',
            generatedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }),
          generatedAt: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      },
      {
        deviceId: '9876543210987654',
        name: 'Asset Tracker - Demo',
        description: 'Demo asset tracking device',
        purpose: 'Equipment monitoring',
        model: 'AT-500',
        category: 'asset',
        status: 'approved',
        assignedTo: sumanUser._id,
        requestedBy: sumanUser._id,
        approvedBy: adminUser._id,
        approvedAt: new Date(),
        qrCode: {
          data: JSON.stringify({
            requestId: createdRequests[0]._id,
            deviceId: '9876543210987654',
            deviceName: 'Asset Tracker - Demo',
            assignedTo: 'suman2_user',
            generatedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }),
          generatedAt: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      }
    ];

    const createdDevices = await Device.insertMany(approvedDevices);
    console.log(`✅ Created ${createdDevices.length} approved devices with QR codes\n`);

    // Create sample location data
    console.log('📍 Creating sample location data...');
    
    const sampleLocations = [
      {
        device: createdDevices[0]._id,
        deviceId: '1234567890123456',
        coordinates: {
          type: 'Point',
          coordinates: [78.8369, 14.7326] // [longitude, latitude] - Proddatur, AP
        },
        accuracy: 10,
        speed: 0,
        batteryLevel: 85,
        signalStrength: 90,
        source: 'gps',
        recordedAt: new Date()
      },
      {
        device: createdDevices[1]._id,
        deviceId: '9876543210987654',
        coordinates: {
          type: 'Point',
          coordinates: [78.8400, 14.7350] // Slightly different location
        },
        accuracy: 15,
        speed: 5,
        batteryLevel: 92,
        signalStrength: 85,
        source: 'gps',
        recordedAt: new Date()
      }
    ];

    const createdLocations = await Location.insertMany(sampleLocations);
    console.log(`✅ Created ${createdLocations.length} sample location records\n`);

    // Update devices with latest location
    for (let i = 0; i < createdDevices.length; i++) {
      const device = createdDevices[i];
      const location = sampleLocations[i];
      
      await Device.findByIdAndUpdate(device._id, {
        'location.coordinates': location.coordinates.coordinates,
        'location.lastUpdated': new Date(),
        isOnline: true,
        lastSeen: new Date(),
        batteryLevel: location.batteryLevel,
        signalStrength: location.signalStrength
      });
    }

    console.log('🎉 Installation completed successfully!\n');
    
    console.log('📋 Summary:');
    console.log(`   - Users created: ${createdUsers.length}`);
    console.log(`   - Device requests: ${createdRequests.length}`);
    console.log(`   - Approved devices: ${createdDevices.length}`);
    console.log(`   - Location records: ${createdLocations.length}\n`);
    
    console.log('🔑 Default Login Credentials:');
    console.log('   Super Admin: superadmin / SuperAdmin@123');
    console.log('   Admin: admin / Admin@123');
    console.log('   User: suman2_user / Suman123!');
    console.log('   Test User: testuser / Test123!\n');
    
    console.log('🚀 Backend is ready! Start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Installation failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
};

// Run installation
installDatabase();
