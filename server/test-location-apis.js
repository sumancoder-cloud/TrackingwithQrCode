const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api';
let authToken = '';

// Test data - Update these with your actual values
const testDeviceId = 'QR10824417138433'; // Your registered device ID
const testLocation = {
  latitude: 17.6868159,   // Visakhapatnam coordinates
  longitude: 83.2184815,
  accuracy: 10,
  altitude: 50,
  speed: 0,
  heading: 0,
  batteryLevel: 85,
  signalStrength: -70,
  source: 'api_test'
};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${url} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testLogin = async () => {
  console.log('\n🔐 Testing Login...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'suman_coder1234', // Your actual username
      password: 'suman123'          // Your actual password (update this)
    });

    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
};

const testSaveLocation = async () => {
  console.log('\n📍 Testing Save Location...');
  try {
    const result = await makeRequest('POST', `/locations/${testDeviceId}`, testLocation);
    console.log('✅ Location saved:', result);
    return result;
  } catch (error) {
    console.error('❌ Save location failed');
    return null;
  }
};

const testGetLatestLocation = async () => {
  console.log('\n📍 Testing Get Latest Location...');
  try {
    const result = await makeRequest('GET', `/locations/${testDeviceId}/latest`);
    console.log('✅ Latest location:', result);
    return result;
  } catch (error) {
    console.error('❌ Get latest location failed');
    return null;
  }
};

const testGetLocationHistory = async () => {
  console.log('\n📍 Testing Get Location History...');
  try {
    const result = await makeRequest('GET', `/locations/${testDeviceId}/history?limit=10&page=1`);
    console.log('✅ Location history:', result);
    console.log(`📊 Found ${result.locations?.length || 0} locations`);
    return result;
  } catch (error) {
    console.error('❌ Get location history failed');
    return null;
  }
};

const testGetNearbyDevices = async () => {
  console.log('\n📍 Testing Get Nearby Devices...');
  try {
    const result = await makeRequest('GET', `/locations/nearby?latitude=${testLocation.latitude}&longitude=${testLocation.longitude}&maxDistance=5000`);
    console.log('✅ Nearby devices:', result);
    console.log(`📊 Found ${result.nearbyDevices?.length || 0} nearby devices`);
    return result;
  } catch (error) {
    console.error('❌ Get nearby devices failed');
    return null;
  }
};

const testGetLocationStats = async () => {
  console.log('\n📍 Testing Get Location Stats...');
  try {
    const result = await makeRequest('GET', `/locations/${testDeviceId}/stats`);
    console.log('✅ Location stats:', result);
    return result;
  } catch (error) {
    console.error('❌ Get location stats failed');
    return null;
  }
};

const testAddLocationAlert = async () => {
  console.log('\n🚨 Testing Add Location Alert...');
  try {
    const alertData = {
      type: 'geofence',
      severity: 'high',
      message: 'Device entered restricted area'
    };
    const result = await makeRequest('POST', `/locations/${testDeviceId}/alerts`, alertData);
    console.log('✅ Alert added:', result);
    return result;
  } catch (error) {
    console.error('❌ Add alert failed');
    return null;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Location API Tests...');
  console.log('=====================================');

  // Step 1: Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Test all location APIs
  await testSaveLocation();
  await testGetLatestLocation();
  await testGetLocationHistory();
  await testGetNearbyDevices();
  await testGetLocationStats();
  await testAddLocationAlert();

  console.log('\n🎉 All tests completed!');
  console.log('=====================================');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testLogin,
  testSaveLocation,
  testGetLatestLocation,
  testGetLocationHistory,
  testGetNearbyDevices,
  testGetLocationStats,
  testAddLocationAlert,
  runAllTests
};
