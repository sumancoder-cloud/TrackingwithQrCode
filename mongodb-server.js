const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/gpstracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('🎉 MongoDB Connected Successfully!');
  console.log('📦 Database: gpstracker');

  // Create default admin user if no users exist
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const defaultAdmin = new User({
        username: 'admin',
        email: 'admin@gps.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        company: 'GPS Tracker Inc',
        phone: '+91 1234567890',
        role: 'admin'
      });

      await defaultAdmin.save();
      console.log('👤 Default admin user created:');
      console.log('   Email: admin@gps.com');
      console.log('   Password: admin123');
    }
  } catch (error) {
    console.error('Error creating default user:', error);
  }

  console.log('🌐 Ready for API requests');
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  console.log('💡 Make sure MongoDB is running on localhost:27017');
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  company: String,
  phone: String,
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  signupTime: { type: Date, default: Date.now },
  lastLogin: Date,
  authProvider: { type: String, default: 'local' },
  googleId: String,
  picture: String
});

const User = mongoose.model('User', userSchema);

// Device Schema
const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['gps', 'qr', 'hybrid'], default: 'gps' },
  model: String,
  description: String,
  serialNumber: String,
  category: String,
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    accuracy: Number,
    timestamp: Date
  },
  batteryLevel: { type: Number, min: 0, max: 100, default: 100 },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Device = mongoose.model('Device', deviceSchema);

// QR Code Schema
const qrCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  deviceInfo: {
    deviceName: String,
    deviceModel: String,
    deviceType: String,
    serialNumber: String,
    description: String
  },
  status: { type: String, enum: ['available', 'assigned', 'active'], default: 'available' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: Date,
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastScanned: Date,
  scanCount: { type: Number, default: 0 },
  qrCodeImage: String,
  validUntil: Date
});

const QRCode = mongoose.model('QRCode', qrCodeSchema);

// Location History Schema
const locationSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: Number,
    address: String
  },
  timestamp: { type: Date, default: Date.now },
  trackingSession: String
});

const Location = mongoose.model('Location', locationSchema);

// Activity Schema
const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  type: { type: String, enum: ['login', 'logout', 'qr_scan', 'location_update', 'device_created', 'user_created'], required: true },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

const Activity = mongoose.model('Activity', activitySchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'gps-tracker-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'GPS Tracker Backend with MongoDB is running!',
    timestamp: new Date().toISOString(),
    database: 'Connected to MongoDB',
    collections: ['users', 'devices', 'qrcodes', 'locations', 'activities']
  });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, company, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      company,
      phone,
      role: role || 'user'
    });

    await newUser.save();

    // Log activity
    const activity = new Activity({
      userId: newUser._id,
      type: 'user_created',
      description: `New user registered: ${username}`,
      metadata: { email, role: newUser.role }
    });
    await activity.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.signupTime
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email OR username (flexible login)
    const user = await User.findOne({
      $or: [
        { email: email },
        { username: email } // Allow login with username in email field
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log activity
    const activity = new Activity({
      userId: user._id,
      type: 'login',
      description: `User logged in: ${user.username}`,
      metadata: { email: user.email, loginTime: new Date() }
    });
    await activity.save();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// Get All Users (Admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const users = await User.find()
      .select('-password')
      .sort({ signupTime: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ status: 'active' });
    const totalQRCodes = await QRCode.countDocuments();
    const assignedQRCodes = await QRCode.countDocuments({ status: 'assigned' });
    const recentActivities = await Activity.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        devices: {
          total: totalDevices,
          active: activeDevices,
          offline: totalDevices - activeDevices
        },
        qrCodes: {
          total: totalQRCodes,
          assigned: assignedQRCodes,
          available: totalQRCodes - assignedQRCodes
        },
        activities: {
          last24Hours: recentActivities
        },
        systemStatus: 'Healthy'
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// Get All Devices
app.get('/api/devices', authenticateToken, async (req, res) => {
  try {
    const devices = await Device.find()
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      devices
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching devices',
      error: error.message
    });
  }
});

// Create Device
app.post('/api/devices', authenticateToken, async (req, res) => {
  try {
    const { name, type, model, description, serialNumber, category } = req.body;

    const deviceId = `GPS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newDevice = new Device({
      deviceId,
      name,
      type: type || 'gps',
      model,
      description,
      serialNumber,
      category,
      createdBy: req.user.userId
    });

    await newDevice.save();

    // Log activity
    const activity = new Activity({
      userId: req.user.userId,
      deviceId: newDevice._id,
      type: 'device_created',
      description: `New device created: ${name}`,
      metadata: { deviceId, type, model }
    });
    await activity.save();

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      device: newDevice
    });
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating device',
      error: error.message
    });
  }
});

// Generate QR Code
app.post('/api/qr/generate', authenticateToken, async (req, res) => {
  try {
    const { deviceInfo, count = 1 } = req.body;

    const qrCodes = [];

    for (let i = 0; i < count; i++) {
      const code = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 12).toUpperCase()}`;

      const qrCode = new QRCode({
        code,
        deviceInfo: deviceInfo || {
          deviceName: `Device ${i + 1}`,
          deviceType: 'gps'
        },
        createdBy: req.user.userId,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      await qrCode.save();
      qrCodes.push(qrCode);
    }

    res.status(201).json({
      success: true,
      message: `${count} QR code(s) generated successfully`,
      qrCodes
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating QR codes',
      error: error.message
    });
  }
});

// Get All QR Codes
app.get('/api/qr', authenticateToken, async (req, res) => {
  try {
    const qrCodes = await QRCode.find()
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      qrCodes
    });
  } catch (error) {
    console.error('Get QR codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching QR codes',
      error: error.message
    });
  }
});

