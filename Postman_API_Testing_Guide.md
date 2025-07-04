# 🚀 Complete GPS Tracker API Testing Guide - Postman

## 📋 Prerequisites
1. **Server Running**: `http://localhost:5001`
2. **Database**: MongoDB connected to `gpstracker` database
3. **Postman**: Import `Complete_GPS_Tracker_API_Collection.json`

## 🔧 Setup Instructions

### 1. Import Collection
1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `Complete_GPS_Tracker_API_Collection.json`
4. Collection will be imported with base URL: `http://localhost:5001`

### 2. Environment Variables
- **baseUrl**: `http://localhost:5001` (already set)
- **authToken**: Will be set after login

## 🧪 API Testing Sequence

### **Phase 1: Authentication APIs** 🔐

#### 1.1 Health Check
```
GET {{baseUrl}}/api/auth/health
```
**Expected Response:**
```json
{
  "status": "success",
  "message": "Auth API is running",
  "timestamp": "2025-07-03T12:00:00.000Z"
}
```

#### 1.2 Register New User
```
POST {{baseUrl}}/api/auth/register
```
**Body:**
```json
{
  "username": "postman_user",
  "email": "postman@gpstracker.com",
  "password": "PostmanTest123!",
  "confirmPassword": "PostmanTest123!",
  "firstName": "Postman",
  "lastName": "User",
  "company": "GPS Tracker Inc",
  "phone": "+91 9876543210",
  "role": "user",
  "agreeToTerms": true
}
```

#### 1.3 Login User
```
POST {{baseUrl}}/api/auth/login
```
**Body:**
```json
{
  "username": "testadmin",
  "password": "Admin123!"
}
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Welcome back, Test! (Admin)",
  "data": {
    "user": {
      "id": "...",
      "username": "testadmin",
      "email": "testadmin@gpstracker.com",
      "firstName": "Test",
      "lastName": "Admin",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### **Phase 2: GPS Tracking APIs** 📍

#### 2.1 GPS Health Check
```
GET {{baseUrl}}/api/gps/health
```

#### 2.2 Update Device Location (Kadapa)
```
POST {{baseUrl}}/api/gps/location
```
**Body:**
```json
{
  "deviceId": "QR112562854",
  "deviceName": "Puppy GPS Tracker",
  "latitude": 14.4673,
  "longitude": 78.8242,
  "accuracy": 5,
  "speed": 2.5,
  "heading": 45
}
```

#### 2.3 Update Device Location (Proddatur)
```
POST {{baseUrl}}/api/gps/location
```
**Body:**
```json
{
  "deviceId": "QR112562854",
  "deviceName": "Puppy GPS Tracker",
  "latitude": 14.7300,
  "longitude": 78.5500,
  "accuracy": 3,
  "speed": 1.8,
  "heading": 90
}
```

#### 2.4 Get Device Current Location
```
GET {{baseUrl}}/api/gps/device/QR112562854
```

#### 2.5 Get Device Path History
```
GET {{baseUrl}}/api/gps/path/QR112562854
```

#### 2.6 Get All Tracked Devices
```
GET {{baseUrl}}/api/gps/devices
```

#### 2.7 Simulate Device Movement
```
POST {{baseUrl}}/api/gps/simulate/QR112562854
```
**Body:**
```json
{
  "startLat": 14.7300,
  "startLng": 78.5500,
  "endLat": 14.7350,
  "endLng": 78.5550,
  "steps": 15,
  "deviceName": "Puppy GPS Tracker"
}
```

### **Phase 3: Device Management APIs** 📱

#### 3.1 Get All Devices
```
GET {{baseUrl}}/api/devices
```

#### 3.2 Create New Device
```
POST {{baseUrl}}/api/devices
```
**Body:**
```json
{
  "deviceName": "Test Device",
  "deviceType": "GPS Tracker",
  "description": "Test device for Postman"
}
```

### **Phase 4: QR Code APIs** 📱

#### 4.1 Generate QR Code
```
POST {{baseUrl}}/api/qr/generate
```
**Body:**
```json
{
  "deviceName": "Postman Test Device",
  "deviceType": "GPS Tracker",
  "description": "Generated via Postman"
}
```

#### 4.2 Get All QR Codes
```
GET {{baseUrl}}/api/qr
```

## 🎯 Testing Checklist

### ✅ Authentication Tests
- [ ] Health check returns 200 OK
- [ ] User registration creates new user
- [ ] Login returns JWT token
- [ ] Login with wrong credentials fails (401)
- [ ] Duplicate email registration fails (400)

### ✅ GPS Tracking Tests
- [ ] GPS health check returns 200 OK
- [ ] Location update stores coordinates
- [ ] Device location retrieval works
- [ ] Path history shows movement trail
- [ ] All devices list shows tracked devices
- [ ] Movement simulation creates path points

### ✅ Device Management Tests
- [ ] Device list retrieval works
- [ ] New device creation works
- [ ] Device data is properly stored

### ✅ QR Code Tests
- [ ] QR code generation works
- [ ] QR code list retrieval works
- [ ] Generated QR codes contain device info

## 🔍 Expected Results

### Successful API Responses:
- **Status Codes**: 200 (OK), 201 (Created)
- **Response Format**: JSON with `success: true`
- **Data Structure**: Consistent across all endpoints
- **Error Handling**: Proper error messages for failures

### Database Verification:
- Users stored in `users` collection
- Locations stored in `locations` collection
- Devices stored in `devices` collection
- QR codes stored in `qrcodes` collection

## 🚨 Troubleshooting

### Common Issues:
1. **Connection Refused**: Check if server is running on port 5001
2. **404 Not Found**: Verify API endpoint URLs
3. **401 Unauthorized**: Check if authentication is required
4. **400 Bad Request**: Verify request body format
5. **500 Internal Error**: Check server logs for details

### Debug Commands:
```bash
# Check server status
curl http://localhost:5001/api/auth/health

# Check database connection
node check-database-users.js

# Test specific endpoint
node test-server-connection.js
```

## 🎉 Success Criteria

All APIs should:
✅ Return proper HTTP status codes
✅ Provide consistent JSON responses
✅ Handle errors gracefully
✅ Store data in MongoDB correctly
✅ Support real-time GPS tracking
✅ Generate and manage QR codes
✅ Authenticate users properly

**Your GPS Tracker API is ready for production testing!** 🚀
