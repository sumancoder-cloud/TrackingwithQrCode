import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Row, Col, Card, Button, ListGroup, Accordion, Table, Badge, Form, Alert, Modal, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import usePreventNavigation from '../hooks/usePreventNavigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
// COMMENTED OUT: Current maps not working correctly
// import EnhancedGPSTracker from './EnhancedGPSTracker';
// import MapboxGPSTracker from './MapboxGPSTracker';
// import EmbeddedMapsGPSTracker from './EmbeddedMapsGPSTracker';

// NEW: Fast and reliable Geoapify GPS Tracker
import GeoapifyGPSTracker from './GeoapifyGPSTracker';
import QRCode from 'qrcode';
import api from '../services/api';
import gpsApi from '../services/gpsApi';
import RealTimeGPSTracker from './RealTimeGPSTracker';
import RealTimePathMap from './RealTimePathMap';
import QRToPostmanPathTracker from './QRToPostmanPathTracker';

// Configure axios to use the backend URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Add axios interceptor for error handling
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - Backend server might not be running');
      // You might want to show a user-friendly message here
    }
    return Promise.reject(error);
  }
);

const WelcomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Add the navigation prevention hook
  usePreventNavigation();
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard-overview');
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDevices: 0,
    activeDevices: 0,
    totalLocations: 0,
    recentLogins: 0,
    systemStatus: 'Healthy',
    lastUpdate: new Date().toISOString()
  });
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [expandedSection, setExpandedSection] = useState('dashboard');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const scannerRef = useRef(null);
  // REMOVED: Device request system (replaced by QR code system)
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedDeviceDetails, setScannedDeviceDetails] = useState(null);
  const [showScannedDeviceModal, setShowScannedDeviceModal] = useState(false);

  // Real-time GPS tracking state
  const [showRealTimeTracker, setShowRealTimeTracker] = useState(false);
  const [selectedDeviceForRealTimeTracking, setSelectedDeviceForRealTimeTracking] = useState(null);

  // REMOVED: Old QR modal and generated QR code state (replaced by new QR system)

  // Help & Support states
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    subject: '',
    message: '',
    category: 'general'
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Admin-specific states
  const [userActivityData, setUserActivityData] = useState([]);
  // REMOVED: Device request details (replaced by QR code system)

  // User Management states
  const [allUsers, setAllUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    company: '',
    phone: '',
    password: ''
  });
  const [userManagementError, setUserManagementError] = useState('');
  const [userManagementSuccess, setUserManagementSuccess] = useState('');

  // Device Management states
  const [allDevices, setAllDevices] = useState([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceFormData, setDeviceFormData] = useState({
    name: '',
    description: '',
    serialNumber: '',
    model: '',
    category: '',
    status: 'active',
    assignedTo: '',
    location: '',
    purchaseDate: '',
    warrantyExpiry: ''
  });
  const [deviceManagementError, setDeviceManagementError] = useState('');
  const [deviceManagementSuccess, setDeviceManagementSuccess] = useState('');

  // GPS Tracking states (based on Figma design)
  const [deviceLocations, setDeviceLocations] = useState({});
  const [trackingActive, setTrackingActive] = useState(false);
  const [selectedDeviceForTracking, setSelectedDeviceForTracking] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeWatchIds, setActiveWatchIds] = useState({}); // Track GPS watch IDs for real-time tracking
  const [showRealTimeMap, setShowRealTimeMap] = useState(false);

  // QR-to-Postman Path Tracking states
  const [showQRToPostmanTracker, setShowQRToPostmanTracker] = useState(false);
  const [qrScanLocationData, setQrScanLocationData] = useState(null);
  const [trackedDeviceId, setTrackedDeviceId] = useState(null);
  const [selectedDeviceForMap, setSelectedDeviceForMap] = useState(null);
  const [gpsError, setGpsError] = useState('');

  // COMMENTED OUT: GPS Tracker states - Maps not working correctly
  // const [showEnhancedGPSTracker, setShowEnhancedGPSTracker] = useState(false);
  // const [showMapboxTracker, setShowMapboxTracker] = useState(false);
  // const [showEmbeddedMapsTracker, setShowEmbeddedMapsTracker] = useState(false);
  const [selectedDeviceForEnhancedTracking, setSelectedDeviceForEnhancedTracking] = useState(null);
  // const [gpsTrackerMode, setGpsTrackerMode] = useState('geoapify'); // Using Geoapify now

  // NEW: Geoapify GPS Tracker states
  const [showGeoapifyTracker, setShowGeoapifyTracker] = useState(false);
  const [gpsTrackerMode, setGpsTrackerMode] = useState('geoapify'); // Only Geoapify for now

  // NEW SYSTEM: QR Code Management States
  const [generatedQRCodes, setGeneratedQRCodes] = useState([]);
  const [showQRGenerationModal, setShowQRGenerationModal] = useState(false);
  const [qrGenerationCount, setQrGenerationCount] = useState(1);
  const [showQRManagementModal, setShowQRManagementModal] = useState(false);
  const [selectedQRForEdit, setSelectedQRForEdit] = useState(null);
  const [showDeviceAssignmentModal, setShowDeviceAssignmentModal] = useState(false);
  const [selectedQRForAssignment, setSelectedQRForAssignment] = useState(null);
  const [deviceAssignmentData, setDeviceAssignmentData] = useState({
    deviceName: '',
    deviceModel: '',
    deviceType: '',
    serialNumber: '',
    description: ''
  });
  const [showQRViewModal, setShowQRViewModal] = useState(false);
  const [selectedQRForView, setSelectedQRForView] = useState(null);

  // 🔒 SECURITY: Functions to control QR code visibility (moved to top to avoid hoisting issues)
  const canViewQRCode = useCallback((qrCode) => {
    if (!userData) return false;

    // Admin and superadmin can see all QR codes
    if (userData.role === 'admin' || userData.role === 'superadmin') {
      return true;
    }

    // Users can see unassigned QR codes
    if (qrCode.status === 'available' && !qrCode.assignedTo) {
      return true;
    }

    // Users can see QR codes assigned to them
    if (qrCode.assignedTo === userData.username) {
      return true;
    }

    // Otherwise, hide the QR code details
    return false;
  }, [userData]);

  // 🔒 SECURITY: Get display code (either real code or masked)
  const getDisplayCode = useCallback((qrCode) => {
    if (canViewQRCode(qrCode)) {
      return qrCode.code;
    } else {
      return `🔒 Assigned to ${qrCode.assignedTo}`;
    }
  }, [canViewQRCode]);

  // 🔒 SECURITY: Check if user can scan QR code
  const canScanQRCode = useCallback((qrCode) => {
    if (!userData) return false;

    // Admin and superadmin can scan all QR codes
    if (userData.role === 'admin' || userData.role === 'superadmin') {
      return true;
    }

    // Users can scan unassigned QR codes
    if (qrCode.status === 'available' && !qrCode.assignedTo) {
      return true;
    }

    // Users can scan QR codes assigned to them
    if (qrCode.assignedTo === userData.username) {
      return true;
    }

    return false;
  }, [userData]);

  // REMOVED: Device request helper functions (replaced by QR code system)

  // Helper function to validate device entry
  const validateDevice = (device) => {
    return device.name.trim() && device.description.trim() && device.purpose.trim();
  };

  // REMOVED: Old generate16DigitCode function (now using the new one in QR management section)

  // QR Code generation function
  const generateQRCode = (requestId, deviceInfo, username) => {
    const qrData = {
      requestId: requestId,
      deviceId: 'OLD-SYSTEM-' + Date.now(), // Old system - will be replaced
      deviceName: deviceInfo.name,
      assignedTo: username,
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      status: 'active'
    };
    return JSON.stringify(qrData);
  };

  // Simple QR Code pattern generator (creates a visual pattern)
  const generateQRPattern = (data) => {
    const size = 21; // Standard QR code size
    const pattern = [];

    // Create a simple pattern based on the data
    const hash = data.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    for (let i = 0; i < size; i++) {
      pattern[i] = [];
      for (let j = 0; j < size; j++) {
        // Create a pseudo-random pattern based on position and hash
        const value = (i * size + j + Math.abs(hash)) % 3;
        pattern[i][j] = value === 0 ? 1 : 0;
      }
    }

    // Add corner markers (typical QR code pattern)
    const addCornerMarker = (startX, startY) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (startX + i < size && startY + j < size) {
            if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
              pattern[startX + i][startY + j] = 1;
            } else {
              pattern[startX + i][startY + j] = 0;
            }
          }
        }
      }
    };

    addCornerMarker(0, 0);     // Top-left
    addCornerMarker(0, 14);    // Top-right
    addCornerMarker(14, 0);    // Bottom-left

    return pattern;
  };

  // REMOVED: Device approval/rejection functions (replaced by QR code system)

  // Help & Support handlers
  const handleFeedbackChange = useCallback((e) => {
    const { name, value } = e.target;
    setFeedbackData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleFeedbackSubmit = useCallback(() => {
    if (!feedbackData.subject.trim() || !feedbackData.message.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Show immediate feedback
    setFeedbackSubmitted(true);

    // Process in background (non-blocking)
    setTimeout(() => {
      try {
        const feedback = {
          id: Date.now(),
          userId: userData.id,
          username: userData.username,
          subject: feedbackData.subject,
          message: feedbackData.message,
          category: feedbackData.category,
          submittedAt: new Date().toISOString(),
          status: 'submitted'
        };

        const existingFeedback = JSON.parse(localStorage.getItem('userFeedback') || '[]');
        existingFeedback.push(feedback);
        localStorage.setItem('userFeedback', JSON.stringify(existingFeedback));

        // Close modal after processing
        setTimeout(() => {
          setShowFeedbackModal(false);
          setFeedbackSubmitted(false);
          setFeedbackData({
            subject: '',
            message: '',
            category: 'general'
          });
        }, 1500);
      } catch (error) {
        console.error('Error submitting feedback:', error);
        setFeedbackSubmitted(false);
        alert('Error submitting feedback. Please try again.');
      }
    }, 0);
  }, [feedbackData, userData]);

  // Optimized contact handlers
  const handleShowContactModal = useCallback(() => {
    setShowContactModal(true);
  }, []);

  const handleCallSupport = useCallback(() => {
    window.open('tel:+911234567890');
  }, []);

  const handleEmailSupport = useCallback(() => {
    window.open('mailto:suman.tati2005@gmail.com');
  }, []);

  // REMOVED: Load device requests for admin (replaced by QR code system)

  // Load user activity data
  const loadUserActivity = useCallback(() => {
    if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
      try {
        // Get all users
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // Get device requests for activity tracking
        const deviceRequests = JSON.parse(localStorage.getItem('deviceRequests') || '[]');

        // Get feedback for activity tracking
        const userFeedback = JSON.parse(localStorage.getItem('userFeedback') || '[]');

        // Create activity data
        const activityData = [];

        // Add user registration activities
        users.forEach(user => {
          if (user.signupTime) {
            activityData.push({
              id: `signup-${user.username}`,
              type: 'User Registration',
              user: user.username,
              action: 'Account Created',
              timestamp: user.signupTime,
              details: `New ${user.role} account created`,
              status: 'completed',
              icon: 'USER'
            });
          }
        });

        // Add device request activities
        deviceRequests.forEach(request => {
          activityData.push({
            id: `request-${request.id}`,
            type: 'Device Request',
            user: request.username,
            action: 'Device Requested',
            timestamp: request.createdAt,
            details: `Requested ${request.devices.length} device(s)`,
            status: 'pending',
            icon: 'DEVICE'
          });

          // Add approval/rejection activities
          request.devices.forEach((device, index) => {
            if (device.approvedAt) {
              activityData.push({
                id: `approve-${request.id}-${index}`,
                type: 'Device Approval',
                user: device.approvedBy,
                action: 'Device Approved',
                timestamp: device.approvedAt,
                details: `Approved ${device.name} for ${request.username}`,
                status: 'approved',
                icon: 'APPROVE'
              });
            }
            if (device.rejectedAt) {
              activityData.push({
                id: `reject-${request.id}-${index}`,
                type: 'Device Rejection',
                user: device.rejectedBy,
                action: 'Device Rejected',
                timestamp: device.rejectedAt,
                details: `Rejected ${device.name} for ${request.username}`,
                status: 'rejected',
                icon: 'REJECT'
              });
            }
          });
        });

        // Add feedback activities
        userFeedback.forEach(feedback => {
          activityData.push({
            id: `feedback-${feedback.id}`,
            type: 'User Feedback',
            user: feedback.username,
            action: 'Feedback Submitted',
            timestamp: feedback.submittedAt,
            details: `${feedback.category}: ${feedback.subject}`,
            status: 'submitted',
            icon: 'FEEDBACK'
          });
        });

        // Sort by timestamp (newest first)
        activityData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setUserActivityData(activityData);
      } catch (error) {
        console.error('Error loading user activity:', error);
        setUserActivityData([]);
      }
    }
  }, [userData]);

  // REMOVED: User device requests and approved devices (replaced by QR code system)

  // REMOVED: Device request submission and handlers (replaced by QR code system)

  // REMOVED: Old QR code handler (replaced by new QR system)
  const handleViewQRCode = useCallback((qrCode) => {
    // For backward compatibility, redirect to new QR system
    console.log('Old QR code view requested:', qrCode);
    alert('QR code viewing has been updated. Please use the new QR Code Management system.');
  }, []);

  // User Management Functions
  const loadAllUsers = useCallback(() => {
    if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        setAllUsers(users);
      } catch (error) {
        console.error('Error loading users:', error);
        setAllUsers([]);
      }
    }
  }, [userData]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'user',
      company: '',
      phone: '',
      password: ''
    });
    setUserManagementError('');
    setUserManagementSuccess('');
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      company: user.company || '',
      phone: user.phone || '',
      password: ''
    });
    setUserManagementError('');
    setUserManagementSuccess('');
    setShowUserModal(true);
  };

  const handleDeleteUser = (user) => {
    if (user.username === userData.username) {
      alert('You cannot delete your own account');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter(u => u.username !== user.username);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        loadAllUsers();
        setUserManagementSuccess(`User "${user.username}" deleted successfully`);
        setTimeout(() => setUserManagementSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting user:', error);
        setUserManagementError('Failed to delete user');
      }
    }
  };

  const handleUserFormSubmit = () => {
    setUserManagementError('');
    setUserManagementSuccess('');

    if (!userFormData.username || !userFormData.email) {
      setUserManagementError('Username and email are required');
      return;
    }

    if (!editingUser && !userFormData.password) {
      setUserManagementError('Password is required for new users');
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');

      if (editingUser) {
        const updatedUsers = users.map(user => {
          if (user.username === editingUser.username) {
            return {
              ...user,
              email: userFormData.email,
              firstName: userFormData.firstName,
              lastName: userFormData.lastName,
              role: userFormData.role,
              company: userFormData.company,
              phone: userFormData.phone,
              ...(userFormData.password && { password: userFormData.password }),
              updatedAt: new Date().toISOString()
            };
          }
          return user;
        });
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUserManagementSuccess(`User "${userFormData.username}" updated successfully`);
      } else {
        const existingUser = users.find(u => u.username === userFormData.username || u.email === userFormData.email);
        if (existingUser) {
          setUserManagementError('Username or email already exists');
          return;
        }

        const newUser = {
          id: Date.now(),
          username: userFormData.username,
          email: userFormData.email,
          password: userFormData.password,
          firstName: userFormData.firstName,
          lastName: userFormData.lastName,
          role: userFormData.role,
          company: userFormData.company,
          phone: userFormData.phone,
          signupTime: new Date().toISOString(),
          createdBy: userData.username
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        setUserManagementSuccess(`User "${userFormData.username}" created successfully`);
      }

      loadAllUsers();
      setTimeout(() => {
        setShowUserModal(false);
        setUserManagementSuccess('');
      }, 2000);

    } catch (error) {
      console.error('Error saving user:', error);
      setUserManagementError('Failed to save user');
    }
  };

  // Device Management Functions
  const loadAllDevices = useCallback(() => {
    if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
      try {
        // Get devices from device requests
        const deviceRequests = JSON.parse(localStorage.getItem('deviceRequests') || '[]');
        const devices = [];

        deviceRequests.forEach(request => {
          request.devices.forEach(device => {
            if (device.status === 'approved') {
              devices.push({
                id: device.qrCode ? JSON.parse(device.qrCode).deviceId : Date.now(),
                name: device.name,
                description: device.purpose,
                serialNumber: device.serialNumber || 'N/A',
                model: device.model || 'N/A',
                category: device.category || 'General',
                status: 'active',
                assignedTo: request.username,
                location: device.location || 'N/A',
                purchaseDate: device.approvedAt,
                warrantyExpiry: 'N/A',
                requestId: request.id,
                approvedBy: device.approvedBy,
                qrCode: device.qrCode
              });
            }
          });
        });

        setAllDevices(devices);
      } catch (error) {
        console.error('Error loading devices:', error);
        setAllDevices([]);
      }
    }
  }, [userData]);

  const handleCreateDevice = () => {
    setEditingDevice(null);
    setDeviceFormData({
      name: '',
      description: '',
      serialNumber: '',
      model: '',
      category: '',
      status: 'active',
      assignedTo: '',
      location: '',
      purchaseDate: '',
      warrantyExpiry: ''
    });
    setDeviceManagementError('');
    setDeviceManagementSuccess('');
    setShowDeviceModal(true);
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setDeviceFormData({
      name: device.name,
      description: device.description,
      serialNumber: device.serialNumber,
      model: device.model,
      category: device.category,
      status: device.status,
      assignedTo: device.assignedTo,
      location: device.location,
      purchaseDate: device.purchaseDate ? device.purchaseDate.split('T')[0] : '',
      warrantyExpiry: device.warrantyExpiry ? device.warrantyExpiry.split('T')[0] : ''
    });
    setDeviceManagementError('');
    setDeviceManagementSuccess('');
    setShowDeviceModal(true);
  };

  const handleDeleteDevice = (device) => {
    if (window.confirm(`Are you sure you want to delete device "${device.name}"?`)) {
      try {
        // Remove device from device requests
        const deviceRequests = JSON.parse(localStorage.getItem('deviceRequests') || '[]');
        const updatedRequests = deviceRequests.map(request => {
          if (request.id === device.requestId) {
            const updatedDevices = request.devices.filter(d =>
              !(d.name === device.name && d.purpose === device.description)
            );
            return { ...request, devices: updatedDevices };
          }
          return request;
        });

        localStorage.setItem('deviceRequests', JSON.stringify(updatedRequests));
        loadAllDevices();
        setDeviceManagementSuccess(`Device "${device.name}" deleted successfully`);
        setTimeout(() => setDeviceManagementSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting device:', error);
        setDeviceManagementError('Failed to delete device');
      }
    }
  };

  const handleDeviceFormSubmit = () => {
    setDeviceManagementError('');
    setDeviceManagementSuccess('');

    if (!deviceFormData.name || !deviceFormData.description) {
      setDeviceManagementError('Device name and description are required');
      return;
    }

    try {
      if (editingDevice) {
        // Update existing device in device requests
        const deviceRequests = JSON.parse(localStorage.getItem('deviceRequests') || '[]');
        const updatedRequests = deviceRequests.map(request => {
          if (request.id === editingDevice.requestId) {
            const updatedDevices = request.devices.map(device => {
              if (device.name === editingDevice.name && device.purpose === editingDevice.description) {
                return {
                  ...device,
                  name: deviceFormData.name,
                  purpose: deviceFormData.description,
                  serialNumber: deviceFormData.serialNumber,
                  model: deviceFormData.model,
                  category: deviceFormData.category,
                  location: deviceFormData.location,
                  updatedAt: new Date().toISOString(),
                  updatedBy: userData.username
                };
              }
              return device;
            });
            return { ...request, devices: updatedDevices };
          }
          return request;
        });

        localStorage.setItem('deviceRequests', JSON.stringify(updatedRequests));
        setDeviceManagementSuccess(`Device "${deviceFormData.name}" updated successfully`);
      } else {
        // Create new device (add to a system request)
        const deviceRequests = JSON.parse(localStorage.getItem('deviceRequests') || '[]');
        const newDevice = {
          name: deviceFormData.name,
          purpose: deviceFormData.description,
          serialNumber: deviceFormData.serialNumber,
          model: deviceFormData.model,
          category: deviceFormData.category,
          location: deviceFormData.location,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: userData.username,
          qrCode: generateQRCode(Date.now(), {
            name: deviceFormData.name,
            purpose: deviceFormData.description
          }, 'system')
        };

        // Create a system request for the new device
        const systemRequest = {
          id: Date.now(),
          username: deviceFormData.assignedTo || 'system',
          devices: [newDevice],
          status: 'approved',
          createdAt: new Date().toISOString(),
          createdBy: userData.username
        };

        deviceRequests.push(systemRequest);
        localStorage.setItem('deviceRequests', JSON.stringify(deviceRequests));
        setDeviceManagementSuccess(`Device "${deviceFormData.name}" created successfully`);
      }

      loadAllDevices();
      setTimeout(() => {
        setShowDeviceModal(false);
        setDeviceManagementSuccess('');
      }, 2000);

    } catch (error) {
      console.error('Error saving device:', error);
      setDeviceManagementError('Failed to save device');
    }
  };

  // OpenStreetMap with Leaflet Integration (FREE Alternative)
  // const initializeSimpleMap = useCallback(() => {
  //   return new Promise((resolve) => {
  //     // Simple map initialization - no external dependencies needed
  //       iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEyLjUgMTIuNSAyOC41IDEyLjUgMjguNVMjNSAyNSAyNSAxMi41QzI1IDUuNiAxOS40IDAgMTIuNSAweiIgZmlsbD0iIzMzODhmZiIvPgogIDxjaXJjbGUgY3g9IjEyLjUiIGN5PSIxMi41IiByPSI0IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==',
  //       iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEyLjUgMTIuNSAyOC41IDEyLjUgMjguNVMyNSAyNSAyNSAxMi41QzI1IDUuNiAxOS40IDAgMTIuNSAweiIgZmlsbD0iIzMzODhmZiIvPgogIDxjaXJjbGUgY3g9IjEyLjUiIGN5PSIxMi41IiByPSI0IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==',
  //       shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZWxsaXBzZSBjeD0iMjAuNSIgY3k9IjM3IiByeD0iMTMiIHJ5PSI0IiBmaWxsPSIjMDAwIiBvcGFjaXR5PSIwLjMiLz4KPC9zdmc+',
  //       iconSize: [25, 41],
  //       iconAnchor: [12, 41],
  //       popupAnchor: [1, -34],
  //       shadowSize: [41, 41]
  //     });
  //     resolve(true);
  //   });
  // }, []);

  // Enhanced Reverse Geocoding using OpenStreetMap Nominatim (FREE) - Improved for Indian locations
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      // Use multiple zoom levels for better accuracy in Indian locations
      const zoomLevels = [18, 16, 14]; // Start with highest detail

      for (const zoom of zoomLevels) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=${zoom}&addressdetails=1&accept-language=en`,
            {
              headers: {
                'User-Agent': 'GPS-Tracker-App-Proddatur/1.0'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();

            // Enhanced location detection for Indian addresses
            const locationInfo = {
              address: data.display_name,
              city: data.address?.city || data.address?.town || data.address?.village || data.address?.municipality,
              state: data.address?.state,
              country: data.address?.country,
              postcode: data.address?.postcode,
              road: data.address?.road,
              houseNumber: data.address?.house_number,
              district: data.address?.state_district,
              subDistrict: data.address?.county,
              locality: data.address?.suburb || data.address?.neighbourhood,
              zoomLevel: zoom
            };

            // Special handling for Proddatur area
            if (locationInfo.city) {
              const cityLower = locationInfo.city.toLowerCase();

              // Check if we're getting the correct city
              if (cityLower.includes('proddatur') || cityLower.includes('prodatur')) {
                return locationInfo;
              } else if (cityLower.includes('visakhapatnam') || cityLower.includes('vizag')) {
                // Try with different parameters for better accuracy
                continue;
              }
            }

            // Return the best result we have
            if (locationInfo.city) {
              return locationInfo;
            }
          }
        } catch (zoomError) {
          console.warn(`Geocoding failed at zoom ${zoom}:`, zoomError);
          continue;
        }
      }

      // Fallback: Try alternative geocoding service
      try {
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&extratags=1`,
          {
            headers: {
              'User-Agent': 'GPS-Tracker-Fallback/1.0'
            }
          }
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();

          return {
            address: fallbackData.display_name,
            city: fallbackData.address?.city || fallbackData.address?.town || fallbackData.address?.village || 'Unknown Location',
            state: fallbackData.address?.state,
            country: fallbackData.address?.country,
            postcode: fallbackData.address?.postcode,
            road: fallbackData.address?.road,
            houseNumber: fallbackData.address?.house_number,
            fallbackUsed: true
          };
        }
      } catch (fallbackError) {
        console.warn('Fallback geocoding also failed:', fallbackError);
      }

    } catch (error) {
      console.warn('🚫 All reverse geocoding attempts failed:', error);
    }

    return null;
  }, []);

  // Enhanced GPS location with dynamic detection - NO HARDCODED LOCATIONS
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      console.log('🔍 Getting GPS location (starting with network, then upgrading to GPS)...');

      // Force high accuracy GPS for real location
      const getAccurateGPS = () => {
        console.log('🛰️ Forcing GPS satellite positioning...');

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            console.log('📍 GPS satellite obtained:', position.coords.accuracy + 'm accuracy');

            // Validate location accuracy
            if (position.coords.accuracy > 100) {
              console.log('⚠️ GPS accuracy too low:', position.coords.accuracy + 'm, trying again...');
              // Try again for better accuracy
              setTimeout(getAccurateGPS, 2000);
              return;
            }

            // Use the actual detected coordinates (no area restrictions)
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            console.log('📍 Your actual location detected:', lat, lng);

            // Process the GPS location directly (no area restrictions)
            await processLocationData(position, true);
          },
          (error) => {
            console.log('❌ High accuracy GPS failed:', error.message);
            reject(new Error(`GPS positioning failed: ${error.message}. Please enable location permissions and try again.`));
          },
          {
            enableHighAccuracy: true,    // Force GPS satellite
            timeout: 30000,              // Give GPS time to lock
            maximumAge: 0                // No cached location
          }
        );
      };



      const processLocationData = async (position, isHighAccuracy = false) => {
        try {
          const basicLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            speed: position.coords.speed,
            heading: position.coords.heading,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            isHighAccuracy: isHighAccuracy
          };

          console.log('📍 GPS coordinates:', basicLocation.latitude, basicLocation.longitude,
                     `(${basicLocation.accuracy}m accuracy, ${isHighAccuracy ? 'GPS' : 'Network'})`);

          // Get real location details using reverse geocoding
          try {
            const geocodeResult = await reverseGeocode(basicLocation.latitude, basicLocation.longitude);

            if (geocodeResult) {
              const enhancedLocation = {
                ...basicLocation,
                address: geocodeResult.address,
                city: geocodeResult.city,
                state: geocodeResult.state,
                country: geocodeResult.country,
                postcode: geocodeResult.postcode,
                road: geocodeResult.road,
                houseNumber: geocodeResult.houseNumber,
                openStreetMapEnhanced: true,
                realLocation: true
              };

              console.log('✅ Real location detected:', geocodeResult.city, geocodeResult.state);

              if (geocodeResult.city) {
                console.log('📍 Location successfully detected:', geocodeResult.city, geocodeResult.state);
              }

              setCurrentLocation(enhancedLocation);
              resolve(enhancedLocation);
            } else {
              setCurrentLocation(basicLocation);
              resolve(basicLocation);
            }
          } catch (geocodeError) {
            console.warn('🚫 Geocoding failed, using basic GPS:', geocodeError);
            setCurrentLocation(basicLocation);
            resolve(basicLocation);
          }
        } catch (error) {
          console.error('❌ GPS location processing error:', error);
          reject(error);
        }
      };

      // Start with accurate GPS directly
      console.log('🔍 Starting GPS location detection...');
      getAccurateGPS();
    });
  }, [reverseGeocode]);

  // Real-time GPS tracking with path recording for moving devices (like puppy)
  const startRealTimeDeviceTracking = useCallback((device) => {
    console.log('🐕 Starting real-time tracking for device:', device.deviceName);

    setSelectedDeviceForEnhancedTracking(device);

    // Initialize device tracking data
    const deviceId = device.deviceId || device.id;
    const trackingKey = `realtime_tracking_${deviceId}`;

    // Start continuous location monitoring
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            heading: position.coords.heading,
            timestamp: new Date().toISOString(),
            deviceId: deviceId,
            deviceName: device.deviceName || device.deviceDetails?.deviceName
          };

          console.log('📍 New location for', device.deviceName, ':', newLocation.latitude, newLocation.longitude);

          // Store location in path history
          const existingPath = JSON.parse(localStorage.getItem(trackingKey) || '[]');
          const updatedPath = [...existingPath, newLocation];

          // Keep only last 100 locations to prevent memory issues
          if (updatedPath.length > 100) {
            updatedPath.shift();
          }

          localStorage.setItem(trackingKey, JSON.stringify(updatedPath));

          // Sync location with server API
          try {
            await gpsApi.syncLocationToServer(deviceId, newLocation);
            console.log('✅ Location synced with server');
          } catch (error) {
            console.warn('⚠️ Failed to sync with server, stored locally:', error.message);
          }

          // Update current device locations with path visualization
          setDeviceLocations(prev => ({
            ...prev,
            [deviceId]: {
              deviceId: deviceId,
              deviceName: device.deviceName || device.deviceDetails?.deviceName,
              location: newLocation,
              timestamp: newLocation.timestamp,
              trackingStarted: prev[deviceId]?.trackingStarted || new Date().toISOString(),
              path: updatedPath,
              isRealTime: true,
              pathCoordinates: updatedPath.map(point => [point.latitude, point.longitude]),
              currentPosition: [newLocation.latitude, newLocation.longitude],
              serverSynced: true
            }
          }));

          // Trigger map update if map is open
          if (showGeoapifyTracker || showRealTimeMap) {
            console.log('🗺️ Updating map with new path point');
          }

          console.log('✅ Location updated for device:', deviceId);
        },
        (error) => {
          console.error('❌ GPS tracking error for device:', deviceId, error);
          setGpsError(`GPS tracking failed for ${device.deviceName}: ${error.message}`);
        },
        {
          enableHighAccuracy: false,   // Start with network location, upgrade to GPS later
          timeout: 15000,              // Reasonable timeout
          maximumAge: 30000            // Allow some caching for reliability
        }
      );

      alert(`🐕 Real-time tracking started for ${device.deviceName}!\nThe device path will be recorded as it moves.`);
    }

    // Also open the GPS tracker for visualization
    setShowGeoapifyTracker(true);
  }, []);

  // Stop real-time tracking for a specific device
  const stopRealTimeTracking = useCallback((deviceId) => {
    const watchId = activeWatchIds[deviceId];
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setActiveWatchIds(prev => {
        const updated = { ...prev };
        delete updated[deviceId];
        return updated;
      });
      console.log('🛑 Stopped real-time tracking for device:', deviceId);
    }
  }, [activeWatchIds]);

  // GPS tracking function - Enhanced with real-time path tracking
  const startEnhancedGPSTracking = useCallback((device) => {
    // Use real-time tracking for moving devices
    startRealTimeDeviceTracking(device);
    console.log('🗺️ Starting enhanced GPS tracking with real-time path for device:', device);
  }, [startRealTimeDeviceTracking]);

  // Handle location updates from enhanced tracker
  const handleEnhancedLocationUpdate = useCallback((location) => {
    if (!selectedDeviceForEnhancedTracking) return;

    // Extract deviceId from QR code if available
    let deviceId = selectedDeviceForEnhancedTracking.id;
    try {
      if (selectedDeviceForEnhancedTracking.qrCode) {
        const qrData = JSON.parse(selectedDeviceForEnhancedTracking.qrCode);
        deviceId = qrData.deviceId || selectedDeviceForEnhancedTracking.id;
      }
    } catch (error) {
      console.warn('Could not parse QR code for enhanced tracking:', error);
    }

    // Create device tracking data
    const deviceTrackingData = {
      deviceId: deviceId,
      deviceName: selectedDeviceForEnhancedTracking.name,
      qrCode: selectedDeviceForEnhancedTracking.qrCode,
      location: location,
      timestamp: new Date().toISOString(),
      status: 'active',
      trackingStarted: new Date().toISOString()
    };

    // Update device locations
    setDeviceLocations(prev => ({
      ...prev,
      [deviceId]: deviceTrackingData
    }));

    // Add to location history
    setLocationHistory(prev => [deviceTrackingData, ...prev.slice(0, 99)]);

    // Save to localStorage
    const savedLocations = JSON.parse(localStorage.getItem('deviceLocations') || '{}');
    savedLocations[deviceId] = deviceTrackingData;
    localStorage.setItem('deviceLocations', JSON.stringify(savedLocations));

    // Save to device-specific location history
    const deviceHistoryKey = `deviceHistory_${deviceId}`;
    const deviceHistory = JSON.parse(localStorage.getItem(deviceHistoryKey) || '[]');
    deviceHistory.unshift(deviceTrackingData);
    localStorage.setItem(deviceHistoryKey, JSON.stringify(deviceHistory.slice(0, 100)));
  }, [selectedDeviceForEnhancedTracking]);

  // NEW SYSTEM: QR Code Management Functions

  // Generate simple QR code (original format)
  const generate16DigitCode = useCallback(() => {
    // Simple format: QR + timestamp + random
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QR${timestamp}${random}`;
  }, []);

  // Generate clean QR code like your sample image
  const generateQRCodeImage = useCallback(async (text) => {
    try {
      // Use shorter text to get cleaner QR pattern
      const shortText = text.length > 20 ? text.substring(0, 20) : text;

      return await QRCode.toDataURL(shortText, {
        width: 200,
        margin: 4,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'L',
        version: 2
      });
    } catch (error) {
      return null;
    }
  }, []);

  // Generate multiple QR codes (Admin/Super Admin only)
  const generateQRCodes = useCallback(async (count) => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      alert('Only admins can generate QR codes');
      return;
    }

    try {
      const newQRCodes = [];

      // Show loading message
      alert('Generating QR codes... Please wait.');

      for (let i = 0; i < count; i++) {
        const code = generate16DigitCode();
        console.log(`Generating QR code ${i + 1}/${count} with code: ${code}`);

        // Create device information for QR code (without hardcoded GPS)
        const deviceInfo = {
          deviceId: code,
          deviceName: `GPS Device ${code}`,
          deviceType: 'GPS Tracker',
          status: 'available',
          generatedAt: new Date().toISOString(),
          createdBy: userData.username,
          // Note: GPS coordinates will be added dynamically when QR code is scanned
          timestamp: new Date().toISOString()
        };

        try {
          // Create simple QR code data - just the device ID for reliability
          const qrCodeData = code; // Just use the device ID directly

          // Generate QR code with simple data
          const qrImageData = await generateQRCodeImage(qrCodeData);
          console.log(`QR code ${i + 1} generated successfully with device ID: ${code}`);

          const qrCode = {
            id: `QR-${Date.now()}-${i}`,
            code: code,
            deviceInfo: deviceInfo, // Store the device information
            status: 'available', // available, assigned, active
            createdAt: new Date().toISOString(),
            createdBy: userData.username,
            assignedTo: null,
            assignedAt: null,
            deviceDetails: deviceInfo, // Also store in deviceDetails for compatibility
            lastScanned: null,
            scanCount: 0,
            qrCodeImage: qrImageData, // Store actual QR code image
            qrCodeData: qrCodeData // Store the actual QR code content
          };
          newQRCodes.push(qrCode);
        } catch (error) {
          console.error(`Error generating QR code ${i + 1}:`, error);
          // Continue with next QR code
        }
      }

      if (newQRCodes.length === 0) {
        alert('Failed to generate any QR codes. Please try again.');
        return;
      }

      // Save to localStorage
      const existingQRCodes = JSON.parse(localStorage.getItem('generatedQRCodes') || '[]');
      const updatedQRCodes = [...existingQRCodes, ...newQRCodes];
      localStorage.setItem('generatedQRCodes', JSON.stringify(updatedQRCodes));
      setGeneratedQRCodes(updatedQRCodes);

      alert(`Successfully generated ${newQRCodes.length} QR codes!\nThey are now visible to all users and can be scanned.`);
      setShowQRGenerationModal(false);
      setQrGenerationCount(1);
    } catch (error) {
      console.error('Error in generateQRCodes:', error);
      alert('Failed to generate QR codes. Please try again.');
    }
  }, [userData, generate16DigitCode, generateQRCodeImage]);

  // Load QR codes from localStorage and regenerate images if missing
  const loadQRCodes = useCallback(async () => {
    const savedQRCodes = JSON.parse(localStorage.getItem('generatedQRCodes') || '[]');

    // Check if any QR codes are missing images and regenerate them
    const updatedQRCodes = [];
    for (const qr of savedQRCodes) {
      if (!qr.qrCodeImage) {
        console.log(`Regenerating QR code image for: ${qr.code}`);
        try {
          const qrImageData = await generateQRCodeImage(qr.code);
          updatedQRCodes.push({ ...qr, qrCodeImage: qrImageData });
        } catch (error) {
          console.error(`Failed to regenerate QR code for ${qr.code}:`, error);
          updatedQRCodes.push(qr);
        }
      } else {
        updatedQRCodes.push(qr);
      }
    }

    // Save updated QR codes if any were regenerated
    if (updatedQRCodes.some((qr, index) => qr.qrCodeImage !== savedQRCodes[index]?.qrCodeImage)) {
      localStorage.setItem('generatedQRCodes', JSON.stringify(updatedQRCodes));
    }

    setGeneratedQRCodes(updatedQRCodes);
  }, [generateQRCodeImage]);

  // Regenerate QR code image for a specific QR code
  const regenerateQRCodeImage = useCallback(async (qrId) => {
    try {
      const qrToUpdate = generatedQRCodes.find(qr => qr.id === qrId);
      if (!qrToUpdate) {
        alert('QR code not found');
        return;
      }

      console.log(`Regenerating QR code image for: ${qrToUpdate.code}`);
      const qrImageData = await generateQRCodeImage(qrToUpdate.code);

      const updatedQRCodes = generatedQRCodes.map(qr =>
        qr.id === qrId ? { ...qr, qrCodeImage: qrImageData } : qr
      );

      localStorage.setItem('generatedQRCodes', JSON.stringify(updatedQRCodes));
      setGeneratedQRCodes(updatedQRCodes);

      alert('QR code image regenerated successfully!');
    } catch (error) {
      console.error('Error regenerating QR code image:', error);
      alert('Failed to regenerate QR code image');
    }
  }, [generatedQRCodes, generateQRCodeImage]);

  // Delete QR code (Admin only)
  const deleteQRCode = useCallback((qrId) => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      alert('Only admins can delete QR codes');
      return;
    }

    if (window.confirm('Are you sure you want to delete this QR code?')) {
      const updatedQRCodes = generatedQRCodes.filter(qr => qr.id !== qrId);
      localStorage.setItem('generatedQRCodes', JSON.stringify(updatedQRCodes));
      setGeneratedQRCodes(updatedQRCodes);
      alert('QR code deleted successfully!');
    }
  }, [userData, generatedQRCodes]);

  // Assign device to QR code (User action)
  const assignDeviceToQR = useCallback((qrCode, deviceData) => {
    if (!userData) return;

    // Check if QR is available
    if (qrCode.status !== 'available') {
      alert('This QR code is already assigned to another user');
      return;
    }

    // Update QR code with device assignment
    const updatedQRCode = {
      ...qrCode,
      status: 'assigned',
      assignedTo: userData.username,
      assignedAt: new Date().toISOString(),
      deviceDetails: {
        ...deviceData,
        assignedBy: userData.username
      }
    };

    // Update in localStorage
    const updatedQRCodes = generatedQRCodes.map(qr =>
      qr.id === qrCode.id ? updatedQRCode : qr
    );
    localStorage.setItem('generatedQRCodes', JSON.stringify(updatedQRCodes));
    setGeneratedQRCodes(updatedQRCodes);

    alert(`Device "${deviceData.deviceName}" successfully assigned to QR code: ${qrCode.code}`);
    setShowDeviceAssignmentModal(false);
    setSelectedQRForAssignment(null);
    setDeviceAssignmentData({
      deviceName: '',
      deviceModel: '',
      deviceType: '',
      serialNumber: '',
      description: ''
    });
  }, [userData, generatedQRCodes]);

  // Handle QR code scanning with 16-digit code validation
  const handleQRCodeScan = useCallback((scannedCode) => {
    console.log('🔍 Scanning QR code:', scannedCode);

    // Find QR code by 16-digit code
    const qrCode = generatedQRCodes.find(qr => qr.code === scannedCode);

    if (!qrCode) {
      console.log('❌ QR code not found in system');
      alert('Invalid QR code. This code is not recognized in the system.');
      return;
    }

    console.log('✅ QR code found:', qrCode);

    // Allow scanning of available QR codes for testing/demo purposes
    if (qrCode.status === 'assigned' && qrCode.assignedTo !== userData?.username) {
      alert('This QR code is assigned to another user. You cannot access it.');
      return;
    }

    // Update scan count and last scanned
    const updatedQRCode = {
      ...qrCode,
      lastScanned: new Date().toISOString(),
      scanCount: qrCode.scanCount + 1,
      status: qrCode.status === 'available' ? 'available' : 'active' // Keep available status for unassigned QR codes
    };

    // Update in localStorage
    const updatedQRCodes = generatedQRCodes.map(qr =>
      qr.id === qrCode.id ? updatedQRCode : qr
    );
    localStorage.setItem('generatedQRCodes', JSON.stringify(updatedQRCodes));
    setGeneratedQRCodes(updatedQRCodes);

    // Show device details directly
    const deviceInfo = qrCode.deviceInfo || {
      deviceId: qrCode.code,
      deviceName: `GPS Tracker ${qrCode.code.substring(0, 4)}`,
      deviceType: 'GPS Tracker',
      manufacturer: 'ADDWISE',
      model: 'GPS Tracker Pro',
      status: qrCode.status,
      generatedAt: qrCode.createdAt,
      createdBy: qrCode.createdBy
    };

    // Enhance device info with additional details
    const enhancedDeviceInfo = {
      ...deviceInfo,
      scannedAt: new Date().toISOString(),
      scannedBy: userData.username,
      scanLocation: 'GPS Tracker App',
      qrCodeId: qrCode.id,
      scanCount: updatedQRCode.scanCount,
      lastScanned: updatedQRCode.lastScanned,
      assignedTo: qrCode.assignedTo,

      // Add default fields if missing
      deviceId: deviceInfo.deviceId || qrCode.code,
      deviceName: deviceInfo.deviceName || `GPS Tracker ${qrCode.code.substring(0, 4)}`,
      deviceType: deviceInfo.deviceType || 'GPS Tracker',
      manufacturer: deviceInfo.manufacturer || 'ADDWISE',
      model: deviceInfo.model || 'GPS Tracker Pro',
      firmwareVersion: deviceInfo.firmwareVersion || '2.1.4',
      serialNumber: deviceInfo.serialNumber || qrCode.code,

      // Location and tracking info
      lastLocation: deviceInfo.lastLocation || 'Location not available',
      batteryLevel: deviceInfo.batteryLevel || 'Unknown',
      signalStrength: deviceInfo.signalStrength || 'Unknown',

      // Timestamps
      validUntil: deviceInfo.validUntil || 'No expiration',
      lastUpdated: new Date().toISOString(),

      // Security and access
      accessLevel: deviceInfo.accessLevel || 'Standard',
      permissions: deviceInfo.permissions || ['view', 'track'],

      // Additional metadata
      description: deviceInfo.description || `GPS tracking device with code ${qrCode.code}`,
      category: deviceInfo.category || 'Vehicle Tracking',
      features: deviceInfo.features || ['Real-time GPS', 'Geofencing', 'Speed Monitoring', 'Route History'],

      // Raw data for debugging
      rawQRData: JSON.stringify(deviceInfo)
    };

    console.log('📱 Showing device details for scanned QR code');
    setScannedDeviceDetails(enhancedDeviceInfo);
    setShowScannedDeviceModal(true);

    // Save to scan history
    const scanHistory = JSON.parse(localStorage.getItem('qrScanHistory') || '[]');
    scanHistory.unshift({
      ...enhancedDeviceInfo,
      scanId: `SCAN-${Date.now()}`,
      scannedAt: new Date().toISOString()
    });

    // Keep only last 50 scans
    if (scanHistory.length > 50) {
      scanHistory.splice(50);
    }

    localStorage.setItem('qrScanHistory', JSON.stringify(scanHistory));

    // 🚀 AUTO-OPEN QR-to-Postman tracker for manual entry (same as camera scan)
    setTimeout(() => {
      console.log('🚀 Auto-opening QR-to-Postman tracker for manual entry...');

      // Create QR scan location data
      const qrScanLocation = {
        latitude: enhancedDeviceInfo.latitude || 14.4673,  // Use QR location or default
        longitude: enhancedDeviceInfo.longitude || 78.8242,
        timestamp: new Date().toISOString(),
        deviceName: enhancedDeviceInfo.deviceName || 'Unknown Device',
        scannedBy: userData?.username || 'Unknown'
      };

      // Extract clean device ID
      let cleanDeviceId = enhancedDeviceInfo.deviceId;
      if (typeof cleanDeviceId === 'object' && cleanDeviceId.deviceId) {
        cleanDeviceId = cleanDeviceId.deviceId;
      }

      console.log('🗺️ Opening tracker with manual entry:', { qrScanLocation, cleanDeviceId });

      // Set data and open tracker
      setQrScanLocationData(qrScanLocation);
      setTrackedDeviceId(cleanDeviceId);
      setShowQRToPostmanTracker(true);
      setShowScannedDeviceModal(false);
    }, 2000);
  }, [generatedQRCodes, userData]);

  // View QR code in large modal (with security check)
  const viewQRCode = useCallback((qr) => {
    // 🔒 SECURITY: Only allow viewing if user has permission
    if (!canViewQRCode(qr)) {
      alert('🔒 Access denied. You can only view QR codes assigned to you or unassigned QR codes.');
      return;
    }
    setSelectedQRForView(qr);
    setShowQRViewModal(true);
  }, [canViewQRCode]);

  // Download QR code image
  const downloadQRCode = useCallback((qr) => {
    if (!qr.qrCodeImage) {
      alert('QR code image not available');
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = qr.qrCodeImage;
    link.download = `QR_Code_${qr.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Print QR code
  const printQRCode = useCallback((qr) => {
    if (!qr.qrCodeImage) {
      alert('QR code image not available');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${qr.code}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              margin: 20px auto;
              max-width: 300px;
            }
            .qr-image {
              width: 100%;
              border: 2px solid #000;
            }
            .qr-info {
              margin-top: 20px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <h2>GPS Tracker QR Code</h2>
          <div class="qr-container">
            <img src="${qr.qrCodeImage}" alt="QR Code" class="qr-image" />
            <div class="qr-info">
              <p><strong>Code:</strong> ${qr.code}</p>
              <p><strong>Status:</strong> ${qr.status}</p>
              ${qr.deviceDetails ? `<p><strong>Device:</strong> ${qr.deviceDetails.deviceName}</p>` : ''}
              ${qr.assignedTo ? `<p><strong>Assigned to:</strong> ${qr.assignedTo}</p>` : ''}
              <p><strong>Created:</strong> ${new Date(qr.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, []);

  // Start real-time GPS tracking for a device
  const startRealTimeTracking = useCallback((device) => {
    console.log('Starting real-time tracking for device:', device);
    setSelectedDeviceForRealTimeTracking(device);
    setShowRealTimeTracker(true);
  }, []);

  // Close real-time tracking
  const closeRealTimeTracking = useCallback(() => {
    setShowRealTimeTracker(false);
    setSelectedDeviceForRealTimeTracking(null);
  }, []);

  const startDeviceTracking = useCallback((device) => {
    setSelectedDeviceForTracking(device);
    setGpsError('');

    // Get current location and assign it to this specific device
    getCurrentLocation()
      .then((location) => {
        // Extract deviceId from QR code if available
        let deviceId = device.id;
        try {
          if (device.qrCode) {
            const qrData = JSON.parse(device.qrCode);
            deviceId = qrData.deviceId || device.id;
          }
        } catch (error) {
          console.warn('Could not parse QR code, using device.id:', error);
        }

        // Create unique tracking data for this specific device
        const deviceTrackingData = {
          deviceId: deviceId,
          deviceName: device.name,
          qrCode: device.qrCode,
          location: {
            ...location,
            // Add some variation to simulate different device locations
            latitude: location.latitude + (Math.random() - 0.5) * 0.001,
            longitude: location.longitude + (Math.random() - 0.5) * 0.001
          },
          timestamp: new Date().toISOString(),
          status: 'active',
          trackingStarted: new Date().toISOString()
        };

        // Update device locations using the correct deviceId from QR code
        setDeviceLocations(prev => ({
          ...prev,
          [deviceId]: deviceTrackingData
        }));

        // Add to location history with device-specific entry
        setLocationHistory(prev => [deviceTrackingData, ...prev.slice(0, 99)]);

        // Save device-specific location to localStorage using correct deviceId
        const savedLocations = JSON.parse(localStorage.getItem('deviceLocations') || '{}');
        savedLocations[deviceId] = deviceTrackingData;
        localStorage.setItem('deviceLocations', JSON.stringify(savedLocations));

        // Save to device-specific location history using correct deviceId
        const deviceHistoryKey = `deviceHistory_${deviceId}`;
        const deviceHistory = JSON.parse(localStorage.getItem(deviceHistoryKey) || '[]');
        deviceHistory.unshift(deviceTrackingData);
        localStorage.setItem(deviceHistoryKey, JSON.stringify(deviceHistory.slice(0, 50)));

        // Update the device request with GPS location
        updateDeviceWithGPSLocation(device, deviceTrackingData);

        alert(`GPS tracking started for ${device.name}!\nLocation: ${deviceTrackingData.location.latitude.toFixed(6)}, ${deviceTrackingData.location.longitude.toFixed(6)}`);
      })
      .catch((error) => {
        console.error('Tracking error:', error);
        setGpsError(`Failed to start tracking for ${device.name}: ${error.message}`);
        alert(`Failed to start GPS tracking for ${device.name}. Please ensure location permissions are enabled.`);
      });
  }, [getCurrentLocation]);

  // Update device request with GPS location
  const updateDeviceWithGPSLocation = useCallback((device, locationData) => {
    try {
      const deviceRequests = JSON.parse(localStorage.getItem('deviceRequests') || '[]');
      const updatedRequests = deviceRequests.map(request => {
        const updatedDevices = request.devices.map(d => {
          if (d.qrCode === device.qrCode) {
            return {
              ...d,
              gpsLocation: locationData.location,
              lastLocationUpdate: locationData.timestamp,
              trackingStatus: 'active'
            };
          }
          return d;
        });
        return { ...request, devices: updatedDevices };
      });

      localStorage.setItem('deviceRequests', JSON.stringify(updatedRequests));
    } catch (error) {
      console.error('Error updating device with GPS location:', error);
    }
  }, []);

  const stopDeviceTracking = useCallback(() => {
    setTrackingActive(false);
    setSelectedDeviceForTracking(null);
    if (window.trackingInterval) {
      clearInterval(window.trackingInterval);
      window.trackingInterval = null;
    }
  }, []);

  const loadSavedLocations = useCallback(() => {
    try {
      const savedLocations = JSON.parse(localStorage.getItem('deviceLocations') || '{}');
      const savedHistory = JSON.parse(localStorage.getItem('locationHistory') || '[]');
      setDeviceLocations(savedLocations);
      setLocationHistory(savedHistory);
    } catch (error) {
      console.error('Error loading saved locations:', error);
    }
  }, []);

  const handleViewDeviceLocation = useCallback((device) => {
    setSelectedDeviceForTracking(device);
    setShowMapModal(true);
  }, []);

  // Simple Map component for device location (FREE - No dependencies)
  const createSimpleMap = useCallback((containerId, location, deviceName) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) return null;

      // Create a simple map display with OpenStreetMap embed
      container.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; background: #f8f9fa; border-radius: 8px; overflow: hidden;">
          <div style="flex: 1; position: relative; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude-0.01},${location.latitude-0.01},${location.longitude+0.01},${location.latitude+0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}"
              style="width: 100%; height: 100%; border: none;"
              title="Device Location Map"
            ></iframe>
            <div style="
              position: absolute;
              top: 10px;
              left: 10px;
              background: rgba(255,255,255,0.9);
              padding: 10px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              font-family: Arial, sans-serif;
              font-size: 12px;
              max-width: 200px;
            ">
              <h6 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">📱 ${deviceName}</h6>
              <div><strong>Coordinates:</strong></div>
              <div>Lat: ${location.latitude.toFixed(6)}</div>
              <div>Lng: ${location.longitude.toFixed(6)}</div>
              <div style="margin-top: 5px;"><strong>Accuracy:</strong> ${location.accuracy}m</div>
              ${location.address ? `
                <div style="margin-top: 5px;">
                  <strong>Address:</strong><br>
                  <small>${location.address.substring(0, 80)}...</small>
                </div>
              ` : ''}
              <div style="margin-top: 8px;">
                <small style="color: #666;">
                  Updated: ${new Date(location.timestamp).toLocaleString()}
                </small>
              </div>
            </div>
          </div>
        </div>
      `;

      return { container };
    } catch (error) {
      console.error('Error creating simple map:', error);
      return null;
    }
  }, []);

  // Load user activity when userData changes
  useEffect(() => {
    if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
      loadUserActivity();
      loadAllUsers();
      loadAllDevices();
    }
    // Load saved GPS locations for all users
    loadSavedLocations();

    // NEW SYSTEM: Load QR codes
    loadQRCodes();
  }, [userData, loadUserActivity, loadAllUsers, loadAllDevices, loadSavedLocations, loadQRCodes]);

  // Initialize Simple Map when modal opens
  useEffect(() => {
    if (showMapModal && selectedDeviceForTracking) {
      // Extract deviceId from QR code if available
      let deviceId = selectedDeviceForTracking.deviceId || selectedDeviceForTracking.id;
      try {
        if (selectedDeviceForTracking.qrCode) {
          const qrData = JSON.parse(selectedDeviceForTracking.qrCode);
          deviceId = qrData.deviceId || deviceId;
        }
      } catch (error) {
        console.warn('Could not parse QR code for map display:', error);
      }

      if (deviceLocations[deviceId]) {
        const location = deviceLocations[deviceId].location;

      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        try {
          createSimpleMap('simple-map-container', location, selectedDeviceForTracking.deviceName);
        } catch (error) {
          console.error('Failed to initialize simple map:', error);
          // Fallback: Show basic map placeholder
          const container = document.getElementById('simple-map-container');
          if (container) {
            container.innerHTML = `
              <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                <h5>OpenStreetMap Loading...</h5>
                <p class="text-muted">Free map integration in progress</p>
                <small class="text-muted">Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</small>
              </div>
            `;
          }
        }
      }, 300);

      return () => clearTimeout(timer);
      }
    }
  }, [showMapModal, selectedDeviceForTracking, deviceLocations, createSimpleMap]);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);

        // REMOVED: Load admin device requests (replaced by QR code system)
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('currentUser');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!userData) return;

      try {
        setLoading(true);
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      const stats = {
        totalUsers: users.length,
        totalAdmins: users.filter(user => user.role === 'admin' || user.role === 'superadmin').length,
        systemHealth: '98%',
        systemStatus: 'Optimal'
      };

      const recentActivities = [
        {
          title: 'System Login',
          type: 'system',
          timestamp: new Date().toISOString(),
          icon: '🔐'
        },
        {
          title: 'Profile Updated',
          type: 'profile',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          icon: '👤'
        }
      ];

      setDashboardStats(stats);
      setUsers(users);
      setActivities(recentActivities);
        setError(null);
      } catch (err) {
      console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
  }, [userData]);

  // Add useEffect to initialize editedProfile when userData changes
  useEffect(() => {
    if (userData) {
      setEditedProfile({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        company: userData.company || '',
        phone: userData.phone || ''
      });
    }
  }, [userData]);

  // Add this useEffect to load login history
  useEffect(() => {
    const loadLoginHistory = () => {
      const history = JSON.parse(localStorage.getItem('loginHistory')) || [];
      // Filter history for current user
      const userHistory = history.filter(entry => entry.email === userData?.email);
      setLoginHistory(userHistory);
    };
    if (userData) {
      loadLoginHistory();
    }
  }, [userData]);

  useEffect(() => {
    // Load dashboard statistics
    const loadDashboardStats = () => {
      try {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const loginHistory = JSON.parse(localStorage.getItem('loginHistory')) || [];
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        setDashboardStats({
          totalUsers: users.length,
          activeUsers: users.filter(user => 
            loginHistory.some(login => 
              login.email === user.email && new Date(login.timestamp) > last24Hours
            )
          ).length,
          recentLogins: loginHistory.filter(login => 
            new Date(login.timestamp) > last24Hours
          ).length,
          systemStatus: 'Healthy'
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      }
    };

    loadDashboardStats();
    const interval = setInterval(loadDashboardStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Add custom styles for sidebar
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      body {
        background-color: #f0f2f5;
        font-family: 'Poppins', sans-serif;
      }

      .dashboard-navbar {
        background-color: #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        padding: 1rem 2rem;
      }

      .dashboard-sidebar {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 1rem;
        height: calc(100vh - 90px);
      }

      .sidebar-header {
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
        margin-bottom: 1rem;
      }

      .sidebar-item {
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .sidebar-item:hover {
        background-color: #e9ecef;
      }

      .sidebar-item.active {
        background-color: #0d6efd;
        color: #ffffff;
      }

      .dashboard-content {
        padding: 2rem;
      }

      .stat-card {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 1.5rem;
        transition: all 0.3s ease;
      }

      .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .profile-card {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 2rem;
      }

      .btn-primary {
        background-color: #0d6efd;
        border-color: #0d6efd;
        transition: all 0.3s ease;
      }

      .btn-primary:hover {
        background-color: #0b5ed7;
        border-color: #0a58ca;
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  };

  const handleDashboardClick = () => {
    setActiveTab('dashboard');
  };

  const handleProfileClick = () => {
    setActiveTab('profile');
  };

  const handleSettingsClick = () => {
    setActiveTab('settings');
  };

  const handleSidebarItemClick = (itemId) => {
    setActiveSidebarItem(itemId);
  };

  const getRoleDisplay = (role) => {
    switch(role) {
      case 'admin':
        return 'Admin';
      case 'superadmin':
        return 'Super Admin';
      default:
        return 'User';
    }
  };

  const getDashboardStats = () => {
    if (!dashboardStats) return null;

    const commonStats = [
      {
        title: 'Total Users',
        value: dashboardStats.totalUsers || 0,
        icon: 'USERS',
        color: '#007bff',
        change: '+8%',
        trend: 'up'
      },
      {
        title: 'Active Users',
        value: dashboardStats.totalUsers || 0,
        icon: 'ACTIVE',
        color: '#28a745',
        change: '+5%',
        trend: 'up'
      }
    ];

    const adminStats = [
      {
        title: 'Total Admins',
        value: dashboardStats.totalAdmins || 0,
        icon: 'ADMIN',
        color: '#ffc107',
        change: '+3%',
        trend: 'up'
      },
      {
        title: 'System Health',
        value: dashboardStats.systemHealth || '98%',
        icon: 'HEALTH',
        color: '#dc3545',
        change: '2%',
        trend: 'up'
      }
    ];

    const superAdminStats = [
      {
        title: 'System Status',
        value: dashboardStats.systemStatus || 'Optimal',
        icon: 'STATUS',
        color: '#17a2b8',
        change: 'Stable',
        trend: 'neutral'
      }
    ];

    switch (userData?.role) {
      case 'superadmin':
        return [...commonStats, ...adminStats, ...superAdminStats];
      case 'admin':
        return [...commonStats, ...adminStats];
      default:
        return commonStats;
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getRecentActivities = () => {
    if (!activities || activities.length === 0) return [];

    const roleBasedActivities = activities.filter(activity => {
      switch (userData?.role) {
        case 'superadmin':
          return true; // Super admin can see all activities
        case 'admin':
          return activity.type !== 'system' && activity.type !== 'admin_management';
        default:
          return activity.type === 'device' || activity.type === 'scan';
      }
    });

    return roleBasedActivities.slice(0, 5); // Show last 5 activities
  };

  // eslint-disable-next-line no-unused-vars
  const getRoleBasedFeatures = () => {
    const commonFeatures = [
      {
        title: 'Device Scanner',
        description: 'Scan and track devices in real-time',
        icon: 'SCAN',
        color: '#4a148c'
      },
      {
        title: 'Location Tracking',
        description: 'View device locations on map',
        icon: 'MAP',
        color: '#28a745'
      }
    ];

    const adminFeatures = [
      {
        title: 'User Management',
        description: 'Manage users and their permissions',
        icon: 'USERS',
        color: '#007bff'
      },
      {
        title: 'Device Management',
        description: 'Add, edit, and remove devices',
        icon: 'DEVICES',
        color: '#ffc107'
      },
      {
        title: 'Reports & Analytics',
        description: 'Generate detailed reports and analytics',
        icon: 'REPORTS',
        color: '#17a2b8'
      }
    ];

    const superAdminFeatures = [
      {
        title: 'Admin Management',
        description: 'Manage system administrators',
        icon: 'ADMIN',
        color: '#dc3545'
      },
      {
        title: 'System Settings',
        description: 'Configure system-wide settings',
        icon: 'SETTINGS',
        color: '#6f42c1'
      },
      {
        title: 'Audit Logs',
        description: 'View detailed system audit logs',
        icon: 'LOGS',
        color: '#20c997'
      }
    ];

    switch (userData?.role) {
      case 'superadmin':
        return [...commonFeatures, ...adminFeatures, ...superAdminFeatures];
      case 'admin':
        return [...commonFeatures, ...adminFeatures];
      default:
        return commonFeatures;
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditSuccess(false);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      company: userData.company || '',
      phone: userData.phone || ''
    });
    setEditSuccess(false);
    setEditError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    try {
      // Validate required fields
      if (!editedProfile.firstName || !editedProfile.lastName || !editedProfile.email) {
        setEditError('First name, last name, and email are required');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedProfile.email)) {
        setEditError('Please enter a valid email address');
        return;
      }

      // Get current users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Find and update the user
      const updatedUsers = users.map(user => {
        if (user.username === userData.username) {
          return {
            ...user,
            ...editedProfile,
            lastUpdated: new Date().toISOString()
          };
        }
        return user;
      });

      // Save updated users
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      // Update current user data
      const updatedUserData = {
        ...userData,
        ...editedProfile,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
      setUserData(updatedUserData);

      setEditSuccess(true);
      setIsEditing(false);
      setEditError('');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setEditSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Error updating profile:', err);
      setEditError('Failed to update profile. Please try again.');
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setPasswordError('');
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handlePasswordSubmit = () => {
    try {
      // Validate current password
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find(u => u.username === userData.username);
      
      if (!currentUser || currentUser.password !== passwordData.currentPassword) {
        setPasswordError('Current password is incorrect');
        return;
      }

      // Validate new password
      const passwordValidationError = validatePassword(passwordData.newPassword);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        return;
      }

      // Check if passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      // Update password in users array
      const updatedUsers = users.map(user => {
        if (user.username === userData.username) {
          return {
            ...user,
            password: passwordData.newPassword,
            lastUpdated: new Date().toISOString()
          };
        }
        return user;
      });

      // Save updated users
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      // Update current user data
      const updatedUserData = {
        ...userData,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
      setUserData(updatedUserData);

      // Show success message and close modal
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError('Failed to update password. Please try again.');
    }
  };

  // Add this function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin':
        return 'primary';
      case 'superadmin':
        return 'danger';
      default:
        return 'success';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin':
        return 'ADM';
      case 'superadmin':
        return 'SA';
      default:
        return 'USR';
    }
  };

  const handleDeleteAccount = () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion');
      return;
    }

    try {
      // Get current users from localStorage
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));

      // Verify password
      const userToDelete = users.find(u => 
        u.email === currentUser.email && 
        u.password === deletePassword
      );

      if (!userToDelete) {
        setDeleteError('Incorrect password');
        return;
      }

      // Remove user from users array
      const updatedUsers = users.filter(u => u.email !== currentUser.email);
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      // Clear user data
      localStorage.removeItem('currentUser');
      localStorage.removeItem('loginHistory');

      // Show success message and redirect to login
      alert('Account deleted successfully');
      window.location.href = '/login';
    } catch (err) {
      setDeleteError('An error occurred while deleting your account');
    }
  };

  const handleStartScan = () => {
    setShowQRScanner(true);
    setScanResult(null);
    setScanError(null);
    
    // Initialize scanner after modal is shown
    setTimeout(() => {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scannerRef.current.render(
          (decodedText) => {
            // Success callback
            console.log('🎯 QR Code scanned successfully:', decodedText);
            console.log('📏 QR Code data length:', decodedText.length);
            console.log('🔍 QR Code preview:', decodedText.substring(0, 200) + (decodedText.length > 200 ? '...' : ''));

            setScanResult(decodedText);
            scannerRef.current.clear();
            setShowQRScanner(false);

            // Handle the scanned QR code data
            handleQRCodeData(decodedText);
          },
          (errorMessage) => {
            // Error callback - only log significant errors, not continuous scanning attempts
            if (!errorMessage.includes('No QR code found') && !errorMessage.includes('NotFoundException')) {
              console.warn('⚠️ QR Scanner error:', errorMessage);
              setScanError(errorMessage);
            }
          }
        );
      }
    }, 500);
  };

  const handleQRCodeData = (data) => {
    console.log('🔄 Processing QR code data...');
    console.log('📄 Raw QR data:', data);
    console.log('📏 Data length:', data.length);

    try {
      let deviceInfo;

      // Clean the data first
      const cleanData = data ? data.trim() : '';
      console.log('🧹 Cleaned data:', cleanData);

      // First, try to parse as JSON (new QR codes with GPS data)
      let parsedQRData = null;
      if (cleanData.startsWith('{') && cleanData.endsWith('}')) {
        try {
          parsedQRData = JSON.parse(cleanData);
          console.log('✅ Successfully parsed QR code JSON:', parsedQRData);
        } catch (parseError) {
          console.log('⚠️ JSON parsing failed:', parseError.message);
        }
      }

      // Try to find the QR code in our generated QR codes list
      let qrCode = null;
      if (parsedQRData && parsedQRData.deviceId) {
        // Look for QR code by deviceId from parsed JSON
        qrCode = generatedQRCodes.find(qr => qr.code === parsedQRData.deviceId);
      } else {
        // Look for QR code by raw data (old format)
        qrCode = generatedQRCodes.find(qr => qr.code === cleanData);
      }

      if (qrCode || parsedQRData) {
        console.log('✅ Found QR code data:', qrCode || parsedQRData);

        // Use parsed JSON data if available, otherwise use stored data
        if (parsedQRData) {
          deviceInfo = {
            deviceId: parsedQRData.deviceId,
            deviceName: parsedQRData.deviceName || `GPS Tracker ${parsedQRData.deviceId.substring(0, 4)}`,
            latitude: parsedQRData.latitude,
            longitude: parsedQRData.longitude,
            timestamp: parsedQRData.timestamp,
            createdBy: parsedQRData.createdBy,
            deviceType: 'GPS Tracker',
            status: qrCode ? qrCode.status : 'available',
            qrCodeId: qrCode ? qrCode.id : null,
            scanCount: qrCode ? qrCode.scanCount + 1 : 1,
            assignedTo: qrCode ? qrCode.assignedTo : null,
            scannedAt: new Date().toISOString(),
            scannedBy: userData?.username || 'Unknown'
          };
        } else {
          // Use stored device information (old format)
          deviceInfo = {
            ...qrCode.deviceInfo,
            deviceId: qrCode.code,
            deviceName: qrCode.deviceInfo?.deviceName || `GPS Tracker ${qrCode.code.substring(0, 4)}`,
            qrCodeId: qrCode.id,
            scanCount: qrCode.scanCount + 1,
            lastScanned: qrCode.lastScanned,
            assignedTo: qrCode.assignedTo,
            status: qrCode.status
          };
        }
        console.log('📱 Using device info with GPS coordinates:', deviceInfo);
        console.log('🔍 DEBUG: GPS coordinates in deviceInfo:');
        console.log('  - latitude:', deviceInfo.latitude, typeof deviceInfo.latitude);
        console.log('  - longitude:', deviceInfo.longitude, typeof deviceInfo.longitude);
      } else {
        // Try to parse as JSON for external QR codes
        if (cleanData.startsWith('{') && cleanData.endsWith('}')) {
          try {
            console.log('🔍 Attempting to parse external QR code as JSON...');
            console.log('📄 Raw QR data to parse:', cleanData);
            const externalQRData = JSON.parse(cleanData);
            console.log('✅ Successfully parsed external QR code as JSON:', externalQRData);
            console.log('🔍 Extracted deviceId:', externalQRData.deviceId);

            deviceInfo = {
              deviceId: externalQRData.deviceId || cleanData,
              deviceName: externalQRData.deviceName || `Device ${(externalQRData.deviceId || cleanData).substring(0, 8)}`,
              latitude: externalQRData.latitude || null,
              longitude: externalQRData.longitude || null,
              timestamp: externalQRData.timestamp || new Date().toISOString(),
              deviceType: 'GPS Tracker',
              manufacturer: 'External',
              model: 'Unknown',
              status: 'external',
              scannedAt: new Date().toISOString(),
              scannedBy: userData?.username || 'Unknown',
              rawData: cleanData
            };
          } catch (parseError) {
            console.log('⚠️ External JSON parsing failed:', parseError.message);
            // Create basic device info for invalid JSON
            deviceInfo = {
              deviceId: cleanData,
              deviceName: `Device ${cleanData.substring(0, 8)}`,
              deviceType: 'GPS Tracker',
              manufacturer: 'Unknown',
              model: 'Unknown',
              status: 'unknown',
              scannedAt: new Date().toISOString(),
              scannedBy: userData?.username || 'Unknown',
              rawData: cleanData,
              error: 'Invalid JSON format'
            };
          }
        } else {
          console.log('⚠️ Not complete JSON format, extracting device ID from truncated data...');

          // Extract device ID from incomplete/truncated JSON
          let extractedDeviceId = cleanData;

          // Try multiple patterns to extract device ID
          const patterns = [
            /"deviceId"\s*:\s*"([^"]+)"/,  // Standard JSON format
            /QR\d+/,                       // Direct QR code pattern
            /{"deviceId":"([^"]+)/,        // Truncated JSON start
            /"([^"]*QR\d+[^"]*)"?/        // Any QR pattern in quotes
          ];

          for (const pattern of patterns) {
            const match = cleanData.match(pattern);
            if (match) {
              extractedDeviceId = match[1] || match[0];
              console.log('🔧 Extracted device ID with pattern:', pattern.source, '→', extractedDeviceId);
              break;
            }
          }

          // Clean up the extracted ID (remove any JSON artifacts)
          if (extractedDeviceId.includes('{') || extractedDeviceId.includes('"')) {
            const cleanMatch = extractedDeviceId.match(/QR\d+/);
            if (cleanMatch) {
              extractedDeviceId = cleanMatch[0];
              console.log('🧹 Cleaned device ID:', extractedDeviceId);
            }
          }

          // Create basic device info for truncated QR codes
          deviceInfo = {
            deviceId: extractedDeviceId,
            deviceName: `GPS Tracker ${extractedDeviceId}`,
            deviceType: 'GPS Tracker',
            manufacturer: 'Unknown',
            model: 'Unknown',
            status: 'unknown',
            scannedAt: new Date().toISOString(),
            scannedBy: userData?.username || 'Unknown',
            rawData: cleanData,
            // Add default GPS coordinates for QR-to-Postman tracking
            latitude: 14.4673,  // Default coordinates for testing
            longitude: 78.8242,
            accuracy: 10
          };
          console.log('📝 Created basic device info:', deviceInfo);
        }
      }

      // Enhance device info with additional details
      const enhancedDeviceInfo = {
        ...deviceInfo,
        scannedAt: new Date().toISOString(),
        scannedBy: userData.username,
        scanLocation: 'GPS Tracker App',

        // Add default fields if missing
        deviceId: deviceInfo.deviceId || deviceInfo.id || `DEV-${Date.now()}`,
        deviceName: deviceInfo.deviceName || deviceInfo.name || 'Unknown Device',
        deviceType: deviceInfo.deviceType || deviceInfo.type || 'GPS Tracker',
        status: deviceInfo.status || 'active',
        assignedTo: deviceInfo.assignedTo || deviceInfo.owner || 'Unknown',

        // Location and tracking info
        lastLocation: deviceInfo.lastLocation || 'Location not available',
        batteryLevel: deviceInfo.batteryLevel || 'Unknown',
        signalStrength: deviceInfo.signalStrength || 'Unknown',

        // Timestamps
        generatedAt: deviceInfo.generatedAt || 'Unknown',
        validUntil: deviceInfo.validUntil || 'No expiration',
        lastUpdated: deviceInfo.lastUpdated || new Date().toISOString(),

        // Additional metadata
        firmwareVersion: deviceInfo.firmwareVersion || 'Unknown',
        serialNumber: deviceInfo.serialNumber || 'Unknown',
        manufacturer: deviceInfo.manufacturer || 'ADDWISE',
        model: deviceInfo.model || 'GPS Tracker Pro',

        // Security and access
        accessLevel: deviceInfo.accessLevel || 'Standard',
        permissions: deviceInfo.permissions || ['view', 'track'],

        // Raw data for debugging
        rawQRData: data
      };

      // Store the scanned device details
      setScannedDeviceDetails(enhancedDeviceInfo);

      // Show the device details modal
      setShowScannedDeviceModal(true);

      // Save to scan history
      const scanHistory = JSON.parse(localStorage.getItem('qrScanHistory') || '[]');
      scanHistory.unshift({
        ...enhancedDeviceInfo,
        scanId: `SCAN-${Date.now()}`,
        scannedAt: new Date().toISOString()
      });

      // Keep only last 50 scans
      if (scanHistory.length > 50) {
        scanHistory.splice(50);
      }

      localStorage.setItem('qrScanHistory', JSON.stringify(scanHistory));

      // 🔴 NEW: Start QR-to-Postman Path Tracking (with error handling)
      try {
        if (enhancedDeviceInfo && enhancedDeviceInfo.deviceId) {
          console.log('🗺️ QR-to-Postman path tracking available for device:', enhancedDeviceInfo.deviceId);
          console.log('📍 Device info:', enhancedDeviceInfo);

          // Store device info for QR-to-Postman tracking (GPS will be added when button is clicked)
          const deviceTrackingInfo = {
            deviceId: enhancedDeviceInfo.deviceId,
            deviceName: enhancedDeviceInfo.deviceName || `Device ${enhancedDeviceInfo.deviceId}`,
            timestamp: enhancedDeviceInfo.scannedAt || new Date().toISOString(),
            scannedBy: enhancedDeviceInfo.scannedBy || userData?.username || 'Unknown',
            hasGPS: !!(enhancedDeviceInfo.latitude && enhancedDeviceInfo.longitude)
          };

          console.log('✅ QR-to-Postman tracking ready for device:', deviceTrackingInfo);

          // Store for later use when button is clicked
          setScannedDeviceDetails(prev => ({
            ...prev,
            qrToPostmanReady: true,
            trackingInfo: deviceTrackingInfo
          }));

          // 🚀 AUTO-OPEN QR-to-Postman tracker after 2 seconds
          setTimeout(() => {
            console.log('🚀 Auto-opening QR-to-Postman tracker...');

            // Create QR scan location data
            const qrScanLocation = {
              latitude: enhancedDeviceInfo.latitude || 14.4673,  // Use QR location or default
              longitude: enhancedDeviceInfo.longitude || 78.8242,
              timestamp: new Date().toISOString(),
              deviceName: enhancedDeviceInfo.deviceName || 'Unknown Device',
              scannedBy: userData?.username || 'Unknown'
            };

            // Extract clean device ID
            let cleanDeviceId = enhancedDeviceInfo.deviceId;
            if (typeof cleanDeviceId === 'object' && cleanDeviceId.deviceId) {
              cleanDeviceId = cleanDeviceId.deviceId;
            }

            console.log('🗺️ Opening tracker with:', { qrScanLocation, cleanDeviceId });

            // Set data and open tracker
            setQrScanLocationData(qrScanLocation);
            setTrackedDeviceId(cleanDeviceId);
            setShowQRToPostmanTracker(true);
            setShowScannedDeviceModal(false);
          }, 2000);
        }
      } catch (pathTrackingError) {
        console.error('❌ Error setting up QR-to-Postman tracking:', pathTrackingError);
      }

    } catch (error) {
      console.error('❌ Error processing QR code data:', error);
      setScanError(`Invalid QR code format: ${error.message}`);

      // Still try to show something useful
      setScannedDeviceDetails({
        deviceId: 'UNKNOWN',
        deviceName: 'Unknown Device',
        status: 'error',
        errorMessage: error.message,
        rawQRData: data,
        scannedAt: new Date().toISOString(),
        scannedBy: userData.username
      });
      setShowScannedDeviceModal(true);
    }
  };

  const handleCloseScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setShowQRScanner(false);
    setScanResult(null);
    setScanError(null);
  };

  // Handle QR code image upload with better detection
  const handleQRImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show loading state
    alert('📁 Processing QR code image... Please wait.');

    try {
      console.log('📁 Processing uploaded QR image:', file.name);

      // Method 1: Try Html5Qrcode.scanFile
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const result = await Html5Qrcode.scanFile(file, true);

        console.log('✅ QR Code detected from uploaded image:', result);

        // Set scan result and trigger the same flow as camera scanning
        setScanResult(result);
        handleQRCodeData(result);

        alert('✅ QR Code successfully read from image!');
        return;

      } catch (scanError) {
        console.log('Method 1 failed, trying alternative methods...');
      }

      // Method 2: Try with different Html5Qrcode configuration
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const result = await Html5Qrcode.scanFile(file, false); // Try without verbose

        console.log('✅ QR Code detected (method 2):', result);
        setScanResult(result);
        handleQRCodeData(result);
        alert('✅ QR Code successfully read from image!');
        return;

      } catch (scanError2) {
        console.log('Method 2 failed, trying canvas method...');
      }

      // Method 3: Canvas-based processing with jsQR library
      await processImageWithJsQR(file);

    } catch (error) {
      console.error('❌ All methods failed:', error);
      alert('❌ Could not read QR code from this image. Please try:\n• A clearer image\n• Better lighting\n• Less rotation/distortion\n• Or use camera scan instead');
    }

    // Reset the input
    event.target.value = '';
  };

  // Enhanced canvas-based QR processing with jsQR
  const processImageWithJsQR = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = async () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Try to use jsQR library if available
          try {
            // Import jsQR dynamically
            const jsQR = await import('jsqr').then(module => module.default);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
              console.log('✅ QR Code detected with jsQR:', code.data);
              setScanResult(code.data);
              handleQRCodeData(code.data);
              alert('✅ QR Code successfully read from image!');
              resolve(code.data);
              return;
            }
          } catch (jsQRError) {
            console.log('jsQR not available, trying manual processing...');
          }

          // Try different image processing techniques
          await tryImageEnhancements(canvas, ctx, imageData);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Try different image enhancement techniques
  const tryImageEnhancements = async (canvas, ctx, originalImageData) => {
    const techniques = [
      // Original image
      () => originalImageData,

      // Increase contrast
      () => {
        const data = new Uint8ClampedArray(originalImageData.data);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.5);     // Red
          data[i + 1] = Math.min(255, data[i + 1] * 1.5); // Green
          data[i + 2] = Math.min(255, data[i + 2] * 1.5); // Blue
        }
        return new ImageData(data, originalImageData.width, originalImageData.height);
      },

      // Convert to grayscale and increase contrast
      () => {
        const data = new Uint8ClampedArray(originalImageData.data);
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          const enhanced = gray > 128 ? 255 : 0; // High contrast
          data[i] = enhanced;     // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
        }
        return new ImageData(data, originalImageData.width, originalImageData.height);
      }
    ];

    // Try each enhancement technique
    for (let i = 0; i < techniques.length; i++) {
      try {
        const enhancedImageData = techniques[i]();

        // Try with html5-qrcode on enhanced image
        try {
          // Put enhanced image back on canvas
          ctx.putImageData(enhancedImageData, 0, 0);

          // Convert canvas to blob and try scanning again
          canvas.toBlob(async (blob) => {
            try {
              const { Html5Qrcode } = await import('html5-qrcode');
              const file = new File([blob], 'enhanced.png', { type: 'image/png' });
              const result = await Html5Qrcode.scanFile(file, true);

              console.log(`✅ QR Code detected with enhancement technique ${i + 1}:`, result);
              setScanResult(result);
              handleQRCodeData(result);
              alert('✅ QR Code successfully read from enhanced image!');
              return;

            } catch (enhancedScanError) {
              console.log(`Enhancement technique ${i + 1} failed`);
            }
          }, 'image/png');

        } catch (enhancementError) {
          console.log(`Enhancement technique ${i + 1} processing failed`);
        }

      } catch (techniqueError) {
        console.log(`Enhancement technique ${i + 1} failed:`, techniqueError);
      }
    }

    // If all techniques fail, ask for manual input
    setTimeout(() => {
      const userInput = prompt('Could not automatically read QR code. Please enter the code manually:');
      if (userInput && userInput.trim()) {
        setScanResult(userInput.trim());
        handleQRCodeData(userInput.trim());
      } else {
        alert('❌ QR code reading cancelled.');
      }
    }, 1000);
  };

  const renderDashboardContent = () => {
    if (!userData) return null;

    // Get recent login history for current user
    const loginHistory = JSON.parse(localStorage.getItem('loginHistory')) || [];
    const userLogins = loginHistory
      .filter(login => login.email === userData.email)
      .slice(-5)
      .reverse();

    return (
      <div className="dashboard-content">
        {/* Welcome Card */}
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-2">
                  Welcome, {userData.firstName}!
                  <span className={`badge bg-${getRoleBadgeColor(userData.role)} ms-2`}>
                    {getRoleIcon(userData.role)} {getRoleDisplay(userData.role)}
                  </span>
                </h4>
                <p className="text-muted mb-0">
                  Account Status: <span className="badge bg-success">Active</span>
                </p>
              </div>
              <div className="text-end">
                <small className="text-muted">
                  Last login: {userLogins[0]?.timestamp ? 
                    new Date(userLogins[0].timestamp).toLocaleString() : 
                    'First time login'}
                </small>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Row className="g-3">
          {/* QR Code System Overview or Recent Logins */}
          <Col lg={8}>
            {(userData.role === 'admin' || userData.role === 'superadmin') ? (
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">🔲 QR Code System Overview</h5>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowQRManagementModal(true)}
                    >
                      Manage QR Codes
                    </Button>
                  </div>

                  <Row className="g-3">
                    <Col md={3}>
                      <Card className="border-secondary">
                        <Card.Body className="text-center">
                          <h3 className="text-secondary">{generatedQRCodes.length}</h3>
                          <small className="text-muted">Total QR Codes</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="border-success">
                        <Card.Body className="text-center">
                          <h3 className="text-success">{generatedQRCodes.filter(qr => qr.status === 'available').length}</h3>
                          <small className="text-muted">Available</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="border-warning">
                        <Card.Body className="text-center">
                          <h3 className="text-warning">{generatedQRCodes.filter(qr => qr.status === 'assigned').length}</h3>
                          <small className="text-muted">Assigned</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="border-info">
                        <Card.Body className="text-center">
                          <h3 className="text-info">{generatedQRCodes.filter(qr => qr.status === 'active').length}</h3>
                          <small className="text-muted">Active</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <div className="mt-4">
                    <h6>Recent QR Code Activity</h6>
                    {generatedQRCodes.length === 0 ? (
                      <div className="text-center py-4">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔲</div>
                        <p className="text-muted">No QR codes generated yet</p>
                        <Button variant="primary" onClick={() => setShowQRGenerationModal(true)}>
                          Generate First QR Codes
                        </Button>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover size="sm">
                          <thead>
                            <tr>
                              <th>QR Code</th>
                              <th>Status</th>
                              <th>Assigned To</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedQRCodes.slice(0, 5).map((qr) => (
                              <tr key={qr.id}>
                                <td><code style={{ fontSize: '0.8rem' }}>{getDisplayCode(qr)}</code></td>
                                <td>
                                  <Badge bg={
                                    qr.status === 'available' ? 'success' :
                                    qr.status === 'assigned' ? 'warning' : 'info'
                                  } size="sm">
                                    {qr.status}
                                  </Badge>
                                </td>
                                <td>{qr.assignedTo || '-'}</td>
                                <td>{new Date(qr.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="mb-4">Recent Login History</h5>
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Device</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userLogins.map((login, index) => (
                          <tr key={index}>
                            <td>{new Date(login.timestamp).toLocaleString()}</td>
                            <td>📱 {login.device || 'Unknown Device'}</td>
                            <td><span className="badge bg-success">Success</span></td>
                          </tr>
                        ))}
                        {userLogins.length === 0 && (
                          <tr>
                            <td colSpan="3" className="text-center text-muted">
                              No login history available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Quick Actions */}
          <Col lg={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-4">Quick Actions</h5>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setActiveTab('profile')}
                    className="d-flex align-items-center justify-content-start p-3"
                  >
                    <span className="me-2">👤</span>
                    <div className="text-start">
                      <div>View Profile</div>
                      <small className="text-muted">Update your information</small>
                    </div>
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={() => setActiveTab('settings')}
                    className="d-flex align-items-center justify-content-start p-3"
                  >
                    <span className="me-2">⚙️</span>
                    <div className="text-start">
                      <div>Security Settings</div>
                      <small className="text-muted">Manage security</small>
                    </div>
                  </Button>
                  <Button
                    variant="outline-success"
                    onClick={() => {
                      console.log('🧪 Dashboard QR Test button clicked');
                      const testQRData = JSON.stringify({
                        deviceId: "TEST-DASHBOARD-" + Date.now(),
                        deviceName: "Test Device from Dashboard",
                        assignedTo: userData.username,
                        generatedAt: new Date().toISOString(),
                        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        status: "approved"
                      });
                      console.log('🧪 Test QR Data:', testQRData);
                      handleViewQRCode(testQRData);
                    }}
                    className="d-flex align-items-center justify-content-start p-3"
                  >
                    <span className="me-2">🔍</span>
                    <div className="text-start">
                      <div>Test QR Code</div>
                      <small className="text-muted">Debug QR modal</small>
                    </div>
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderSettingsContent = () => {
    if (!userData) return null;

    return (
      <div className="dashboard-content">
        <h2>Settings</h2>
        <Row>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">Security Settings</h5>
                <div className="d-grid gap-2">
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    🔒 Change Password
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    🗑️ Delete Account
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">Privacy Settings</h5>
                <p className="text-muted">Manage your privacy preferences and data settings.</p>
                <div className="d-grid gap-2 mt-3">
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={() => {
                      const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
                      const dataStr = `Account Information Export:
Username: ${userData.username}
Email: ${userData.email}
Name: ${userData.firstName} ${userData.lastName}
Role: ${userData.role}
Company: ${userData.company || 'Not specified'}
Phone: ${userData.phone || 'Not specified'}
Account Created: ${new Date(userData.signupTime).toLocaleString()}
Last Updated: ${userData.lastUpdated ? new Date(userData.lastUpdated).toLocaleString() : 'Never'}

Exported on: ${new Date().toLocaleString()}`;

                      const dataBlob = new Blob([dataStr], {type: 'text/plain'});
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `account_data_${userData.username}.txt`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    📄 Export My Data
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem('loginHistory');
                      alert('Login history cleared successfully!');
                    }}
                  >
                    🧹 Clear Login History
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Password Change Modal */}
        <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Change Password</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {passwordError && <Alert variant="danger">{passwordError}</Alert>}
            {passwordSuccess && <Alert variant="success">Password updated successfully!</Alert>}
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePasswordSubmit}>
              Update Password
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Account Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Delete Account</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {deleteError && <Alert variant="danger">{deleteError}</Alert>}
            <Alert variant="warning">
              <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
            </Alert>
            <Form>
              <Form.Group>
                <Form.Label>Enter your password to confirm deletion</Form.Label>
                <Form.Control
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter password"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  };

  // NEW SYSTEM: Render My Devices page with QR code system
  const renderMyDevicesContent = useCallback(() => {
    if (!userData) return null;

    // 🔒 SECURITY: Filter QR codes based on user permissions
    const userQRCodes = generatedQRCodes.filter(qr => qr.assignedTo === userData.username);
    const availableQRCodes = generatedQRCodes.filter(qr => qr.status === 'available');

    // Only show QR codes the user is authorized to see
    const allQRCodes = generatedQRCodes.filter(qr => canViewQRCode(qr));

    return (
      <div className="dashboard-content">
        <h2>🔲 All QR Codes & My Devices</h2>
        <p className="text-muted">View all QR codes in the system and manage your assigned devices</p>

        {/* All QR Codes Section - Shows ALL QR codes with their status */}
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📋 All QR Codes in System</h5>
              <div className="d-flex gap-2 align-items-center">
                <Badge bg="secondary">Total: {allQRCodes.length}</Badge>
                <Badge bg="success">Available: {availableQRCodes.length}</Badge>
                <Badge bg="warning">Assigned: {generatedQRCodes.filter(qr => qr.status === 'assigned').length}</Badge>
                <Badge bg="info">Active: {generatedQRCodes.filter(qr => qr.status === 'active').length}</Badge>
                {userData && (userData.role === 'admin' || userData.role === 'superadmin') && allQRCodes.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => {
                      if (window.confirm(`⚠️ DELETE ALL ${allQRCodes.length} QR CODES?\n\nThis cannot be undone!`)) {
                        localStorage.removeItem('generatedQRCodes');
                        setGeneratedQRCodes([]);
                        alert('All QR codes deleted!');
                      }
                    }}
                  >
                    🗑️ Delete All
                  </Button>
                )}
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            {allQRCodes.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔲</div>
                <h4>No QR Codes Available</h4>
                <p className="text-muted">No QR codes have been generated yet.</p>
                <small className="text-muted">Contact admin to generate QR codes for devices</small>
              </div>
            ) : (
              <Row>
                {allQRCodes.map((qr) => (
                  <Col md={4} lg={3} key={qr.id} className="mb-3">
                    <Card className={`h-100 ${
                      qr.status === 'available' ? 'border-success' :
                      qr.status === 'assigned' && qr.assignedTo === userData.username ? 'border-primary' :
                      qr.status === 'assigned' ? 'border-warning' : 'border-info'
                    }`}>
                      <Card.Body className="text-center">
                        {/* Actual QR Code Image */}
                        <div
                          style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 1rem',
                            border: '2px solid #dee2e6',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ffffff',
                            overflow: 'hidden'
                          }}
                        >
                          {canViewQRCode(qr) && qr.qrCodeImage ? (
                            <img
                              src={qr.qrCodeImage}
                              alt={`QR Code ${qr.code}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                              }}
                            />
                          ) : canViewQRCode(qr) ? (
                            <div style={{ fontSize: '1.5rem', color: '#6c757d' }}>🔲</div>
                          ) : (
                            <div style={{ fontSize: '1.5rem', color: '#6c757d' }}>🔒</div>
                          )}
                        </div>

                        <h6 className="mb-2">Device QR</h6>
                        <div className="mb-2">
                          <code style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                            {getDisplayCode(qr)}
                          </code>
                        </div>

                        <Badge
                          bg={
                            qr.status === 'available' ? 'success' :
                            qr.status === 'assigned' && qr.assignedTo === userData.username ? 'primary' :
                            qr.status === 'assigned' ? 'warning' : 'info'
                          }
                          className="mb-2"
                        >
                          {qr.status === 'assigned' && qr.assignedTo === userData.username ? 'MY DEVICE' : qr.status.toUpperCase()}
                        </Badge>

                        {qr.assignedTo && qr.assignedTo !== userData.username && (
                          <div className="mb-2">
                            <small className="text-muted">Assigned to: {qr.assignedTo}</small>
                          </div>
                        )}

                        {qr.deviceDetails && (
                          <div className="mb-2">
                            <small className="text-muted">Device:</small><br/>
                            <strong style={{ fontSize: '0.8rem' }}>{qr.deviceDetails.deviceName}</strong>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="d-grid gap-1">
                          {canViewQRCode(qr) && (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => viewQRCode(qr)}
                              className="mb-1"
                            >
                              🔍 View QR Code
                            </Button>
                          )}

                          {qr.status === 'available' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => {
                                setSelectedQRForAssignment(qr);
                                setShowDeviceAssignmentModal(true);
                              }}
                            >
                              📱 Assign My Device
                            </Button>
                          )}

                          {qr.assignedTo === userData.username && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => startEnhancedGPSTracking({
                                  id: qr.id,
                                  name: qr.deviceDetails?.deviceName,
                                  qrCode: JSON.stringify(qr),
                                  model: qr.deviceDetails?.deviceModel,
                                  type: qr.deviceDetails?.deviceType
                                })}
                              >
                                🌍 GPS Track
                              </Button>
                              {canScanQRCode(qr) && (
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  onClick={() => handleQRCodeScan(qr.code)}
                                >
                                  📱 Quick Scan
                                </Button>
                              )}
                            </>
                          )}

                          {qr.status === 'assigned' && qr.assignedTo !== userData.username && (
                            <Button size="sm" variant="outline-secondary" disabled>
                              🔒 Assigned to Other User
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* My Assigned Devices Section */}
        <Card>
          <Card.Header>
            <h5 className="mb-0">📱 My Assigned Devices</h5>
          </Card.Header>
          <Card.Body>
            {userQRCodes.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📱</div>
                <h4>No Devices Assigned</h4>
                <p className="text-muted">You haven't assigned any devices to QR codes yet.</p>
                <p className="text-muted">Choose an available QR code above to assign your device.</p>
              </div>
            ) : (
              <Row>
                {userQRCodes.map((qr) => (
                  <Col md={6} lg={4} key={qr.id} className="mb-4">
                    <Card className="h-100 shadow-sm border-primary">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5 className="card-title">{qr.deviceDetails?.deviceName}</h5>
                          <Badge bg={qr.status === 'active' ? 'success' : 'warning'}>
                            {qr.status}
                          </Badge>
                        </div>

                        <div className="mb-3">
                          <small className="text-muted">QR Code:</small>
                          <div><code>{qr.code}</code></div>
                        </div>

                        <p className="text-muted mb-2">
                          <strong>Model:</strong> {qr.deviceDetails?.deviceModel || 'Not specified'}
                        </p>
                        <p className="text-muted mb-2">
                          <strong>Type:</strong> {qr.deviceDetails?.deviceType || 'Not specified'}
                        </p>
                        <p className="text-muted mb-2">
                          <strong>Serial:</strong> {qr.deviceDetails?.serialNumber || 'Not specified'}
                        </p>
                        <p className="text-muted mb-3">
                          <strong>Assigned:</strong> {new Date(qr.assignedAt).toLocaleDateString()}
                        </p>

                        <div className="d-grid gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => startEnhancedGPSTracking({
                              id: qr.id,
                              name: qr.deviceDetails?.deviceName,
                              qrCode: JSON.stringify(qr),
                              model: qr.deviceDetails?.deviceModel,
                              type: qr.deviceDetails?.deviceType
                            })}
                          >
                            🌍 Start GPS Tracking
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            className="ms-1"
                            onClick={() => startRealTimeTracking({
                              id: qr.id,
                              name: qr.deviceDetails?.deviceName,
                              qrCode: JSON.stringify(qr),
                              model: qr.deviceDetails?.deviceModel,
                              type: qr.deviceDetails?.deviceType
                            })}
                          >
                            🗺️ Real-Time Path
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {
                              // Simulate QR scan for this device
                              handleQRCodeScan(qr.code);
                            }}
                          >
                            📱 Quick Scan & Track
                          </Button>
                        </div>

                        {qr.lastScanned && (
                          <div className="mt-2">
                            <small className="text-muted">
                              Last scanned: {new Date(qr.lastScanned).toLocaleString()}
                            </small>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  }, [userData, generatedQRCodes, startEnhancedGPSTracking, handleQRCodeScan, canViewQRCode, getDisplayCode, canScanQRCode, viewQRCode]);

  // NEW SYSTEM: Render Device Status page - QR Code Assignment Status
  const renderDeviceStatusContent = useCallback(() => {
    if (!userData) return null;

    // Get user's assigned QR codes
    const userQRCodes = generatedQRCodes.filter(qr => qr.assignedTo === userData.username);

    return (
      <div className="dashboard-content">
        <h2>📱 My Device Status</h2>
        <p className="text-muted">View the status and details of your assigned devices</p>

        {userQRCodes.length === 0 ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📱</div>
              <h4>No Devices Assigned</h4>
              <p className="text-muted">You haven't assigned any devices to QR codes yet.</p>
              <p className="text-muted">Go to "My Devices" to assign your device to an available QR code.</p>
              <Button
                variant="primary"
                onClick={() => setActiveTab('my-devices')}
              >
                View Available QR Codes
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>QR Code</th>
                    <th>Device Name</th>
                    <th>Device Model</th>
                    <th>Device Type</th>
                    <th>Serial Number</th>
                    <th>Status</th>
                    <th>GPS Location</th>
                    <th>Assigned Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userQRCodes.map((qr) => (
                    <tr key={qr.id}>
                      <td>
                        <code style={{ fontSize: '0.8rem' }}>{qr.code}</code>
                      </td>
                      <td><strong>{qr.deviceDetails?.deviceName || 'N/A'}</strong></td>
                      <td>{qr.deviceDetails?.deviceModel || 'Not specified'}</td>
                      <td>{qr.deviceDetails?.deviceType || 'Not specified'}</td>
                      <td>{qr.deviceDetails?.serialNumber || 'Not specified'}</td>
                      <td>
                        <Badge bg={qr.status === 'active' ? 'success' : 'warning'}>
                          {qr.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        {deviceLocations[qr.id] ? (
                          <div>
                            <Badge bg="success" className="mb-1">📍 Live GPS</Badge><br />
                            <small>
                              <strong>Coordinates:</strong><br />
                              {deviceLocations[qr.id].location.latitude.toFixed(6)}, {deviceLocations[qr.id].location.longitude.toFixed(6)}<br />
                              <strong>Accuracy:</strong> {deviceLocations[qr.id].location.accuracy}m<br />
                              {deviceLocations[qr.id].location.address && (
                                <>
                                  <strong>Address:</strong><br />
                                  {deviceLocations[qr.id].location.address.substring(0, 50)}...<br />
                                </>
                              )}
                              <span className="text-muted">
                                Updated: {new Date(deviceLocations[qr.id].timestamp).toLocaleString()}
                              </span>
                            </small>
                          </div>
                        ) : qr.lastScanned ? (
                          <div>
                            <Badge bg="info" className="mb-1">📍 Last Scanned</Badge><br />
                            <small className="text-muted">
                              {new Date(qr.lastScanned).toLocaleString()}
                            </small>
                          </div>
                        ) : (
                          <div>
                            <Badge bg="secondary">No GPS Data</Badge><br />
                            <small className="text-muted">Scan QR code to start tracking</small>
                          </div>
                        )}
                      </td>
                      <td>{new Date(qr.assignedAt).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {canViewQRCode(qr) && (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => viewQRCode(qr)}
                            >
                              🔍 View QR
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => startEnhancedGPSTracking({
                              id: qr.id,
                              name: qr.deviceDetails?.deviceName,
                              qrCode: JSON.stringify(qr),
                              model: qr.deviceDetails?.deviceModel,
                              type: qr.deviceDetails?.deviceType
                            })}
                          >
                            🌍 GPS Track
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-info"
                            onClick={() => handleQRCodeScan(qr.code)}
                          >
                            📱 Quick Scan
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Summary Cards */}
            <Row className="mt-4">
              <Col md={4}>
                <Card className="shadow-sm border-primary">
                  <Card.Body className="text-center">
                    <h3 className="text-primary">{userQRCodes.length}</h3>
                    <p className="mb-0">Total Assigned Devices</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm border-success">
                  <Card.Body className="text-center">
                    <h3 className="text-success">{userQRCodes.filter(qr => qr.status === 'active').length}</h3>
                    <p className="mb-0">Active Devices</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm border-info">
                  <Card.Body className="text-center">
                    <h3 className="text-info">{userQRCodes.filter(qr => qr.lastScanned).length}</h3>
                    <p className="mb-0">Recently Scanned</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Help Section */}
            <Row className="mt-4">
              <Col md={6}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <h5>📱 How to Use Your Devices</h5>
                    <ul className="mb-0">
                      <li>Scan the QR code to start GPS tracking</li>
                      <li>Use "GPS Track" for enhanced location monitoring</li>
                      <li>View QR codes to download or print them</li>
                      <li>Check GPS location status in real-time</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <h5>🆘 Need Help?</h5>
                    <p>If you have questions about your devices or QR codes, contact support.</p>
                    <Button variant="outline-primary" size="sm" onClick={() => setActiveTab('contact')}>
                      Contact Support
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    );
  }, [userData, generatedQRCodes, deviceLocations, viewQRCode, startEnhancedGPSTracking, handleQRCodeScan, setActiveTab, canViewQRCode]);

  // Render Help Center content
  const renderHelpContent = useCallback(() => {
    return (
      <div className="dashboard-content">
        <h2>Help Center</h2>
        <Row>
          <Col md={8}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">Frequently Asked Questions</h5>
                <Accordion>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>How do I request a new device?</Accordion.Header>
                    <Accordion.Body>
                      Go to <strong>Devices → Quick Actions</strong> and click "Request Device". Fill out the form with device details and submit. An admin will review and approve your request.
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>How do I check my device status?</Accordion.Header>
                    <Accordion.Body>
                      Navigate to <strong>Devices → Device Status</strong> to see all your device requests with their current status (Pending, Approved, or Rejected).
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>How do I scan QR codes?</Accordion.Header>
                    <Accordion.Body>
                      Go to <strong>Devices → Quick Actions</strong> and click "Scan QR Code". Allow camera access and point your camera at the QR code to scan it.
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="3">
                    <Accordion.Header>How do I update my profile?</Accordion.Header>
                    <Accordion.Body>
                      Visit <strong>My Account → View Profile</strong> and click the "Edit Profile" button to update your information.
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="4">
                    <Accordion.Header>How do I change my password?</Accordion.Header>
                    <Accordion.Body>
                      Go to <strong>My Account → Account Settings</strong> and click "Change Password" to update your password securely.
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">Quick Help</h5>
                <div className="d-grid gap-2">
                  <Button variant="outline-primary" onClick={handleShowContactModal}>
                    📞 Contact Support
                  </Button>
                  <Button variant="outline-success" onClick={() => setShowFeedbackModal(true)}>
                    📝 Send Feedback
                  </Button>
                  <Button variant="outline-info" onClick={handleEmailSupport}>
                    📧 Email Support
                  </Button>
                </div>
              </Card.Body>
            </Card>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-3">System Status</h5>
                <div className="d-flex align-items-center mb-2">
                  <Badge bg="success" className="me-2">●</Badge>
                  <span>All Systems Operational</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <Badge bg="success" className="me-2">●</Badge>
                  <span>QR Code Service</span>
                </div>
                <div className="d-flex align-items-center">
                  <Badge bg="success" className="me-2">●</Badge>
                  <span>Device Management</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }, []);

  // Render Contact Support content
  const renderContactContent = () => {
    return (
      <div className="dashboard-content">
        <h2>Contact Support</h2>
        <Row>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">Contact Information</h5>
                <div className="mb-3">
                  <strong>📧 Email:</strong> suman.tati2005@gmail.com
                </div>
                <div className="mb-3">
                  <strong>📞 Phone:</strong> +91 1234567890
                </div>
                <div className="mb-3">
                  <strong>🕒 Business Hours:</strong> Mon-Fri, 9:00 AM - 6:00 PM EST
                </div>
              
                <div className="mb-3">
                  <strong>⚡ Response Time:</strong> Within 24 hours
                </div>
                <Button variant="primary" onClick={handleShowContactModal}>
                  📝 Submit Support Ticket
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">Before Contacting Support</h5>
                <ul>
                  <li>Check the Help Center for common solutions</li>
                  <li>Ensure you have your username and device information ready</li>
                  <li>Include screenshots if reporting a visual issue</li>
                  <li>Describe the steps you took before encountering the problem</li>
                </ul>
                <Button variant="outline-info" onClick={() => setActiveTab('help')}>
                  📚 Visit Help Center
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Render Feedback content
  const renderFeedbackContent = () => {
    const userFeedback = JSON.parse(localStorage.getItem('userFeedback') || '[]')
      .filter(feedback => feedback.userId === userData.id);

    return (
      <div className="dashboard-content">
        <h2>Send Feedback</h2>
        <Row>
          <Col md={8}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">We Value Your Feedback</h5>
                <p className="text-muted">Help us improve by sharing your thoughts and suggestions.</p>
                <Button variant="primary" onClick={() => setShowFeedbackModal(true)}>
                  📝 Submit New Feedback
                </Button>
              </Card.Body>
            </Card>

            {userFeedback.length > 0 && (
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">Your Previous Feedback</h5>
                  {userFeedback.map((feedback, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6>{feedback.subject}</h6>
                            <p className="text-muted mb-2">{feedback.message}</p>
                            <small className="text-muted">
                              Submitted: {new Date(feedback.submittedAt).toLocaleDateString()}
                            </small>
                          </div>
                          <Badge bg="info">{feedback.category}</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </Card.Body>
              </Card>
            )}
          </Col>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-3">Feedback Categories</h5>
                <ul className="list-unstyled">
                  <li className="mb-2">🐛 <strong>Bug Report</strong> - Report technical issues</li>
                  <li className="mb-2">💡 <strong>Feature Request</strong> - Suggest new features</li>
                  <li className="mb-2">📈 <strong>Improvement</strong> - Suggest enhancements</li>
                  <li className="mb-2">💬 <strong>General</strong> - General feedback</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderActionsContent = () => {
    if (!userData) return null;

    return (
      <div className="dashboard-content">
        <style>
          {`
            .quick-actions-container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 20px;
              padding: 2rem;
              margin-bottom: 2rem;
              color: white;
            }
            .action-card {
              background: rgba(255, 255, 255, 0.95);
              border-radius: 15px;
              border: none;
              transition: all 0.3s ease;
              overflow: hidden;
            }
            .action-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            }
            .action-btn {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border: none;
              border-radius: 12px;
              padding: 1.2rem 2rem;
              font-size: 1.1rem;
              font-weight: 600;
              color: white;
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
            }
            .action-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
              background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            }
            .action-btn:before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
              transition: left 0.5s;
            }
            .action-btn:hover:before {
              left: 100%;
            }
            .action-btn-secondary {
              background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            }
            .action-btn-secondary:hover {
              background: linear-gradient(135deg, #38ef7d 0%, #11998e 100%);
              box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
            }
            .action-btn-warning {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .action-btn-warning:hover {
              background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
              box-shadow: 0 8px 25px rgba(245, 87, 108, 0.4);
            }
            .action-btn-info {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }
            .action-btn-info:hover {
              background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
              box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
            }
          `}
        </style>

        <div className="quick-actions-container">
          <h2 className="mb-3">🚀 Quick Actions</h2>
          <p className="mb-0" style={{ opacity: 0.9 }}>Scan QR codes and manage your devices efficiently</p>
        </div>

        <Row>
          <Col md={6}>
            <Card className="action-card shadow-lg mb-4">
              <Card.Body style={{ padding: '2rem' }}>
                <h5 className="mb-4" style={{ color: '#333', fontWeight: 'bold' }}>📱 QR Code Actions</h5>
                <div className="d-grid gap-3">
                  <Button
                    className="action-btn w-100"
                    onClick={handleStartScan}
                  >
                    📷 Scan QR Code
                  </Button>
                  <Button
                    className="action-btn action-btn-secondary w-100"
                    onClick={() => setActiveTab('my-devices')}
                  >
                    🔲 View Available QR Codes
                  </Button>

                  <Button
                    className="action-btn action-btn-warning w-100"
                    onClick={() => document.getElementById('qr-upload-input').click()}
                  >
                    📁 Upload QR Code Image
                  </Button>
                  <input
                    id="qr-upload-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleQRImageUpload}
                  />
                  {/* Hidden div for QR processing */}
                  <div id="temp-qr-reader" style={{ display: 'none' }}></div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="action-card shadow-lg mb-4">
              <Card.Body style={{ padding: '2rem' }}>
                <h5 className="mb-4" style={{ color: '#333', fontWeight: 'bold' }}>👤 Profile Actions</h5>
                <div className="d-grid gap-3">
                  <Button
                    className="action-btn w-100"
                    onClick={() => setActiveTab('profile')}
                  >
                    👤 View Profile
                  </Button>
                  <Button
                    className="action-btn action-btn-secondary w-100"
                    onClick={() => setShowHistoryModal(true)}
                  >
                    📊 Login History
                  </Button>
                  {(userData?.role === 'admin' || userData?.role === 'superadmin') && (
                    <Button
                      variant="outline-warning"
                      size="lg"
                      onClick={async () => {
                        // Generate a test QR code for immediate testing
                        const testCode = generate16DigitCode();
                        const testDeviceInfo = {
                          deviceId: testCode,
                          deviceName: `Test GPS Tracker ${testCode.substring(0, 4)}`,
                          deviceType: 'GPS Tracker',
                          manufacturer: 'ADDWISE',
                          model: 'GPS Tracker Pro',
                          status: 'available',
                          generatedAt: new Date().toISOString(),
                          createdBy: userData.username
                        };

                        const qrImageData = await generateQRCodeImage(testCode);

                        const testQRCode = {
                          id: `TEST-QR-${Date.now()}`,
                          code: testCode,
                          deviceInfo: testDeviceInfo,
                          status: 'available',
                          createdAt: new Date().toISOString(),
                          createdBy: userData.username,
                          assignedTo: null,
                          assignedAt: null,
                          deviceDetails: testDeviceInfo,
                          lastScanned: null,
                          scanCount: 0,
                          qrCodeImage: qrImageData
                        };

                        // Add to QR codes list
                        const updatedQRCodes = [...generatedQRCodes, testQRCode];
                        localStorage.setItem('generatedQRCodes', JSON.stringify(updatedQRCodes));
                        setGeneratedQRCodes(updatedQRCodes);

                        alert(`Test QR code generated!\nCode: ${testCode}\nYou can now scan this QR code to test the scanning functionality.`);
                      }}
                      style={{
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                      }}
                    >
                      🧪 Generate Test QR
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* QR Scanner Modal */}
        <Modal show={showQRScanner} onHide={handleCloseScanner} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>📷 QR Code Scanner</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <div className="d-flex align-items-center">
                <div style={{ fontSize: '1.5rem', marginRight: '10px' }}>📱</div>
                <div>
                  <strong>How to scan:</strong>
                  <ol className="mb-0 mt-2">
                    <li>Hold your mobile device with the QR code in front of the camera</li>
                    <li>Make sure the QR code is well-lit and clearly visible</li>
                    <li>Keep the QR code steady within the camera frame</li>
                    <li>Wait for the scanner to detect and process the QR code</li>
                  </ol>
                </div>
              </div>
            </Alert>

            {scanError && (
              <Alert variant="danger">
                <strong>❌ Scanning Error:</strong> {scanError}
                <br />
                <small>Try adjusting lighting, distance, or QR code angle.</small>
              </Alert>
            )}

            {scanResult && (
              <Alert variant="success">
                <strong>✅ QR Code Detected:</strong> {scanResult.substring(0, 100)}
                {scanResult.length > 100 && '...'}
                <br />
                <small>Processing device information...</small>
              </Alert>
            )}

            <Card>
              <Card.Header>
                <h6 className="mb-0">📷 Camera View</h6>
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                <div id="qr-reader" style={{ width: '100%', minHeight: '300px' }}></div>
              </Card.Body>
            </Card>

            <div className="mt-3">
              <small className="text-muted">
                <strong>💡 Tips:</strong>
                <ul className="mb-0 mt-1">
                  <li>Ensure good lighting conditions</li>
                  <li>Hold the QR code 6-12 inches from the camera</li>
                  <li>Make sure the QR code is not damaged or blurry</li>
                  <li>Try different angles if scanning fails</li>
                </ul>
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="d-flex justify-content-between w-100">
              <div>
                <small className="text-muted">
                  📱 Point your camera at the QR code on your mobile device
                </small>
              </div>
              <Button variant="secondary" onClick={handleCloseScanner}>
                Close Scanner
              </Button>
            </div>
          </Modal.Footer>
        </Modal>

        {/* Login History Modal */}
        <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Login History</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Device</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((login, index) => (
                  <tr key={index}>
                    <td>{formatDate(login.timestamp)}</td>
                    <td>{login.device || 'Unknown Device'}</td>
                    <td><Badge bg="success">Success</Badge></td>
                  </tr>
                ))}
                {loginHistory.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center text-muted">
                      No login history available
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  };

  const renderProfileContent = () => {
    if (!userData) return null;

    const profileFields = [
      {
        label: 'Username',
        value: userData.username,
        icon: '👤',
        editable: false
      },
      {
        label: 'Email',
        value: userData.email,
        icon: '📧',
        editable: true,
        type: 'email',
        name: 'email'
      },
      {
        label: 'First Name',
        value: userData.firstName,
        icon: '👨',
        editable: true,
        type: 'text',
        name: 'firstName'
      },
      {
        label: 'Last Name',
        value: userData.lastName,
        icon: '👨',
        editable: true,
        type: 'text',
        name: 'lastName'
      },
      {
        label: 'Role',
        value: getRoleDisplay(userData.role),
        icon: '🎭',
        editable: false
      },
      {
        label: 'Company',
        value: userData.company || 'Not specified',
        icon: '🏢',
        editable: true,
        type: 'text',
        name: 'company'
      },
      {
        label: 'Phone',
        value: userData.phone || 'Not specified',
        icon: '📱',
        editable: true,
        type: 'tel',
        name: 'phone'
      },
      {
        label: 'Account Created',
        value: new Date(userData.signupTime).toLocaleString(),
        icon: '📅',
        editable: false
      },
      {
        label: 'Last Updated',
        value: userData.lastUpdated ? new Date(userData.lastUpdated).toLocaleString() : 'Never',
        icon: '🔄',
        editable: false
      }
    ];

    return (
      <div className="dashboard-content">
        <div className="profile-header mb-4 d-flex justify-content-between align-items-center">
          <div>
            <h2>My Profile</h2>
            <p className="text-muted">View and manage your account information</p>
          </div>
          <div className="d-flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="primary"
                  onClick={handleEditClick}
                  style={{
                    backgroundColor: '#4a148c',
                    border: 'none',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '25px'
                  }}
                >
                  ✏️ Edit Profile
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowHistoryModal(true)}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '25px'
                  }}
                >
                  📋 Login History
                </Button>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={handleCancelEdit}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '25px'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveProfile}
                  style={{
                    backgroundColor: '#4a148c',
                    border: 'none',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '25px'
                  }}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {editSuccess && (
          <Alert variant="success" className="mb-4">
            Profile updated successfully!
          </Alert>
        )}

        {editError && (
          <Alert variant="danger" className="mb-4">
            {editError}
          </Alert>
        )}

        <Row>
          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Body className="text-center">
                <div className="profile-avatar mb-3" style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#4a148c',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  margin: '0 auto',
                  marginBottom: '1rem'
                }}>
                  {userData.firstName?.[0]?.toUpperCase() || userData.username?.[0]?.toUpperCase()}
                </div>
                <h4 className="mb-1">{userData.firstName} {userData.lastName}</h4>
                <p className="text-muted mb-3">{getRoleDisplay(userData.role)}</p>
                {!isEditing && (
                  <Button
                    variant="outline-primary"
                    className="w-100"
                    onClick={handleEditClick}
                  >
                    Edit Profile
                  </Button>
                )}
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-3">Account Status</h5>
                <div className="d-flex align-items-center mb-3">
                  <div className="status-indicator me-2" style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#28a745'
                  }}></div>
                  <span>Active</span>
                </div>
                <div className="text-muted small">
                  <p className="mb-1">Member since: {new Date(userData.signupTime).toLocaleDateString()}</p>
                  {userData.lastUpdated && (
                    <p className="mb-0">Last updated: {new Date(userData.lastUpdated).toLocaleDateString()}</p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-4">Personal Information</h5>
                <div className="profile-details">
                  {profileFields.map((field, index) => (
                    <div key={index} className="profile-field mb-4">
                      <div className="d-flex align-items-center mb-2">
                        <span className="field-icon me-2" style={{ fontSize: '1.2rem' }}>
                          {field.icon}
                        </span>
                        <h6 className="mb-0" style={{ color: '#666' }}>{field.label}</h6>
                      </div>
                      {isEditing && field.editable ? (
                        <Form.Control
                          type={field.type}
                          name={field.name}
                          value={editedProfile[field.name]}
                          onChange={handleInputChange}
                          style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}
                        />
                      ) : (
                        <div className="field-value" style={{
                          padding: '0.75rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #e9ecef'
                        }}>
                          {field.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* REMOVED: Device Request Modal (replaced by QR code system) */}

        {/* REMOVED: Old QR Code Display Modal (replaced by new QR system) */}

        {/* Contact Support Modal */}
        <Modal show={showContactModal} onHide={() => setShowContactModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Contact Support</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info">
              <strong>📞 Phone:</strong> +91 1234567890<br/>
              <strong>📧 Email:</strong> suman.tati2005@gmail.com<br/>
              <strong>🕒 Hours:</strong> Mon-Fri, 9:00 AM - 6:00 PM IST
            </Alert>
            <p>For immediate assistance, please call our support line or send an email. We typically respond within 24 hours.</p>
            <div className="d-grid gap-2">
              <Button variant="primary" onClick={handleCallSupport}>
                📞 Call Support
              </Button>
              <Button variant="outline-primary" onClick={handleEmailSupport}>
                📧 Email Support
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowContactModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Feedback Modal */}
        <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Send Feedback</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {feedbackSubmitted ? (
              <Alert variant="success">
                <h5>Thank you for your feedback!</h5>
                <p>Your feedback has been submitted successfully. We appreciate your input and will review it carefully.</p>
              </Alert>
            ) : (
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={feedbackData.category}
                    onChange={handleFeedbackChange}
                  >
                    <option value="general">💬 General Feedback</option>
                    <option value="bug">🐛 Bug Report</option>
                    <option value="feature">💡 Feature Request</option>
                    <option value="improvement">📈 Improvement Suggestion</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Subject *</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={feedbackData.subject}
                    onChange={handleFeedbackChange}
                    placeholder="Brief description of your feedback"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Message *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="message"
                    value={feedbackData.message}
                    onChange={handleFeedbackChange}
                    placeholder="Please provide detailed feedback..."
                    required
                  />
                </Form.Group>
                <small className="text-muted">* Required fields</small>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            {!feedbackSubmitted && (
              <>
                <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleFeedbackSubmit}>
                  Submit Feedback
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal>
      </div>
    );
  };

  // Admin-specific render functions
  const renderDeviceRequestsContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return <div>Access denied</div>;
    }

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>🔲 QR Code System Active</h2>
            <p className="text-muted">Device request system has been replaced with QR code assignments</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('qr-management')}
            >
              🔲 Manage QR Codes
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setActiveTab('user-management')}
            >
              👥 Manage Users
            </Button>
          </div>
        </div>

        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔄</div>
            <h4>System Updated</h4>
            <p className="text-muted">
              The device request and approval system has been replaced with a more efficient QR code system.
            </p>
            <p className="text-muted">
              Users can now directly assign their devices to available QR codes without requiring admin approval.
            </p>
            <div className="mt-4">
              <h6>New QR Code System Benefits:</h6>
              <ul className="list-unstyled text-start" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <li>✅ Instant device assignment</li>
                <li>✅ No waiting for admin approval</li>
                <li>✅ Real-time QR code generation</li>
                <li>✅ Better GPS tracking integration</li>
                <li>✅ Simplified user experience</li>
              </ul>
            </div>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => setActiveTab('qr-management')}
                className="me-2"
              >
                🔲 View QR Code Management
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Back to Dashboard
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* REMOVED: Device Request Details Modal (replaced by QR code system) */}
      </div>
    );
  };

  const renderUserActivityContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return <div>Access denied</div>;
    }

    const getActivityIcon = (icon) => {
      const iconMap = {
        'USER': 'USR',
        'DEVICE': 'DEV',
        'APPROVE': 'APP',
        'REJECT': 'REJ',
        'FEEDBACK': 'FBK'
      };
      return iconMap[icon] || 'ACT';
    };

    const getActivityColor = (status) => {
      const colorMap = {
        'completed': '#28a745',
        'pending': '#ffc107',
        'approved': '#28a745',
        'rejected': '#dc3545',
        'submitted': '#17a2b8'
      };
      return colorMap[status] || '#6c757d';
    };

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>User Activity Monitor</h2>
            <p className="text-muted">Track all user activities and system events</p>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={loadUserActivity}
          >
            Refresh
          </Button>
        </div>

        {userActivityData.length === 0 ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#f8f9fa',
                border: '3px dashed #dee2e6',
                color: '#6c757d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontWeight: 'bold'
              }}>
                ACT
              </div>
              <h4>No Activity Data</h4>
              <p className="text-muted">No user activity recorded yet.</p>
            </Card.Body>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <Card.Body>
              <div className="activity-timeline">
                {userActivityData.map((activity, index) => (
                  <div key={activity.id} className="activity-item d-flex align-items-start mb-3 pb-3" style={{
                    borderBottom: index < userActivityData.length - 1 ? '1px solid #e9ecef' : 'none'
                  }}>
                    <div
                      className="activity-icon me-3"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: getActivityColor(activity.status),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}
                    >
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="activity-content flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{activity.type}</h6>
                          <p className="mb-1 text-muted">{activity.details}</p>
                          <small className="text-muted">
                            by <strong>{activity.user}</strong> • {new Date(activity.timestamp).toLocaleString()}
                          </small>
                        </div>
                        <Badge bg={
                          activity.status === 'completed' || activity.status === 'approved' ? 'success' :
                          activity.status === 'pending' ? 'warning' :
                          activity.status === 'rejected' ? 'danger' : 'info'
                        }>
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    );
  };

  // User Management render function
  const renderUserManagementContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return <div>Access denied</div>;
    }

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>User Management</h2>
            <p className="text-muted">Manage system users and their roles</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={loadAllUsers}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateUser}
            >
              Add New User
            </Button>
          </div>
        </div>

        {userManagementSuccess && (
          <Alert variant="success" className="mb-3">
            {userManagementSuccess}
          </Alert>
        )}

        {userManagementError && (
          <Alert variant="danger" className="mb-3">
            {userManagementError}
          </Alert>
        )}

        {allUsers.length === 0 ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#f8f9fa',
                border: '3px dashed #dee2e6',
                color: '#6c757d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontWeight: 'bold'
              }}>
                USR
              </div>
              <h4>No Users Found</h4>
              <p className="text-muted">No users in the system yet.</p>
              <Button variant="primary" onClick={handleCreateUser}>
                Create First User
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{user.username}</strong>
                        {user.username === userData.username && (
                          <Badge bg="info" className="ms-2">You</Badge>
                        )}
                      </td>
                      <td>{user.email}</td>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>
                        <Badge bg={
                          user.role === 'superadmin' ? 'danger' :
                          user.role === 'admin' ? 'warning' : 'primary'
                        }>
                          {getRoleDisplay(user.role)}
                        </Badge>
                      </td>
                      <td>{user.company || 'N/A'}</td>
                      <td>
                        {user.signupTime ?
                          new Date(user.signupTime).toLocaleDateString() :
                          'N/A'
                        }
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </Button>
                          {user.username !== userData.username && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteUser(user)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
      </div>
    );
  };

  // Device Management render function
  const renderDeviceManagementContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return <div>Access denied</div>;
    }

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Device Management</h2>
            <p className="text-muted">Manage all devices in the system</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={loadAllDevices}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateDevice}
            >
              Add New Device
            </Button>
          </div>
        </div>

        {deviceManagementSuccess && (
          <Alert variant="success" className="mb-3">
            {deviceManagementSuccess}
          </Alert>
        )}

        {deviceManagementError && (
          <Alert variant="danger" className="mb-3">
            {deviceManagementError}
          </Alert>
        )}

        {allDevices.length === 0 ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#f8f9fa',
                border: '3px dashed #dee2e6',
                color: '#6c757d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontWeight: 'bold'
              }}>
                DEV
              </div>
              <h4>No Devices Found</h4>
              <p className="text-muted">No devices in the system yet.</p>
              <Button variant="primary" onClick={handleCreateDevice}>
                Add First Device
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Device Name</th>
                    <th>Model</th>
                    <th>Serial Number</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allDevices.map((device, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{device.name}</strong>
                        <br />
                        <small className="text-muted">{device.description}</small>
                      </td>
                      <td>{device.model}</td>
                      <td>{device.serialNumber}</td>
                      <td>{device.assignedTo}</td>
                      <td>
                        <Badge bg={
                          device.status === 'active' ? 'success' :
                          device.status === 'inactive' ? 'secondary' :
                          device.status === 'maintenance' ? 'warning' : 'danger'
                        }>
                          {device.status}
                        </Badge>
                      </td>
                      <td>{device.location}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleEditDevice(device)}
                          >
                            Edit
                          </Button>
                          {device.qrCode && (
                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() => handleViewQRCode(device.qrCode)}
                            >
                              QR
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDeleteDevice(device)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
      </div>
    );
  };

  // QR Code Management render function
  const renderQRManagementContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return <div>Access denied</div>;
    }

    // Get all QR codes from approved devices
    const getQRCodes = () => {
      try {
        const deviceRequests = JSON.parse(localStorage.getItem('deviceRequests') || '[]');
        const qrCodes = [];

        deviceRequests.forEach(request => {
          request.devices.forEach(device => {
            if (device.status === 'approved' && device.qrCode) {
              try {
                const qrData = JSON.parse(device.qrCode);
                qrCodes.push({
                  id: qrData.deviceId || Date.now(),
                  deviceName: device.name,
                  username: request.username,
                  qrCode: device.qrCode,
                  qrData: qrData,
                  approvedAt: device.approvedAt,
                  approvedBy: device.approvedBy,
                  purpose: device.purpose,
                  status: 'active'
                });
              } catch (error) {
                console.error('Error parsing QR code:', error);
              }
            }
          });
        });

        return qrCodes;
      } catch (error) {
        console.error('Error loading QR codes:', error);
        return [];
      }
    };

    const qrCodes = getQRCodes();

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>QR Code Management</h2>
            <p className="text-muted">View and manage all generated QR codes</p>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>

        {qrCodes.length === 0 ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#f8f9fa',
                border: '3px dashed #dee2e6',
                color: '#6c757d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontWeight: 'bold'
              }}>
                QR
              </div>
              <h4>No QR Codes Found</h4>
              <p className="text-muted">No QR codes have been generated yet.</p>
            </Card.Body>
          </Card>
        ) : (
          <Row>
            {qrCodes.map((qr, index) => (
              <Col md={6} lg={4} key={index} className="mb-4">
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <div className="text-center mb-3">
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#4a148c',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}>
                        QR
                      </div>
                    </div>

                    <h5 className="text-center mb-3">{qr.deviceName}</h5>

                    <div className="mb-2">
                      <strong>Device ID:</strong> {qr.qrData.deviceId || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Assigned To:</strong> {qr.username}
                    </div>
                    <div className="mb-2">
                      <strong>Purpose:</strong> {qr.purpose}
                    </div>
                    <div className="mb-2">
                      <strong>Generated:</strong> {new Date(qr.approvedAt).toLocaleDateString()}
                    </div>
                    <div className="mb-3">
                      <strong>Approved By:</strong> {qr.approvedBy}
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <Badge bg="success">Active</Badge>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleViewQRCode(qr.qrCode)}
                      >
                        View QR Code
                      </Button>
                    </div>

                    <div className="mt-3">
                      <small className="text-muted">
                        <strong>QR Data:</strong><br />
                        Device: {qr.qrData.deviceId}<br />
                        User: {qr.qrData.username}<br />
                        Generated: {new Date(qr.qrData.timestamp).toLocaleString()}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    );
  };

  // REMOVED: GPS Tracking Dashboard - Now available through QR scan/upload
  const renderGPSTrackingContent_REMOVED = () => {
    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>GPS Device Tracking</h2>
            <p className="text-muted">Real-time location tracking for your devices</p>
            <Badge bg="success" className="me-2">
              🗺️ Enhanced Maps with Street Details
            </Badge>
            <small className="text-muted">
              Detailed street maps with city names, roads, and multiple layer options
            </small>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {/* COMMENTED OUT: Multiple GPS modes - Using only Geoapify now */}
            {/*
            <div className="btn-group" role="group">
              <Button
                variant={gpsTrackerMode === 'embedded' ? "dark" : "outline-dark"}
                size="sm"
                onClick={() => setGpsTrackerMode('embedded')}
                title="Visual Maps - Reliable visual GPS display"
              >
                🗺️ Visual Maps
              </Button>
              <Button
                variant={gpsTrackerMode === 'mapbox' ? "success" : "outline-success"}
                size="sm"
                onClick={() => setGpsTrackerMode('mapbox')}
                title="Mapbox Maps - High quality satellite imagery"
              >
                🛰️ Mapbox
              </Button>
              <Button
                variant={gpsTrackerMode === 'enhanced' ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => setGpsTrackerMode('enhanced')}
                title="OpenStreetMap - Open source mapping"
              >
                🗺️ OpenStreetMap
              </Button>
            </div>
            */}

            {/* NEW: Enhanced GPS tracking indicator */}
            <Badge bg="success" size="lg" className="p-2">
              🗺️ Enhanced GPS with Street Maps Active
            </Badge>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={loadSavedLocations}
            >
              Refresh Locations
            </Button>
            <Button
              variant={trackingActive ? "danger" : "success"}
              size="sm"
              onClick={trackingActive ? stopDeviceTracking : () => getCurrentLocation()}
            >
              {trackingActive ? "Stop Tracking" : "Start GPS"}
            </Button>
            <Button
              variant="outline-warning"
              size="sm"
              className="ms-2"
              onClick={() => {
                const userLat = prompt('Enter correct latitude (e.g., 14.7300 for Proddatur):');
                const userLng = prompt('Enter correct longitude (e.g., 78.5500 for Proddatur):');

                if (userLat && userLng) {
                  const lat = parseFloat(userLat);
                  const lng = parseFloat(userLng);

                  if (!isNaN(lat) && !isNaN(lng)) {
                    const manualLocation = {
                      latitude: lat,
                      longitude: lng,
                      accuracy: 0,
                      timestamp: new Date().toISOString(),
                      city: 'Proddatur (Manual)',
                      state: 'Andhra Pradesh',
                      country: 'India',
                      address: `Manual location: ${lat}, ${lng}`,
                      manuallySet: true
                    };
                    setCurrentLocation(manualLocation);
                    alert('Manual location set successfully!');
                  } else {
                    alert('Invalid coordinates. Please enter valid numbers.');
                  }
                } else {
                  alert('Location correction cancelled.');
                }
              }}
            >
              📍 Fix Location
            </Button>
            <Button
              variant="success"
              size="sm"
              className="ms-2"
              onClick={() => {
                const proddaturLocation = {
                  latitude: 14.7300,
                  longitude: 78.5500,
                  accuracy: 5,
                  timestamp: new Date().toISOString(),
                  city: 'Proddatur',
                  state: 'Andhra Pradesh',
                  country: 'India',
                  address: 'Proddatur, Kadapa District, Andhra Pradesh, India',
                  road: 'Proddatur Main Road',
                  postcode: '516360',
                  manuallySet: true,
                  preset: 'Proddatur'
                };
                setCurrentLocation(proddaturLocation);
                setGpsError('');
                alert('✅ Location set to Proddatur, Andhra Pradesh!');
              }}
            >
              🏘️ Set Proddatur
            </Button>
            <Button
              variant="outline-info"
              size="sm"
              className="ms-2"
              onClick={async () => {
                setGpsError('');
                alert('🔍 Starting enhanced GPS detection...\n\nThis will:\n• Try multiple location services\n• Show detailed GPS information\n• Detect location accuracy issues\n• Provide debugging information');

                try {
                  const location = await getCurrentLocation();
                  console.log('Enhanced GPS result:', location);
                } catch (error) {
                  console.error('Enhanced GPS failed:', error);
                  setGpsError(`Enhanced GPS failed: ${error.message}`);
                }
              }}
            >
              🔍 Debug GPS
            </Button>
          </div>
        </div>

        {gpsError && (
          <Alert variant="warning" className="mb-3">
            <strong>GPS Error:</strong> {gpsError}
            <br />
            <small>Make sure location permissions are enabled and you have a stable internet connection.</small>
          </Alert>
        )}

        {/* GPS Debug Information Panel */}
        {currentLocation && (
          <Alert variant="info" className="mb-3">
            <div className="d-flex align-items-start">
              <div className="me-3" style={{ fontSize: '1.5rem' }}>🔍</div>
              <div style={{ flex: 1 }}>
                <strong>GPS Debug Information</strong>
                <div className="mt-2">
                  <Row>
                    <Col md={6}>
                      <small>
                        <strong>📍 Coordinates:</strong><br />
                        Lat: {currentLocation.latitude?.toFixed(6)}<br />
                        Lng: {currentLocation.longitude?.toFixed(6)}<br />
                        <strong>🎯 Accuracy:</strong> {currentLocation.accuracy}m<br />
                        <strong>⏰ Timestamp:</strong> {new Date(currentLocation.timestamp).toLocaleString()}
                      </small>
                    </Col>
                    <Col md={6}>
                      <small>
                        <strong>🏘️ Detected Location:</strong><br />
                        City: {currentLocation.city || 'Unknown'}<br />
                        State: {currentLocation.state || 'Unknown'}<br />
                        Country: {currentLocation.country || 'Unknown'}<br />
                        {currentLocation.locationWarning && (
                          <div className="text-warning mt-1">
                            <strong>⚠️ Warning:</strong> {currentLocation.locationWarning}
                          </div>
                        )}
                      </small>
                    </Col>
                  </Row>
                  {currentLocation.address && (
                    <div className="mt-2">
                      <small>
                        <strong>📍 Full Address:</strong><br />
                        {currentLocation.address}
                      </small>
                    </div>
                  )}
                  <div className="mt-2">
                    <small className="text-muted">
                      <strong>💡 Tips for better accuracy:</strong><br />
                      • Ensure you're outdoors with clear sky view<br />
                      • Enable high-accuracy location in browser settings<br />
                      • Wait a few seconds for GPS to get a better fix<br />
                      • Try refreshing if location seems incorrect
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </Alert>
        )}



        {/* Current Location Card */}
        {currentLocation && (
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5>📍 Current Location</h5>
              <Row>
                <Col md={6}>
                  <strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}
                </Col>
                <Col md={6}>
                  <strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}
                </Col>
              </Row>
              <div className="mt-2">
                <strong>Accuracy:</strong> {currentLocation.accuracy}m •
                <strong> Updated:</strong> {new Date(currentLocation.timestamp).toLocaleString()}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Device Location Cards - Each device with its own GPS location */}
        <Row>
          {Object.values(deviceLocations).map((deviceLocation, index) => (
            <Col md={6} lg={4} key={index} className="mb-4">
              <Card className="shadow-sm h-100 border-success">
                <Card.Header className="bg-success bg-opacity-10">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">📱 {deviceLocation.deviceName}</h6>
                    <Badge bg="success">GPS Active</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Device ID:</strong>
                      <code>{deviceLocation.deviceId}</code>
                    </div>
                    {deviceLocation.qrCode && (
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>QR Code:</strong>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleViewQRCode(deviceLocation.qrCode)}
                        >
                          View QR
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="location-info bg-light p-2 rounded mb-3">
                    <div className="mb-2">
                      <strong>📍 GPS Coordinates:</strong><br />
                      <small>
                        <strong>Latitude:</strong> {deviceLocation.location.latitude.toFixed(6)}<br />
                        <strong>Longitude:</strong> {deviceLocation.location.longitude.toFixed(6)}
                      </small>
                    </div>
                    <div className="mb-2">
                      <strong>🎯 Accuracy:</strong> {deviceLocation.location.accuracy}m
                    </div>
                    <div className="mb-2">
                      <strong>🕒 Last Update:</strong><br />
                      <small>{new Date(deviceLocation.timestamp).toLocaleString()}</small>
                    </div>
                    <div>
                      <strong>⏰ Tracking Started:</strong><br />
                      <small>{new Date(deviceLocation.trackingStarted).toLocaleString()}</small>
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleViewDeviceLocation(deviceLocation)}
                    >
                      🗺️ View on Map
                    </Button>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => {
                          const osmUrl = `https://www.openstreetmap.org/?mlat=${deviceLocation.location.latitude}&mlon=${deviceLocation.location.longitude}&zoom=16`;
                          window.open(osmUrl, '_blank');
                        }}
                        className="flex-fill"
                      >
                        🗺️ OpenStreetMap
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => {
                          // Stop tracking for this specific device
                          const updatedLocations = { ...deviceLocations };
                          delete updatedLocations[deviceLocation.deviceId];
                          setDeviceLocations(updatedLocations);

                          // Update localStorage
                          const savedLocations = JSON.parse(localStorage.getItem('deviceLocations') || '{}');
                          delete savedLocations[deviceLocation.deviceId];
                          localStorage.setItem('deviceLocations', JSON.stringify(savedLocations));

                          alert(`GPS tracking stopped for ${deviceLocation.deviceName}`);
                        }}
                      >
                        Stop GPS
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Location History */}
        {locationHistory.length > 0 && (
          <Card className="shadow-sm mt-4">
            <Card.Header>
              <h5 className="mb-0">📊 Location History</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {locationHistory.slice(0, 20).map((location, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                      <strong>{location.deviceName}</strong><br />
                      <small className="text-muted">
                        {location.location.latitude.toFixed(6)}, {location.location.longitude.toFixed(6)}
                      </small>
                    </div>
                    <div className="text-end">
                      <Badge bg="info" className="mb-1">Active</Badge><br />
                      <small className="text-muted">
                        {new Date(location.timestamp).toLocaleString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Empty State */}
        {Object.keys(deviceLocations).length === 0 && (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#f8f9fa',
                border: '3px dashed #dee2e6',
                color: '#6c757d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontWeight: 'bold'
              }}>
                📍
              </div>
              <h4>No Device Locations</h4>
              <p className="text-muted">Start tracking devices to see their locations here.</p>
              <Button variant="primary" onClick={() => getCurrentLocation()}>
                Enable GPS Tracking
              </Button>
            </Card.Body>
          </Card>
        )}
      </div>
    );
  };

  // Additional Admin Render Functions (Based on Figma Design)
  const renderAdminOverviewContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return <div>Access denied</div>;
    }

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Admin Dashboard Overview</h2>
            <p className="text-muted">Comprehensive admin dashboard with key metrics and insights</p>
          </div>
          <Button variant="outline-primary" size="sm" onClick={() => window.location.reload()}>
            Refresh Data
          </Button>
        </div>

        {/* Admin Stats Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="shadow-sm border-primary">
              <Card.Body className="text-center">
                <div className="display-6 text-primary mb-2">👥</div>
                <h5>Total Users</h5>
                <h3 className="text-primary">{allUsers.length}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-success">
              <Card.Body className="text-center">
                <div className="display-6 text-success mb-2">📱</div>
                <h5>Total Devices</h5>
                <h3 className="text-success">{allDevices.length}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-warning">
              <Card.Body className="text-center">
                <div className="display-6 text-warning mb-2">🔲</div>
                <h5>QR Codes</h5>
                <h3 className="text-warning">{generatedQRCodes.length}</h3>
                <small className="text-muted">
                  Available: {generatedQRCodes.filter(qr => qr.status === 'available').length}
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-info">
              <Card.Body className="text-center">
                <div className="display-6 text-info mb-2">📱</div>
                <h5>Assigned Devices</h5>
                <h3 className="text-info">{generatedQRCodes.filter(qr => qr.status === 'assigned').length}</h3>
                <small className="text-muted">
                  Active: {generatedQRCodes.filter(qr => qr.status === 'active').length}
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h5 className="mb-0">Quick Actions</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <Button variant="primary" className="w-100 mb-2" onClick={() => setShowQRGenerationModal(true)}>
                  🔲 Generate QR Codes
                </Button>
              </Col>
              <Col md={3}>
                <Button variant="success" className="w-100 mb-2" onClick={() => setShowQRManagementModal(true)}>
                  📋 Manage QR Codes
                </Button>
              </Col>
              <Col md={3}>
                <Button variant="info" className="w-100 mb-2" onClick={() => setActiveTab('all-users')}>
                  👥 Manage Users
                </Button>
              </Col>
              <Col md={3}>
                <Button variant="warning" className="w-100 mb-2" onClick={() => setActiveTab('all-devices')}>
                  📱 Manage Devices
                </Button>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col md={12}>
                <small className="text-muted">
                  {/* COMMENTED OUT: Old device request system */}
                  {/* <Button variant="outline-secondary" size="sm" onClick={() => setActiveTab('device-requests')}>
                    📱 Old Device Requests (Disabled)
                  </Button> */}
                </small>
              </Col>
            </Row>

            {/* Generated QR Codes Display Section */}
            <Card className="mt-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">🔲 Generated QR Codes</h5>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setShowQRGenerationModal(true)}
                    >
                      ➕ Generate More
                    </Button>
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={async () => {
                        console.log('=== QR CODE DEBUG TEST ===');
                        try {
                          const testCode = '1234567890123456';
                          console.log('1. Testing QR code generation with code:', testCode);

                          const qrImage = await generateQRCodeImage(testCode);
                          console.log('2. QR generation result:', qrImage ? 'SUCCESS' : 'FAILED');
                          console.log('3. QR image data length:', qrImage ? qrImage.length : 0);
                          console.log('4. QR image starts with:', qrImage ? qrImage.substring(0, 50) : 'N/A');

                          if (qrImage) {
                            // Test if it's a valid data URL
                            const isValidDataURL = qrImage.startsWith('data:image/');
                            console.log('5. Is valid data URL:', isValidDataURL);

                            // Create a test image element to verify it loads
                            const testImg = new Image();
                            testImg.onload = () => {
                              console.log('6. Image loaded successfully!');
                              alert('✅ QR Code generation test PASSED!\nCheck console for details.');
                            };
                            testImg.onerror = (error) => {
                              console.error('6. Image failed to load:', error);
                              alert('❌ QR Code image failed to load!\nCheck console for details.');
                            };
                            testImg.src = qrImage;
                          } else {
                            alert('❌ QR Code generation FAILED!\nCheck console for details.');
                          }
                        } catch (error) {
                          console.error('QR generation test error:', error);
                          alert('❌ QR generation test ERROR: ' + error.message);
                        }
                      }}
                    >
                      🔍 Debug QR
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setShowQRManagementModal(true)}
                    >
                      📋 View All
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (window.confirm(`⚠️ DELETE ALL QR CODES?\n\nThis will permanently delete all ${generatedQRCodes.length} QR codes and cannot be undone.\n\nAll user assignments will be lost!\n\nAre you absolutely sure?`)) {
                          localStorage.removeItem('generatedQRCodes');
                          setGeneratedQRCodes([]);
                          alert('✅ All QR codes have been deleted successfully!\n\nYou can now generate new QR codes.');
                        }
                      }}
                      disabled={generatedQRCodes.length === 0}
                    >
                      🗑️ Delete All ({generatedQRCodes.length})
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                {generatedQRCodes.length === 0 ? (
                  <div className="text-center py-4">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔲</div>
                    <h5>No QR Codes Generated</h5>
                    <p className="text-muted">Generate QR codes for devices to get started</p>
                    <Button variant="primary" onClick={() => setShowQRGenerationModal(true)}>
                      🚀 Generate First QR Codes
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <div className="d-flex gap-3">
                        <Badge bg="secondary" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                          Total: {generatedQRCodes.length}
                        </Badge>
                        <Badge bg="success" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                          Available: {generatedQRCodes.filter(qr => qr.status === 'available').length}
                        </Badge>
                        <Badge bg="warning" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                          Assigned: {generatedQRCodes.filter(qr => qr.status === 'assigned').length}
                        </Badge>
                        <Badge bg="info" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                          Active: {generatedQRCodes.filter(qr => qr.status === 'active').length}
                        </Badge>
                      </div>
                    </div>

                    <Row>
                      {generatedQRCodes.slice(0, 8).map((qr) => (
                        <Col md={3} key={qr.id} className="mb-3">
                          <Card className={`border ${
                            qr.status === 'available' ? 'border-success' :
                            qr.status === 'assigned' ? 'border-warning' : 'border-info'
                          }`} style={{ height: '200px' }}>
                            <Card.Body className="text-center d-flex flex-column">
                              <div
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  margin: '0 auto 0.5rem',
                                  border: '2px solid #dee2e6',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#ffffff',
                                  overflow: 'hidden'
                                }}
                              >
                                {qr.qrCodeImage ? (
                                  <img
                                    src={qr.qrCodeImage}
                                    alt={`QR Code ${qr.code}`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain'
                                    }}
                                  />
                                ) : (
                                  <div style={{ fontSize: '1.2rem', color: '#6c757d' }}>🔲</div>
                                )}
                              </div>

                              <div className="mb-1">
                                <code style={{ fontSize: '0.6rem', wordBreak: 'break-all' }}>
                                  {getDisplayCode(qr)}
                                </code>
                              </div>

                              <Badge
                                bg={
                                  qr.status === 'available' ? 'success' :
                                  qr.status === 'assigned' ? 'warning' : 'info'
                                }
                                className="mb-1"
                                style={{ fontSize: '0.7rem' }}
                              >
                                {qr.status}
                              </Badge>

                              {qr.assignedTo && (
                                <div className="mb-1">
                                  <small style={{ fontSize: '0.7rem' }}>
                                    {qr.assignedTo}
                                  </small>
                                </div>
                              )}

                              <div className="mt-auto">
                                <small className="text-muted" style={{ fontSize: '0.6rem' }}>
                                  {new Date(qr.createdAt).toLocaleDateString()}
                                </small>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {generatedQRCodes.length > 8 && (
                      <div className="text-center mt-3">
                        <Button
                          variant="outline-primary"
                          onClick={() => setShowQRManagementModal(true)}
                        >
                          View All {generatedQRCodes.length} QR Codes
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Card.Body>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">Recent Admin Activity</h5>
          </Card.Header>
          <Card.Body>
            {userActivityData.slice(0, 5).map((activity, index) => (
              <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                  <strong>{activity.type}</strong> - {activity.action}<br />
                  <small className="text-muted">User: {activity.user}</small>
                </div>
                <div className="text-end">
                  <Badge bg={activity.status === 'completed' ? 'success' : activity.status === 'pending' ? 'warning' : 'info'}>
                    {activity.status}
                  </Badge><br />
                  <small className="text-muted">{new Date(activity.timestamp).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Functional Analytics Dashboard with Charts and Graphs
  const renderAnalyticsDashboardContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return <div>Access denied</div>;
    }

    // Calculate analytics data
    const totalUsers = allUsers.length;
    const totalDevices = allDevices.length;
    const pendingRequests = 0; // REMOVED: Device requests (replaced by QR code system)
    const approvedDevices = generatedQRCodes.filter(qr => qr.status === 'assigned' || qr.status === 'active').length;

    // User role distribution
    const userRoles = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // Device status distribution
    const deviceStatuses = {
      approved: approvedDevices,
      pending: pendingRequests,
      rejected: 0 // REMOVED: Device requests (replaced by QR code system)
    };

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Analytics Dashboard</h2>
            <p className="text-muted">Comprehensive analytics with charts and insights</p>
          </div>
          <Button variant="outline-primary" size="sm" onClick={() => window.location.reload()}>
            Refresh Data
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="shadow-sm border-primary">
              <Card.Body className="text-center">
                <div className="display-6 text-primary mb-2">👥</div>
                <h5>Total Users</h5>
                <h3 className="text-primary">{totalUsers}</h3>
                <small className="text-muted">Active system users</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-success">
              <Card.Body className="text-center">
                <div className="display-6 text-success mb-2">📱</div>
                <h5>Total Devices</h5>
                <h3 className="text-success">{totalDevices}</h3>
                <small className="text-muted">Managed devices</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-warning">
              <Card.Body className="text-center">
                <div className="display-6 text-warning mb-2">⏳</div>
                <h5>Pending Requests</h5>
                <h3 className="text-warning">{pendingRequests}</h3>
                <small className="text-muted">Awaiting approval</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-info">
              <Card.Body className="text-center">
                <div className="display-6 text-info mb-2">✅</div>
                <h5>Approved Devices</h5>
                <h3 className="text-info">{approvedDevices}</h3>
                <small className="text-muted">Active devices</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row className="mb-4">
          {/* User Roles Chart */}
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">User Role Distribution</h5>
              </Card.Header>
              <Card.Body>
                <div className="chart-container">
                  {Object.entries(userRoles).map(([role, count], index) => {
                    const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
                    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545'];
                    return (
                      <div key={role} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-capitalize">{role}</span>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="progress" style={{ height: '20px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colors[index % colors.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Device Status Chart */}
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Device Status Distribution</h5>
              </Card.Header>
              <Card.Body>
                <div className="chart-container">
                  {Object.entries(deviceStatuses).map(([status, count], index) => {
                    const total = Object.values(deviceStatuses).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const colors = { approved: '#28a745', pending: '#ffc107', rejected: '#dc3545' };
                    return (
                      <div key={status} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-capitalize">{status}</span>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="progress" style={{ height: '20px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colors[status]
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Activity Timeline */}
        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">Recent Activity Timeline</h5>
          </Card.Header>
          <Card.Body>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {userActivityData.slice(0, 10).map((activity, index) => (
                <div key={index} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                  <div className="me-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: activity.status === 'completed' ? '#28a745' :
                                       activity.status === 'pending' ? '#ffc107' : '#007bff',
                        color: 'white',
                        fontSize: '1.2rem'
                      }}
                    >
                      {activity.icon === 'USER' ? '👤' :
                       activity.icon === 'DEVICE' ? '📱' :
                       activity.icon === 'APPROVE' ? '✅' :
                       activity.icon === 'REJECT' ? '❌' : '📋'}
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{activity.type}</h6>
                        <p className="mb-1 text-muted">{activity.details}</p>
                        <small className="text-muted">by {activity.user}</small>
                      </div>
                      <div className="text-end">
                        <Badge bg={activity.status === 'completed' ? 'success' :
                                  activity.status === 'pending' ? 'warning' : 'info'}>
                          {activity.status}
                        </Badge>
                        <br />
                        <small className="text-muted">
                          {new Date(activity.timestamp).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Device Analytics with Charts
  const renderDeviceAnalyticsContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return <div>Access denied</div>;
    }

    // Calculate QR code analytics (NEW SYSTEM)
    const qrCodesByUser = {};
    const qrCodesByStatus = { available: 0, assigned: 0, active: 0 };
    const qrCodesByMonth = {};

    generatedQRCodes.forEach(qr => {
      // Count by user
      if (qr.assignedTo) {
        qrCodesByUser[qr.assignedTo] = (qrCodesByUser[qr.assignedTo] || 0) + 1;
      }

      // Count by status
      qrCodesByStatus[qr.status] = (qrCodesByStatus[qr.status] || 0) + 1;

      // Count by month
      if (qr.createdAt) {
        const month = new Date(qr.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        qrCodesByMonth[month] = (qrCodesByMonth[month] || 0) + 1;
      }
    });

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>🔲 QR Code Analytics</h2>
            <p className="text-muted">Detailed QR code usage and distribution analytics</p>
          </div>
        </div>

        {/* QR Code Status Overview */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm border-success">
              <Card.Body className="text-center">
                <div className="display-6 text-success mb-2">✅</div>
                <h5>Active QR Codes</h5>
                <h3 className="text-success">{qrCodesByStatus.active}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-warning">
              <Card.Body className="text-center">
                <div className="display-6 text-warning mb-2">📱</div>
                <h5>Assigned QR Codes</h5>
                <h3 className="text-warning">{qrCodesByStatus.assigned}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-info">
              <Card.Body className="text-center">
                <div className="display-6 text-info mb-2">🔲</div>
                <h5>Available QR Codes</h5>
                <h3 className="text-info">{qrCodesByStatus.available}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* QR Codes by User Chart */}
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">🔲 QR Codes by User</h5>
              </Card.Header>
              <Card.Body>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {Object.entries(qrCodesByUser).length > 0 ? (
                    Object.entries(qrCodesByUser)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([user, count], index) => {
                        const maxCount = Math.max(...Object.values(qrCodesByUser));
                        const percentage = (count / maxCount) * 100;
                        return (
                          <div key={user} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold">{user}</span>
                              <span>{count} QR codes</span>
                            </div>
                            <div className="progress" style={{ height: '15px' }}>
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4">
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔲</div>
                      <p className="text-muted">No QR codes assigned to users yet</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* QR Code Generation Timeline */}
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">🔲 QR Code Generation by Month</h5>
              </Card.Header>
              <Card.Body>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {Object.entries(qrCodesByMonth).length > 0 ? (
                    Object.entries(qrCodesByMonth)
                      .sort(([a], [b]) => new Date(a) - new Date(b))
                      .map(([month, count], index) => {
                        const maxCount = Math.max(...Object.values(qrCodesByMonth));
                        const percentage = (count / maxCount) * 100;
                      return (
                        <div key={month} className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold">{month}</span>
                            <span>{count} QR codes</span>
                          </div>
                          <div className="progress" style={{ height: '15px' }}>
                            <div
                              className="progress-bar bg-success"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4">
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                      <p className="text-muted">No QR codes generated yet</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // User Analytics with Charts
  const renderUserAnalyticsContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return <div>Access denied</div>;
    }

    // Calculate user analytics
    const usersByRole = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const usersByMonth = {};
    allUsers.forEach(user => {
      if (user.signupTime) {
        const month = new Date(user.signupTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        usersByMonth[month] = (usersByMonth[month] || 0) + 1;
      }
    });

    const activeUsers = allUsers.filter(user => {
      // Consider users active if they have assigned QR codes
      return generatedQRCodes.some(qr => qr.assignedTo === user.username);
    }).length;

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>User Analytics</h2>
            <p className="text-muted">User engagement and activity analytics</p>
          </div>
        </div>

        {/* User Overview */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="shadow-sm border-primary">
              <Card.Body className="text-center">
                <div className="display-6 text-primary mb-2">👥</div>
                <h5>Total Users</h5>
                <h3 className="text-primary">{allUsers.length}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-success">
              <Card.Body className="text-center">
                <div className="display-6 text-success mb-2">🟢</div>
                <h5>Active Users</h5>
                <h3 className="text-success">{activeUsers}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-warning">
              <Card.Body className="text-center">
                <div className="display-6 text-warning mb-2">👤</div>
                <h5>Regular Users</h5>
                <h3 className="text-warning">{usersByRole.user || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-info">
              <Card.Body className="text-center">
                <div className="display-6 text-info mb-2">👨‍💼</div>
                <h5>Admin Users</h5>
                <h3 className="text-info">{(usersByRole.admin || 0) + (usersByRole.superadmin || 0)}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* User Role Distribution */}
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">User Role Distribution</h5>
              </Card.Header>
              <Card.Body>
                {Object.entries(usersByRole).map(([role, count], index) => {
                  const percentage = allUsers.length > 0 ? (count / allUsers.length) * 100 : 0;
                  const colors = { user: '#007bff', admin: '#28a745', superadmin: '#dc3545' };
                  return (
                    <div key={role} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-capitalize">{role}</span>
                        <span>{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="progress" style={{ height: '20px' }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: colors[role] || '#6c757d'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          </Col>

          {/* User Registration Timeline */}
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">User Registrations by Month</h5>
              </Card.Header>
              <Card.Body>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {Object.entries(usersByMonth)
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([month, count], index) => {
                      const maxCount = Math.max(...Object.values(usersByMonth));
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={month} className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold">{month}</span>
                            <span>{count} registrations</span>
                          </div>
                          <div className="progress" style={{ height: '15px' }}>
                            <div
                              className="progress-bar bg-info"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Super Admin Render Functions (Essential Only)
  const renderSystemSettingsContent = () => {
    if (!userData || userData.role !== 'superadmin') {
      return <div>Access denied - Super Admin only</div>;
    }
    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>System Settings</h2>
            <p className="text-muted">Configure global system settings and parameters</p>
          </div>
        </div>

        <Row>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">Application Settings</h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Application Name</Form.Label>
                    <Form.Control type="text" defaultValue="ADDWISE TRACKER" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Users</Form.Label>
                    <Form.Control type="number" defaultValue="1000" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Devices per User</Form.Label>
                    <Form.Control type="number" defaultValue="10" />
                  </Form.Group>
                  <Button variant="primary">Save Settings</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">System Status</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>System Health</span>
                    <Badge bg="success">Healthy</Badge>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Database Status</span>
                    <Badge bg="success">Connected</Badge>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Storage Usage</span>
                    <span>45% (2.3GB / 5GB)</span>
                  </div>
                  <div className="progress mt-1">
                    <div className="progress-bar bg-info" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderSystemLogsContent = () => {
    if (!userData || userData.role !== 'superadmin') {
      return <div>Access denied - Super Admin only</div>;
    }

    // Mock system logs
    const systemLogs = [
      { timestamp: new Date().toISOString(), level: 'INFO', message: 'User login successful', user: userData.username },
      { timestamp: new Date(Date.now() - 300000).toISOString(), level: 'WARN', message: 'High memory usage detected', user: 'system' },
      { timestamp: new Date(Date.now() - 600000).toISOString(), level: 'INFO', message: 'Device request approved', user: 'admin' },
      { timestamp: new Date(Date.now() - 900000).toISOString(), level: 'ERROR', message: 'Failed GPS location request', user: 'user1' },
      { timestamp: new Date(Date.now() - 1200000).toISOString(), level: 'INFO', message: 'System backup completed', user: 'system' }
    ];

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>System Logs</h2>
            <p className="text-muted">View comprehensive system logs and debugging information</p>
          </div>
          <Button variant="outline-primary" size="sm">
            Export Logs
          </Button>
        </div>

        <Card className="shadow-sm">
          <Card.Body>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {systemLogs.map((log, index) => (
                <div key={index} className="d-flex align-items-center py-2 border-bottom">
                  <div className="me-3">
                    <Badge bg={log.level === 'ERROR' ? 'danger' : log.level === 'WARN' ? 'warning' : 'info'}>
                      {log.level}
                    </Badge>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold">{log.message}</div>
                    <small className="text-muted">User: {log.user}</small>
                  </div>
                  <div className="text-end">
                    <small className="text-muted">
                      {new Date(log.timestamp).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderAdminManagementContent = () => {
    if (!userData || userData.role !== 'superadmin') {
      return <div>Access denied - Super Admin only</div>;
    }

    const adminUsers = allUsers.filter(user => user.role === 'admin' || user.role === 'superadmin');

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Admin Management</h2>
            <p className="text-muted">Manage admin users and their privileges</p>
          </div>
          <Button variant="primary" onClick={handleCreateUser}>
            Add New Admin
          </Button>
        </div>

        <Card className="shadow-sm">
          <Card.Body>
            <Table responsive>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user, index) => (
                  <tr key={index}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={user.role === 'superadmin' ? 'danger' : 'warning'}>
                        {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                      </Badge>
                    </td>
                    <td>{user.signupTime ? new Date(user.signupTime).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <Button size="sm" variant="outline-primary" className="me-2" onClick={() => handleEditUser(user)}>
                        Edit
                      </Button>
                      {user.username !== userData.username && (
                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteUser(user)}>
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderSystemAnalyticsContent = () => {
    if (!userData || userData.role !== 'superadmin') {
      return <div>Access denied - Super Admin only</div>;
    }

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>System Analytics</h2>
            <p className="text-muted">Advanced system analytics and performance insights</p>
          </div>
        </div>

        <Row className="mb-4">
          <Col md={3}>
            <Card className="shadow-sm border-info">
              <Card.Body className="text-center">
                <div className="display-6 text-info mb-2">💾</div>
                <h5>Storage Used</h5>
                <h3 className="text-info">2.3 GB</h3>
                <small className="text-muted">of 5 GB total</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-success">
              <Card.Body className="text-center">
                <div className="display-6 text-success mb-2">⚡</div>
                <h5>System Uptime</h5>
                <h3 className="text-success">99.9%</h3>
                <small className="text-muted">Last 30 days</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-warning">
              <Card.Body className="text-center">
                <div className="display-6 text-warning mb-2">📊</div>
                <h5>API Calls</h5>
                <h3 className="text-warning">15.2K</h3>
                <small className="text-muted">This month</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-primary">
              <Card.Body className="text-center">
                <div className="display-6 text-primary mb-2">🔄</div>
                <h5>Active Sessions</h5>
                <h3 className="text-primary">{allUsers.length}</h3>
                <small className="text-muted">Current users</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">System Performance Metrics</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h6>Memory Usage</h6>
                <div className="progress mb-3" style={{ height: '20px' }}>
                  <div className="progress-bar bg-info" style={{ width: '65%' }}>65%</div>
                </div>

                <h6>CPU Usage</h6>
                <div className="progress mb-3" style={{ height: '20px' }}>
                  <div className="progress-bar bg-warning" style={{ width: '45%' }}>45%</div>
                </div>
              </Col>
              <Col md={6}>
                <h6>Network I/O</h6>
                <div className="progress mb-3" style={{ height: '20px' }}>
                  <div className="progress-bar bg-success" style={{ width: '30%' }}>30%</div>
                </div>

                <h6>Database Connections</h6>
                <div className="progress mb-3" style={{ height: '20px' }}>
                  <div className="progress-bar bg-primary" style={{ width: '25%' }}>25%</div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderPerformanceMonitoringContent = () => {
    if (!userData || userData.role !== 'superadmin') {
      return <div>Access denied - Super Admin only</div>;
    }

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Performance Monitoring</h2>
            <p className="text-muted">Real-time system performance monitoring and alerts</p>
          </div>
        </div>

        <Alert variant="success" className="mb-4">
          <strong>System Status: Healthy</strong><br />
          All systems are operating normally. No critical alerts detected.
        </Alert>

        <Row>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">Response Time Monitoring</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Average Response Time</span>
                    <span className="text-success">120ms</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar bg-success" style={{ width: '20%' }}></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Peak Response Time</span>
                    <span className="text-warning">450ms</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar bg-warning" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">Error Rate Monitoring</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Error Rate</span>
                    <span className="text-success">0.1%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar bg-success" style={{ width: '1%' }}></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Success Rate</span>
                    <span className="text-success">99.9%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar bg-success" style={{ width: '99%' }}></div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };



  const getSidebarContent = () => {
    // Base sections for regular users
    const userSections = [
      {
        key: "dashboard",
        title: "Dashboard",
        icon: "📊",
        items: [
          { id: "dashboard", label: "Overview", icon: "📈" }
        ]
      },
      {
        key: "devices",
        title: "My Devices",
        icon: "📱",
        items: [
          { id: "my-devices", label: "My Devices", icon: "📱" },
          { id: "device-status", label: "Device Status", icon: "📊" },
          { id: "actions", label: "Quick Actions", icon: "⚡" }
        ]
      },
      {
        key: "profile",
        title: "My Account",
        icon: "👤",
        items: [
          { id: "profile", label: "View Profile", icon: "👤" },
          { id: "settings", label: "Account Settings", icon: "⚙️" }
        ]
      },
      {
        key: "support",
        title: "Help & Support",
        icon: "💬",
        items: [
          { id: "help", label: "Help Center", icon: "❓" },
          { id: "contact", label: "Contact Support", icon: "📞" },
          { id: "feedback", label: "Send Feedback", icon: "📝" }
        ]
      }
    ];

    // Base sections for admin users (different from regular users)
    const adminBaseSections = [
      {
        key: "dashboard",
        title: "Dashboard",
        icon: "📊",
        items: [
          { id: "dashboard", label: "Admin Overview", icon: "📈" }
        ]
      },
      {
        key: "personal",
        title: "My Account",
        icon: "👤",
        items: [
          { id: "profile", label: "My Profile", icon: "👤" },
          { id: "settings", label: "Account Settings", icon: "⚙️" }
        ]
      }
    ];

    // Additional sections for admin and super admin (Optimized and Functional)
    const adminSections = [
      {
        key: "admin-dashboard",
        title: "Admin Dashboard",
        icon: "🛠️",
        items: [
          { id: "admin-overview", label: "Dashboard Overview", icon: "📊" },
          { id: "device-requests", label: "Device Requests", icon: "📱" },
          { id: "user-activity", label: "User Activity", icon: "👥" }
        ]
      },
      {
        key: "device-management",
        title: "Device Management",
        icon: "📱",
        items: [
          { id: "all-devices", label: "All Devices", icon: "📱" },
          { id: "qr-management", label: "QR Code Management", icon: "📲" }
        ]
      },
      {
        key: "user-management",
        title: "User Management",
        icon: "👥",
        items: [
          { id: "all-users", label: "All Users", icon: "👤" }
        ]
      },
      {
        key: "reports-analytics",
        title: "Reports & Analytics",
        icon: "📈",
        items: [
          { id: "analytics-dashboard", label: "Analytics Dashboard", icon: "📊" },
          { id: "device-analytics", label: "Device Analytics", icon: "📱" },
          { id: "user-analytics", label: "User Analytics", icon: "👥" }
        ]
      }
    ];

    // Additional sections for super admin only (Simplified and Essential)
    const superAdminSections = [
      {
        key: "system-administration",
        title: "System Administration",
        icon: "⚙️",
        items: [
          { id: "system-settings", label: "System Settings", icon: "⚙️" },
          { id: "system-logs", label: "System Logs", icon: "📝" },
          { id: "admin-management", label: "Admin Management", icon: "👨‍💼" }
        ]
      },
      {
        key: "advanced-analytics",
        title: "Advanced Analytics",
        icon: "📊",
        items: [
          { id: "system-analytics", label: "System Analytics", icon: "📊" },
          { id: "performance-monitoring", label: "Performance Monitoring", icon: "📈" }
        ]
      }
    ];

    // Default to user sections if userData is not available
    let sections = [...userSections];

    // Assign sections based on user role
    if (userData) {
      if (userData.role === 'admin') {
        sections = [...adminBaseSections, ...adminSections];
      } else if (userData.role === 'superadmin' || userData.role === 'super_admin') {
        sections = [...adminBaseSections, ...adminSections, ...superAdminSections];
      } else {
        // Regular user
        sections = [...userSections];
      }
    }

    return (
      <Accordion className="dashboard-sidebar">
        {sections && sections.map(section => (
          <Accordion.Item 
            key={section.key} 
            eventKey={section.key} 
            className="sidebar-section"
          >
            <Accordion.Header 
              className={`sidebar-header ${activeTab.startsWith(section.key) ? 'active' : ''}`}
            >
              {section.title}
            </Accordion.Header>
            <Accordion.Body className="p-0">
              {section.items && section.items.map(item => (
                <div 
                  key={item.id}
                  className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span>{item.label}</span>
                </div>
              ))}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="dashboard-content text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="dashboard-content">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      );
    }

    switch(activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'profile':
        return renderProfileContent();
      case 'settings':
        return renderSettingsContent();
      case 'actions':
        return renderActionsContent();
      case 'my-devices':
        return renderMyDevicesContent();
      case 'device-status':
        return renderDeviceStatusContent();
      case 'help':
        return renderHelpContent();
      case 'contact':
        return renderContactContent();
      case 'feedback':
        return renderFeedbackContent();

      // Admin Dashboard Pages
      case 'admin-overview':
        return renderAdminOverviewContent();
      case 'device-requests':
        return renderDeviceRequestsContent();
      case 'user-activity':
        return renderUserActivityContent();

      // Device Management Pages
      case 'all-devices':
        return renderDeviceManagementContent();
      case 'qr-management':
        return renderQRManagementContent();

      // User Management Pages
      case 'all-users':
        return renderUserManagementContent();

      // Reports & Analytics Pages (With Charts and Graphs)
      case 'analytics-dashboard':
        return renderAnalyticsDashboardContent();
      case 'device-analytics':
        return renderDeviceAnalyticsContent();
      case 'user-analytics':
        return renderUserAnalyticsContent();

      // Super Admin - System Administration Pages
      case 'system-settings':
        return renderSystemSettingsContent();
      case 'system-logs':
        return renderSystemLogsContent();
      case 'admin-management':
        return renderAdminManagementContent();

      // Super Admin - Advanced Analytics Pages
      case 'system-analytics':
        return renderSystemAnalyticsContent();
      case 'performance-monitoring':
        return renderPerformanceMonitoringContent();

      default:
        return renderDashboardContent();
    }
  };

  // Show loading spinner if userData is not loaded yet
  if (!userData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-page">
      {/* Navigation Bar */}
      <Navbar 
        bg="dark"
        variant="dark"
        expand="lg" 
        fixed="top"
        className="custom-navbar"
        style={{ 
          backgroundColor: '#4a148c !important',
          background: '#4a148c !important',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          padding: '0.8rem 0',
          width: '100%',
          zIndex: 1000
        }}
      >
        <Container fluid style={{ padding: '0 2rem' }}>
          <Navbar.Brand
            href="#home"
            className="navbar-brand-custom"
            style={{
              color: '#fff !important',
              fontWeight: '700',
              fontSize: '1.6rem',
              padding: '0.5rem 1.2rem',
              borderRadius: '6px',
              backgroundColor: activeTab === 'home' ? '#7b1fa2' : 'transparent',
              border: activeTab === 'home' ? '2px solid #fff' : '2px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              letterSpacing: '0.5px'
            }}
            onClick={() => setActiveTab('home')}
          >
            ADDWISE TRACKER
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" style={{ borderColor: '#fff' }} />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
            <Nav className="me-auto">
              {/* Navigation links removed as they are in sidebar */}
            </Nav>
            <Nav>
              <Nav.Link
                href="#settings"
                className="nav-link-custom"
                style={{
                  color: '#fff !important',
                  fontWeight: '600',
                  fontSize: '1rem',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '6px',
                  transition: 'all 0.3s ease',
                  backgroundColor: activeTab === 'settings' ? '#7b1fa2' : 'transparent',
                  border: activeTab === 'settings' ? '1px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                  marginRight: '1rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  letterSpacing: '0.3px'
                }}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </Nav.Link>
              <Nav.Link
                href="#logout"
                className="nav-link-custom logout-btn"
                style={{
                  color: '#fff !important',
                  fontWeight: '600',
                  fontSize: '1rem',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '6px',
                  transition: 'all 0.3s ease',
                  backgroundColor: '#d32f2f',
                  border: '1px solid rgba(255,255,255,0.3)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  letterSpacing: '0.3px'
                }}
                onClick={handleLogout}
              >
                Logout
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div style={{ paddingTop: '80px', height: 'calc(100vh - 80px)' }}>
        <Container fluid style={{ height: '100%' }}>
          <Row style={{ height: '100%', margin: 0 }}>
            {/* Sidebar */}
            <Col md={3} lg={2} style={{
              height: '100%',
              position: 'sticky',
              top: '80px',
              overflowY: 'auto',
              padding: 0,
              backgroundColor: '#fff',
              borderRight: '1px solid #e9ecef'
            }}>
              {getSidebarContent()}
            </Col>

            {/* Main Content */}
            <Col md={9} lg={10} style={{ 
              height: '100%',
              overflowY: 'auto',
              padding: '1rem',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ 
                maxWidth: '1200px', 
                margin: '0 auto',
                minHeight: 'fit-content'
              }}>
                {renderContent()}
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* User Management Modal */}
      <Modal
        show={showUserModal}
        onHide={() => {
          setShowUserModal(false);
          setUserManagementError('');
          setUserManagementSuccess('');
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Edit User' : 'Create New User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userManagementError && (
            <Alert variant="danger" className="mb-3">
              {userManagementError}
            </Alert>
          )}

          {userManagementSuccess && (
            <Alert variant="success" className="mb-3">
              {userManagementSuccess}
            </Alert>
          )}

          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
                    placeholder="Enter username"
                    disabled={editingUser}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                    placeholder="Enter email"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={userFormData.firstName}
                    onChange={(e) => setUserFormData({...userFormData, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={userFormData.lastName}
                    onChange={(e) => setUserFormData({...userFormData, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    {userData && userData.role === 'superadmin' && (
                      <option value="superadmin">Super Admin</option>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Company</Form.Label>
              <Form.Control
                type="text"
                value={userFormData.company}
                onChange={(e) => setUserFormData({...userFormData, company: e.target.value})}
                placeholder="Enter company name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Password {!editingUser && '*'}
                {editingUser && <small className="text-muted">(leave blank to keep current password)</small>}
              </Form.Label>
              <Form.Control
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                placeholder={editingUser ? "Enter new password (optional)" : "Enter password"}
                required={!editingUser}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowUserModal(false);
              setUserManagementError('');
              setUserManagementSuccess('');
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUserFormSubmit}>
            {editingUser ? 'Update User' : 'Create User'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Device Management Modal */}
      <Modal
        show={showDeviceModal}
        onHide={() => {
          setShowDeviceModal(false);
          setDeviceManagementError('');
          setDeviceManagementSuccess('');
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingDevice ? 'Edit Device' : 'Create New Device'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deviceManagementError && (
            <Alert variant="danger" className="mb-3">
              {deviceManagementError}
            </Alert>
          )}

          {deviceManagementSuccess && (
            <Alert variant="success" className="mb-3">
              {deviceManagementSuccess}
            </Alert>
          )}

          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Device Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={deviceFormData.name}
                    onChange={(e) => setDeviceFormData({...deviceFormData, name: e.target.value})}
                    placeholder="Enter device name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model</Form.Label>
                  <Form.Control
                    type="text"
                    value={deviceFormData.model}
                    onChange={(e) => setDeviceFormData({...deviceFormData, model: e.target.value})}
                    placeholder="Enter device model"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={deviceFormData.description}
                onChange={(e) => setDeviceFormData({...deviceFormData, description: e.target.value})}
                placeholder="Enter device description"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Serial Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={deviceFormData.serialNumber}
                    onChange={(e) => setDeviceFormData({...deviceFormData, serialNumber: e.target.value})}
                    placeholder="Enter serial number"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={deviceFormData.category}
                    onChange={(e) => setDeviceFormData({...deviceFormData, category: e.target.value})}
                  >
                    <option value="">Select category</option>
                    <option value="Computer">Computer</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Printer">Printer</option>
                    <option value="Scanner">Scanner</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={deviceFormData.status}
                    onChange={(e) => setDeviceFormData({...deviceFormData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assigned To</Form.Label>
                  <Form.Control
                    type="text"
                    value={deviceFormData.assignedTo}
                    onChange={(e) => setDeviceFormData({...deviceFormData, assignedTo: e.target.value})}
                    placeholder="Enter username"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={deviceFormData.location}
                    onChange={(e) => setDeviceFormData({...deviceFormData, location: e.target.value})}
                    placeholder="Enter location"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purchase Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={deviceFormData.purchaseDate}
                    onChange={(e) => setDeviceFormData({...deviceFormData, purchaseDate: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Warranty Expiry</Form.Label>
              <Form.Control
                type="date"
                value={deviceFormData.warrantyExpiry}
                onChange={(e) => setDeviceFormData({...deviceFormData, warrantyExpiry: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeviceModal(false);
              setDeviceManagementError('');
              setDeviceManagementSuccess('');
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDeviceFormSubmit}>
            {editingDevice ? 'Update Device' : 'Create Device'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* GPS Map Modal with OpenStreetMap */}
      <Modal
        show={showMapModal}
        onHide={() => setShowMapModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            🗺️ Device Location - {selectedDeviceForTracking?.deviceName || 'Unknown Device'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDeviceForTracking && (() => {
            // Extract deviceId from QR code if available
            let deviceId = selectedDeviceForTracking.deviceId || selectedDeviceForTracking.id;
            try {
              if (selectedDeviceForTracking.qrCode) {
                const qrData = JSON.parse(selectedDeviceForTracking.qrCode);
                deviceId = qrData.deviceId || deviceId;
              }
            } catch (error) {
              console.warn('Could not parse QR code for modal display:', error);
            }
            return deviceLocations[deviceId];
          })() ? (() => {
            // Extract deviceId from QR code if available
            let deviceId = selectedDeviceForTracking.deviceId || selectedDeviceForTracking.id;
            try {
              if (selectedDeviceForTracking.qrCode) {
                const qrData = JSON.parse(selectedDeviceForTracking.qrCode);
                deviceId = qrData.deviceId || deviceId;
              }
            } catch (error) {
              console.warn('Could not parse QR code for modal display:', error);
            }

            const deviceData = deviceLocations[deviceId];

            return (
              <div>
                <div className="mb-3">
                  <Row>
                    <Col md={6}>
                      <strong>Device:</strong> {selectedDeviceForTracking.deviceName}<br />
                      <strong>Device ID:</strong> {deviceId}
                    </Col>
                    <Col md={6}>
                      <strong>Status:</strong> <Badge bg="success">Active</Badge><br />
                      <strong>Last Update:</strong> {new Date(deviceData.timestamp).toLocaleString()}
                    </Col>
                  </Row>
                </div>

                <div className="location-details mb-3">
                  <h6>📍 Location Details:</h6>
                  <Row>
                    <Col md={4}>
                      <strong>Latitude:</strong><br />
                      {deviceData.location.latitude.toFixed(6)}
                    </Col>
                    <Col md={4}>
                      <strong>Longitude:</strong><br />
                      {deviceData.location.longitude.toFixed(6)}
                    </Col>
                    <Col md={4}>
                      <strong>Accuracy:</strong><br />
                      {deviceData.location.accuracy}m
                    </Col>
                  </Row>
                </div>

              {/* OpenStreetMap Integration (FREE) */}
              <div
                id="simple-map-container"
                style={{
                  height: '400px',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  position: 'relative',
                  backgroundColor: '#f8f9fa'
                }}
              >
                {/* Map will be rendered here */}
              </div>

              {/* Map Controls */}
              <div className="mt-3 d-flex gap-2 justify-content-center flex-wrap">
                <Button
                  variant="primary"
                  onClick={() => {
                    const lat = deviceData.location.latitude;
                    const lng = deviceData.location.longitude;
                    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`;
                    window.open(osmUrl, '_blank');
                  }}
                >
                  🗺️ Open in OpenStreetMap
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => {
                    const lat = deviceData.location.latitude;
                    const lng = deviceData.location.longitude;
                    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                    window.open(googleMapsUrl, '_blank');
                  }}
                >
                  📍 Google Maps
                </Button>
                <Button
                  variant="outline-info"
                  onClick={() => {
                    const lat = deviceData.location.latitude;
                    const lng = deviceData.location.longitude;
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                    window.open(directionsUrl, '_blank');
                  }}
                >
                  🧭 Get Directions
                </Button>
                <Button
                  variant="outline-warning"
                  onClick={() => {
                    // Extract deviceId from QR code if available
                    let deviceId = selectedDeviceForTracking.deviceId || selectedDeviceForTracking.id;
                    try {
                      if (selectedDeviceForTracking.qrCode) {
                        const qrData = JSON.parse(selectedDeviceForTracking.qrCode);
                        deviceId = qrData.deviceId || deviceId;
                      }
                    } catch (error) {
                      console.warn('Could not parse QR code for refresh:', error);
                    }

                    if (deviceLocations[deviceId]) {
                      const location = deviceLocations[deviceId].location;
                      // Refresh the map with current location
                      setTimeout(() => {
                        createSimpleMap('simple-map-container', location, selectedDeviceForTracking.deviceName);
                      }, 100);
                    }
                  }}
                >
                  🔄 Refresh Map
                </Button>
              </div>

              <div className="mt-3">
                <small className="text-muted">
                  <strong>Note:</strong> In a production environment, this would show an interactive map with the device's real-time location.
                  For now, click "Open in Google Maps" to view the exact location.
                </small>
              </div>
            </div>
            );
          })() : (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
              <h5>No Location Data</h5>
              <p className="text-muted">No location data available for this device.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMapModal(false)}>
            Close
          </Button>
          {selectedDeviceForTracking && (() => {
            // Extract deviceId from QR code if available
            let deviceId = selectedDeviceForTracking.deviceId || selectedDeviceForTracking.id;
            try {
              if (selectedDeviceForTracking.qrCode) {
                const qrData = JSON.parse(selectedDeviceForTracking.qrCode);
                deviceId = qrData.deviceId || deviceId;
              }
            } catch (error) {
              console.warn('Could not parse QR code for footer buttons:', error);
            }
            return deviceLocations[deviceId];
          })() && (
            <>
              <Button
                variant="success"
                onClick={() => {
                  // Extract deviceId from QR code if available
                  let deviceId = selectedDeviceForTracking.deviceId || selectedDeviceForTracking.id;
                  try {
                    if (selectedDeviceForTracking.qrCode) {
                      const qrData = JSON.parse(selectedDeviceForTracking.qrCode);
                      deviceId = qrData.deviceId || deviceId;
                    }
                  } catch (error) {
                    console.warn('Could not parse QR code for OSM button:', error);
                  }

                  if (deviceLocations[deviceId]) {
                    const lat = deviceLocations[deviceId].location.latitude;
                    const lng = deviceLocations[deviceId].location.longitude;
                    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`;
                    window.open(osmUrl, '_blank');
                  }
                }}
              >
                🗺️ OpenStreetMap
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  // Extract deviceId from QR code if available
                  let deviceId = selectedDeviceForTracking.deviceId || selectedDeviceForTracking.id;
                  try {
                    if (selectedDeviceForTracking.qrCode) {
                      const qrData = JSON.parse(selectedDeviceForTracking.qrCode);
                      deviceId = qrData.deviceId || deviceId;
                    }
                  } catch (error) {
                    console.warn('Could not parse QR code for Google Maps button:', error);
                  }

                  if (deviceLocations[deviceId]) {
                    const lat = deviceLocations[deviceId].location.latitude;
                    const lng = deviceLocations[deviceId].location.longitude;
                    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                    window.open(googleMapsUrl, '_blank');
                  }
                }}
              >
                📍 Google Maps
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      <style>
        {`
          .custom-navbar {
            background: linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%) !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.15) !important;
          }
          .custom-navbar .navbar-nav .nav-link {
            color: #fff !important;
          }
          .custom-navbar .navbar-brand {
            color: #fff !important;
          }
          .nav-link-custom:hover {
            background-color: rgba(255,255,255,0.1) !important;
            border-color: rgba(255,255,255,0.4) !important;
            transform: translateY(-1px);
          }
          .navbar-brand-custom:hover {
            background-color: rgba(255,255,255,0.1) !important;
            border-color: rgba(255,255,255,0.4) !important;
            transform: translateY(-1px);
          }
          .logout-btn:hover {
            background-color: #b71c1c !important;
            transform: translateY(-1px);
          }
          .dashboard-sidebar {
            height: calc(100vh - 70px);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #4a148c #f0e6ff;
          }

          .dashboard-sidebar::-webkit-scrollbar {
            width: 6px;
          }

          .dashboard-sidebar::-webkit-scrollbar-track {
            background: #f0e6ff;
          }

          .dashboard-sidebar::-webkit-scrollbar-thumb {
            background-color: #4a148c;
            border-radius: 3px;
          }

          .sidebar-section .accordion-button:not(.collapsed) {
            background-color: #f8f5ff;
            color: #4a148c;
            box-shadow: none;
          }

          .sidebar-section .accordion-button:focus {
            box-shadow: none;
            border-color: transparent;
          }

          .sidebar-section .accordion-button::after {
            background-size: 1rem;
            transition: all 0.3s ease;
          }

          .sidebar-item.active {
            background-color: #f0e6ff !important;
            border-left: 4px solid #4a148c !important;
          }

          .sidebar-item:hover {
            background-color: #f8f5ff !important;
            border-left: 4px solid #7b1fa2 !important;
          }
        `}
      </style>

      {/* COMMENTED OUT: Old GPS Tracker Modals - Not working correctly */}
      {/*
      <EnhancedGPSTracker
        show={showEnhancedGPSTracker}
        onHide={() => {
          setShowEnhancedGPSTracker(false);
          setSelectedDeviceForEnhancedTracking(null);
        }}
        device={selectedDeviceForEnhancedTracking}
        onLocationUpdate={handleEnhancedLocationUpdate}
      />

      <MapboxGPSTracker
        show={showMapboxTracker}
        onHide={() => {
          setShowMapboxTracker(false);
          setSelectedDeviceForEnhancedTracking(null);
        }}
        device={selectedDeviceForEnhancedTracking}
        onLocationUpdate={handleEnhancedLocationUpdate}
      />

      <EmbeddedMapsGPSTracker
        show={showEmbeddedMapsTracker}
        onHide={() => {
          setShowEmbeddedMapsTracker(false);
          setSelectedDeviceForEnhancedTracking(null);
        }}
        device={selectedDeviceForEnhancedTracking}
        onLocationUpdate={handleEnhancedLocationUpdate}
      />
      */}

      {/* NEW: Geoapify GPS Tracker Modal - Fast and Reliable */}
      <GeoapifyGPSTracker
        show={showGeoapifyTracker}
        onHide={() => {
          setShowGeoapifyTracker(false);
          setSelectedDeviceForEnhancedTracking(null);
        }}
        device={selectedDeviceForEnhancedTracking}
        onLocationUpdate={handleEnhancedLocationUpdate}
      />

      {/* NEW SYSTEM: QR Code Generation Modal */}
      <Modal show={showQRGenerationModal} onHide={() => setShowQRGenerationModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>🔲 Generate QR Codes for Devices</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label><strong>Number of Devices/QR Codes to Generate</strong></Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="50"
                value={qrGenerationCount}
                onChange={(e) => setQrGenerationCount(parseInt(e.target.value) || 1)}
                style={{ fontSize: '1.2rem', padding: '0.75rem' }}
              />
              <Form.Text className="text-muted">
                📱 Each QR code represents one device slot with a unique 16-digit code<br/>
                👥 All users will be able to see these QR codes and assign their devices
              </Form.Text>
            </Form.Group>

            <Alert variant="info">
              <h6>📋 What happens after generation:</h6>
              <ul className="mb-0">
                <li>✅ {qrGenerationCount} QR codes will be created</li>
                <li>👀 All users can see these QR codes</li>
                <li>📱 Users can assign their devices to available QR codes</li>
                <li>🔒 Once assigned, only that user can use the QR code</li>
                <li>📍 QR codes enable GPS tracking when scanned</li>
              </ul>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQRGenerationModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            size="lg"
            onClick={() => generateQRCodes(qrGenerationCount)}
            style={{ padding: '0.75rem 2rem' }}
          >
            🚀 Generate {qrGenerationCount} QR Code{qrGenerationCount > 1 ? 's' : ''} for Devices
          </Button>
        </Modal.Footer>
      </Modal>

      {/* NEW SYSTEM: QR Code Management Modal - Visual Display */}
      <Modal show={showQRManagementModal} onHide={() => setShowQRManagementModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>📋 All Generated QR Codes - Device Management</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="mb-4">
            <h6>📊 QR Code Statistics</h6>
            <div className="d-flex gap-3 mb-3">
              <Badge bg="secondary" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                Total: {generatedQRCodes.length}
              </Badge>
              <Badge bg="success" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                Available: {generatedQRCodes.filter(qr => qr.status === 'available').length}
              </Badge>
              <Badge bg="warning" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                Assigned: {generatedQRCodes.filter(qr => qr.status === 'assigned').length}
              </Badge>
              <Badge bg="info" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                Active: {generatedQRCodes.filter(qr => qr.status === 'active').length}
              </Badge>
            </div>
          </div>

          {generatedQRCodes.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔲</div>
              <h4>No QR Codes Generated</h4>
              <p className="text-muted">Click "Generate QR Codes" to create device QR codes</p>
            </div>
          ) : (
            <Row>
              {generatedQRCodes.map((qr) => (
                <Col md={4} lg={3} key={qr.id} className="mb-4">
                  <Card className={`h-100 ${
                    qr.status === 'available' ? 'border-success' :
                    qr.status === 'assigned' ? 'border-warning' : 'border-info'
                  }`}>
                    <Card.Body className="text-center">
                      {/* Actual QR Code Image */}
                      <div
                        style={{
                          width: '120px',
                          height: '120px',
                          margin: '0 auto 1rem',
                          border: '2px solid #dee2e6',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#ffffff',
                          overflow: 'hidden'
                        }}
                      >
                        {qr.qrCodeImage ? (
                          <img
                            src={qr.qrCodeImage}
                            alt={`QR Code ${qr.code}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        ) : (
                          <div style={{ fontSize: '2rem', color: '#6c757d' }}>🔲</div>
                        )}
                      </div>

                      {/* QR Code Details */}
                      <h6 className="mb-2">Device QR Code</h6>
                      <div className="mb-2">
                        <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                          {getDisplayCode(qr)}
                        </code>
                      </div>

                      <Badge
                        bg={
                          qr.status === 'available' ? 'success' :
                          qr.status === 'assigned' ? 'warning' : 'info'
                        }
                        className="mb-2"
                      >
                        {qr.status.toUpperCase()}
                      </Badge>

                      {qr.assignedTo && (
                        <div className="mb-2">
                          <small className="text-muted">Assigned to:</small><br/>
                          <strong>{qr.assignedTo}</strong>
                        </div>
                      )}

                      {qr.deviceDetails && (
                        <div className="mb-2">
                          <small className="text-muted">Device:</small><br/>
                          <strong>{qr.deviceDetails.deviceName}</strong>
                        </div>
                      )}

                      <div className="mb-3">
                        <small className="text-muted">
                          Created: {new Date(qr.createdAt).toLocaleDateString()}<br/>
                          By: {qr.createdBy}
                        </small>
                      </div>

                      {/* Actions */}
                      <div className="d-grid gap-1">
                        {canViewQRCode(qr) && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => viewQRCode(qr)}
                          >
                            🔍 View Large
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => downloadQRCode(qr)}
                        >
                          💾 Download
                        </Button>
                        <Button
                          size="sm"
                          variant="info"
                          onClick={() => printQRCode(qr)}
                        >
                          🖨️ Print
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => {
                            // Copy QR code to clipboard
                            navigator.clipboard.writeText(qr.code);
                            alert('QR code copied to clipboard!');
                          }}
                        >
                          📋 Copy Code
                        </Button>
                        {!qr.qrCodeImage && (
                          <Button
                            size="sm"
                            variant="warning"
                            onClick={() => regenerateQRCodeImage(qr.id)}
                          >
                            🔄 Generate Image
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => deleteQRCode(qr.id)}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm(`⚠️ DELETE ALL QR CODES?\n\nThis will permanently delete all ${generatedQRCodes.length} QR codes and cannot be undone.\n\nAre you sure?`)) {
                  localStorage.removeItem('generatedQRCodes');
                  setGeneratedQRCodes([]);
                  setShowQRManagementModal(false);
                  alert('✅ All QR codes have been deleted successfully!');
                }
              }}
              disabled={generatedQRCodes.length === 0}
            >
              🗑️ Delete All QR Codes ({generatedQRCodes.length})
            </Button>

            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => setShowQRManagementModal(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowQRManagementModal(false);
                  setShowQRGenerationModal(true);
                }}
              >
                ➕ Generate More QR Codes
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* NEW SYSTEM: Device Assignment Modal */}
      <Modal show={showDeviceAssignmentModal} onHide={() => setShowDeviceAssignmentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>📱 Assign Device to QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedQRForAssignment && (
            <div className="mb-3">
              <Alert variant="info">
                <strong>QR Code:</strong> <code>{selectedQRForAssignment.code}</code>
              </Alert>
            </div>
          )}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Device Name *</Form.Label>
              <Form.Control
                type="text"
                value={deviceAssignmentData.deviceName}
                onChange={(e) => setDeviceAssignmentData(prev => ({
                  ...prev,
                  deviceName: e.target.value
                }))}
                placeholder="Enter device name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Device Model</Form.Label>
              <Form.Control
                type="text"
                value={deviceAssignmentData.deviceModel}
                onChange={(e) => setDeviceAssignmentData(prev => ({
                  ...prev,
                  deviceModel: e.target.value
                }))}
                placeholder="Enter device model"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Device Type</Form.Label>
              <Form.Select
                value={deviceAssignmentData.deviceType}
                onChange={(e) => setDeviceAssignmentData(prev => ({
                  ...prev,
                  deviceType: e.target.value
                }))}
              >
                <option value="">Select device type</option>
                <option value="smartphone">Smartphone</option>
                <option value="tablet">Tablet</option>
                <option value="laptop">Laptop</option>
                <option value="vehicle">Vehicle Tracker</option>
                <option value="asset">Asset Tracker</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Serial Number</Form.Label>
              <Form.Control
                type="text"
                value={deviceAssignmentData.serialNumber}
                onChange={(e) => setDeviceAssignmentData(prev => ({
                  ...prev,
                  serialNumber: e.target.value
                }))}
                placeholder="Enter serial number"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={deviceAssignmentData.description}
                onChange={(e) => setDeviceAssignmentData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="Enter device description"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeviceAssignmentModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => assignDeviceToQR(selectedQRForAssignment, deviceAssignmentData)}
            disabled={!deviceAssignmentData.deviceName}
          >
            Assign Device
          </Button>
        </Modal.Footer>
      </Modal>

      {/* QR Code Viewer Modal */}
      <Modal show={showQRViewModal} onHide={() => setShowQRViewModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>🔍 QR Code Viewer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedQRForView && (
            <>
              <div className="mb-4">
                <h5>Device QR Code</h5>
                <div
                  style={{
                    width: '300px',
                    height: '300px',
                    margin: '0 auto',
                    border: '3px solid #dee2e6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    overflow: 'hidden'
                  }}
                >
                  {selectedQRForView.qrCodeImage ? (
                    <img
                      src={selectedQRForView.qrCodeImage}
                      alt={`QR Code ${selectedQRForView.code}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '4rem', color: '#6c757d' }}>🔲</div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h6>QR Code Details</h6>
                <Table bordered className="mb-0">
                  <tbody>
                    <tr>
                      <td><strong>16-Digit Code</strong></td>
                      <td><code>{selectedQRForView.code}</code></td>
                    </tr>
                    <tr>
                      <td><strong>Status</strong></td>
                      <td>
                        <Badge bg={
                          selectedQRForView.status === 'available' ? 'success' :
                          selectedQRForView.status === 'assigned' ? 'warning' : 'info'
                        }>
                          {selectedQRForView.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                    {selectedQRForView.assignedTo && (
                      <tr>
                        <td><strong>Assigned To</strong></td>
                        <td>{selectedQRForView.assignedTo}</td>
                      </tr>
                    )}
                    {selectedQRForView.deviceDetails && (
                      <>
                        <tr>
                          <td><strong>Device Name</strong></td>
                          <td>{selectedQRForView.deviceDetails.deviceName}</td>
                        </tr>
                        <tr>
                          <td><strong>Device Model</strong></td>
                          <td>{selectedQRForView.deviceDetails.deviceModel || 'Not specified'}</td>
                        </tr>
                        <tr>
                          <td><strong>Device Type</strong></td>
                          <td>{selectedQRForView.deviceDetails.deviceType || 'Not specified'}</td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td><strong>Created</strong></td>
                      <td>{new Date(selectedQRForView.createdAt).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td><strong>Created By</strong></td>
                      <td>{selectedQRForView.createdBy}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              <div className="d-flex gap-2 justify-content-center">
                <Button variant="success" onClick={() => downloadQRCode(selectedQRForView)}>
                  💾 Download QR Code
                </Button>
                <Button variant="info" onClick={() => printQRCode(selectedQRForView)}>
                  🖨️ Print QR Code
                </Button>
                <Button variant="outline-secondary" onClick={() => {
                  navigator.clipboard.writeText(selectedQRForView.code);
                  alert('QR code copied to clipboard!');
                }}>
                  📋 Copy Code
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQRViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Simple Scanned Device Details Modal */}
      <Modal
        show={showScannedDeviceModal}
        onHide={() => setShowScannedDeviceModal(false)}
        size="md"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>📱 Device Scanned</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {scannedDeviceDetails ? (
            <>
              <Alert variant="success" className="text-center mb-3">
                <h5 className="mb-1">✅ Scan Successful!</h5>
                <small>Device information retrieved</small>
              </Alert>

              {/* Simple Device Info */}
              <Card>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6>📱 Device Information</h6>
                      <p><strong>Device ID:</strong> <code>{scannedDeviceDetails.deviceId}</code></p>
                      <p><strong>Device Name:</strong> {scannedDeviceDetails.deviceName}</p>
                      <p><strong>Status:</strong>
                        <Badge bg={scannedDeviceDetails.status === 'assigned' ? 'success' : 'warning'} className="ms-2">
                          {scannedDeviceDetails.status}
                        </Badge>
                      </p>
                      <p><strong>Assigned To:</strong> {scannedDeviceDetails.assignedTo}</p>
                    </Col>
                    <Col md={6}>
                      <h6>⏰ Scan Details</h6>
                      <p><strong>Scanned At:</strong><br/>
                        <small>{new Date(scannedDeviceDetails.scannedAt).toLocaleString()}</small>
                      </p>
                      <p><strong>Scanned By:</strong> {scannedDeviceDetails.scannedBy}</p>

                      {/* Path Tracking Status */}
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="info"
                          onClick={() => {
                            const trackingKey = `realtime_tracking_${scannedDeviceDetails.deviceId}`;
                            const path = JSON.parse(localStorage.getItem(trackingKey) || '[]');
                            if (path.length > 0) {
                              alert(`📍 Path Points Recorded: ${path.length}\n\nLatest Location:\nLat: ${path[path.length-1].latitude}\nLng: ${path[path.length-1].longitude}\nTime: ${new Date(path[path.length-1].timestamp).toLocaleString()}`);
                            } else {
                              alert('No path data recorded yet. Start GPS tracking and move the device to see path points.');
                            }
                          }}
                        >
                          📊 View Path Data
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>


            </>
          ) : (
            <div className="text-center">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
              <h5>No Device Details Available</h5>
              <p className="text-muted">Unable to retrieve device information from the scanned QR code.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <div className="d-flex gap-2">
              {scannedDeviceDetails && (
                <>
                  <Button
                    variant="info"
                    onClick={() => {
                      setSelectedDeviceForMap(scannedDeviceDetails);
                      setShowRealTimeMap(true);
                      setShowScannedDeviceModal(false);
                    }}
                  >
                    🗺️ View Map
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => {
                      startEnhancedGPSTracking(scannedDeviceDetails);
                      setSelectedDeviceForMap(scannedDeviceDetails);
                      setShowRealTimeMap(true);
                      setShowScannedDeviceModal(false);
                    }}
                  >
                    📍 Start GPS Tracking
                  </Button>

                </>
              )}
            </div>
            <div>
              <Button variant="secondary" onClick={() => setShowScannedDeviceModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Real-Time GPS Path Tracker Modal */}
      {showRealTimeTracker && selectedDeviceForRealTimeTracking && (
        <RealTimeGPSTracker
          deviceId={selectedDeviceForRealTimeTracking.id}
          deviceName={selectedDeviceForRealTimeTracking.name}
          onClose={closeRealTimeTracking}
        />
      )}

      {/* Real-Time Path Map Modal */}
      {showRealTimeMap && selectedDeviceForMap && (
        <Modal
          show={showRealTimeMap}
          onHide={() => setShowRealTimeMap(false)}
          size="xl"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>🗺️ Real-Time Path Tracking</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 0, height: '70vh' }}>
            <RealTimePathMap
              deviceData={deviceLocations[selectedDeviceForMap.deviceId || selectedDeviceForMap.id] || {
                deviceId: selectedDeviceForMap.deviceId || selectedDeviceForMap.id,
                deviceName: selectedDeviceForMap.deviceName || selectedDeviceForMap.deviceDetails?.deviceName,
                location: currentLocation,
                path: [],
                isRealTime: false
              }}
              onClose={() => setShowRealTimeMap(false)}
            />
          </Modal.Body>
        </Modal>
      )}

      {/* 🔴 QR-to-Postman Path Tracker Modal */}
      {showQRToPostmanTracker && qrScanLocationData && trackedDeviceId && (
        <Modal
          show={showQRToPostmanTracker}
          onHide={() => {
            setShowQRToPostmanTracker(false);
            setQrScanLocationData(null);
            setTrackedDeviceId(null);
          }}
          size="xl"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>🗺️ QR Scan → Postman Path Tracking</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 0, height: '70vh' }}>
            {qrScanLocationData && trackedDeviceId ? (
              <QRToPostmanPathTracker
                deviceId={trackedDeviceId}
                deviceName={qrScanLocationData.deviceName || 'Unknown Device'}
                qrScanLocation={qrScanLocationData}
                onClose={() => {
                  setShowQRToPostmanTracker(false);
                  setQrScanLocationData(null);
                  setTrackedDeviceId(null);
                }}
              />
            ) : (
              <Alert variant="warning" className="m-3">
                <h6>⚠️ Missing Data</h6>
                <p>QR scan location data is missing. Please scan a QR code first.</p>
                <Button
                  variant="secondary"
                  onClick={() => setShowQRToPostmanTracker(false)}
                >
                  Close
                </Button>
              </Alert>
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* 🔴 QR-to-Postman Path Tracker Modal */}
      {showQRToPostmanTracker && qrScanLocationData && trackedDeviceId && (
        <Modal
          show={showQRToPostmanTracker}
          onHide={() => setShowQRToPostmanTracker(false)}
          size="xl"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>🗺️ QR Scan → Postman Path Tracking</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 0, height: '70vh' }}>
            <QRToPostmanPathTracker
              deviceId={trackedDeviceId}
              deviceName={qrScanLocationData.deviceName}
              qrScanLocation={qrScanLocationData}
              onClose={() => setShowQRToPostmanTracker(false)}
            />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default WelcomePage