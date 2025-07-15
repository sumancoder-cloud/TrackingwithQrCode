const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/devices/user-upload - User uploads a device
router.post('/user-upload', authenticate, async (req, res) => {
  try {
    console.log('📱 User device upload request received');
    console.log('📋 Request body:', req.body);
    console.log('👤 User:', req.user);

    const { deviceCode, description, purpose, uploadMethod, qrImageName } = req.body;
    const userId = req.user._id || req.user.id;

    console.log('🔑 User ID:', userId);

    // Validate required fields
    if (!deviceCode || !description || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Device code, description, and purpose are required'
      });
    }

    // Check if device code already exists for this user
    const existingDevice = await Device.findOne({
      deviceId: deviceCode,
      assignedTo: userId
    });

    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: 'Device already registered',
        device: existingDevice
      });
    }

    // Ensure device code is exactly 16 characters by padding if necessary
    let formattedDeviceId = deviceCode;
    if (deviceCode.length < 16) {
      // Pad with random numbers to make it 16 characters
      const padding = 16 - deviceCode.length;
      const randomPadding = Math.floor(Math.random() * Math.pow(10, padding)).toString().padStart(padding, '0');
      formattedDeviceId = deviceCode + randomPadding;
    } else if (deviceCode.length > 16) {
      // Take first 16 characters
      formattedDeviceId = deviceCode.substring(0, 16);
    }

    console.log('📱 Original device code:', deviceCode, '(Length:', deviceCode.length, ')');
    console.log('📱 Formatted device ID:', formattedDeviceId, '(Length:', formattedDeviceId.length, ')');

    // Create new device
    const newDevice = new Device({
      deviceId: formattedDeviceId,
      name: description,
      description: description,
      purpose: purpose,
      uploadMethod: uploadMethod,
      qrImageName: qrImageName,
      assignedTo: userId,
      requestedBy: userId, // Required field
      status: 'active', // Valid enum value - auto-approve user uploads
      approvedBy: userId, // Auto-approve
      approvedAt: new Date()
    });

    await newDevice.save();

    res.json({
      success: true,
      message: 'Device uploaded successfully',
      device: newDevice
    });

  } catch (error) {
    console.error('❌ Error uploading device:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/devices/my-devices - Get user's devices
router.get('/my-devices', authenticate, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const devices = await Device.find({ assignedTo: userId })
      .populate('assignedTo', 'username email')
      .sort({ createdAt: -1 });

    const formattedDevices = devices.map(device => ({
      id: device._id,
      deviceCode: device.deviceId,
      description: device.description || device.name,
      purpose: device.purpose,
      uploadMethod: device.uploadMethod,
      qrImageName: device.qrImageName,
      status: device.status,
      addedDate: device.createdAt,
      addedBy: device.assignedTo?.username
    }));

    res.json({
      success: true,
      devices: formattedDevices
    });

  } catch (error) {
    console.error('Error fetching user devices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/devices/check/:deviceCode - Check if device exists
router.get('/check/:deviceCode', authenticate, async (req, res) => {
  try {
    const { deviceCode } = req.params;
    const userId = req.user._id || req.user.id;

    console.log('🔍 Checking device:', deviceCode, 'for user:', userId);

    // First, check if device exists for current user
    const userDevice = await Device.findOne({
      deviceId: deviceCode,
      assignedTo: userId
    }).populate('assignedTo', 'username email');

    if (userDevice) {
      console.log('✅ Device found for current user:', userDevice.deviceId);
      const formattedDevice = {
        id: userDevice._id,
        deviceCode: userDevice.deviceId,
        deviceId: userDevice.deviceId,
        description: userDevice.description || userDevice.name,
        purpose: userDevice.purpose,
        uploadMethod: userDevice.uploadMethod,
        status: userDevice.status,
        addedDate: userDevice.createdAt,
        addedBy: userDevice.assignedTo?.username
      };

      return res.json({
        success: true,
        exists: true,
        ownedByCurrentUser: true,
        device: formattedDevice
      });
    }

    // Check if device exists for another user
    const otherUserDevice = await Device.findOne({
      deviceId: deviceCode
    }).populate('assignedTo', 'username email');

    if (otherUserDevice) {
      console.log('⚠️ Device already assigned to another user:', otherUserDevice.assignedTo?.username);
      return res.json({
        success: true,
        exists: true,
        ownedByCurrentUser: false,
        assignedTo: otherUserDevice.assignedTo?.username,
        message: `This QR code is already assigned to user: ${otherUserDevice.assignedTo?.username}`
      });
    }

    // Device doesn't exist for anyone
    console.log('📝 Device not found, available for registration');
    res.json({
      success: true,
      exists: false,
      ownedByCurrentUser: false,
      device: null
    });

  } catch (error) {
    console.error('Error checking device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/devices/admin/user-uploads - Admin view of all user uploads
router.get('/admin/user-uploads', authenticate, async (req, res) => {
  try {
    // Check if user is admin or superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const devices = await Device.find({})
      .populate('assignedTo', 'username email')
      .sort({ createdAt: -1 });

    const formattedUploads = devices.map(device => ({
      id: device._id,
      deviceCode: device.deviceId,
      description: device.description || device.name,
      purpose: device.purpose,
      uploadMethod: device.uploadMethod,
      qrImageName: device.qrImageName,
      status: device.status,
      addedDate: device.createdAt,
      userId: device.assignedTo?._id,
      userName: device.assignedTo?.username,
      userEmail: device.assignedTo?.email
    }));

    res.json({
      success: true,
      uploads: formattedUploads
    });

  } catch (error) {
    console.error('Error fetching admin device uploads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/devices/admin/approve/:deviceId - Admin approve device
router.put('/admin/approve/:deviceId', authenticate, async (req, res) => {
  try {
    // Check if user is admin or superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { deviceId } = req.params;

    const device = await Device.findByIdAndUpdate(
      deviceId,
      { 
        status: 'approved',
        approvedBy: req.user._id || req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('assignedTo', 'username email');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      message: 'Device approved successfully',
      device: device
    });

  } catch (error) {
    console.error('Error approving device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/devices/admin/reject/:deviceId - Admin reject device
router.put('/admin/reject/:deviceId', authenticate, async (req, res) => {
  try {
    // Check if user is admin or superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { deviceId } = req.params;
    const { reason } = req.body;

    const device = await Device.findByIdAndUpdate(
      deviceId,
      { 
        status: 'rejected',
        rejectedBy: req.user._id || req.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      { new: true }
    ).populate('assignedTo', 'username email');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      message: 'Device rejected successfully',
      device: device
    });

  } catch (error) {
    console.error('Error rejecting device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
