const express = require('express');
const router = express.Router();

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

// GET /api/gps/device/:deviceId - Get current device location
router.get('/device/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceLocations[deviceId]) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found',
        deviceId
      });
    }

    res.json({
      status: 'success',
      data: {
        device: deviceLocations[deviceId],
        pathPoints: devicePaths[deviceId] ? devicePaths[deviceId].length : 0,
        lastUpdate: deviceLocations[deviceId].timestamp
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

// GET /api/gps/path/:deviceId - Get device path history
router.get('/path/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit } = req.query;

    if (!devicePaths[deviceId]) {
      return res.status(404).json({
        status: 'error',
        message: 'No path data found for device',
        deviceId
      });
    }

    let pathData = devicePaths[deviceId];
    
    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit);
      pathData = pathData.slice(-limitNum);
    }

    res.json({
      status: 'success',
      data: {
        deviceId,
        pathPoints: pathData,
        totalPoints: devicePaths[deviceId].length,
        startTime: devicePaths[deviceId][0]?.timestamp,
        endTime: devicePaths[deviceId][devicePaths[deviceId].length - 1]?.timestamp
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
