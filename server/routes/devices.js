const express = require('express');
const Device = require('../models/Device');
const DeviceRequest = require('../models/DeviceRequest');
const User = require('../models/User');
const { authenticate, authorize, canManageDevices, validateDeviceOwnership } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Check if device exists and get assignment info
// @route   GET /api/devices/check/:deviceId
// @access  Private
router.get('/check/:deviceId', authenticate, asyncHandler(async (req, res, next) => {
  const { deviceId } = req.params;

  if (!deviceId) {
    return next(new AppError('Device ID is required', 400));
  }

  try {
    // Find device by deviceId (QR code)
    const device = await Device.findOne({ deviceId: deviceId })
      .populate('assignedTo', 'username firstName lastName email');

    if (device) {
      // Check if device belongs to current user
      const ownedByCurrentUser = device.assignedTo && device.assignedTo._id.toString() === req.user._id.toString();

      // Device exists, return assignment info
      res.json({
        success: true,
        exists: true,
        ownedByCurrentUser: ownedByCurrentUser,
        device: {
          _id: device._id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          description: device.description,
          assignedTo: device.assignedTo?._id,
          assignedToUsername: device.assignedTo ?
            `${device.assignedTo.firstName || ''} ${device.assignedTo.lastName || ''}`.trim() ||
            device.assignedTo.username : null,
          assignedToEmail: device.assignedTo?.email,
          registrationDate: device.registrationDate,
          status: device.status
        }
      });
    } else {
      // Device doesn't exist
      res.json({
        success: true,
        exists: false,
        device: null
      });
    }
  } catch (error) {
    console.error('Error checking device:', error);
    return next(new AppError('Failed to check device', 500));
  }
}));

