const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function postmanStyleTest() {
  console.log('📮 Postman-Style API Testing...\n');

  // Test 1: Auth Health Check
  console.log('🔍 Test 1: Auth Health Check');
  console.log('GET', `${BASE_URL}/api/auth/health`);
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/health`);
    console.log('✅ Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Login
  console.log('🔍 Test 2: User Login');
  console.log('POST', `${BASE_URL}/api/auth/login`);
  console.log('Body:', JSON.stringify({
    username: 'testadmin',
    password: 'Admin123!'
  }, null, 2));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'testadmin',
      password: 'Admin123!'
    });
    console.log('✅ Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: GPS Location Update
  console.log('🔍 Test 3: GPS Location Update');
  console.log('POST', `${BASE_URL}/api/gps/location`);
  const locationData = {
    deviceId: 'QR112562854',
    deviceName: 'Puppy GPS Tracker',
    latitude: 14.4673,
    longitude: 78.8242,
    accuracy: 5,
    speed: 2.5,
    heading: 45
  };
  console.log('Body:', JSON.stringify(locationData, null, 2));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/gps/location`, locationData);
    console.log('✅ Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: Get Device Location
  console.log('🔍 Test 4: Get Device Location');
  console.log('GET', `${BASE_URL}/api/gps/device/QR112562854`);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/gps/device/QR112562854`);
    console.log('✅ Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 5: Get All Devices
  console.log('🔍 Test 5: Get All Devices');
  console.log('GET', `${BASE_URL}/api/gps/devices`);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/gps/devices`);
    console.log('✅ Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data);
  }

  console.log('\n🎯 Copy these exact requests to Postman for testing!');
}

postmanStyleTest();
