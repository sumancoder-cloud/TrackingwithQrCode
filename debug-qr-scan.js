// Debug QR code scanning process

// Simulate the QR code data that should be generated
const testQRData = {
  deviceId: 'QR112562854',
  deviceName: 'Test GPS Tracker',
  latitude: 14.4673,
  longitude: 78.8242,
  timestamp: new Date().toISOString(),
  createdBy: 'test_user'
};

const qrDataString = JSON.stringify(testQRData);

console.log('🔍 DEBUG: QR Code Scanning Simulation');
console.log('=====================================');
console.log('📄 QR Data String:', qrDataString);
console.log('📏 Data Length:', qrDataString.length);
console.log('🔍 Starts with {:', qrDataString.startsWith('{'));
console.log('🔍 Ends with }:', qrDataString.endsWith('}'));

// Simulate parsing
try {
  const parsed = JSON.parse(qrDataString);
  console.log('\n✅ Parsing successful:');
  console.log('- deviceId:', parsed.deviceId);
  console.log('- deviceName:', parsed.deviceName);
  console.log('- latitude:', parsed.latitude, typeof parsed.latitude);
  console.log('- longitude:', parsed.longitude, typeof parsed.longitude);
  console.log('- timestamp:', parsed.timestamp);
  
  // Check GPS validation
  const hasValidGPS = parsed.latitude && parsed.longitude && 
                     !isNaN(parsed.latitude) && !isNaN(parsed.longitude);
  console.log('\n🎯 GPS Validation Result:', hasValidGPS);
  
  if (hasValidGPS) {
    console.log('✅ GPS coordinates are valid!');
    console.log('📍 Location:', parsed.latitude, parsed.longitude);
  } else {
    console.log('❌ GPS coordinates are invalid!');
    console.log('- latitude valid:', !!parsed.latitude && !isNaN(parsed.latitude));
    console.log('- longitude valid:', !!parsed.longitude && !isNaN(parsed.longitude));
  }
  
} catch (error) {
  console.error('❌ Parsing failed:', error.message);
}

console.log('\n📋 Expected Device Info Structure:');
console.log({
  deviceId: testQRData.deviceId,
  deviceName: testQRData.deviceName,
  latitude: testQRData.latitude,
  longitude: testQRData.longitude,
  timestamp: testQRData.timestamp,
  createdBy: testQRData.createdBy,
  deviceType: 'GPS Tracker',
  status: 'available',
  scannedAt: new Date().toISOString(),
  scannedBy: 'test_user'
});

console.log('\n🎯 This is what should be in scannedDeviceDetails for QR-to-Postman tracking to work!');
