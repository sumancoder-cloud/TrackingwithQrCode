const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5001';
const TEST_DEVICE_ID = 'TEST_DEVICE_001';

// Test user credentials (you can change these)
const TEST_USER = {
  email: 'suman.tati2005@gmail.com',
  password: 'Suman@2005'
};

// Starting location (Kadapa, India)
let currentLocation = {
  latitude: 14.4673,
  longitude: 78.8242
};

let authToken = '';

// Create test user if doesn't exist
async function createTestUser() {
  try {
    console.log('👤 Creating test user...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      username: 'testuser',
      email: TEST_USER.email,
      password: TEST_USER.password,
      firstName: 'Test',
      lastName: 'User',
      company: 'GPS Testing',
      phone: '+91 9999999999',
      role: 'user'
    });

    if (response.data.success) {
      console.log('✅ Test user created successfully!');
      return true;
    }
  } catch (error) {
    console.log('ℹ️ User might already exist:', error.response?.data?.message || error.message);
    return true; // Continue anyway
  }
}

// Login to get auth token
async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_USER);

    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful!');
      return true;
    } else {
      console.error('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

// Create a test device
async function createTestDevice() {
  try {
    console.log('📱 Creating test device...');
    const response = await axios.post(`${API_BASE_URL}/api/devices`, {
      name: 'Test GPS Device',
      type: 'gps',
      model: 'GPS Tracker Pro',
      description: 'Test device for real-time tracking',
      serialNumber: TEST_DEVICE_ID,
      category: 'Vehicle Tracking'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Test device created successfully!');
      return response.data.device;
    } else {
      console.log('ℹ️ Device might already exist, continuing...');
      return { _id: TEST_DEVICE_ID };
    }
  } catch (error) {
    console.log('ℹ️ Device creation error (might already exist):', error.response?.data?.message || error.message);
    return { _id: TEST_DEVICE_ID };
  }
}

// Send location update
async function sendLocationUpdate(deviceId, location, address = '') {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/locations`, {
      deviceId: deviceId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: Math.random() * 10 + 5, // Random accuracy between 5-15 meters
      address: address || `Location ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log(`📍 Location updated: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
      return true;
    } else {
      console.error('❌ Location update failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Location update error:', error.response?.data?.message || error.message);
    return false;
  }
}

// Simulate movement along a path
function simulateMovement() {
  // Define a path (simulating movement around Kadapa)
  const waypoints = [
    { lat: 14.4673, lng: 78.8242, name: 'Starting Point - Kadapa Center' },
    { lat: 14.4690, lng: 78.8260, name: 'Moving towards Bus Stand' },
    { lat: 14.4710, lng: 78.8280, name: 'Near Kadapa Bus Stand' },
    { lat: 14.4730, lng: 78.8300, name: 'Moving towards Railway Station' },
    { lat: 14.4750, lng: 78.8320, name: 'Near Kadapa Railway Station' },
    { lat: 14.4770, lng: 78.8340, name: 'Moving towards Airport Road' },
    { lat: 14.4790, lng: 78.8360, name: 'On Airport Road' },
    { lat: 14.4810, lng: 78.8380, name: 'Approaching Kadapa Airport' },
    { lat: 14.4830, lng: 78.8400, name: 'Near Kadapa Airport' },
    { lat: 14.4850, lng: 78.8420, name: 'Airport Area - Kadapa Outskirts' }
  ];
  
  let currentWaypointIndex = 0;
  
  return function getNextLocation() {
    if (currentWaypointIndex >= waypoints.length) {
      // Reset to start for continuous loop
      currentWaypointIndex = 0;
    }
    
    const waypoint = waypoints[currentWaypointIndex];
    currentWaypointIndex++;
    
    // Add some random variation to make it more realistic
    const variation = 0.0001; // About 10 meters
    const location = {
      latitude: waypoint.lat + (Math.random() - 0.5) * variation,
      longitude: waypoint.lng + (Math.random() - 0.5) * variation
    };
    
    return { location, address: waypoint.name };
  };
}

// Main function to run the simulation
async function runSimulation() {
  console.log('🚀 Starting GPS Tracking Simulation...\n');

  // Step 1: Create test user
  await createTestUser();

  // Step 2: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot continue without authentication');
    return;
  }
  
  // Step 2: Create test device
  const device = await createTestDevice();
  const deviceId = device._id;
  
  console.log(`📱 Using device ID: ${deviceId}\n`);
  
  // Step 3: Start location simulation
  const getNextLocation = simulateMovement();
  let updateCount = 0;
  
  console.log('📍 Starting location updates...');
  console.log('💡 Open your GPS tracker app and look for the "Real-Time Path" button!');
  console.log('🗺️ You should see the device moving along the path in real-time\n');
  
  // Send location updates every 3 seconds
  const interval = setInterval(async () => {
    const { location, address } = getNextLocation();
    const success = await sendLocationUpdate(deviceId, location, address);
    
    if (success) {
      updateCount++;
      console.log(`✅ Update #${updateCount} sent - ${address}`);
      
      if (updateCount >= 20) {
        console.log('\n🎉 Simulation completed! 20 location updates sent.');
        console.log('🗺️ Check your GPS tracker app to see the complete path!');
        clearInterval(interval);
      }
    }
  }, 3000); // Update every 3 seconds
  
  // Handle Ctrl+C to stop simulation
  process.on('SIGINT', () => {
    console.log('\n⏹️ Simulation stopped by user');
    clearInterval(interval);
    process.exit(0);
  });
}

// Run the simulation
runSimulation().catch(error => {
  console.error('❌ Simulation error:', error.message);
});
