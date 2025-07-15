const express = require('express');
const router = express.Router();
const LocationHistory = require('../models/LocationHistory');

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

// Save location to history with distance calculation
router.post('/save', async (req, res) => {
  try {
    console.log('📍 Saving location to history:', req.body);
    
    const locationData = req.body;
    
    // Get the previous location for distance calculation
    const previousLocation = await LocationHistory.findOne({
      deviceId: locationData.deviceId
    }).sort({ timestamp: -1 });
    
    let distanceFromPrevious = 0;
    let totalDistance = 0;
    
    if (previousLocation) {
      // Calculate distance from previous location
      distanceFromPrevious = calculateDistance(
        previousLocation.location.latitude,
        previousLocation.location.longitude,
        locationData.location.latitude,
        locationData.location.longitude
      );
      
      totalDistance = (previousLocation.totalDistance || 0) + distanceFromPrevious;
    }
    
    // Create location history entry
    const locationHistory = new LocationHistory({
      ...locationData,
      distanceFromPrevious: Math.round(distanceFromPrevious * 100) / 100, // Round to 2 decimal places
      totalDistance: Math.round(totalDistance * 100) / 100
    });
    
    const savedLocation = await locationHistory.save();
    
    console.log('✅ Location history saved with distance:', {
      deviceId: savedLocation.deviceId,
      distanceFromPrevious: savedLocation.distanceFromPrevious,
      totalDistance: savedLocation.totalDistance
    });
    
    res.json({
      success: true,
      message: 'Location history saved successfully',
      locationHistory: savedLocation,
      distanceInfo: {
        distanceFromPrevious: savedLocation.distanceFromPrevious,
        totalDistance: savedLocation.totalDistance
      }
    });
  } catch (error) {
    console.error('❌ Error saving location history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save location history',
      error: error.message
    });
  }
});

// Get location history for a device with date range
router.get('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    
    console.log('📜 Getting location history for device:', deviceId, { startDate, endDate });
    
    let query = { deviceId: deviceId };
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    const locationHistory = await LocationHistory.find(query)
      .sort({ timestamp: 1 }) // Chronological order for route tracking
      .limit(parseInt(limit));
    
    // Calculate total distance for the route
    const totalRouteDistance = locationHistory.length > 0 
      ? locationHistory[locationHistory.length - 1].totalDistance || 0
      : 0;
    
    console.log('✅ Found location history:', locationHistory.length, 'entries, total distance:', totalRouteDistance, 'm');
    
    res.json({
      success: true,
      locationHistory: locationHistory,
      routeInfo: {
        totalPoints: locationHistory.length,
        totalDistance: totalRouteDistance,
        startTime: locationHistory.length > 0 ? locationHistory[0].timestamp : null,
        endTime: locationHistory.length > 0 ? locationHistory[locationHistory.length - 1].timestamp : null
      }
    });
  } catch (error) {
    console.error('❌ Error getting location history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location history',
      error: error.message
    });
  }
});

// Get available dates with location data for a device
router.get('/device/:deviceId/dates', async (req, res) => {
  try {
    const { deviceId } = req.params;
    console.log('📅 Getting available dates for device:', deviceId);
    
    const dates = await LocationHistory.aggregate([
      { $match: { deviceId: deviceId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 },
          totalDistance: { $max: "$totalDistance" },
          startTime: { $min: "$timestamp" },
          endTime: { $max: "$timestamp" }
        }
      },
      { $sort: { "_id": -1 } } // Most recent first
    ]);
    
    console.log('✅ Found dates with data:', dates.length);
    
    res.json({
      success: true,
      dates: dates.map(date => ({
        date: date._id,
        pointCount: date.count,
        totalDistance: date.totalDistance || 0,
        startTime: date.startTime,
        endTime: date.endTime
      }))
    });
  } catch (error) {
    console.error('❌ Error getting available dates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available dates',
      error: error.message
    });
  }
});

// Get location history for a specific date
router.get('/device/:deviceId/date/:date', async (req, res) => {
  try {
    const { deviceId, date } = req.params;
    console.log('📅 Getting location history for device:', deviceId, 'on date:', date);
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    const locationHistory = await LocationHistory.find({
      deviceId: deviceId,
      timestamp: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ timestamp: 1 });
    
    // Calculate route statistics
    const routeStats = {
      totalPoints: locationHistory.length,
      totalDistance: locationHistory.length > 0 ? locationHistory[locationHistory.length - 1].totalDistance || 0 : 0,
      startTime: locationHistory.length > 0 ? locationHistory[0].timestamp : null,
      endTime: locationHistory.length > 0 ? locationHistory[locationHistory.length - 1].timestamp : null,
      duration: 0
    };
    
    if (routeStats.startTime && routeStats.endTime) {
      routeStats.duration = (new Date(routeStats.endTime) - new Date(routeStats.startTime)) / 1000; // Duration in seconds
    }
    
    console.log('✅ Found location history for date:', locationHistory.length, 'entries');
    
    res.json({
      success: true,
      locationHistory: locationHistory,
      routeStats: routeStats
    });
  } catch (error) {
    console.error('❌ Error getting location history for date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location history for date',
      error: error.message
    });
  }
});

module.exports = router;
