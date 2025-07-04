// Test user registration and login
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testRegistrationAndLogin() {
  console.log('🧪 Testing User Registration and Login...\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing user registration...');
    
    const timestamp = Math.floor(Date.now() / 1000); // Shorter timestamp
    const newUser = {
      username: `test${timestamp}`,
      email: `test${timestamp}@test.com`,
      password: 'Password123',
      confirmPassword: 'Password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      company: 'Test Company',
      phone: '+91 9876543210',
      agreeToTerms: true
    };
    
    console.log('📤 Registering new user:', {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, newUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('📋 Response:', {
      success: registerResponse.data.success,
      message: registerResponse.data.message,
      user: registerResponse.data.data.user,
      hasToken: !!registerResponse.data.data.token
    });
    
    // Test 2: Login with the newly created user
    console.log('\n2️⃣ Testing login with new user...');
    
    const loginData = {
      username: newUser.username,
      password: newUser.password
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('📋 Login Response:', {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      user: loginResponse.data.data.user,
      hasToken: !!loginResponse.data.data.token
    });
    
    // Test 3: Register an admin user
    console.log('\n3️⃣ Testing admin registration...');
    
    const adminUser = {
      username: `admin${timestamp}`,
      email: `admin${timestamp}@test.com`,
      password: 'Admin123',
      confirmPassword: 'Admin123',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
      company: 'Test Company',
      phone: '+91 9876543211',
      agreeToTerms: true
    };
    
    const adminRegisterResponse = await axios.post(`${BASE_URL}/auth/register`, adminUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin registration successful!');
    console.log('📋 Admin Response:', {
      success: adminRegisterResponse.data.success,
      message: adminRegisterResponse.data.message,
      user: adminRegisterResponse.data.data.user,
      hasToken: !!adminRegisterResponse.data.data.token
    });
    
    // Test 4: Login with admin user
    console.log('\n4️⃣ Testing admin login...');
    
    const adminLoginData = {
      username: adminUser.username,
      password: adminUser.password
    };
    
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, adminLoginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin login successful!');
    console.log('📋 Admin Login Response:', {
      success: adminLoginResponse.data.success,
      message: adminLoginResponse.data.message,
      user: adminLoginResponse.data.data.user,
      hasToken: !!adminLoginResponse.data.data.token
    });
    
    console.log('\n🎉 Registration and Login system working perfectly!');
    console.log('\n📝 New Test Users Created:');
    console.log(`   User: ${newUser.username}, Password: ${newUser.password}, Role: ${newUser.role}`);
    console.log(`   Admin: ${adminUser.username}, Password: ${adminUser.password}, Role: ${adminUser.role}`);
    console.log('\n💡 You can now use these credentials to login to your app!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📋 Error details:', error.response.data);
    }
  }
}

testRegistrationAndLogin();
