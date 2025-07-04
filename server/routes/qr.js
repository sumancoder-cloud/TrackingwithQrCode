const express = require('express');
const QRCode = require('qrcode');
const Device = require('../models/Device');
const { authenticate, validateDeviceOwnership } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Generate QR code for device
// @route   GET /api/qr/:deviceId
// @access  Private
router.get('/:deviceId', authenticate, validateDeviceOwnership, asyncHandler(async (req, res, next) => {
  const device = req.device;

  if (!device.qrCode.data) {
    return next(new AppError('QR code not generated for this device', 404));
  }

  if (!device.qrCode.isActive) {
    return next(new AppError('QR code is inactive', 400));
  }

  if (device.qrCode.validUntil && device.qrCode.validUntil < new Date()) {
    return next(new AppError('QR code has expired', 400));
  }

  const qrData = JSON.parse(device.qrCode.data);

  res.json({
    success: true,
    data: {
      qrCode: {
        data: qrData,
        deviceId: qrData.deviceId,
        deviceName: qrData.deviceName,
        assignedTo: qrData.assignedTo,
        generatedAt: qrData.generatedAt,
        validUntil: qrData.validUntil,
        status: qrData.status
      },
      device: {
        deviceId: device.deviceId,
        name: device.name,
        status: device.status
      }
    }
  });
}));

// @desc    Generate QR code image for device
// @route   GET /api/qr/:deviceId/image
// @access  Private
router.get('/:deviceId/image', authenticate, validateDeviceOwnership, asyncHandler(async (req, res, next) => {
  const { format = 'png', size = 200, margin = 2 } = req.query;
  const device = req.device;

  if (!device.qrCode.data) {
    return next(new AppError('QR code not generated for this device', 404));
  }

  if (!device.qrCode.isActive) {
    return next(new AppError('QR code is inactive', 400));
  }

  if (device.qrCode.validUntil && device.qrCode.validUntil < new Date()) {
    return next(new AppError('QR code has expired', 400));
  }

  try {
    const qrCodeOptions = {
      type: format === 'svg' ? 'svg' : 'png',
      width: parseInt(size),
      margin: parseInt(margin),
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    if (format === 'svg') {
      const svgString = await QRCode.toString(device.qrCode.data, qrCodeOptions);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgString);
    } else {
      const buffer = await QRCode.toBuffer(device.qrCode.data, qrCodeOptions);
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    }
  } catch (error) {
    console.error('QR code generation error:', error);
    return next(new AppError('Failed to generate QR code image', 500));
  }
}));

// @desc    Scan QR code and get device info
// @route   POST /api/qr/scan
// @access  Private
router.post('/scan', authenticate, asyncHandler(async (req, res, next) => {
  const { qrData } = req.body;

  if (!qrData) {
    return next(new AppError('QR code data is required', 400));
  }

  let parsedData;
  try {
    parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
  } catch (error) {
    return next(new AppError('Invalid QR code format', 400));
  }

  if (!parsedData.deviceId) {
    return next(new AppError('Invalid QR code: missing device ID', 400));
  }

  // Find device by deviceId
  const device = await Device.findOne({ deviceId: parsedData.deviceId })
    .populate('assignedTo', 'username firstName lastName email')
    .populate('approvedBy', 'username firstName lastName');

  if (!device) {
    return next(new AppError('Device not found', 404));
  }

  // Check if user has permission to view this device
  const canView = req.user.role === 'admin' || 
                  req.user.role === 'superadmin' || 
                  device.assignedTo._id.toString() === req.user._id.toString();

  if (!canView) {
    return next(new AppError('You do not have permission to view this device', 403));
  }

  // Verify QR code validity
  if (!device.qrCode.isActive) {
    return next(new AppError('QR code is inactive', 400));
  }

  if (device.qrCode.validUntil && device.qrCode.validUntil < new Date()) {
    return next(new AppError('QR code has expired', 400));
  }

  // Enhanced device info for scan response
  const deviceInfo = {
    deviceId: device.deviceId,
    deviceName: device.name,
    deviceType: device.type,
    status: device.status,
    assignedTo: device.assignedTo.username,
    assignedToName: `${device.assignedTo.firstName} ${device.assignedTo.lastName}`,
    
    // QR code info
    qrCode: parsedData,
    
    // Location info
    lastLocation: device.location.coordinates.length > 0 ? {
      latitude: device.location.coordinates[1],
      longitude: device.location.coordinates[0],
      address: device.location.address,
      lastUpdated: device.location.lastUpdated
    } : null,
    
    // Device status
    batteryLevel: device.batteryLevel,
    signalStrength: device.signalStrength,
    isOnline: device.isOnline,
    lastSeen: device.lastSeen,
    
    // Tracking info
    trackingEnabled: device.trackingEnabled,
    trackingStartedAt: device.trackingStartedAt,
    
    // Scan info
    scannedAt: new Date().toISOString(),
    scannedBy: req.user.username,
    scanLocation: 'GPS Tracker App'
  };

  res.json({
    success: true,
    message: 'QR code scanned successfully',
    data: {
      deviceInfo,
      scanResult: {
        valid: true,
        deviceFound: true,
        accessGranted: true,
        scannedAt: new Date().toISOString()
      }
    }
  });
}));

