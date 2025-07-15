// API service for GPS Tracker Backend with MongoDB
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      console.log('🌐 API Request:', options.method || 'GET', url);
      console.log('📤 API Request config:', config);

      const response = await fetch(url, config);

      console.log('📡 API Response status:', response.status, response.statusText);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }

      console.log('📡 API Response:', response.status, data);

      if (!response.ok) {
        // Create error object with proper structure
        const error = new Error(data.message || data.error?.message || `HTTP error! status: ${response.status}`);
        error.response = { status: response.status, data };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);

      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error('Cannot connect to server. Please ensure the server is running on port 5001.');
        networkError.response = { status: 0, data: { message: 'Network Error' } };
        throw networkError;
      }

      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication APIs
  async register(userData) {
    console.log('📝 Register attempt:', userData.username, userData.email);

    const response = await this.post('/api/auth/register', userData);

    console.log('✅ Register response:', response);

    if (response.success && response.data) {
      const user = response.data.user;
      const token = response.data.token;

      if (token) {
        this.setToken(token);
        console.log('🔑 Registration token stored');
      }

      if (user) {
        localStorage.setItem('userData', JSON.stringify(user));
        console.log('👤 Registration user data stored');
      }
    }

    return response;
  }

  async login(credentials) {
    console.log('🔐 API Service: Login attempt for:', credentials.username || credentials.email);
    console.log('🌐 API Service: Making request to:', `${this.baseURL}/api/auth/login`);
    console.log('📤 API Service: Request data:', credentials);

    try {
      const response = await this.post('/api/auth/login', credentials);

      console.log('✅ API Service: Login response received:', response);

      if (response.success && response.data) {
        const token = response.data.token;
        const user = response.data.user;

        if (token) {
          this.setToken(token);
          console.log('🔑 API Service: Token stored successfully');
        }

        if (user) {
          localStorage.setItem('userData', JSON.stringify(user));
          console.log('👤 API Service: User data stored successfully');
        }
      }

      return response;
    } catch (error) {
      console.error('❌ API Service: Login failed:', error);
      console.error('❌ API Service: Error details:', error.response?.data);
      throw error;
    }
  }

  async logout() {
    try {
      await this.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.get('/api/auth/me');
  }

  async updateProfile(profileData) {
    return this.put('/api/auth/profile', profileData);
  }

  async changePassword(passwordData) {
    return this.put('/api/auth/change-password', passwordData);
  }

  async sendQREmail(qrData, recipientEmail, deviceInfo) {
    return this.post('/api/auth/send-qr-email', { qrData, recipientEmail, deviceInfo });
  }

  // Device APIs
  async submitDeviceRequest(requestData) {
    return this.post('/api/devices/request', requestData);
  }

  async uploadUserDevice(deviceData) {
    return this.post('/api/devices/user-upload', deviceData);
  }

  async checkDeviceExists(deviceCode) {
    return this.get(`/api/devices/check/${deviceCode}`);
  }

  async getUserDeviceRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/devices/requests${queryString ? `?${queryString}` : ''}`);
  }

  async getAllDeviceRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/devices/requests/all${queryString ? `?${queryString}` : ''}`);
  }

  async approveDevice(requestId, deviceIndex) {
    return this.put(`/api/devices/requests/${requestId}/devices/${deviceIndex}/approve`);
  }

  async rejectDevice(requestId, deviceIndex, reason) {
    return this.put(`/api/devices/requests/${requestId}/devices/${deviceIndex}/reject`, { reason });
  }

  async getUserDevices() {
    return this.get('/api/devices/my-devices');
  }

  async getAllDevices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/devices${queryString ? `?${queryString}` : ''}`);
  }

  async getDevice(deviceId) {
    return this.get(`/api/devices/${deviceId}`);
  }

  async startDeviceTracking(deviceId) {
    return this.put(`/api/devices/${deviceId}/start-tracking`);
  }

  async stopDeviceTracking(deviceId) {
    return this.put(`/api/devices/${deviceId}/stop-tracking`);
  }

  // Location APIs
  async updateDeviceLocation(deviceId, locationData) {
    return this.post(`/api/locations/${deviceId}`, locationData);
  }

  async getDeviceLocationHistory(deviceId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/locations/${deviceId}/history${queryString ? `?${queryString}` : ''}`);
  }

  async getLatestDeviceLocation(deviceId) {
    return this.get(`/api/locations/${deviceId}/latest`);
  }

  async getNearbyDevices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/locations/nearby${queryString ? `?${queryString}` : ''}`);
  }

  async addLocationAlert(deviceId, alertData) {
    return this.post(`/api/locations/${deviceId}/alerts`, alertData);
  }

  async acknowledgeAlert(deviceId, alertIndex) {
    return this.put(`/api/locations/${deviceId}/alerts/${alertIndex}/acknowledge`);
  }

  async getDeviceStats(deviceId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/locations/${deviceId}/stats${queryString ? `?${queryString}` : ''}`);
  }

  // QR Code APIs
  async getDeviceQRCode(deviceId) {
    return this.get(`/api/qr/${deviceId}`);
  }

  async getQRCodeImage(deviceId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/api/qr/${deviceId}/image${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch QR code image');
    }

    return response.blob();
  }

  async scanQRCode(qrData) {
    return this.post('/api/qr/scan', { qrData });
  }

  async regenerateQRCode(deviceId, validityDays = 30) {
    return this.put(`/api/qr/${deviceId}/regenerate`, { validityDays });
  }

  async deactivateQRCode(deviceId) {
    return this.put(`/api/qr/${deviceId}/deactivate`);
  }

  async getQRCodeStats() {
    return this.get('/api/qr/stats');
  }

  // Admin QR Code Management APIs
  async getMyQRCodes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/devices/admin/my-qr-codes${queryString ? `?${queryString}` : ''}`);
  }

  async generateQRCodes(data) {
    return this.post('/api/devices/admin/generate-qr', data);
  }

  async deleteUnassignedQRCodes() {
    return this.delete('/api/devices/admin/delete-unassigned-qr');
  }

  // Device Registration API
  async registerDevice(deviceData) {
    return this.post('/api/devices/register', deviceData);
  }

  // Scan History APIs
  async saveScanHistory(scanHistoryData) {
    return this.post('/api/scan-history/save', scanHistoryData);
  }

  async getScanHistory(username) {
    return this.get(`/api/scan-history/user/${username}`);
  }

  // Location History APIs
  async saveLocationHistory(locationData) {
    return this.post('/api/location-history/save', locationData);
  }

  async getLocationHistory(deviceId, startDate = null, endDate = null, limit = 100) {
    let url = `/api/location-history/device/${deviceId}?limit=${limit}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return this.get(url);
  }

  async getAvailableDatesForDevice(deviceId) {
    return this.get(`/api/location-history/device/${deviceId}/dates`);
  }

  async getLocationHistoryForDate(deviceId, date) {
    return this.get(`/api/location-history/device/${deviceId}/date/${date}`);
  }

  // Statistics APIs
  // Note: getAllLocations endpoint doesn't exist, using fallback data in component

  // User Management APIs (Admin/SuperAdmin)
  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(userId) {
    return this.get(`/api/users/${userId}`);
  }

  async createUser(userData) {
    return this.post('/api/users', userData);
  }

  async updateUser(userId, userData) {
    return this.put(`/api/users/${userId}`, userData);
  }

  async deleteUser(userId) {
    return this.delete(`/api/users/${userId}`);
  }

  async getUserActivity(userId) {
    return this.get(`/api/users/${userId}/activity`);
  }

  async resetUserPassword(userId, newPassword) {
    return this.put(`/api/users/${userId}/reset-password`, { newPassword });
  }

  // Health check
  async healthCheck() {
    return this.get('/api/health');
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  getToken() {
    return this.token;
  }

  clearAuth() {
    this.setToken(null);
    localStorage.removeItem('currentUser');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
