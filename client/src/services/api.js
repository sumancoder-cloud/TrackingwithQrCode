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

    const response = await this.post('/auth/register', userData);

    console.log('✅ Register response:', response);

    if (response.success && response.data) {
      const user = response.data.user;
      const token = response.data.token;

      if (token) {
        this.setToken(token);
        console.log('🔑 Registration token stored');
      }

      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log('👤 Registration user data stored');
      }
    }

    return response;
  }

  async login(credentials) {
    console.log('🔐 API Service: Login attempt for:', credentials.username || credentials.email);
    console.log('🌐 API Service: Making request to:', `${this.baseURL}/auth/login`);
    console.log('📤 API Service: Request data:', credentials);

    try {
      const response = await this.post('/auth/login', credentials);

      console.log('✅ API Service: Login response received:', response);

      if (response.success && response.data) {
        const token = response.data.token;
        const user = response.data.user;

        if (token) {
          this.setToken(token);
          console.log('🔑 API Service: Token stored successfully');
        }

        if (user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
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
      await this.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async updateProfile(profileData) {
    return this.put('/auth/profile', profileData);
  }

  async changePassword(passwordData) {
    return this.put('/auth/change-password', passwordData);
  }

  // Device APIs
  async submitDeviceRequest(requestData) {
    return this.post('/devices/request', requestData);
  }

  async getUserDeviceRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/devices/requests${queryString ? `?${queryString}` : ''}`);
  }

  async getAllDeviceRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/devices/requests/all${queryString ? `?${queryString}` : ''}`);
  }

  async approveDevice(requestId, deviceIndex) {
    return this.put(`/devices/requests/${requestId}/devices/${deviceIndex}/approve`);
  }

  async rejectDevice(requestId, deviceIndex, reason) {
    return this.put(`/devices/requests/${requestId}/devices/${deviceIndex}/reject`, { reason });
  }

  async getUserDevices() {
    return this.get('/devices/my-devices');
  }

  async getAllDevices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/devices${queryString ? `?${queryString}` : ''}`);
  }

  async getDevice(deviceId) {
    return this.get(`/devices/${deviceId}`);
  }

  async startDeviceTracking(deviceId) {
    return this.put(`/devices/${deviceId}/start-tracking`);
  }

  async stopDeviceTracking(deviceId) {
    return this.put(`/devices/${deviceId}/stop-tracking`);
  }

  // Location APIs
  async updateDeviceLocation(deviceId, locationData) {
    return this.post(`/locations/${deviceId}`, locationData);
  }

  async getDeviceLocationHistory(deviceId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/locations/${deviceId}/history${queryString ? `?${queryString}` : ''}`);
  }

  async getLatestDeviceLocation(deviceId) {
    return this.get(`/locations/${deviceId}/latest`);
  }

  async getNearbyDevices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/locations/nearby${queryString ? `?${queryString}` : ''}`);
  }

  async addLocationAlert(deviceId, alertData) {
    return this.post(`/locations/${deviceId}/alerts`, alertData);
  }

  async acknowledgeAlert(deviceId, alertIndex) {
    return this.put(`/locations/${deviceId}/alerts/${alertIndex}/acknowledge`);
  }

  async getDeviceStats(deviceId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/locations/${deviceId}/stats${queryString ? `?${queryString}` : ''}`);
  }

  // QR Code APIs
  async getDeviceQRCode(deviceId) {
    return this.get(`/qr/${deviceId}`);
  }

  async getQRCodeImage(deviceId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/qr/${deviceId}/image${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch QR code image');
    }

    return response.blob();
  }

  async scanQRCode(qrData) {
    return this.post('/qr/scan', { qrData });
  }

  async regenerateQRCode(deviceId, validityDays = 30) {
    return this.put(`/qr/${deviceId}/regenerate`, { validityDays });
  }

  async deactivateQRCode(deviceId) {
    return this.put(`/qr/${deviceId}/deactivate`);
  }

  async getQRCodeStats() {
    return this.get('/qr/stats');
  }

  // User Management APIs (Admin/SuperAdmin)
  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(userId) {
    return this.get(`/users/${userId}`);
  }

  async createUser(userData) {
    return this.post('/users', userData);
  }

  async updateUser(userId, userData) {
    return this.put(`/users/${userId}`, userData);
  }

  async deleteUser(userId) {
    return this.delete(`/users/${userId}`);
  }

  async getUserActivity(userId) {
    return this.get(`/users/${userId}/activity`);
  }

  async resetUserPassword(userId, newPassword) {
    return this.put(`/users/${userId}/reset-password`, { newPassword });
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
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
