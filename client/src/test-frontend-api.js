// Test frontend API connection
import api from './services/api';

async function testFrontendAPI() {
  console.log('🧪 Testing Frontend API Connection...');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await fetch('http://localhost:5001/api/auth/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    
    // Test 2: Test signup
    console.log('2️⃣ Testing signup...');
    const signupData = {
      username: 'frontend_test',
      email: 'frontend@test.com',
      password: 'Test123!',
      confirmPassword: 'Test123!',
      firstName: 'Frontend',
      lastName: 'Test',
      company: 'Test Company',
      phone: '+91 1234567890',
      role: 'user',
      agreeToTerms: true
    };
    
    const signupResponse = await api.register(signupData);
    console.log('✅ Signup response:', signupResponse);
    
    // Test 3: Test login
    console.log('3️⃣ Testing login...');
    const loginResponse = await api.login({
      username: 'frontend_test',
      password: 'Test123!'
    });
    console.log('✅ Login response:', loginResponse);
    
  } catch (error) {
    console.error('❌ Frontend API test failed:', error);
  }
}

// Run test when page loads
if (typeof window !== 'undefined') {
  window.testFrontendAPI = testFrontendAPI;
  console.log('🔧 Run testFrontendAPI() in browser console to test');
}

export default testFrontendAPI;
