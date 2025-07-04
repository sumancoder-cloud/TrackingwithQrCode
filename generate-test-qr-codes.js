// Simple script to generate test QR codes for manual entry
// Run this in browser console to create test QR codes

function generateTestQRCodes() {
    console.log('🔲 Generating Test QR Codes for Manual Entry...');
    
    // Generate simple 16-digit codes
    const generateCode = () => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `QR${timestamp}${random}`;
    };
    
    // Create test QR codes
    const testQRCodes = [];
    const codes = [
        'QR1234567890123456',
        'QR2345678901234567', 
        'QR3456789012345678',
        'QR4567890123456789',
        'QR5678901234567890'
    ];
    
    codes.forEach((code, index) => {
        const qrCode = {
            id: `TEST-QR-${Date.now()}-${index}`,
            code: code,
            deviceInfo: {
                deviceId: code,
                deviceName: `Test GPS Device ${index + 1}`,
                deviceType: 'GPS Tracker',
                manufacturer: 'ADDWISE',
                model: 'GPS Tracker Pro',
                status: 'available',
                generatedAt: new Date().toISOString(),
                createdBy: 'test_user'
            },
            status: 'available',
            createdAt: new Date().toISOString(),
            createdBy: 'test_user',
            assignedTo: null,
            assignedAt: null,
            deviceDetails: {
                deviceId: code,
                deviceName: `Test GPS Device ${index + 1}`,
                deviceType: 'GPS Tracker'
            },
            lastScanned: null,
            scanCount: 0,
            qrCodeImage: null // Will be generated when needed
        };
        testQRCodes.push(qrCode);
    });
    
    // Save to localStorage
    const existingQRCodes = JSON.parse(localStorage.getItem('generatedQRCodes') || '[]');
    const updatedQRCodes = [...existingQRCodes, ...testQRCodes];
    localStorage.setItem('generatedQRCodes', JSON.stringify(updatedQRCodes));
    
    console.log('✅ Generated test QR codes:');
    codes.forEach((code, index) => {
        console.log(`${index + 1}. ${code} - Test GPS Device ${index + 1}`);
    });
    
    console.log('\n📱 You can now use these codes for manual entry:');
    console.log('1. Click "⌨️ Enter QR Code Manually"');
    console.log('2. Enter any of the codes above');
    console.log('3. Watch the tracker open automatically!');
    
    return codes;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    generateTestQRCodes();
}
