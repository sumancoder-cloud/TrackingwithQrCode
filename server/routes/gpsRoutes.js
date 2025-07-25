const express = require('express');
const router = express.Router();
const LocationHistory = require('../models/LocationHistory');

// In-memory storage for GPS data (in production, use MongoDB)
let deviceLocations = {};
let devicePaths = {};

// GET /api/gps/health - Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'GPS API is running',
    timestamp: new Date().toISOString(),
    activeDevices: Object.keys(deviceLocations).length
  });
});

// POST /api/gps/location - Update device location
router.post('/location', (req, res) => {
  try {
    const { deviceId, latitude, longitude, deviceName, accuracy, speed, heading } = req.body;

    // Validation
    if (!deviceId || !latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId, latitude, and longitude are required',
        required: ['deviceId', 'latitude', 'longitude']
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates',
        details: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    const locationData = {
      deviceId,
      deviceName: deviceName || `Device ${deviceId}`,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy || 10,
      speed: speed || 0,
      heading: heading || null,
      timestamp: new Date().toISOString(),
      updatedVia: 'API'
    };

    // Update current location
    deviceLocations[deviceId] = locationData;

    // Add to path history
    if (!devicePaths[deviceId]) {
      devicePaths[deviceId] = [];
    }

    devicePaths[deviceId].push(locationData);

    // Keep only last 100 points
    if (devicePaths[deviceId].length > 100) {
      devicePaths[deviceId] = devicePaths[deviceId].slice(-100);
    }

    // Save to location history database
    try {
      const locationHistoryData = {
        deviceId: deviceId,
        deviceName: deviceName || `Device ${deviceId}`,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: accuracy || 10,
          speed: speed || 0,
          heading: heading || null
        },
        timestamp: new Date(),
        recordedAt: new Date(),
        source: 'api',
        assignedTo: '', // Will be updated when we know the user
        routeId: `${deviceId}_${new Date().toISOString().split('T')[0]}` // Daily route ID
      };

      // Save to database (async, don't wait for response)
      const locationHistory = new LocationHistory(locationHistoryData);
      locationHistory.save().then(saved => {
        console.log(`💾 Location saved to history database for device ${deviceId}`);
      }).catch(err => {
        console.error(`❌ Failed to save location history for device ${deviceId}:`, err.message);
      });
    } catch (historyError) {
      console.error('❌ Error preparing location history:', historyError.message);
    }

    console.log(`📍 GPS API: Updated location for device ${deviceId}:`, latitude, longitude);

    res.json({
      status: 'success',
      message: 'Location updated successfully',
      data: {
        deviceId,
        location: locationData,
        pathPoints: devicePaths[deviceId].length,
        timestamp: locationData.timestamp
      }
    });

  } catch (error) {
    console.error('❌ GPS API Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/gps/device/:deviceId - Get current device location FROM DATABASE
router.get('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // 🔥 FETCH FROM DATABASE instead of memory
    const latestLocation = await LocationHistory.findOne({ deviceId })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latestLocation) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found or no location data available',
        deviceId
      });
    }

    const currentLocation = {
      deviceId: latestLocation.deviceId,
      deviceName: latestLocation.deviceName,
      latitude: latestLocation.location.latitude,
      longitude: latestLocation.location.longitude,
      accuracy: latestLocation.location.accuracy,
      speed: latestLocation.location.speed,
      heading: latestLocation.location.heading,
      timestamp: latestLocation.timestamp,
      source: 'database'
    };

    res.json({
      status: 'success',
      data: {
        device: currentLocation,
        pathPoints: await LocationHistory.countDocuments({ deviceId }),
        lastUpdate: currentLocation.timestamp
      }
    });

  } catch (error) {
    console.error('❌ GPS API Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/gps/path/:deviceId - Get device path history FROM DATABASE
router.get('/path/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 100, startDate, endDate } = req.query;

    console.log('📍 Fetching path from database for device:', deviceId);

    // Build query
    let query = { deviceId };

    // Add date range if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // 🔥 FETCH FROM DATABASE instead of memory
    const locationHistory = await LocationHistory.find(query)
      .sort({ timestamp: 1 }) // Chronological order for path
      .limit(parseInt(limit));

    if (locationHistory.length === 0) {
      return res.json({
        status: 'success',
        data: {
          deviceId,
          pathPoints: [],
          totalPoints: 0,
          message: 'No path data available for this device'
        }
      });
    }

    // Convert database format to GPS API format
    const pathPoints = locationHistory.map(loc => ({
      deviceId: loc.deviceId,
      deviceName: loc.deviceName,
      latitude: loc.location.latitude,
      longitude: loc.location.longitude,
      accuracy: loc.location.accuracy,
      speed: loc.location.speed,
      heading: loc.location.heading,
      timestamp: loc.timestamp,
      source: 'database'
    }));

    console.log('✅ Fetched', pathPoints.length, 'path points from database');

    res.json({
      status: 'success',
      data: {
        deviceId,
        pathPoints,
        totalPoints: await LocationHistory.countDocuments({ deviceId }),
        requestedLimit: parseInt(limit),
        returnedPoints: pathPoints.length,
        startTime: pathPoints[0]?.timestamp,
        endTime: pathPoints[pathPoints.length - 1]?.timestamp,
        dateRange: startDate || endDate ? { startDate, endDate } : null
      }
    });

  } catch (error) {
    console.error('❌ GPS Path API Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/gps/devices - Get all tracked devices
router.get('/devices', (req, res) => {
  try {
    const devices = Object.keys(deviceLocations).map(deviceId => ({
      deviceId,
      ...deviceLocations[deviceId],
      pathPoints: devicePaths[deviceId] ? devicePaths[deviceId].length : 0
    }));

    res.json({
      status: 'success',
      data: {
        devices,
        totalDevices: devices.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ GPS API Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/gps/device/:deviceId - Clear device data
router.delete('/device/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceLocations[deviceId]) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found',
        deviceId
      });
    }

    delete deviceLocations[deviceId];
    delete devicePaths[deviceId];

    console.log(`🗑️ GPS API: Cleared data for device ${deviceId}`);

    res.json({
      status: 'success',
      message: 'Device data cleared successfully',
      deviceId
    });

  } catch (error) {
    console.error('❌ GPS API Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/gps/simulate/:deviceId - Simulate device movement
router.post('/simulate/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startLat, startLng, endLat, endLng, steps, deviceName } = req.body;

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({
        status: 'error',
        message: 'startLat, startLng, endLat, endLng are required'
      });
    }

    const numSteps = steps || 10;
    const latStep = (endLat - startLat) / numSteps;
    const lngStep = (endLng - startLng) / numSteps;

    // Generate path points
    const simulatedPath = [];
    for (let i = 0; i <= numSteps; i++) {
      const lat = startLat + (latStep * i);
      const lng = startLng + (lngStep * i);
      
      simulatedPath.push({
        deviceId,
        deviceName: deviceName || `Device ${deviceId}`,
        latitude: lat,
        longitude: lng,
        accuracy: 5,
        speed: Math.random() * 10, // Random speed 0-10 km/h
        heading: null,
        timestamp: new Date(Date.now() + (i * 1000)).toISOString(),
        updatedVia: 'Simulation'
      });
    }

    // Update device data
    deviceLocations[deviceId] = simulatedPath[simulatedPath.length - 1];
    devicePaths[deviceId] = (devicePaths[deviceId] || []).concat(simulatedPath);

    // Keep only last 100 points
    if (devicePaths[deviceId].length > 100) {
      devicePaths[deviceId] = devicePaths[deviceId].slice(-100);
    }

    console.log(`🎮 GPS API: Simulated movement for device ${deviceId} with ${numSteps} steps`);

    res.json({
      status: 'success',
      message: 'Movement simulation completed',
      data: {
        deviceId,
        simulatedPoints: simulatedPath.length,
        totalPathPoints: devicePaths[deviceId].length,
        startLocation: { lat: startLat, lng: startLng },
        endLocation: { lat: endLat, lng: endLng }
      }
    });

  } catch (error) {
    console.error('❌ GPS API Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
