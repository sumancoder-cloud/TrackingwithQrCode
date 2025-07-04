const express = require('express');
const Location = require('../models/Location');
const Device = require('../models/Device');
const { authenticate, validateDeviceOwnership } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Update device location
// @route   POST /api/locations/:deviceId
// @access  Private
router.post('/:deviceId', authenticate, validateDeviceOwnership, asyncHandler(async (req, res, next) => {
  const { 
    latitude, 
    longitude, 
    accuracy, 
    altitude, 
    speed, 
    heading, 
    batteryLevel, 
    signalStrength,
    source = 'gps'
  } = req.body;

  if (!latitude || !longitude || !accuracy) {
    return next(new AppError('Latitude, longitude, and accuracy are required', 400));
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90) {
    return next(new AppError('Latitude must be between -90 and 90', 400));
  }

  if (longitude < -180 || longitude > 180) {
    return next(new AppError('Longitude must be between -180 and 180', 400));
  }

  const device = req.device;

  // Create location record
  const location = await Location.create({
    device: device._id,
    deviceId: device.deviceId,
    coordinates: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    altitude,
    accuracy,
    speed,
    heading,
    batteryLevel,
    signalStrength,
    source,
    recordedAt: new Date()
  });

  // Update device location and status
  await device.updateLocation(longitude, latitude);
  device.isOnline = true;
  device.batteryLevel = batteryLevel || device.batteryLevel;
  device.signalStrength = signalStrength || device.signalStrength;
  await device.save();

  res.status(201).json({
    success: true,
    message: 'Location updated successfully',
    data: {
      location,
      device: {
        deviceId: device.deviceId,
        name: device.name,
        isOnline: device.isOnline,
        lastSeen: device.lastSeen
      }
    }
  });
}));

