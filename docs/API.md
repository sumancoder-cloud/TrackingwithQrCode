# API Documentation

## Base URL
```
Development: http://localhost:5000
Production: https://your-domain.com/api
```

## Authentication

### Headers
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/login
Login user with credentials

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user|admin|superadmin"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### POST /auth/register
Register new user

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "company": "Company Name",
  "phone": "+1234567890"
}
```

#### POST /auth/google
Google OAuth authentication

**Request Body:**
```json
{
  "credential": "google_jwt_token",
  "role": "user"
}
```

### Users

#### GET /users
Get all users (Admin only)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_id",
      "username": "username",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /users/:id
Get user by ID

#### PUT /users/:id
Update user information

#### DELETE /users/:id
Delete user (Admin only)

### Devices

#### GET /devices
Get user's devices

**Response:**
```json
{
  "success": true,
  "devices": [
    {
      "id": "device_id",
      "name": "GPS Tracker 1",
      "model": "GT-Pro",
      "status": "approved",
      "qrCode": "qr_code_data",
      "assignedTo": "user_id",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /devices/request
Request new device

**Request Body:**
```json
{
  "devices": [
    {
      "name": "GPS Tracker Pro",
      "model": "GT-2024",
      "purpose": "Vehicle tracking",
      "description": "For company vehicle monitoring"
    }
  ],
  "additionalInfo": "Urgent requirement for fleet management"
}
```

#### PUT /devices/:id/approve
Approve device request (Admin only)

#### PUT /devices/:id/reject
Reject device request (Admin only)

### QR Codes

#### GET /qr/:deviceId
Get QR code for device

**Response:**
```json
{
  "success": true,
  "qrCode": "base64_qr_image",
  "data": {
    "deviceId": "device_id",
    "deviceName": "GPS Tracker Pro",
    "assignedTo": "username",
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "validUntil": "2024-12-31T23:59:59.999Z"
  }
}
```

#### POST /qr/scan
Record QR code scan

**Request Body:**
```json
{
  "deviceId": "device_id",
  "scanData": "scanned_qr_data",
  "location": {
    "latitude": 14.7504,
    "longitude": 78.5482,
    "accuracy": 10
  }
}
```

### GPS Tracking

#### POST /gps/location
Update device location

**Request Body:**
```json
{
  "deviceId": "device_id",
  "location": {
    "latitude": 14.7504,
    "longitude": 78.5482,
    "accuracy": 10,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /gps/history/:deviceId
Get location history for device

**Query Parameters:**
- `limit`: Number of records (default: 100)
- `from`: Start date (ISO string)
- `to`: End date (ISO string)

### Analytics

#### GET /analytics/dashboard
Get dashboard analytics (Admin only)

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalUsers": 150,
    "totalDevices": 75,
    "pendingRequests": 12,
    "activeDevices": 68,
    "qrScansToday": 45,
    "userGrowth": 15.5,
    "deviceUtilization": 90.7
  }
}
```

#### GET /analytics/users
Get user analytics (Admin only)

#### GET /analytics/devices
Get device analytics (Admin only)

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Invalid or missing authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

## Rate Limiting

- **General API**: 100 requests per minute
- **Authentication**: 10 requests per minute
- **GPS Updates**: 60 requests per minute

## Data Models

### User
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "user|admin|superadmin",
  "firstName": "string",
  "lastName": "string",
  "company": "string",
  "phone": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Device
```json
{
  "id": "string",
  "name": "string",
  "model": "string",
  "status": "pending|approved|rejected",
  "assignedTo": "string",
  "qrCode": "string",
  "purpose": "string",
  "createdAt": "datetime",
  "approvedAt": "datetime"
}
```

### Location
```json
{
  "id": "string",
  "deviceId": "string",
  "latitude": "number",
  "longitude": "number",
  "accuracy": "number",
  "timestamp": "datetime"
}
```

## WebSocket Events (Future)

### Connection
```javascript
const socket = io('ws://localhost:5000');
```

### Events
- `location:update` - Real-time location updates
- `device:approved` - Device approval notifications
- `qr:scanned` - QR code scan events
