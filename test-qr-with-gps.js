const QRCode = require('qrcode');

async function generateTestQRWithGPS() {
  console.log('🔲 Generating Test QR Code with GPS Coordinates...\n');

  // Create QR code data with GPS coordinates (Kadapa area)
  const qrData = {
    deviceId: 'QR112562854',
    deviceName: 'Test GPS Tracker',
    latitude: 14.4673,
    longitude: 78.8242,
    timestamp: new Date().toISOString(),
    createdBy: 'test_user'
  };

  const qrDataString = JSON.stringify(qrData);
  
  console.log('📄 QR Code Data:');
  console.log(qrDataString);
  console.log('\n📊 QR Code Content:');
  console.log('- Device ID:', qrData.deviceId);
  console.log('- Device Name:', qrData.deviceName);
  console.log('- Latitude:', qrData.latitude);
  console.log('- Longitude:', qrData.longitude);
  console.log('- Timestamp:', qrData.timestamp);

  try {
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('\n✅ QR Code generated successfully!');
    console.log('📏 Data URL length:', qrCodeDataURL.length);
    console.log('🔗 Data URL preview:', qrCodeDataURL.substring(0, 100) + '...');

    // Save as file for testing
    const fs = require('fs');
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('test-qr-with-gps.png', base64Data, 'base64');
    
    console.log('\n💾 QR Code saved as: test-qr-with-gps.png');
    console.log('\n🧪 Testing Instructions:');
    console.log('1. Upload this QR code image in your GPS Tracker app');
    console.log('2. Click "🔴 Track Postman Updates" button');
    console.log('3. Send Postman updates to see the red path!');
    
    console.log('\n📮 Test Postman Request:');
    console.log('POST http://localhost:5001/api/gps/location');
    console.log(JSON.stringify({
      deviceId: qrData.deviceId,
      deviceName: qrData.deviceName,
      latitude: 14.7300,
      longitude: 78.5500,
      speed: 25
    }, null, 2));

  } catch (error) {
    console.error('❌ Error generating QR code:', error);
  }
}

generateTestQRWithGPS();
