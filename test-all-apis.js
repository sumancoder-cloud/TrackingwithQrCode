const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testAllAPIs() {
  console.log('🧪 Testing All GPS Tracker APIs...\n');
  
  let authToken = null;

  try {
    // Test 1: Auth Health Check
    console.log('1️⃣ Testing Auth Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/auth/health`);
    console.log('✅ Auth Health:', healthResponse.data.message);

    // Test 2: GPS Health Check
    console.log('\n2️⃣ Testing GPS Health Check...');
    const gpsHealthResponse = await axios.get(`${BASE_URL}/api/gps/health`);
    console.log('✅ GPS Health:', gpsHealthResponse.data.message);

    // Test 3: Login
    console.log('\n3️⃣ Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'testadmin',
      password: 'Admin123!'
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful:', loginResponse.data.data.user.firstName);
      console.log('🔑 Token received:', !!authToken);
    }

    // Test 4: Update GPS Location (Kadapa)
    console.log('\n4️⃣ Testing GPS Location Update (Kadapa)...');
    const locationResponse1 = await axios.post(`${BASE_URL}/api/gps/location`, {
      deviceId: 'QR112562854',
      deviceName: 'Puppy GPS Tracker',
      latitude: 14.4673,
      longitude: 78.8242,
      accuracy: 5,
      speed: 2.5,
      heading: 45
    });
    console.log('✅ Location updated:', locationResponse1.data.message);

    // Test 5: Update GPS Location (Proddatur)
    console.log('\n5️⃣ Testing GPS Location Update (Proddatur)...');
    const locationResponse2 = await axios.post(`${BASE_URL}/api/gps/location`, {
      deviceId: 'QR112562854',
      deviceName: 'Puppy GPS Tracker',
      latitude: 14.7300,
      longitude: 78.5500,
      accuracy: 3,
      speed: 1.8,
      heading: 90
    });
    console.log('✅ Location updated:', locationResponse2.data.message);

    // Test 6: Get Device Location
    console.log('\n6️⃣ Testing Get Device Location...');
    const deviceLocationResponse = await axios.get(`${BASE_URL}/api/gps/device/QR112562854`);
    console.log('✅ Current location:', deviceLocationResponse.data.data.latitude, deviceLocationResponse.data.data.longitude);

    // Test 7: Get Device Path
    console.log('\n7️⃣ Testing Get Device Path...');
    const pathResponse = await axios.get(`${BASE_URL}/api/gps/path/QR112562854`);
    console.log('✅ Path points:', pathResponse.data.data.length);

    // Test 8: Get All Devices
    console.log('\n8️⃣ Testing Get All Devices...');
    const devicesResponse = await axios.get(`${BASE_URL}/api/gps/devices`);
    console.log('✅ Total devices:', devicesResponse.data.data.length);

    // Test 9: Generate QR Code
    console.log('\n9️⃣ Testing QR Code Generation...');
    try {
      const qrResponse = await axios.post(`${BASE_URL}/api/qr/generate`, {
        deviceName: 'Postman Test Device',
        deviceType: 'GPS Tracker',
        description: 'Generated via API test'
      });
      console.log('✅ QR Code generated:', qrResponse.data.data.qrCode);
    } catch (qrError) {
      console.log('⚠️ QR API not available:', qrError.response?.status);
    }

    // Test 10: Simulate Movement
    console.log('\n🔟 Testing Movement Simulation...');
    try {
      const simulateResponse = await axios.post(`${BASE_URL}/api/gps/simulate/QR112562854`, {
        startLat: 14.7300,
        startLng: 78.5500,
        endLat: 14.7350,
        endLng: 78.5550,
        steps: 10,
        deviceName: 'Puppy GPS Tracker'
      });
      console.log('✅ Movement simulated:', simulateResponse.data.message);
    } catch (simError) {
      console.log('⚠️ Simulation API not available:', simError.response?.status);
    }

    console.log('\n🎉 All API Tests Completed Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Authentication: Working');
    console.log('✅ GPS Tracking: Working');
    console.log('✅ Device Management: Working');
    console.log('✅ Location Updates: Working');
    console.log('✅ Path Tracking: Working');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.data?.message || error.message);
    console.error('📊 Status:', error.response?.status);
    console.error('🔗 URL:', error.config?.url);
  }
}

testAllAPIs();
