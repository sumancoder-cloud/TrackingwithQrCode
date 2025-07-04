# Real-Time GPS Coordinate Update Test Script
# This script simulates Postman API calls to update device coordinates
# and demonstrates real-time map updates

Write-Host "🗺️ Real-Time GPS Coordinate Update Test" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Test device configuration
$deviceId = "QR112562854"
$deviceName = "Test GPS Device"
$baseUrl = "http://localhost:5001"

# Test coordinates (simulating movement)
$coordinates = @(
    @{ lat = 14.7300; lng = 78.5500; location = "Proddatur Start" },
    @{ lat = 14.7350; lng = 78.5550; location = "Moving North-East" },
    @{ lat = 14.7400; lng = 78.5600; location = "Continuing North-East" },
    @{ lat = 14.7450; lng = 78.5650; location = "Further North-East" },
    @{ lat = 14.7500; lng = 78.5700; location = "Final Position" }
)

Write-Host "📍 Testing device: $deviceName ($deviceId)" -ForegroundColor Yellow
Write-Host "🌐 API Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Function to update device location
function Update-DeviceLocation {
    param(
        [string]$DeviceId,
        [string]$DeviceName,
        [double]$Latitude,
        [double]$Longitude,
        [string]$LocationName
    )
    
    $body = @{
        deviceId = $DeviceId
        deviceName = $DeviceName
        latitude = $Latitude
        longitude = $Longitude
        accuracy = 3
        speed = [math]::Round((Get-Random -Minimum 0 -Maximum 50) / 10, 1)
        heading = Get-Random -Minimum 0 -Maximum 360
    } | ConvertTo-Json
    
    try {
        Write-Host "📡 Updating coordinates to: $LocationName" -ForegroundColor Cyan
        Write-Host "   Lat: $Latitude, Lng: $Longitude" -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/gps/location" -Method POST -ContentType "application/json" -Body $body
        
        if ($response.status -eq "success") {
            Write-Host "✅ Location updated successfully!" -ForegroundColor Green
            Write-Host "   Timestamp: $($response.data.timestamp)" -ForegroundColor Gray
        } else {
            Write-Host "❌ Failed to update location: $($response.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error updating location: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Function to get current device location
function Get-DeviceLocation {
    param([string]$DeviceId)
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/gps/device/$DeviceId" -Method GET
        return $response
    } catch {
        Write-Host "❌ Error getting device location: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "🚀 Starting real-time coordinate update test..." -ForegroundColor Green
Write-Host "💡 Open your GPS Tracker app in the browser and navigate to the Real-Time Path Map" -ForegroundColor Yellow
Write-Host "📱 You should see the red path updating in real-time as coordinates change" -ForegroundColor Yellow
Write-Host ""

# Wait for user to be ready
Read-Host "Press Enter when you're ready to start the test (make sure the map is open)"

Write-Host ""
Write-Host "🎯 Sending coordinate updates..." -ForegroundColor Green

# Send coordinate updates with delays
for ($i = 0; $i -lt $coordinates.Count; $i++) {
    $coord = $coordinates[$i]
    Update-DeviceLocation -DeviceId $deviceId -DeviceName $deviceName -Latitude $coord.lat -Longitude $coord.lng -LocationName $coord.location
    
    if ($i -lt $coordinates.Count - 1) {
        Write-Host "⏳ Waiting 5 seconds for map to update..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

Write-Host ""
Write-Host "🎉 Test completed!" -ForegroundColor Green
Write-Host "📊 Getting final device status..." -ForegroundColor Yellow

$finalStatus = Get-DeviceLocation -DeviceId $deviceId
if ($finalStatus) {
    Write-Host "📍 Final device location:" -ForegroundColor Green
    Write-Host "   Device ID: $($finalStatus.data.device.deviceId)" -ForegroundColor Gray
    Write-Host "   Device Name: $($finalStatus.data.device.deviceName)" -ForegroundColor Gray
    Write-Host "   Latitude: $($finalStatus.data.device.latitude)" -ForegroundColor Gray
    Write-Host "   Longitude: $($finalStatus.data.device.longitude)" -ForegroundColor Gray
    Write-Host "   Path Points: $($finalStatus.data.pathPoints)" -ForegroundColor Gray
    Write-Host "   Last Update: $($finalStatus.data.lastUpdate)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ The map should now show a red path connecting all the coordinate points!" -ForegroundColor Green
Write-Host "🔄 The real-time updates happen every 3 seconds automatically" -ForegroundColor Yellow