// Update Location
app.post('/api/locations', authenticateToken, async (req, res) => {
  try {
    const { deviceId, latitude, longitude, accuracy, address } = req.body;

    const location = new Location({
      deviceId,
      userId: req.user.userId,
      location: {
        latitude,
        longitude,
        accuracy,
        address
      }
    });

    await location.save();

    // Update device location
    await Device.findByIdAndUpdate(deviceId, {
      location: {
        latitude,
        longitude,
        accuracy,
        address,
        timestamp: new Date()
      },
      lastSeen: new Date()
    });

    // Log activity
    const activity = new Activity({
      userId: req.user.userId,
      deviceId,
      type: 'location_update',
      description: 'Device location updated',
      metadata: { latitude, longitude, accuracy }
    });
    await activity.save();

    res.json({
      success: true,
      message: 'Location updated successfully',
      location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
});

// Get Device Location History (for path visualization)
app.get('/api/locations/device/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50 } = req.query;

    const locations = await Location.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      locations: locations.reverse(), // Reverse to get chronological order
      count: locations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching device locations',
      error: error.message
    });
  }
});

// Get All Devices with Latest Locations (for real-time tracking)
app.get('/api/devices/tracking', authenticateToken, async (req, res) => {
  try {
    const devices = await Device.find({ status: 'active' })
      .populate('createdBy', 'username email');

    const devicesWithLocations = await Promise.all(
      devices.map(async (device) => {
        const latestLocation = await Location.findOne({ deviceId: device._id })
          .sort({ timestamp: -1 });

        return {
          ...device.toObject(),
          latestLocation: latestLocation ? latestLocation.location : null,
          lastSeen: latestLocation ? latestLocation.timestamp : device.createdAt
        };
      })
    );

    res.json({
      success: true,
      devices: devicesWithLocations,
      count: devicesWithLocations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tracking data',
      error: error.message
    });
  }
});

// Get Device Locations
app.get('/api/locations/device/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;

    const locations = await Location.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(50); // Get last 50 locations

    res.json({
      success: true,
      locations,
      count: locations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message
    });
  }
});

// Get All Locations (Admin only)
app.get('/api/locations', authenticateToken, async (req, res) => {
  try {
    const locations = await Location.find()
      .populate('deviceId', 'name deviceId')
      .populate('userId', 'username email')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      locations,
      count: locations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching all locations',
      error: error.message
    });
  }
});

// Get Recent Activities
app.get('/api/activities', authenticateToken, async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('userId', 'username email')
      .populate('deviceId', 'name deviceId')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 GPS Tracker MongoDB Server running on port ${PORT}`);
  console.log(`📱 API Base URL: http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Ready for Postman testing!`);
});
