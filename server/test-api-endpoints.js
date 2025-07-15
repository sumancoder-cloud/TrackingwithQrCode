const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api';

// Test API endpoint availability
const testEndpoints = async () => {
  console.log('🚀 Testing API Endpoints Availability...');
  console.log('==========================================');

  const endpoints = [
    { method: 'POST', path: '/auth/login', description: 'User Login' },
    { method: 'POST', path: '/auth/register', description: 'User Registration' },
    { method: 'GET', path: '/devices/my-devices', description: 'Get User Devices' },
    { method: 'POST', path: '/devices/user-upload', description: 'Upload Device' },
    { method: 'GET', path: '/devices/check/QR123456789', description: 'Check Device Exists' },
    { method: 'POST', path: '/locations/QR123456789', description: 'Save Device Location' },
    { method: 'GET', path: '/locations/QR123456789/latest', description: 'Get Latest Location' },
    { method: 'GET', path: '/locations/QR123456789/history', description: 'Get Location History' },
    { method: 'GET', path: '/locations/nearby', description: 'Get Nearby Devices' },
    { method: 'GET', path: '/locations/QR123456789/stats', description: 'Get Location Stats' },
    { method: 'POST', path: '/locations/QR123456789/alerts', description: 'Add Location Alert' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing ${endpoint.method} ${endpoint.path}`);
      console.log(`   Description: ${endpoint.description}`);

      const config = {
        method: endpoint.method.toLowerCase(),
        url: `${BASE_URL}${endpoint.path}`,
        timeout: 5000,
        validateStatus: function (status) {
          // Accept any status code (we just want to see if endpoint exists)
          return true;
        }
      };

      // Add dummy data for POST requests
      if (endpoint.method === 'POST') {
        config.data = {};
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      
      if (response.status === 404) {
        console.log(`   ❌ Endpoint not found (404)`);
      } else if (response.status === 401) {
        console.log(`   ✅ Endpoint exists (401 - Authentication required)`);
      } else if (response.status === 400) {
        console.log(`   ✅ Endpoint exists (400 - Bad request - missing data)`);
      } else if (response.status === 500) {
        console.log(`   ⚠️  Endpoint exists but has server error (500)`);
      } else {
        console.log(`   ✅ Endpoint exists (${response.status})`);
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Server not running`);
        break;
      } else if (error.response?.status === 404) {
        console.log(`   ❌ Endpoint not found (404)`);
      } else if (error.response?.status === 401) {
        console.log(`   ✅ Endpoint exists (401 - Authentication required)`);
      } else if (error.response?.status === 400) {
        console.log(`   ✅ Endpoint exists (400 - Bad request)`);
      } else {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
    }
  }

  console.log('\n🎉 Endpoint availability test completed!');
  console.log('==========================================');
};

// Test server health
const testServerHealth = async () => {
  console.log('\n🏥 Testing Server Health...');
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`, { timeout: 5000 });
    console.log('✅ Server is healthy:', response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running');
    } else {
      console.log('⚠️ Server health check failed:', error.message);
    }
  }
};

// Test database connection (if endpoint exists)
const testDatabaseConnection = async () => {
  console.log('\n🗄️ Testing Database Connection...');
  try {
    // Try to hit an endpoint that would require database
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'test',
      password: 'test'
    }, { 
      timeout: 5000,
      validateStatus: () => true 
    });

    if (response.status === 500) {
      console.log('❌ Database connection issue');
    } else {
      console.log('✅ Database connection working (got response from auth endpoint)');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running');
    } else {
      console.log('⚠️ Database test inconclusive:', error.message);
    }
  }
};

// Main test runner
const runTests = async () => {
  await testServerHealth();
  await testDatabaseConnection();
  await testEndpoints();
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testEndpoints,
  testServerHealth,
  testDatabaseConnection,
  runTests
};