// @desc    Get device location history
// @route   GET /api/locations/:deviceId/history
// @access  Private
router.get('/:deviceId/history', authenticate, validateDeviceOwnership, asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 100, page = 1 } = req.query;
  const device = req.device;

  const query = { 
    deviceId: device.deviceId, 
    isActive: true 
  };

  if (startDate || endDate) {
    query.recordedAt = {};
    if (startDate) query.recordedAt.$gte = new Date(startDate);
    if (endDate) query.recordedAt.$lte = new Date(endDate);
  }

  const locations = await Location.find(query)
    .sort({ recordedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Location.countDocuments(query);

  res.json({
    success: true,
    data: {
      locations,
      device: {
        deviceId: device.deviceId,
        name: device.name
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get latest device location
// @route   GET /api/locations/:deviceId/latest
// @access  Private
router.get('/:deviceId/latest', authenticate, validateDeviceOwnership, asyncHandler(async (req, res) => {
  const device = req.device;

  const location = await Location.getLatestForDevice(device.deviceId);

  if (!location) {
    return res.json({
      success: true,
      message: 'No location data found for this device',
      data: {
        location: null,
        device: {
          deviceId: device.deviceId,
          name: device.name,
          isOnline: device.isOnline,
          lastSeen: device.lastSeen
        }
      }
    });
  }

  res.json({
    success: true,
    data: {
      location,
      device: {
        deviceId: device.deviceId,
        name: device.name,
        isOnline: device.isOnline,
        lastSeen: device.lastSeen
      }
    }
  });
}));

// @desc    Get nearby devices
// @route   GET /api/locations/nearby
// @access  Private
router.get('/nearby', authenticate, asyncHandler(async (req, res, next) => {
  const { latitude, longitude, maxDistance = 1000 } = req.query;

  if (!latitude || !longitude) {
    return next(new AppError('Latitude and longitude are required', 400));
  }

  const locations = await Location.findNearby(
    parseFloat(longitude), 
    parseFloat(latitude), 
    parseInt(maxDistance)
  );

  res.json({
    success: true,
    data: {
      locations,
      searchCenter: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      maxDistance: parseInt(maxDistance)
    }
  });
}));

// @desc    Add location alert
// @route   POST /api/locations/:deviceId/alerts
// @access  Private
router.post('/:deviceId/alerts', authenticate, validateDeviceOwnership, asyncHandler(async (req, res, next) => {
  const { type, severity = 'medium', message } = req.body;
  const device = req.device;

  if (!type || !message) {
    return next(new AppError('Alert type and message are required', 400));
  }

  const validTypes = ['speed_limit', 'geofence', 'low_battery', 'device_offline', 'panic_button'];
  if (!validTypes.includes(type)) {
    return next(new AppError('Invalid alert type', 400));
  }

  // Get latest location
  const location = await Location.getLatestForDevice(device.deviceId);
  
  if (!location) {
    return next(new AppError('No location data found for this device', 404));
  }

  await location.addAlert(type, severity, message);

  res.status(201).json({
    success: true,
    message: 'Alert added successfully',
    data: {
      location,
      alert: location.alerts[location.alerts.length - 1]
    }
  });
}));

// @desc    Acknowledge location alert
// @route   PUT /api/locations/:deviceId/alerts/:alertIndex/acknowledge
// @access  Private
router.put('/:deviceId/alerts/:alertIndex/acknowledge', 
  authenticate, 
  validateDeviceOwnership, 
  asyncHandler(async (req, res, next) => {
    const { alertIndex } = req.params;
    const device = req.device;

    // Get latest location
    const location = await Location.getLatestForDevice(device.deviceId);
    
    if (!location) {
      return next(new AppError('No location data found for this device', 404));
    }

    const index = parseInt(alertIndex);
    if (index < 0 || index >= location.alerts.length) {
      return next(new AppError('Invalid alert index', 400));
    }

    await location.acknowledgeAlert(index, req.user._id);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: {
        location,
        alert: location.alerts[index]
      }
    });
  })
);

// @desc    Get device tracking statistics
// @route   GET /api/locations/:deviceId/stats
// @access  Private
router.get('/:deviceId/stats', authenticate, validateDeviceOwnership, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const device = req.device;

  const query = { 
    deviceId: device.deviceId, 
    isActive: true 
  };

  if (startDate || endDate) {
    query.recordedAt = {};
    if (startDate) query.recordedAt.$gte = new Date(startDate);
    if (endDate) query.recordedAt.$lte = new Date(endDate);
  }

  const locations = await Location.find(query).sort({ recordedAt: 1 });

  if (locations.length === 0) {
    return res.json({
      success: true,
      data: {
        stats: {
          totalLocations: 0,
          totalDistance: 0,
          averageSpeed: 0,
          maxSpeed: 0,
          trackingDuration: 0
        },
        device: {
          deviceId: device.deviceId,
          name: device.name
        }
      }
    });
  }

  // Calculate statistics
  let totalDistance = 0;
  let totalSpeed = 0;
  let maxSpeed = 0;
  let speedCount = 0;

  for (let i = 1; i < locations.length; i++) {
    const prevLocation = locations[i - 1];
    const currentLocation = locations[i];

    // Calculate distance between consecutive points
    const distance = currentLocation.distanceTo(prevLocation);
    totalDistance += distance;

    // Track speed statistics
    if (currentLocation.speed !== null && currentLocation.speed !== undefined) {
      totalSpeed += currentLocation.speed;
      speedCount++;
      maxSpeed = Math.max(maxSpeed, currentLocation.speed);
    }
  }

  const trackingDuration = locations.length > 0 ? 
    (locations[locations.length - 1].recordedAt - locations[0].recordedAt) / 1000 : 0;

  const stats = {
    totalLocations: locations.length,
    totalDistance: Math.round(totalDistance), // meters
    averageSpeed: speedCount > 0 ? Math.round((totalSpeed / speedCount) * 100) / 100 : 0, // m/s
    maxSpeed: Math.round(maxSpeed * 100) / 100, // m/s
    trackingDuration: Math.round(trackingDuration), // seconds
    firstLocation: locations[0].recordedAt,
    lastLocation: locations[locations.length - 1].recordedAt
  };

  res.json({
    success: true,
    data: {
      stats,
      device: {
        deviceId: device.deviceId,
        name: device.name
      }
    }
  });
}));

module.exports = router;