// @desc    Register a QR code device to current user
// @route   POST /api/devices/register
// @access  Private
router.post('/register', authenticate, asyncHandler(async (req, res, next) => {
  const { deviceId, deviceName, description, purpose, location } = req.body;

  if (!deviceId) {
    return next(new AppError('Device ID (QR code) is required', 400));
  }

  if (!deviceName || !description || !purpose) {
    return next(new AppError('Device name, description, and purpose are required', 400));
  }

  try {
    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId: deviceId });

    if (existingDevice) {
      if (existingDevice.assignedTo) {
        // Device is already assigned to someone
        if (existingDevice.assignedTo.toString() === req.user._id.toString()) {
          return res.status(400).json({
            success: false,
            message: 'This QR code is already registered to you',
            device: existingDevice
          });
        } else {
          // Device is assigned to another user
          const assignedUser = await User.findById(existingDevice.assignedTo);
          return res.status(400).json({
            success: false,
            message: `This QR code is already assigned to ${assignedUser ? assignedUser.username : 'another user'}`,
            assignedTo: assignedUser ? `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim() || assignedUser.username : 'Unknown User'
          });
        }
      } else {
        // Device exists but not assigned - assign it to current user
        existingDevice.assignedTo = req.user._id;
        existingDevice.requestedBy = req.user._id;
        existingDevice.name = deviceName;
        existingDevice.deviceName = deviceName;
        existingDevice.description = description;
        existingDevice.purpose = purpose;
        existingDevice.registrationDate = new Date();
        existingDevice.status = 'active';

        if (location) {
          existingDevice.lastKnownLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: new Date(),
            address: location.address
          };
        }

        await existingDevice.save();

        return res.status(200).json({
          success: true,
          message: 'QR code successfully registered to your account',
          device: existingDevice
        });
      }
    } else {
      // Device doesn't exist - create new device and assign to user
      const newDevice = await Device.create({
        deviceId: deviceId,
        name: deviceName,
        deviceName: deviceName,
        description: description,
        purpose: purpose,
        assignedTo: req.user._id,
        requestedBy: req.user._id,
        registrationDate: new Date(),
        status: 'active',
        lastKnownLocation: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date(),
          address: location.address
        } : null
      });

      return res.status(201).json({
        success: true,
        message: 'QR code successfully registered to your account',
        device: newDevice
      });
    }
  } catch (error) {
    console.error('Device registration error:', error);
    return next(new AppError('Failed to register device', 500));
  }
}));

// @desc    Get user's registered devices
// @route   GET /api/devices/my-devices
// @access  Private
router.get('/my-devices', authenticate, asyncHandler(async (req, res) => {
  try {
    const devices = await Device.find({ assignedTo: req.user._id })
      .populate('assignedTo', 'username firstName lastName email')
      .sort({ registrationDate: -1 });

    res.json({
      success: true,
      count: devices.length,
      devices: devices
    });
  } catch (error) {
    console.error('Error fetching user devices:', error);
    return next(new AppError('Failed to fetch devices', 500));
  }
}));

// @desc    Submit device request
// @route   POST /api/devices/request
// @access  Private
router.post('/request', authenticate, asyncHandler(async (req, res, next) => {
  const { devices, additionalInfo, priority = 'medium', department, businessJustification } = req.body;

  if (!devices || !Array.isArray(devices) || devices.length === 0) {
    return next(new AppError('Please provide at least one device in the request', 400));
  }

  // Validate each device
  for (const device of devices) {
    if (!device.name || !device.purpose) {
      return next(new AppError('Each device must have a name and purpose', 400));
    }
  }

  const deviceRequest = await DeviceRequest.create({
    requestedBy: req.user._id,
    devices: devices.map(device => ({
      ...device,
      status: 'pending'
    })),
    additionalInfo,
    priority,
    department,
    businessJustification
  });

  await deviceRequest.populate('requestedBy', 'username firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Device request submitted successfully',
    data: {
      request: deviceRequest
    }
  });
}));

// @desc    Get user's device requests
// @route   GET /api/devices/requests
// @access  Private
router.get('/requests', authenticate, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { requestedBy: req.user._id };
  if (status) {
    query.status = status;
  }

  const requests = await DeviceRequest.find(query)
    .populate('devices.approvedBy', 'username firstName lastName')
    .populate('devices.rejectedBy', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await DeviceRequest.countDocuments(query);

  res.json({
    success: true,
    data: {
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get all device requests (Admin/SuperAdmin)
// @route   GET /api/devices/requests/all
// @access  Private (Admin/SuperAdmin)
router.get('/requests/all', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const requests = await DeviceRequest.find(query)
    .populate('requestedBy', 'username firstName lastName email company')
    .populate('devices.approvedBy', 'username firstName lastName')
    .populate('devices.rejectedBy', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await DeviceRequest.countDocuments(query);

  res.json({
    success: true,
    data: {
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Approve device in request
// @route   PUT /api/devices/requests/:requestId/devices/:deviceIndex/approve
// @access  Private (Admin/SuperAdmin)
router.put('/requests/:requestId/devices/:deviceIndex/approve', 
  authenticate, 
  authorize('admin', 'superadmin'), 
  asyncHandler(async (req, res, next) => {
    const { requestId, deviceIndex } = req.params;

    const deviceRequest = await DeviceRequest.findById(requestId)
      .populate('requestedBy', 'username firstName lastName email');

    if (!deviceRequest) {
      return next(new AppError('Device request not found', 404));
    }

    const index = parseInt(deviceIndex);
    if (index < 0 || index >= deviceRequest.devices.length) {
      return next(new AppError('Invalid device index', 400));
    }

    if (deviceRequest.devices[index].status !== 'pending') {
      return next(new AppError('Device has already been processed', 400));
    }

    // Generate unique device ID
    const deviceId = Device.generateDeviceId();

    // Generate QR code data
    const qrData = {
      requestId: deviceRequest._id,
      deviceId: deviceId,
      deviceName: deviceRequest.devices[index].name,
      assignedTo: deviceRequest.requestedBy.username,
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      status: 'active'
    };

    // Create device record
    const device = await Device.create({
      deviceId: deviceId,
      name: deviceRequest.devices[index].name,
      description: deviceRequest.devices[index].description,
      purpose: deviceRequest.devices[index].purpose,
      serialNumber: deviceRequest.devices[index].serialNumber,
      model: deviceRequest.devices[index].model,
      category: deviceRequest.devices[index].category,
      status: 'approved',
      assignedTo: deviceRequest.requestedBy._id,
      requestedBy: deviceRequest.requestedBy._id,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      qrCode: {
        data: JSON.stringify(qrData),
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    });

    // Update device request
    await deviceRequest.approveDevice(index, req.user._id, JSON.stringify(qrData));

    await deviceRequest.populate('devices.approvedBy', 'username firstName lastName');

    res.json({
      success: true,
      message: `Device "${deviceRequest.devices[index].name}" approved successfully`,
      data: {
        device,
        qrCode: qrData,
        request: deviceRequest
      }
    });
  })
);

// @desc    Reject device in request
// @route   PUT /api/devices/requests/:requestId/devices/:deviceIndex/reject
// @access  Private (Admin/SuperAdmin)
router.put('/requests/:requestId/devices/:deviceIndex/reject',
  authenticate,
  authorize('admin', 'superadmin'),
  asyncHandler(async (req, res, next) => {
    const { requestId, deviceIndex } = req.params;
    const { reason } = req.body;

    const deviceRequest = await DeviceRequest.findById(requestId);

    if (!deviceRequest) {
      return next(new AppError('Device request not found', 404));
    }

    const index = parseInt(deviceIndex);
    if (index < 0 || index >= deviceRequest.devices.length) {
      return next(new AppError('Invalid device index', 400));
    }

    if (deviceRequest.devices[index].status !== 'pending') {
      return next(new AppError('Device has already been processed', 400));
    }

    // Update device request
    await deviceRequest.rejectDevice(index, req.user._id, reason);

    await deviceRequest.populate('devices.rejectedBy', 'username firstName lastName');

    res.json({
      success: true,
      message: `Device "${deviceRequest.devices[index].name}" rejected successfully`,
      data: {
        request: deviceRequest
      }
    });
  })
);

// @desc    Get user's approved devices
// @route   GET /api/devices/my-devices
// @access  Private
router.get('/my-devices', authenticate, asyncHandler(async (req, res) => {
  const devices = await Device.find({
    assignedTo: req.user._id,
    status: { $in: ['approved', 'active'] }
  })
  .populate('approvedBy', 'username firstName lastName')
  .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      devices
    }
  });
}));

// @desc    Get all devices (Admin/SuperAdmin)
// @route   GET /api/devices
// @access  Private (Admin/SuperAdmin)
router.get('/', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const { status, assignedTo, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (assignedTo) query.assignedTo = assignedTo;

  // 🔒 SECURITY: Admins can only see devices they created, SuperAdmins see everything
  if (req.user.role === 'admin') {
    query.createdBy = req.user._id;
    console.log(`🔒 Admin ${req.user.username} filtering devices by createdBy: ${req.user._id}`);
  } else if (req.user.role === 'superadmin') {
    console.log(`👑 SuperAdmin ${req.user.username} accessing all devices`);
  }

  const devices = await Device.find(query)
    .populate('assignedTo', 'username firstName lastName email')
    .populate('approvedBy', 'username firstName lastName')
    .populate('createdBy', 'username firstName lastName email') // Include creator info
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Device.countDocuments(query);

  res.json({
    success: true,
    data: {
      devices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get device by ID
// @route   GET /api/devices/:deviceId
// @access  Private
router.get('/:deviceId', authenticate, validateDeviceOwnership, asyncHandler(async (req, res) => {
  const device = req.device;

  await device.populate([
    { path: 'assignedTo', select: 'username firstName lastName email' },
    { path: 'approvedBy', select: 'username firstName lastName' }
  ]);

  res.json({
    success: true,
    data: {
      device
    }
  });
}));

// @desc    Start device tracking
// @route   PUT /api/devices/:deviceId/start-tracking
// @access  Private
router.put('/:deviceId/start-tracking', authenticate, validateDeviceOwnership, asyncHandler(async (req, res) => {
  const device = req.device;

  await device.startTracking();

  res.json({
    success: true,
    message: `GPS tracking started for ${device.name}`,
    data: {
      device
    }
  });
}));

// @desc    Stop device tracking
// @route   PUT /api/devices/:deviceId/stop-tracking
// @access  Private
router.put('/:deviceId/stop-tracking', authenticate, validateDeviceOwnership, asyncHandler(async (req, res) => {
  const device = req.device;

  await device.stopTracking();

  res.json({
    success: true,
    message: `GPS tracking stopped for ${device.name}`,
    data: {
      device
    }
  });
}));

// @desc    Generate QR codes for admin distribution
// @route   POST /api/devices/admin/generate-qr
// @access  Private (Admin/SuperAdmin)
router.post('/admin/generate-qr', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const { count = 1, purpose = 'General Use', description = 'Admin generated QR code' } = req.body;

  try {
    const generatedDevices = [];

    for (let i = 0; i < count; i++) {
      // Generate unique QR code ID
      const qrId = `QR${Date.now()}${Math.floor(Math.random() * 10000)}`;

      // Create device in database (unassigned)
      const device = await Device.create({
        deviceId: qrId,
        name: `${purpose} Device`,
        deviceName: `${purpose} Device`,
        description: description,
        purpose: purpose,
        status: 'active', // Available for assignment
        createdBy: req.user._id,
        createdAt: new Date()
      });

      generatedDevices.push(device);
    }

    res.status(201).json({
      success: true,
      message: `Successfully generated ${count} QR code(s)`,
      devices: generatedDevices,
      count: generatedDevices.length
    });

  } catch (error) {
    console.error('Error generating QR codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR codes',
      error: error.message
    });
  }
}));

// @desc    Delete a device
// @route   DELETE /api/devices/:id
// @access  Private (Admin/SuperAdmin)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    await Device.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device',
      error: error.message
    });
  }
}));

// @desc    Delete unassigned QR codes only
// @route   DELETE /api/devices/admin/delete-unassigned-qr
// @access  Private (Admin/SuperAdmin)
router.delete('/admin/delete-unassigned-qr', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  try {
    // 🔒 SECURITY: Build query based on user role
    const baseQuery = {};
    if (req.user.role === 'admin') {
      baseQuery.createdBy = req.user._id;
      console.log(`🔒 Admin ${req.user.username} can only delete QR codes they created`);
    } else if (req.user.role === 'superadmin') {
      console.log(`👑 SuperAdmin ${req.user.username} can delete any unassigned QR codes`);
    }

    // Delete only QR codes that are not assigned to any user
    // First, let's find all devices and check their assignedTo field
    const allDevices = await Device.find(baseQuery);
    console.log('📊 All devices before cleanup:', allDevices.map(d => ({ id: d.deviceId, assignedTo: d.assignedTo, createdBy: d.createdBy, type: typeof d.assignedTo })));

    // Find devices to delete (unassigned ones)
    const devicesToDelete = allDevices.filter(device => {
      return !device.assignedTo ||
             device.assignedTo === null ||
             device.assignedTo === '' ||
             device.assignedTo === 'Unknown User' ||
             (typeof device.assignedTo === 'string' && device.assignedTo.trim() === '');
    });

    console.log('🗑️ Devices to delete:', devicesToDelete.map(d => ({ id: d.deviceId, assignedTo: d.assignedTo })));

    // Delete by device IDs to avoid ObjectId casting issues
    const deviceIdsToDelete = devicesToDelete.map(d => d._id);
    const result = await Device.deleteMany({ _id: { $in: deviceIdsToDelete } });

    console.log(`🗑️ Deleted ${result.deletedCount} unassigned QR codes`);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} unassigned QR codes`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete unassigned QR codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete unassigned QR codes',
      error: error.message
    });
  }
}));

// @desc    Get QR codes created by current admin (for dropdowns and management)
// @route   GET /api/devices/admin/my-qr-codes
// @access  Private (Admin/SuperAdmin)
router.get('/admin/my-qr-codes', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  try {
    const { status, assigned } = req.query;

    // 🔒 SECURITY: Build query based on user role
    const query = {};
    if (req.user.role === 'admin') {
      query.createdBy = req.user._id;
      console.log(`🔒 Admin ${req.user.username} retrieving QR codes they created`);
    } else if (req.user.role === 'superadmin') {
      console.log(`👑 SuperAdmin ${req.user.username} retrieving all QR codes`);
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by assignment status if provided
    if (assigned === 'true') {
      query.assignedTo = { $ne: null };
    } else if (assigned === 'false') {
      query.assignedTo = null;
    }

    const qrCodes = await Device.find(query)
      .populate('assignedTo', 'username firstName lastName email')
      .populate('createdBy', 'username firstName lastName email')
      .select('deviceId name deviceName description purpose status assignedTo createdBy createdAt')
      .sort({ createdAt: -1 });

    // Separate assigned and unassigned for easier frontend handling
    const assignedQRs = qrCodes.filter(qr => qr.assignedTo);
    const unassignedQRs = qrCodes.filter(qr => !qr.assignedTo);

    res.json({
      success: true,
      data: {
        all: qrCodes,
        assigned: assignedQRs,
        unassigned: unassignedQRs,
        counts: {
          total: qrCodes.length,
          assigned: assignedQRs.length,
          unassigned: unassignedQRs.length
        },
        createdBy: req.user.role === 'admin' ? {
          id: req.user._id,
          username: req.user.username,
          name: `${req.user.firstName} ${req.user.lastName}`.trim() || req.user.username
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Error retrieving admin QR codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve QR codes',
      error: error.message
    });
  }
}));

module.exports = router;
