# PowerShell script to create test QR codes for manual entry

Write-Host "🔲 Creating Test QR Codes for Manual Entry" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Method 1: Create QR codes directly in browser localStorage
Write-Host "📱 Method 1: Browser Console Script" -ForegroundColor Cyan
Write-Host "1. Open your GPS Tracker app at http://localhost:3000" -ForegroundColor Yellow
Write-Host "2. Press F12 to open Developer Tools" -ForegroundColor Yellow
Write-Host "3. Go to Console tab" -ForegroundColor Yellow
Write-Host "4. Copy and paste this code:" -ForegroundColor Yellow
Write-Host ""

$browserScript = @"
// Generate test QR codes
const testQRCodes = [];
const codes = ['QR1234567890123456', 'QR2345678901234567', 'QR3456789012345678'];

codes.forEach((code, index) => {
    const qrCode = {
        id: `TEST-QR-${Date.now()}-${index}`,
        code: code,
        deviceInfo: {
            deviceId: code,
            deviceName: `Test GPS Device ${index + 1}`,
            deviceType: 'GPS Tracker',
            status: 'available',
            generatedAt: new Date().toISOString(),
            createdBy: 'test_user'
        },
        status: 'available',
        createdAt: new Date().toISOString(),
        createdBy: 'test_user',
        deviceDetails: {
            deviceId: code,
            deviceName: `Test GPS Device ${index + 1}`,
            deviceType: 'GPS Tracker'
        }
    };
    testQRCodes.push(qrCode);
});

const existingQRCodes = JSON.parse(localStorage.getItem('generatedQRCodes') || '[]');
const updatedQRCodes = [...existingQRCodes, ...testQRCodes];
localStorage.setItem('generatedQRCodes', JSON.stringify(updatedQRCodes));

console.log('✅ Test QR codes created!');
console.log('📱 You can now use these codes for manual entry:');
codes.forEach(code => console.log(`- ${code}`));
"@

Write-Host $browserScript -ForegroundColor Gray
Write-Host ""

# Method 2: Use Admin Panel (if you're admin)
Write-Host "📱 Method 2: Admin Panel" -ForegroundColor Cyan
Write-Host "1. Login as admin in your GPS Tracker app" -ForegroundColor Yellow
Write-Host "2. Look for '🧪 Generate Test QR Code' button in Quick Actions" -ForegroundColor Yellow
Write-Host "3. Click it to generate a test QR code" -ForegroundColor Yellow
Write-Host "4. Copy the generated code for manual entry" -ForegroundColor Yellow
Write-Host ""

# Method 3: Quick test codes
Write-Host "📱 Method 3: Try These Test Codes" -ForegroundColor Cyan
Write-Host "If you've already generated QR codes, try these:" -ForegroundColor Yellow
Write-Host ""

$testCodes = @(
    "QR1234567890123456",
    "QR2345678901234567", 
    "QR3456789012345678",
    "QR4567890123456789",
    "QR5678901234567890"
)

foreach ($code in $testCodes) {
    Write-Host "   $code" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 How to Test Manual Entry:" -ForegroundColor Cyan
Write-Host "1. First, create QR codes using Method 1 or 2 above" -ForegroundColor White
Write-Host "2. Go to your GPS Tracker app" -ForegroundColor White
Write-Host "3. Click '⌨️ Enter QR Code Manually'" -ForegroundColor White
Write-Host "4. Enter one of the codes (e.g., QR1234567890123456)" -ForegroundColor White
Write-Host "5. Watch the tracker open automatically!" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Test Coordinates for Postman:" -ForegroundColor Cyan
Write-Host "Once tracking starts, send these coordinates:" -ForegroundColor White
Write-Host ""

$coordinates = @"
{
  "deviceId": "QR1234567890123456",
  "deviceName": "Test GPS Device 1",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "accuracy": 3,
  "speed": 0,
  "heading": 0
}
"@

Write-Host $coordinates -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Expected Result:" -ForegroundColor Green
Write-Host "- QR tracker opens automatically after 2 seconds" -ForegroundColor White
Write-Host "- Single 'Start Tracking' button appears" -ForegroundColor White
Write-Host "- Click button → Send coordinates → See real-time updates!" -ForegroundColor White
