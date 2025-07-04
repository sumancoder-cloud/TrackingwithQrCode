const express = require('express');
const Device = require('../models/Device');
const DeviceRequest = require('../models/DeviceRequest');
const { authenticate, authorize, canManageDevices, validateDeviceOwnership } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

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

  const devices = await Device.find(query)
    .populate('assignedTo', 'username firstName lastName email')
    .populate('approvedBy', 'username firstName lastName')
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

module.exports = router;
