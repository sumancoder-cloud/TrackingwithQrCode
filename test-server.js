const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Routes for Postman Demo
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'GPS Tracker Backend is running perfectly!',
    timestamp: new Date().toISOString(),
    environment: 'development',
    version: '1.0.0'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Smart Device Management System API is live!',
    success: true,
    endpoints: [
      'GET /api/health',
      'GET /api/test', 
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/devices',
      'POST /api/devices',
      'GET /api/users'
    ]
  });
});

// Mock Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt for email: ${email}`);
  
  if (email === 'admin@gps.com' && password === 'admin123') {
    res.json({ 
      success: true, 
      message: 'Admin login successful',
      token: 'mock-jwt-token-admin-12345',
      user: {
        id: 1,
        email: 'admin@gps.com',
        role: 'admin',
        name: 'GPS Admin'
      }
    });
  } else if (email === 'user@gps.com' && password === 'user123') {
    res.json({ 
      success: true, 
      message: 'User login successful',
      token: 'mock-jwt-token-user-67890',
      user: {
        id: 2,
        email: 'user@gps.com',
        role: 'user',
        name: 'GPS User'
      }
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials. Try admin@gps.com/admin123 or user@gps.com/user123' 
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, role } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required'
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: Date.now(),
      username,
      email,
      role: role || 'user',
      createdAt: new Date().toISOString()
    }
  });
});

// Mock Devices
app.get('/api/devices', (req, res) => {
  res.json({
    success: true,
    devices: [
      {
        id: 1,
        deviceId: 'GPS001',
        name: 'GPS Tracker Pro',
        type: 'gps',
        status: 'online',
        location: {
          latitude: 14.7504,
          longitude: 78.5569,
          address: 'Proddatur, Andhra Pradesh'
        },
        lastSeen: new Date().toISOString()
      },
      {
        id: 2,
        deviceId: 'GPS002', 
        name: 'Vehicle Tracker',
        type: 'vehicle',
        status: 'offline',
        location: {
          latitude: 14.7600,
          longitude: 78.5700,
          address: 'Kadapa, Andhra Pradesh'
        },
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]
  });
});

app.post('/api/devices', (req, res) => {
  const { deviceId, name, type, location } = req.body;
  
  if (!deviceId || !name) {
    return res.status(400).json({
      success: false,
      message: 'Device ID and name are required'
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'Device created successfully',
    device: {
      id: Date.now(),
      deviceId,
      name,
      type: type || 'gps',
      status: 'active',
      location: location || { latitude: 0, longitude: 0 },
      createdAt: new Date().toISOString()
    }
  });
});

// Mock Users
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: [
      {
        id: 1,
        username: 'admin',
        email: 'admin@gps.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        username: 'testuser',
        email: 'user@gps.com', 
        role: 'user',
        status: 'active',
        createdAt: '2024-01-02T00:00:00.000Z'
      }
    ]
  });
});

// Mock QR Code
app.post('/api/qr/generate', (req, res) => {
  const { deviceId, validityDays } = req.body;
  
  res.json({
    success: true,
    message: 'QR code generated successfully',
    qrCode: {
      deviceId: deviceId || 'GPS001',
      qrData: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      validUntil: new Date(Date.now() + (validityDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    }
  });
});

app.post('/api/qr/scan', (req, res) => {
  const { qrData } = req.body;
  
  res.json({
    success: true,
    message: 'QR code scanned successfully',
    device: {
      deviceId: 'GPS001',
      name: 'GPS Tracker Pro',
      type: 'gps',
      status: 'active',
      location: {
        latitude: 14.7504,
        longitude: 78.5569,
        accuracy: 10
      },
      scannedAt: new Date().toISOString()
    }
  });
});

// Mock Location Update
app.post('/api/locations', (req, res) => {
  const { deviceId, latitude, longitude, accuracy } = req.body;
  
  res.json({
    success: true,
    message: 'Location updated successfully',
    location: {
      deviceId: deviceId || 'GPS001',
      latitude: latitude || 14.7504,
      longitude: longitude || 78.5569,
      accuracy: accuracy || 10,
      timestamp: new Date().toISOString()
    }
  });
});

// Dashboard Stats
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalDevices: 15,
      activeDevices: 12,
      offlineDevices: 3,
      totalUsers: 25,
      activeUsers: 18,
      recentAlerts: 3,
      systemStatus: 'Healthy'
    }
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 GPS Tracker Test Server running on port ${PORT}`);
  console.log(`📱 Ready for Postman testing!`);
  console.log(`🌐 Test URL: http://localhost:${PORT}`);
  console.log(`✅ All endpoints are working and ready for demo!`);
});
