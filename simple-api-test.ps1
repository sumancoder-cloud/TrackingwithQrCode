# Simple GPS Tracker API Testing Script
Write-Host "🚀 GPS Tracker API Testing" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:5001"

Write-Host "🔍 Testing APIs..." -ForegroundColor Yellow
Write-Host ""

# Test 1: GPS Health Check
Write-Host "1. GPS Health Check" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/gps/health" -Method GET
    Write-Host "   ✅ SUCCESS: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Update Device Location
Write-Host "2. Update Device Location" -ForegroundColor Cyan
try {
    $body = @{
        deviceId = "QR112562854"
        deviceName = "Test Device"
        latitude = 14.4673
        longitude = 78.8242
        accuracy = 3
        speed = 1.5
        heading = 90
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/gps/location" -Method POST -ContentType "application/json" -Body $body
    Write-Host "   ✅ SUCCESS: Location updated" -ForegroundColor Green
} catch {
    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Device Location
Write-Host "3. Get Device Current Location" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/gps/device/QR112562854" -Method GET
    Write-Host "   ✅ SUCCESS: Device found" -ForegroundColor Green
    Write-Host "   📍 Location: $($response.data.device.latitude), $($response.data.device.longitude)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Device Path
Write-Host "4. Get Device Path History" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/gps/path/QR112562854" -Method GET
    Write-Host "   ✅ SUCCESS: Path data retrieved" -ForegroundColor Green
    Write-Host "   📊 Path Points: $($response.data.totalPoints)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get All Devices
Write-Host "5. Get All Tracked Devices" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/gps/devices" -Method GET
    Write-Host "   ✅ SUCCESS: Device list retrieved" -ForegroundColor Green
    Write-Host "   📱 Total Devices: $($response.data.totalDevices)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Auth Health Check
Write-Host "6. Auth Health Check" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/health" -Method GET
    Write-Host "   ✅ SUCCESS: Auth service running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Device Management
Write-Host "7. Get All Devices (Management)" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/devices" -Method GET
    Write-Host "   ✅ SUCCESS: Device management API working" -ForegroundColor Green
} catch {
    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: QR Code APIs
Write-Host "8. Get All QR Codes" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/qr" -Method GET
    Write-Host "   ✅ SUCCESS: QR Code API working" -ForegroundColor Green
} catch {
    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 9: Simulate Movement
Write-Host "9. Simulate Device Movement" -ForegroundColor Cyan
try {
    $body = @{
        startLat = 14.4673
        startLng = 78.8242
        endLat = 14.7300
        endLng = 78.5500
        steps = 3
        deviceName = "Test Device"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/gps/simulate/QR112562854" -Method POST -ContentType "application/json" -Body $body
    Write-Host "   ✅ SUCCESS: Movement simulation completed" -ForegroundColor Green
    Write-Host "   🎮 Simulated Points: $($response.data.simulatedPoints)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "🎉 API Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Your services are running at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   Backend:  http://localhost:5001" -ForegroundColor Gray
Write-Host "   GPS API:  http://localhost:5001/api/gps/health" -ForegroundColor Gray
