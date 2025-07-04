# Complete GPS Tracker API Testing Script
# Tests all APIs from the Postman collection

Write-Host "🚀 GPS Tracker API Complete Testing Suite" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:5001"
$testResults = @()

# Function to test API endpoint
function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{"Content-Type" = "application/json"}
    )
    
    Write-Host "🔍 Testing: $Name" -ForegroundColor Cyan
    Write-Host "   $Method $Endpoint" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host "   ✅ SUCCESS" -ForegroundColor Green
        $script:testResults += @{
            Name = $Name
            Status = "✅ PASS"
            Response = $response
        }
        
        # Show key response data
        if ($response.status) {
            Write-Host "   Status: $($response.status)" -ForegroundColor Gray
        }
        if ($response.message) {
            Write-Host "   Message: $($response.message)" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults += @{
            Name = $Name
            Status = "❌ FAIL"
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ""
}

Write-Host "🏁 Starting API Tests..." -ForegroundColor Yellow
Write-Host ""

# 1. AUTHENTICATION APIs
Write-Host "📋 AUTHENTICATION APIs" -ForegroundColor Magenta
Write-Host "======================" -ForegroundColor Magenta

Test-API -Name "Auth Health Check" -Method "GET" -Endpoint "/api/auth/health"

Test-API -Name "Register New User" -Method "POST" -Endpoint "/api/auth/register" -Body @{
    username = "postman_user_$(Get-Random)"
    email = "postman$(Get-Random)@gpstracker.com"
    password = "PostmanTest123!"
    confirmPassword = "PostmanTest123!"
    firstName = "Postman"
    lastName = "User"
    company = "GPS Tracker Inc"
    phone = "+91 9876543210"
    role = "user"
    agreeToTerms = $true
}

Test-API -Name "Login User" -Method "POST" -Endpoint "/api/auth/login" -Body @{
    username = "testuser"
    password = "password123"
}

Test-API -Name "Login Admin" -Method "POST" -Endpoint "/api/auth/login" -Body @{
    username = "admin"
    password = "admin123"
}

# 2. GPS TRACKING APIs
Write-Host "📍 GPS TRACKING APIs" -ForegroundColor Magenta
Write-Host "====================" -ForegroundColor Magenta

Test-API -Name "GPS Health Check" -Method "GET" -Endpoint "/api/gps/health"

Test-API -Name "Update Device Location (Kadapa)" -Method "POST" -Endpoint "/api/gps/location" -Body @{
    deviceId = "QR112562854"
    deviceName = "Puppy GPS Tracker"
    latitude = 14.4673
    longitude = 78.8242
    accuracy = 3
    speed = 0.5
    heading = 180
}

Test-API -Name "Update Device Location (Proddatur)" -Method "POST" -Endpoint "/api/gps/location" -Body @{
    deviceId = "QR112562854"
    deviceName = "Puppy GPS Tracker"
    latitude = 14.7300
    longitude = 78.5500
    accuracy = 3
    speed = 1.8
    heading = 90
}

Test-API -Name "Get Device Current Location" -Method "GET" -Endpoint "/api/gps/device/QR112562854"

Test-API -Name "Get Device Path History" -Method "GET" -Endpoint "/api/gps/path/QR112562854"

Test-API -Name "Get All Tracked Devices" -Method "GET" -Endpoint "/api/gps/devices"

Test-API -Name "Simulate Device Movement" -Method "POST" -Endpoint "/api/gps/simulate/QR112562854" -Body @{
    startLat = 14.4673
    startLng = 78.8242
    endLat = 14.7300
    endLng = 78.5500
    steps = 5
    deviceName = "Puppy GPS Tracker"
}

# 3. DEVICE MANAGEMENT APIs
Write-Host "📱 DEVICE MANAGEMENT APIs" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta

Test-API -Name "Get All Devices" -Method "GET" -Endpoint "/api/devices"

Test-API -Name "Create New Device" -Method "POST" -Endpoint "/api/devices" -Body @{
    deviceId = "QR$(Get-Random -Minimum 100000 -Maximum 999999)"
    name = "Test Device $(Get-Date -Format 'HHmmss')"
    type = "gps"
    model = "GPS-2024"
    description = "Test device created via API"
    serialNumber = "SN$(Get-Random)"
    category = "tracking"
}

# 4. QR CODE APIs
Write-Host "📱 QR CODE APIs" -ForegroundColor Magenta
Write-Host "===============" -ForegroundColor Magenta

Test-API -Name "Generate QR Code" -Method "POST" -Endpoint "/api/qr/generate" -Body @{
    deviceId = "QR$(Get-Random -Minimum 100000 -Maximum 999999)"
    deviceName = "Test QR Device"
    deviceType = "gps"
    generatedBy = "API Test"
}

Test-API -Name "Get All QR Codes" -Method "GET" -Endpoint "/api/qr"

# SUMMARY
Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
Write-Host ""

$passCount = ($testResults | Where-Object { $_.Status -like "*PASS*" }).Count
$failCount = ($testResults | Where-Object { $_.Status -like "*FAIL*" }).Count
$totalCount = $testResults.Count

Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! Your GPS Tracker API is working perfectly!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some tests failed. Check the details above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Detailed Results:" -ForegroundColor White
foreach ($result in $testResults) {
    Write-Host "   $($result.Status) $($result.Name)" -ForegroundColor $(if ($result.Status -like "*PASS*") { "Green" } else { "Red" })
}

Write-Host ""
Write-Host "🔗 Your APIs are available at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   Backend:  http://localhost:5001" -ForegroundColor Gray
Write-Host "   GPS API:  http://localhost:5001/api/gps/health" -ForegroundColor Gray
