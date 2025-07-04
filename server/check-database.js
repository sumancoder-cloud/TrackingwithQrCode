const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Device = require('./models/Device');
const DeviceRequest = require('./models/DeviceRequest');
const Location = require('./models/Location');

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking GPS Tracker Database...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gps_tracker');
    console.log('✅ Connected to MongoDB\n');

    // Check Users
    const userCount = await User.countDocuments();
    const users = await User.find({}, 'username email role status').limit(10);
    console.log(`👥 USERS (${userCount} total):`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.email} [${user.status}]`);
    });
    console.log();

    // Check Devices
    const deviceCount = await Device.countDocuments();
    const devices = await Device.find({}, 'deviceId name status assignedTo').populate('assignedTo', 'username').limit(10);
    console.log(`📱 DEVICES (${deviceCount} total):`);
    devices.forEach(device => {
      console.log(`   - ${device.deviceId} | ${device.name} | ${device.status} | Assigned to: ${device.assignedTo?.username || 'None'}`);
    });
    console.log();

    // Check Device Requests
    const requestCount = await DeviceRequest.countDocuments();
    const requests = await DeviceRequest.find({}, 'requestId status devices').populate('requestedBy', 'username').limit(10);
    console.log(`📋 DEVICE REQUESTS (${requestCount} total):`);
    requests.forEach(request => {
      console.log(`   - ${request.requestId} | ${request.status} | ${request.devices.length} device(s) | By: ${request.requestedBy?.username || 'Unknown'}`);
    });
    console.log();

    // Check Locations
    const locationCount = await Location.countDocuments();
    const locations = await Location.find({}, 'deviceId coordinates recordedAt').limit(10);
    console.log(`📍 LOCATIONS (${locationCount} total):`);
    locations.forEach(location => {
      const [lng, lat] = location.coordinates.coordinates;
      console.log(`   - Device: ${location.deviceId} | Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)} | ${location.recordedAt.toISOString()}`);
    });
    console.log();

    // Summary
    console.log('📊 DATABASE SUMMARY:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Devices: ${deviceCount}`);
    console.log(`   - Device Requests: ${requestCount}`);
    console.log(`   - Location Records: ${locationCount}`);
    console.log();

    if (userCount > 0 && deviceCount > 0) {
      console.log('🎉 Database setup is SUCCESSFUL!');
      console.log('✅ You can now start the backend server with: npm run dev');
    } else {
      console.log('⚠️  Database seems empty. Run: node install.js');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
};

// Run the check
checkDatabase();
