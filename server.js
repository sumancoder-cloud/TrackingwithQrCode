const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpstracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('📦 MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Models
const User = require('./models/User');
const Device = require('./models/Device');
const Activity = require('./models/Activity');

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Dashboard Routes
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ status: 'online' });
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const recentAlerts = await Activity.countDocuments({ 
      type: 'alert',
      createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
    });

    res.json({
      devices: {
        total: totalDevices,
        active: activeDevices,
        offline: totalDevices - activeDevices,
        maintenance: await Device.countDocuments({ status: 'maintenance' })
      },
      users: {
        total: totalUsers,
        active: activeUsers
      },
      alerts: recentAlerts
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Error fetching dashboard statistics' });
  }
});

app.get('/api/dashboard/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('username email role status createdAt')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Users List Error:', error);
    res.status(500).json({ error: 'Error fetching users list' });
  }
});

app.get('/api/dashboard/devices', async (req, res) => {
  try {
    const devices = await Device.find()
      .select('deviceId name status lastSeen location')
      .sort({ lastSeen: -1 });
    res.json(devices);
  } catch (error) {
    console.error('Devices List Error:', error);
    res.status(500).json({ error: 'Error fetching devices list' });
  }
});

app.get('/api/dashboard/activities', async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('userId', 'username')
      .populate('deviceId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (error) {
    console.error('Activities List Error:', error);
    res.status(500).json({ error: 'Error fetching activities' });
  }
});

// Basic route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'Smart Device Management System API is running!' });
});



// Catch all handler: send back React's index.html file
app.post('/v1/chat/completions', (req, res) => {
  const userMessage = req.body.message || "default message";

  // You can later plug in AI logic here
  return res.json({
    reply: `You said: ${userMessage}. This is a test response from the backend.`,
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Smart Device Management System API is live!`);
}); 