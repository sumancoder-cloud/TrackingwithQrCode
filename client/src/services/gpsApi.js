import api from './api';

const GPS_API_BASE = '/api/gps';

// GPS API Service
const gpsApi = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get(`${GPS_API_BASE}/health`);
      return response.data;
    } catch (error) {
      console.error('GPS API health check failed:', error);
      throw error;
    }
  },

  // Update device location
  updateLocation: async (locationData) => {
    try {
      const response = await api.post(`${GPS_API_BASE}/location`, locationData);
      console.log('📍 Location updated via API:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update location:', error);
      throw error;
    }
  },

  // Get current device location
  getDeviceLocation: async (deviceId) => {
    try {
      const response = await api.get(`${GPS_API_BASE}/device/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get device location:', error);
      throw error;
    }
  },

  // Get device path history
  getDevicePath: async (deviceId, limit = null) => {
    try {
      const url = limit ? 
        `${GPS_API_BASE}/path/${deviceId}?limit=${limit}` : 
        `${GPS_API_BASE}/path/${deviceId}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to get device path:', error);
      throw error;
    }
  },

  // Get all tracked devices
  getAllDevices: async () => {
    try {
      const response = await api.get(`${GPS_API_BASE}/devices`);
      return response.data;
    } catch (error) {
      console.error('Failed to get all devices:', error);
      throw error;
    }
  },

  // Clear device data
  clearDeviceData: async (deviceId) => {
    try {
      const response = await api.delete(`${GPS_API_BASE}/device/${deviceId}`);
      console.log('🗑️ Device data cleared:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to clear device data:', error);
      throw error;
    }
  },

  // Simulate device movement
  simulateMovement: async (deviceId, movementData) => {
    try {
      const response = await api.post(`${GPS_API_BASE}/simulate/${deviceId}`, movementData);
      console.log('🎮 Movement simulation completed:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to simulate movement:', error);
      throw error;
    }
  },

  // Sync local GPS data with server
  syncLocationToServer: async (deviceId, locationData) => {
    try {
      const payload = {
        deviceId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        speed: locationData.speed,
        heading: locationData.heading,
        deviceName: locationData.deviceName
      };

      const response = await gpsApi.updateLocation(payload);
      
      // Update local storage with server response
      const trackingKey = `realtime_tracking_${deviceId}`;
      const existingPath = JSON.parse(localStorage.getItem(trackingKey) || '[]');
      
      const serverLocation = {
        ...locationData,
        timestamp: response.data.timestamp,
        syncedWithServer: true
      };
      
      existingPath.push(serverLocation);
      
      // Keep only last 100 points
      if (existingPath.length > 100) {
        existingPath.shift();
      }
      
      localStorage.setItem(trackingKey, JSON.stringify(existingPath));
      
      return response;
    } catch (error) {
      console.error('Failed to sync location to server:', error);
      // Store locally even if server sync fails
      const trackingKey = `realtime_tracking_${deviceId}`;
      const existingPath = JSON.parse(localStorage.getItem(trackingKey) || '[]');
      
      const localLocation = {
        ...locationData,
        timestamp: new Date().toISOString(),
        syncedWithServer: false
      };
      
      existingPath.push(localLocation);
      localStorage.setItem(trackingKey, JSON.stringify(existingPath));
      
      throw error;
    }
  },

  // Get path data from server and update local storage
  syncPathFromServer: async (deviceId) => {
    try {
      const response = await gpsApi.getDevicePath(deviceId);
      const serverPath = response.data.pathPoints;
      
      // Update local storage with server data
      const trackingKey = `realtime_tracking_${deviceId}`;
      const formattedPath = serverPath.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
        accuracy: point.accuracy,
        speed: point.speed,
        heading: point.heading,
        timestamp: point.timestamp,
        deviceId: point.deviceId,
        deviceName: point.deviceName,
        syncedWithServer: true
      }));
      
      localStorage.setItem(trackingKey, JSON.stringify(formattedPath));
      
      console.log(`📥 Synced ${formattedPath.length} path points from server for device ${deviceId}`);
      return formattedPath;
      
    } catch (error) {
      console.error('Failed to sync path from server:', error);
      // Return local data if server sync fails
      const trackingKey = `realtime_tracking_${deviceId}`;
      const localPath = JSON.parse(localStorage.getItem(trackingKey) || '[]');
      return localPath;
    }
  },

  // Monitor server for location updates
  startServerPolling: (deviceId, callback, interval = 5000) => {
    const pollServer = async () => {
      try {
        const response = await gpsApi.getDeviceLocation(deviceId);
        const serverLocation = response.data.device;
        
        // Call callback with updated location
        if (callback && typeof callback === 'function') {
          callback(serverLocation);
        }
        
      } catch (error) {
        console.error('Server polling error:', error);
      }
    };

    // Start polling
    const intervalId = setInterval(pollServer, interval);
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      console.log(`🛑 Stopped server polling for device ${deviceId}`);
    };
  }
};

export default gpsApi;