// @desc    Regenerate QR code for device
// @route   PUT /api/qr/:deviceId/regenerate
// @access  Private (Admin/SuperAdmin or Device Owner)
router.put('/:deviceId/regenerate', authenticate, validateDeviceOwnership, asyncHandler(async (req, res, next) => {
  const device = req.device;
  const { validityDays = 30 } = req.body;

  // Only admin/superadmin or device owner can regenerate
  const canRegenerate = req.user.role === 'admin' || 
                        req.user.role === 'superadmin' || 
                        device.assignedTo.toString() === req.user._id.toString();

  if (!canRegenerate) {
    return next(new AppError('You do not have permission to regenerate QR code for this device', 403));
  }

  // Generate new QR code data
  const qrData = {
    requestId: device._id,
    deviceId: device.deviceId,
    deviceName: device.name,
    assignedTo: req.user.username,
    generatedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active'
  };

  // Update device QR code
  device.qrCode = {
    data: JSON.stringify(qrData),
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
    isActive: true
  };

  await device.save();

  res.json({
    success: true,
    message: 'QR code regenerated successfully',
    data: {
      qrCode: qrData,
      device: {
        deviceId: device.deviceId,
        name: device.name,
        status: device.status
      }
    }
  });
}));

// @desc    Deactivate QR code for device
// @route   PUT /api/qr/:deviceId/deactivate
// @access  Private (Admin/SuperAdmin)
router.put('/:deviceId/deactivate', authenticate, validateDeviceOwnership, asyncHandler(async (req, res, next) => {
  const device = req.device;

  // Only admin/superadmin can deactivate QR codes
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return next(new AppError('Only administrators can deactivate QR codes', 403));
  }

  if (!device.qrCode.data) {
    return next(new AppError('No QR code found for this device', 404));
  }

  device.qrCode.isActive = false;
  await device.save();

  res.json({
    success: true,
    message: 'QR code deactivated successfully',
    data: {
      device: {
        deviceId: device.deviceId,
        name: device.name,
        qrCodeStatus: 'inactive'
      }
    }
  });
}));

// @desc    Get QR code statistics
// @route   GET /api/qr/stats
// @access  Private (Admin/SuperAdmin)
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  // Only admin/superadmin can view QR code statistics
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    const userDevices = await Device.find({ assignedTo: req.user._id });
    
    const userStats = {
      totalQRCodes: userDevices.length,
      activeQRCodes: userDevices.filter(d => d.qrCode.isActive).length,
      expiredQRCodes: userDevices.filter(d => 
        d.qrCode.validUntil && d.qrCode.validUntil < new Date()
      ).length
    };

    return res.json({
      success: true,
      data: {
        stats: userStats,
        devices: userDevices.map(d => ({
          deviceId: d.deviceId,
          name: d.name,
          qrCodeStatus: d.qrCodeStatus
        }))
      }
    });
  }

  // Admin/SuperAdmin statistics
  const totalDevices = await Device.countDocuments();
  const devicesWithQR = await Device.countDocuments({ 'qrCode.data': { $exists: true, $ne: null } });
  const activeQRCodes = await Device.countDocuments({ 'qrCode.isActive': true });
  const expiredQRCodes = await Device.countDocuments({ 
    'qrCode.validUntil': { $lt: new Date() },
    'qrCode.isActive': true
  });

  const stats = {
    totalDevices,
    devicesWithQR,
    activeQRCodes,
    inactiveQRCodes: devicesWithQR - activeQRCodes,
    expiredQRCodes,
    qrCodeCoverage: totalDevices > 0 ? Math.round((devicesWithQR / totalDevices) * 100) : 0
  };

  res.json({
    success: true,
    data: {
      stats
    }
  });
}));

module.exports = router;
