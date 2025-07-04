# 🗺️ GPS Tracking API Testing Guide

## 🚀 Quick Start

### 1. Start Your Server
```bash
cd server
npm start
```
Server will run on: `http://localhost:5000`

### 2. Import Postman Collection
- Open Postman
- Import `GPS_Tracking_API_Collection.json`
- Set baseUrl variable to `http://localhost:5000`

## 📍 API Endpoints

### Health Check
```
GET /api/gps/health
```
**Response:**
```json
{
  "status": "success",
  "message": "GPS API is running",
  "timestamp": "2025-01-03T10:30:00.000Z",
  "activeDevices": 0
}
```

### Update Device Location
```
POST /api/gps/location
```
**Body:**
```json
{
  "deviceId": "QR112562854",
  "deviceName": "Puppy GPS Tracker",
  "latitude": 14.7300,
  "longitude": 78.5500,
  "accuracy": 5,
  "speed": 2.5,
  "heading": 45
}
```

### Get Device Location
```
GET /api/gps/device/{deviceId}
```

### Get Device Path
```
GET /api/gps/path/{deviceId}
GET /api/gps/path/{deviceId}?limit=10
```

## 🎮 Testing Real-Time Path Movement

### Step 1: Start Frontend
```bash
cd client
npm start
```

### Step 2: Scan QR Code
- Scan or upload QR code: `QR112562854`
- Click "📍 Start GPS Tracking"
- Map will open showing current location

### Step 3: Move Device via Postman

**Move to Kadapa:**
```json
POST /api/gps/location
{
  "deviceId": "QR112562854",
  "latitude": 14.4673,
  "longitude": 78.8242,
  "deviceName": "Puppy GPS Tracker"
}
```

**Move to Proddatur:**
```json
POST /api/gps/location
{
  "deviceId": "QR112562854",
  "latitude": 14.7300,
  "longitude": 78.5500,
  "deviceName": "Puppy GPS Tracker"
}
```

**Move North:**
```json
POST /api/gps/location
{
  "deviceId": "QR112562854",
  "latitude": 14.7310,
  "longitude": 78.5500,
  "deviceName": "Puppy GPS Tracker"
}
```

### Step 4: Watch Map Update
- After each Postman request, the map will update
- Red dot moves to new location
- Red line shows the path trail
- Path points counter increases

## 🎯 Testing Scenarios

### Scenario 1: Puppy Walking
1. Start at home: `14.7300, 78.5500`
2. Walk to park: `14.7310, 78.5510`
3. Run around park: `14.7315, 78.5515`
4. Return home: `14.7300, 78.5500`

### Scenario 2: Vehicle Trip
1. Start in Proddatur: `14.7300, 78.5500`
2. Drive to Kadapa: `14.4673, 78.8242`
3. Stop at market: `14.4680, 78.8250`
4. Return to Proddatur: `14.7300, 78.5500`

### Scenario 3: Simulate Movement
```json
POST /api/gps/simulate/QR112562854
{
  "startLat": 14.7300,
  "startLng": 78.5500,
  "endLat": 14.7350,
  "endLng": 78.5550,
  "steps": 20,
  "deviceName": "Puppy GPS Tracker"
}
```

## 🔍 Monitoring & Debugging

### Check Server Logs
```bash
# In server terminal, you'll see:
📍 GPS API: Updated location for device QR112562854: 14.7300, 78.5500
```

### Check Browser Console
```bash
# In browser console, you'll see:
✅ Location synced with server
🗺️ Updating map with new path point
```

### Check Local Storage
- Open DevTools → Application → Local Storage
- Look for: `realtime_tracking_QR112562854`
- See array of location points

## 📊 API Response Examples

### Successful Location Update
```json
{
  "status": "success",
  "message": "Location updated successfully",
  "data": {
    "deviceId": "QR112562854",
    "location": {
      "deviceId": "QR112562854",
      "deviceName": "Puppy GPS Tracker",
      "latitude": 14.7300,
      "longitude": 78.5500,
      "accuracy": 5,
      "speed": 2.5,
      "heading": 45,
      "timestamp": "2025-01-03T10:30:00.000Z",
      "updatedVia": "API"
    },
    "pathPoints": 1,
    "timestamp": "2025-01-03T10:30:00.000Z"
  }
}
```

### Path History Response
```json
{
  "status": "success",
  "data": {
    "deviceId": "QR112562854",
    "pathPoints": [
      {
        "deviceId": "QR112562854",
        "latitude": 14.7300,
        "longitude": 78.5500,
        "timestamp": "2025-01-03T10:30:00.000Z"
      },
      {
        "deviceId": "QR112562854",
        "latitude": 14.7310,
        "longitude": 78.5510,
        "timestamp": "2025-01-03T10:31:00.000Z"
      }
    ],
    "totalPoints": 2,
    "startTime": "2025-01-03T10:30:00.000Z",
    "endTime": "2025-01-03T10:31:00.000Z"
  }
}
```

## 🚨 Error Handling

### Invalid Coordinates
```json
{
  "status": "error",
  "message": "Invalid coordinates",
  "details": "Latitude must be between -90 and 90, longitude between -180 and 180"
}
```

### Missing Required Fields
```json
{
  "status": "error",
  "message": "deviceId, latitude, and longitude are required",
  "required": ["deviceId", "latitude", "longitude"]
}
```

## 🎉 Success Indicators

✅ **API Working:** Health check returns success
✅ **Location Updates:** Postman requests return 200 status
✅ **Map Updates:** Red dot moves on map after API calls
✅ **Path Recording:** Red line shows movement trail
✅ **Real-time Sync:** Changes appear immediately on frontend

## 🔧 Troubleshooting

**Map not updating?**
- Check browser console for errors
- Verify server is running on port 5000
- Check if device ID matches in Postman and frontend

**API errors?**
- Verify JSON format in Postman
- Check required fields are present
- Ensure coordinates are valid numbers

**Path not showing?**
- Make sure you've made multiple location updates
- Check if device ID is consistent
- Verify map is open and tracking is started

Now you can test real-time GPS tracking by changing coordinates in Postman and watching the device move on the map! 🎯
