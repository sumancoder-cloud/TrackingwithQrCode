import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Row, Col, Card, Button, ListGroup, Accordion, Table, Badge, Form, Alert, Modal, InputGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';
import usePreventNavigation from '../hooks/usePreventNavigation';
import { useResponsive } from '../hooks/useResponsive';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Swal from 'sweetalert2';
import { FaUsers, FaQrcode, FaMapMarkerAlt, FaChartBar, FaChartPie, FaChartLine, FaChartArea, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import GeoapifyGPSTracker from './GeoapifyGPSTracker';
import GeoapifyMap from './GeoapifyMap';
import QRCode from 'qrcode';
import api from '../services/api';
import gpsApi from '../services/gpsApi';
import RealTimeGPSTracker from './RealTimeGPSTracker';
import RealTimePathMap from './RealTimePathMap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// QR Code Display Component - Simple and Working
const QRCodeDisplay = ({ qrData, size = 120 }) => {
  const [qrImageSrc, setQrImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQRImage = async () => {
      try {
        setLoading(true);


        const qrImageData = await QRCode.toDataURL(qrData, {
          width: size,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        console.log('✅ QR code generated successfully for:', qrData);
        setQrImageSrc(qrImageData);
      } catch (error) {
        console.error('❌ Error generating QR code for', qrData, ':', error);
        setQrImageSrc(null);
      } finally {
        setLoading(false);
      }
    };

    if (qrData) {
      generateQRImage();
    }
  }, [qrData, size]);

  if (loading) {
    return (
      <div style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Loading QR...</div>
      </div>
    );
  }

  if (!qrImageSrc) {
    return (
      <div style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        flexDirection: 'column',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>❌</div>
        <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>QR Error</div>
      </div>
    );
  }

  return (
    <img
      src={qrImageSrc}
      alt={`QR Code: ${qrData}`}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: '4px',
        border: '1px solid #dee2e6'
      }}
    />
  );
};

// SVG Icons Component
const SVGIcons = {
  QRCode: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" stroke={color} strokeWidth="2" fill="none"/>
      <path d="M5 5h3v3H5V5zm0 11h3v3H5v-3zm11-11h3v3h-3V5zm0 11h3v3h-3v-3z" fill={color}/>
    </svg>
  ),
  Upload: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2"/>
      <polyline points="7,10 12,5 17,10" stroke={color} strokeWidth="2"/>
      <line x1="12" y1="5" x2="12" y2="15" stroke={color} strokeWidth="2"/>
    </svg>
  ),
  Edit: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2"/>
    </svg>
  ),
  Location: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2"/>
      <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2"/>
    </svg>
  ),
  Refresh: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="23,4 23,10 17,10" stroke={color} strokeWidth="2"/>
      <polyline points="1,20 1,14 7,14" stroke={color} strokeWidth="2"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke={color} strokeWidth="2"/>
    </svg>
  ),
  Map: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2 1,6" stroke={color} strokeWidth="2" fill="none"/>
      <line x1="8" y1="2" x2="8" y2="18" stroke={color} strokeWidth="2"/>
      <line x1="16" y1="6" x2="16" y2="22" stroke={color} strokeWidth="2"/>
    </svg>
  ),
  Device: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke={color} strokeWidth="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth="2"/>
    </svg>
  ),
  Search: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2"/>
      <path d="m21 21-4.35-4.35" stroke={color} strokeWidth="2"/>
    </svg>
  ),
  StartPoint: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill={color} stroke="white" strokeWidth="2"/>
      <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),
  EndPoint: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26" fill={color} stroke="white" strokeWidth="1"/>
    </svg>
  ),
  CurrentLocation: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" fill={color}/>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="12" stroke={color} strokeWidth="1" fill="none" opacity="0.3"/>
    </svg>
  )
};


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

  // Responsive design hook
  const { isMobile, isTablet, isDesktop, isDevToolsOpen, getResponsivePadding, getResponsiveModalSize } = useResponsive();

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

  // Mobile responsive state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Device Upload States
  const [deviceUploadMethod, setDeviceUploadMethod] = useState('scan'); // 'scan', 'upload', 'manual'
  const [uploadedQRFile, setUploadedQRFile] = useState(null);
  const [manualDeviceCode, setManualDeviceCode] = useState('');
  const [deviceDescription, setDeviceDescription] = useState('');
  const [devicePurpose, setDevicePurpose] = useState('');
  const [showDeviceFormModal, setShowDeviceFormModal] = useState(false);
  const [userDevices, setUserDevices] = useState([]);
  const [scannedDeviceCode, setScannedDeviceCode] = useState('');
  const [adminDeviceUploads, setAdminDeviceUploads] = useState([]);
  const [qrScanCallback, setQRScanCallback] = useState(null);

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
  const [adminQRCodes, setAdminQRCodes] = useState([]);
  // REMOVED: Device request details (replaced by QR code system)

  // Statistics states
  const [statisticsData, setStatisticsData] = useState({
    users: { total: 0, active: 0, inactive: 0, byRole: { user: 0, admin: 0, superadmin: 0 } },
    devices: { total: 0, assigned: 0, unassigned: 0, byStatus: { active: 0, inactive: 0 } },
    qrCodes: { total: 0, generated: 0, assigned: 0, scanned: 0 },
    locations: { total: 0, recent: 0, bySource: { manual: 0, automatic: 0 } },
    activity: {
      daily: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        users: 0,
        devices: 0,
        locations: 0
      })).reverse(),
      weekly: Array.from({ length: 4 }, (_, i) => ({
        week: `Week ${i + 1}`,
        users: 0,
        devices: 0,
        locations: 0
      })),
      monthly: Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          users: 0,
          devices: 0,
          locations: 0
        };
      }).reverse()
    }
  });
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState('');

  // User Management states
  const [allUsers, setAllUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // QR Management states
  const [allQRCodes, setAllQRCodes] = useState([]); // Only assigned QR codes (for QR Management section)

  const [showQRModal, setShowQRModal] = useState(false);
  const [editingQR, setEditingQR] = useState(null);
  const [qrFormData, setQRFormData] = useState({
    deviceCode: '',
    deviceName: '',
    purpose: '',
    description: '',
    assignedTo: '',
    status: 'active'
  });
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

  const [selectedDeviceForEnhancedTracking, setSelectedDeviceForEnhancedTracking] = useState(null);

  // Geoapify GPS Tracker states
  const [showGeoapifyTracker, setShowGeoapifyTracker] = useState(false);
  const [gpsTrackerMode, setGpsTrackerMode] = useState('geoapify');

  // Calendar and History states
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [dateRangeHistory, setDateRangeHistory] = useState([]);
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showPathLines, setShowPathLines] = useState(true);

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

  // Statistics Functions
  const loadStatisticsData = useCallback(async () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return;
    }

    setStatisticsLoading(true);
    setStatisticsError('');

    try {


      // Use existing data that's already loaded in the component
      let users = Array.isArray(allUsers) ? allUsers : [];
      let devices = Array.isArray(allDevices) ? allDevices : [];
      let locations = [];



      // If no existing data, try to load fresh data
      if (users.length === 0) {
        try {

          const usersResponse = await api.getAllUsers();
          const userData = usersResponse.data || usersResponse;
          users = Array.isArray(userData) ? userData : [];

        } catch (error) {
          console.warn('⚠️ Failed to load fresh users:', error.message);
          users = [];
        }
      } else {

      }

      if (devices.length === 0) {
        try {

          const devicesResponse = await api.getAllDevices();
          const deviceData = devicesResponse.data || devicesResponse;
          devices = Array.isArray(deviceData) ? deviceData : [];

        } catch (error) {
          console.warn('⚠️ Failed to load fresh devices:', error.message);
          devices = [];
        }
      } else {

      }

      // Try to load locations data (optional)
      try {

        const locationsResponse = await api.getAllLocations();
        locations = locationsResponse.data || locationsResponse || [];

      } catch (error) {
        console.warn('⚠️ Failed to load locations (using fallback):', error.message);
        // Generate some sample location data for demonstration
        locations = Array.from({ length: Math.floor(Math.random() * 50) + 10 }, (_, i) => ({
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          source: Math.random() > 0.5 ? 'manual' : 'automatic'
        }));
      }

      // Process statistics with array validation


      // Ensure arrays are valid
      const validUsers = Array.isArray(users) ? users : [];
      const validDevices = Array.isArray(devices) ? devices : [];
      const validLocations = Array.isArray(locations) ? locations : [];

      const stats = {
        users: {
          total: validUsers.length,
          active: validUsers.filter(u => u && u.status === 'active').length,
          inactive: validUsers.filter(u => u && u.status !== 'active').length,
          byRole: validUsers.reduce((acc, user) => {
            if (user && user.role) {
              acc[user.role] = (acc[user.role] || 0) + 1;
            }
            return acc;
          }, {})
        },
        devices: {
          total: validDevices.length,
          assigned: validDevices.filter(d => d && d.assignedTo).length,
          unassigned: validDevices.filter(d => d && !d.assignedTo).length,
          byStatus: validDevices.reduce((acc, device) => {
            if (device && device.status) {
              acc[device.status] = (acc[device.status] || 0) + 1;
            }
            return acc;
          }, {})
        },
        qrCodes: {
          total: validDevices.length,
          generated: validDevices.length,
          assigned: validDevices.filter(d => d && d.assignedTo).length,
          scanned: validDevices.filter(d => d && d.lastScanned).length
        },
        locations: {
          total: validLocations.length,
          recent: validLocations.filter(l => l && l.timestamp && new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
          bySource: validLocations.reduce((acc, location) => {
            if (location && location.source) {
              acc[location.source] = (acc[location.source] || 0) + 1;
            }
            return acc;
          }, {})
        },
        activity: {
          daily: generateDailyActivity(validUsers, validDevices, validLocations),
          weekly: generateWeeklyActivity(validUsers, validDevices, validLocations),
          monthly: generateMonthlyActivity(validUsers, validDevices, validLocations)
        }
      };

      setStatisticsData(stats);
      console.log('✅ Statistics data loaded:', stats);

    } catch (error) {
      console.error('❌ Error loading statistics:', error);
      setStatisticsError('Failed to load statistics data');

      // Set fallback data to prevent UI errors
      setStatisticsData({
        users: { total: 0, active: 0, inactive: 0, byRole: { user: 0, admin: 0, superadmin: 0 } },
        devices: { total: 0, assigned: 0, unassigned: 0, byStatus: { active: 0, inactive: 0 } },
        qrCodes: { total: 0, generated: 0, assigned: 0, scanned: 0 },
        locations: { total: 0, recent: 0, bySource: { manual: 0, automatic: 0 } },
        activity: {
          daily: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            users: 0,
            devices: 0,
            locations: 0
          })).reverse(),
          weekly: Array.from({ length: 4 }, (_, i) => ({
            week: `Week ${i + 1}`,
            users: 0,
            devices: 0,
            locations: 0
          })),
          monthly: Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return {
              month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              users: 0,
              devices: 0,
              locations: 0
            };
          }).reverse()
        }
      });
    } finally {
      setStatisticsLoading(false);
    }
  }, [userData, allUsers, allDevices]);

  // Helper functions for activity data
  const generateDailyActivity = (users, devices, locations) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      last7Days.push({
        date: dateStr,
        users: users.filter(u => u.createdAt && u.createdAt.startsWith(dateStr)).length,
        devices: devices.filter(d => d.createdAt && d.createdAt.startsWith(dateStr)).length,
        locations: locations.filter(l => l.timestamp && l.timestamp.startsWith(dateStr)).length
      });
    }
    return last7Days;
  };

  const generateWeeklyActivity = (users, devices, locations) => {
    const last4Weeks = [];
    for (let i = 3; i >= 0; i--) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i + 1) * 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - i * 7);

      last4Weeks.push({
        week: `Week ${4 - i}`,
        users: users.filter(u => u.createdAt && new Date(u.createdAt) >= startDate && new Date(u.createdAt) < endDate).length,
        devices: devices.filter(d => d.createdAt && new Date(d.createdAt) >= startDate && new Date(d.createdAt) < endDate).length,
        locations: locations.filter(l => l.timestamp && new Date(l.timestamp) >= startDate && new Date(l.timestamp) < endDate).length
      });
    }
    return last4Weeks;
  };

  const generateMonthlyActivity = (users, devices, locations) => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7); // YYYY-MM

      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: users.filter(u => u.createdAt && u.createdAt.startsWith(monthStr)).length,
        devices: devices.filter(d => d.createdAt && d.createdAt.startsWith(monthStr)).length,
        locations: locations.filter(l => l.timestamp && l.timestamp.startsWith(monthStr)).length
      });
    }
    return last6Months;
  };

  // User Management Functions - Updated to use actual gpstracker database
  const loadAllUsers = useCallback(async () => {
    if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
      try {


        // Try to load from gpstracker database API first
        try {

          const response = await api.getAllUsers();


          if (response.success && response.data) {
            // Backend returns: { success: true, data: { users: [...], pagination: {...} } }
            const users = response.data.users || response.data;
            if (Array.isArray(users)) {
              setAllUsers(users);
              console.log('✅ SUCCESS: Loaded', users.length, 'users from gpstracker database');
              console.log('👥 Users from database:', users);
              return;
            } else {
              console.warn('⚠️ Users data is not an array:', users);
            }
          } else {
            console.warn('⚠️ API response not successful or no data:', response);
          }
        } catch (apiError) {
          console.error('❌ API call failed:', apiError);
          console.error('❌ Error details:', {
            message: apiError.message,
            response: apiError.response,
            status: apiError.response?.status
          });
        }

        // Try direct fetch as a backup
        try {
          console.log('🔄 Trying direct fetch to /api/users on port 5001...');
          const directResponse = await fetch('http://localhost:5001/api/users');

          if (directResponse.ok) {
            const data = await directResponse.json();
            console.log('📋 Direct fetch response:', data);

            if (data.success && data.data) {
              // Backend returns: { success: true, data: { users: [...], pagination: {...} } }
              const users = data.data.users || data.data;
              if (Array.isArray(users)) {
                setAllUsers(users);
                console.log('✅ SUCCESS: Loaded', users.length, 'users from direct fetch');
                return;
              }
            }
          } else {
            console.warn('⚠️ Direct fetch failed with status:', directResponse.status);
          }
        } catch (fetchError) {
          console.error('❌ Direct fetch failed:', fetchError);
        }

        // Last resort: Fallback to localStorage (for development)
        console.log('⚠️ All API attempts failed, falling back to localStorage');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const usersArray = Array.isArray(users) ? users : [];
        setAllUsers(usersArray);
        console.log('✅ Loaded users from localStorage:', usersArray.length, 'users');
        console.log('📋 User details:', usersArray);
      } catch (error) {
        console.error('❌ Error loading users:', error);
        setAllUsers([]); // Always ensure it's an empty array
      }
    }
  }, [userData]);

  // Auto-load users when component mounts for admin/super admin
  useEffect(() => {
    if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
      loadAllUsers();
    }
  }, [userData, loadAllUsers]);

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

  const handleDeleteUser = async (user) => {
    if (user.username === userData.username) {
      alert('You cannot delete your own account');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      try {
        console.log('🗑️ Deleting user from database:', user._id);

        // Use MongoDB API to delete user
        const response = await api.deleteUser(user._id);

        if (response.success) {
          setUserManagementSuccess(`User "${user.username}" deleted successfully`);
          loadAllUsers(); // Reload users from database
          setTimeout(() => setUserManagementSuccess(''), 3000);
        } else {
          throw new Error(response.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('❌ Error deleting user:', error);
        setUserManagementError(error.message || 'Failed to delete user');
        setTimeout(() => setUserManagementError(''), 5000);
      }
    }
  };

  const handleUserFormSubmit = async () => {
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
      console.log('👥 Saving user to database...', userFormData);

      if (editingUser) {
        // Update existing user via MongoDB API
        console.log('✏️ Updating user:', editingUser._id);

        const updateData = {
          firstName: userFormData.firstName,
          lastName: userFormData.lastName,
          email: userFormData.email,
          role: userFormData.role,
          company: userFormData.company,
          phone: userFormData.phone
        };

        // Only include password if provided
        if (userFormData.password) {
          updateData.password = userFormData.password;
        }

        const response = await api.updateUser(editingUser._id, updateData);

        if (response.success) {
          setUserManagementSuccess(`User "${userFormData.username}" updated successfully`);
        } else {
          throw new Error(response.message || 'Failed to update user');
        }
      } else {
        // Create new user via MongoDB API
        console.log('➕ Creating new user');

        const newUserData = {
          username: userFormData.username,
          email: userFormData.email,
          password: userFormData.password,
          firstName: userFormData.firstName,
          lastName: userFormData.lastName,
          role: userFormData.role,
          company: userFormData.company,
          phone: userFormData.phone
        };

        const response = await api.createUser(newUserData);

        if (response.success) {
          setUserManagementSuccess(`User "${userFormData.username}" created successfully`);
        } else {
          throw new Error(response.message || 'Failed to create user');
        }
      }

      loadAllUsers(); // Reload users from database
      setTimeout(() => {
        setShowUserModal(false);
        setUserManagementSuccess('');
      }, 2000);

    } catch (error) {
      console.error('❌ Error saving user:', error);
      setUserManagementError(error.message || 'Failed to save user');
      setTimeout(() => setUserManagementError(''), 5000);
    }
  };

  // Device Management Functions - Updated for gpstracker database connectivity
  const loadAllDevices = useCallback(async () => {
    if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
      try {
        console.log('📱 Loading all devices from gpstracker database...');

        // Try to load from API first
        try {
          const response = await api.getAllDevices();
          if (response.success && response.data && Array.isArray(response.data)) {
            setAllDevices(response.data);
            console.log('✅ Loaded devices from API:', response.data.length, 'devices');
            return;
          }
        } catch (apiError) {
          console.warn('⚠️ Device API not available, loading from localStorage:', apiError);
        }

        // Fallback to localStorage (for development) - get actual user devices
        const userDevicesData = JSON.parse(localStorage.getItem('userDevices') || '[]');
        const devicesArray = Array.isArray(userDevicesData) ? userDevicesData : [];
        const devices = [];

        // Add user devices from gpstracker database
        devicesArray.forEach(userDevice => {
          devices.push({
            name: userDevice.description || userDevice.deviceCode,
            description: userDevice.description,
            deviceCode: userDevice.deviceCode,
            deviceId: userDevice.deviceId,
            status: userDevice.status || 'active',
            assignedTo: userDevice.userEmail,
            addedDate: userDevice.addedDate,
            purpose: userDevice.purpose
          });
        });

        setAllDevices(devices);
        console.log('✅ Loaded devices:', devices.length, 'devices');
        console.log('📋 Device details:', devices);
      } catch (error) {
        console.error('❌ Error loading devices:', error);
        setAllDevices([]);
      }
    }
  }, [userData]);

  // Auto-load devices when component mounts for admin/super admin
  useEffect(() => {
    if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
      loadAllDevices();
    }
  }, [userData, loadAllDevices]);

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

  const handleAdminDeviceFormSubmit = () => {
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

  // Show location permission help
  const showLocationHelp = () => {
    Swal.fire({
      icon: 'info',
      title: 'Enable Location Access',
      html: `
        <div style="text-align: left;">
          <p><strong>To use GPS tracking, please:</strong></p>
          <ol>
            <li>Click the location icon (🔒) in your browser's address bar</li>
            <li>Select "Allow" for location access</li>
            <li>Refresh the page and try again</li>
          </ol>
          <p><strong>Or in browser settings:</strong></p>
          <ul>
            <li><strong>Chrome:</strong> Settings → Privacy → Site Settings → Location</li>
            <li><strong>Firefox:</strong> Settings → Privacy → Permissions → Location</li>
            <li><strong>Safari:</strong> Preferences → Websites → Location</li>
          </ul>
        </div>
      `,
      confirmButtonText: 'Got it!',
      confirmButtonColor: '#007bff'
    });
  };

  // Show only current location without affecting existing paths
  const showCurrentLocationOnly = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      console.log('📍 Getting current location only (not affecting paths)...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const accuracy = position.coords.accuracy;

          // STRICT GPS VALIDATION - Only accept satellite GPS (accuracy ≤ 50m)
          if (accuracy > 50) {
            let title, text, icon, color;

            if (accuracy > 1000) {
              title = 'WiFi Location Detected';
              text = `Accuracy: ${(accuracy/1000).toFixed(1)}km. This is WiFi/Network location, NOT GPS satellites. Go outdoors and enable High Accuracy GPS mode.`;
              icon = 'error';
              color = '#dc3545';
            } else {
              title = 'GPS Signal Too Weak';
              text = `Accuracy: ${accuracy.toFixed(0)}m. Need ≤50m for exact location. Go outdoors with clear sky view and wait for satellite lock.`;
              icon = 'warning';
              color = '#ffc107';
            }

            Swal.fire({
              icon: icon,
              title: title,
              text: text,
              confirmButtonColor: color
            });
          }

          const currentPos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          // Update map center to current location without affecting paths
          setCurrentLocation(currentPos);

          // Show success message with accuracy info
          Swal.fire({
            icon: accuracy <= 50 ? 'success' : 'info',
            title: 'Current Location Found',
            text: `Latitude: ${currentPos.latitude.toFixed(6)}, Longitude: ${currentPos.longitude.toFixed(6)}\nAccuracy: ${accuracy}m ${accuracy <= 50 ? '(GPS)' : '(Network)'}`,
            timer: 4000,
            showConfirmButton: false
          });

          resolve(currentPos);
        },
        (error) => {
          Swal.fire({
            icon: 'error',
            title: 'GPS Location Error',
            text: 'Could not get exact GPS location. Please enable GPS, go outdoors, and check location permissions.',
            confirmButtonColor: '#dc3545'
          });
          reject(error);
        },
        {
          enableHighAccuracy: true,  // Force GPS
          timeout: 30000,           // Wait longer for GPS
          maximumAge: 0             // No cached location
        }
      );
    });
  }, []);

  // Show GPS setup instructions
  const showGPSInstructions = () => {
    alert(`📍 HOW TO GET EXACT GPS LOCATION\n\n🔧 DEVICE SETTINGS:\n• Enable Location Services\n• Set Location Mode to "High Accuracy" or "GPS Only"\n• Turn OFF WiFi scanning for location\n\n🌍 PHYSICAL REQUIREMENTS:\n• Go OUTDOORS (GPS doesn't work indoors)\n• Find open area with clear sky view\n• Stay away from tall buildings/trees\n\n⏱️ TIMING:\n• Wait 1-2 minutes for satellite lock\n• Don't move during GPS acquisition\n• Be patient - exact GPS takes time\n\n✅ SUCCESS INDICATORS:\n• Accuracy ≤ 50 meters\n• Location updates smoothly\n• Consistent coordinates\n\n❌ AVOID:\n• Indoor locations\n• WiFi-based location\n• Network/cellular location\n• Cached/old locations`);
  };

  // EXACT GPS LOCATION ONLY - No WiFi Network Locations
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      // FORCE HIGH-ACCURACY GPS ONLY - Reject WiFi-based locations
      const getExactGPS = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const accuracy = position.coords.accuracy;

            // STRICT GPS VALIDATION - Only accept satellite GPS (accuracy ≤ 50m)
            if (accuracy > 50) {
              let errorMsg = `❌ EXACT GPS REQUIRED\n\nCurrent accuracy: ${accuracy > 1000 ? (accuracy/1000).toFixed(1) + 'km' : accuracy.toFixed(0) + 'm'}\n\n`;

              if (accuracy > 1000) {
                errorMsg += `This is WiFi/Network location, NOT GPS satellites.\n\n`;
              } else {
                errorMsg += `GPS signal too weak for exact tracking.\n\n`;
              }

              errorMsg += `REQUIRED: GPS accuracy ≤ 50m\n\nTo get EXACT GPS:\n• Go OUTDOORS (not indoors)\n• Enable HIGH ACCURACY GPS mode\n• Wait 1-2 minutes for satellite lock\n• Ensure clear sky view\n• Try again`;

              alert(errorMsg);
              reject(new Error(`GPS accuracy too low (${accuracy.toFixed(0)}m). Need ≤50m for exact location.`));
              return;
            }

            // Show accuracy info to user
            if (accuracy <= 10) {
              alert(`✅ Excellent GPS Signal!\n\nAccuracy: ${accuracy}m\nThis is exact GPS location from satellites.`);
            } else if (accuracy <= 50) {
              alert(`✅ Good GPS Signal!\n\nAccuracy: ${accuracy}m\nThis is GPS location from satellites.`);
            } else {
              alert(`⚠️ Moderate GPS Signal\n\nAccuracy: ${accuracy}m\nFor better accuracy, go outdoors with clear sky view.`);
            }

            // Process the exact GPS location
            await processLocationData(position, true);
          },
          (error) => {
            let errorMessage = 'Exact GPS location failed: ';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Location permission denied. Please:\n• Allow location access in browser\n• Enable GPS in device settings\n• Refresh the page and try again';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'GPS satellites unavailable. Please:\n• Go outdoors for better satellite reception\n• Enable GPS/Location Services in device settings\n• Check if airplane mode is off';
                break;
              case error.TIMEOUT:
                errorMessage += 'GPS timeout. Please:\n• Go outdoors with clear sky view\n• Wait longer for satellite connection\n• Ensure GPS is enabled in device settings';
                break;
              default:
                errorMessage += 'GPS error occurred. Please check device GPS settings and try again.';
                break;
            }
            alert(`❌ ${errorMessage}`);
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,  // FORCE GPS satellites only
            timeout: 60000,           // Wait even longer for GPS (60 seconds)
            maximumAge: 0             // NEVER use cached/old location
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

      // Start exact GPS detection
      getExactGPS();
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

    // DON'T open GPS tracker modal - keep map in its original position
    // setShowGeoapifyTracker(true);
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

  // Generate simple QR code (exactly 16 characters)
  const generate16DigitCode = useCallback(() => {
    // Format: QR + timestamp (8 digits) + random (6 digits) = 16 total
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0'); // 6 digit random
    const code = `QR${timestamp}${random}`;
    console.log('🔢 Generated 16-digit code:', code, '(Length:', code.length, ')');
    return code;
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
      // Show loading message
      alert('Generating QR codes on server... Please wait.');

      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');

      // Generate QR codes on SERVER (not client) - this ensures database consistency
      console.log('💾 Generating QR codes on server...');

      const response = await fetch('http://localhost:5001/api/devices/admin/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          count: count,
          purpose: 'GPS Tracking Device',
          description: `Generated by ${userData.username} on ${new Date().toLocaleDateString()}`
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to generate QR codes:', result.message);
        alert(`Failed to generate QR codes: ${result.message}`);
        return;
      }

      console.log('✅ QR codes generated on server:', result.devices?.length || count);

      // Create localStorage entries for backward compatibility with existing UI
      const newQRCodes = result.devices.map(device => ({
        id: device.deviceId,
        code: device.deviceId,
        deviceInfo: {
          deviceName: device.name || device.deviceName,
          deviceType: 'GPS Tracker',
          description: device.description
        },
        status: 'available',
        assignedTo: null,
        createdAt: device.createdAt,
        createdBy: userData.username
      }));

      // Clear localStorage to avoid confusion with old QR codes - use database only
      localStorage.removeItem('generatedQRCodes');
      setGeneratedQRCodes([]);

      // Refresh the admin QR codes list to show new unassigned QR codes
      loadAdminQRCodes();

      alert(`Successfully generated ${result.devices.length} QR codes!\nFormat: ${result.devices[0]?.deviceId}\nThey are now saved in the database and available for sending to users.`);
      setShowQRGenerationModal(false);
      setQrGenerationCount(1);

    } catch (error) {
      console.error('Error in generateQRCodes:', error);
      alert(`Failed to generate QR codes: ${error.message}`);
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

    // Show loading message for GPS capture
    alert('📍 Getting your current location as starting point...');

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

    // 🚀 GET EXACT GPS LOCATION AS STARTING POINT (NO WIFI)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const accuracy = position.coords.accuracy;

          // STRICT GPS VALIDATION FOR QR SCAN - Only accept satellite GPS (accuracy ≤ 50m)
          if (accuracy > 50) {
            let errorMsg = `❌ EXACT GPS REQUIRED FOR QR SCAN\n\nCurrent accuracy: ${accuracy > 1000 ? (accuracy/1000).toFixed(1) + 'km' : accuracy.toFixed(0) + 'm'}\n\n`;

            if (accuracy > 1000) {
              errorMsg += `This is WiFi/Network location, NOT GPS satellites.\n\n`;
            } else {
              errorMsg += `GPS signal too weak for exact starting point.\n\n`;
            }

            errorMsg += `REQUIRED: GPS accuracy ≤ 50m\n\nTo get EXACT starting point:\n• Go OUTDOORS (not indoors)\n• Enable HIGH ACCURACY GPS mode\n• Wait 1-2 minutes for satellite lock\n• Ensure clear sky view\n• Scan QR code again`;

            alert(errorMsg);
            return; // Cancel QR scan
          }

          const currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            deviceName: enhancedDeviceInfo.deviceName || 'Unknown Device',
            scannedBy: userData?.username || 'Unknown',
            source: 'qr_scan_exact_gps'
          };

          // Show GPS accuracy confirmation
          alert(`✅ Exact GPS Starting Point Captured!\n\nAccuracy: ${accuracy}m\nLocation: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}\n\nThis is your exact GPS location from satellites.`);

          // 🔥 SAVE TO GPS API AS STARTING POINT
          try {
            const token = localStorage.getItem('token');
            const gpsResponse = await fetch('http://localhost:5001/api/gps/location', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                deviceId: enhancedDeviceInfo.deviceId,
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                accuracy: currentLocation.accuracy,
                deviceName: enhancedDeviceInfo.deviceName,
                source: 'qr_scan_starting_point'
              })
            });

            if (gpsResponse.ok) {
              const gpsResult = await gpsResponse.json();
              console.log('✅ QR scan starting location saved to GPS API:', gpsResult);
            } else {
              console.error('❌ Failed to save QR scan location to GPS API');
            }
          } catch (error) {
            console.error('❌ Error saving QR scan location:', error);
          }

          // Continue with the rest of the QR scan process
          continueQRScanProcess(enhancedDeviceInfo, currentLocation);
        },
        (error) => {
          let errorMessage = 'Exact GPS location failed for QR scan: ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location permission denied. Please enable location access and GPS in device settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'GPS satellites unavailable. Please go outdoors for better satellite reception.';
              break;
            case error.TIMEOUT:
              errorMessage += 'GPS timeout. Please go outdoors with clear sky view and try again.';
              break;
            default:
              errorMessage += 'GPS error occurred. Please check device GPS settings.';
              break;
          }
          alert(`❌ ${errorMessage}\n\nQR scan cancelled. Please fix GPS issues and scan again for exact location.`);
          return; // Don't use fallback - require exact GPS
        },
        {
          enableHighAccuracy: true,  // FORCE GPS satellites only
          timeout: 60000,           // Wait even longer for GPS (60 seconds)
          maximumAge: 0             // NEVER use cached/old location
        }
      );
    } else {
      alert('❌ GPS Not Supported\n\nYour device does not support GPS location services.\n\nQR scan cancelled. Please use a device with GPS capability for exact location tracking.');
      return; // Don't proceed without GPS capability
    }

    // Function to continue QR scan process after getting location
    const continueQRScanProcess = (deviceInfo, qrScanLocation) => {
      console.log('🚀 Continuing QR scan process with location:', qrScanLocation);

      // Extract clean device ID
      let cleanDeviceId = deviceInfo.deviceId;
      if (typeof cleanDeviceId === 'object' && cleanDeviceId.deviceId) {
        cleanDeviceId = cleanDeviceId.deviceId;
      }

      console.log('🗺️ Opening tracker with manual entry:', { qrScanLocation, cleanDeviceId });

      // Set data and open tracker
      setTimeout(() => {
        setQrScanLocationData(qrScanLocation);
        setTrackedDeviceId(cleanDeviceId);
        setShowQRToPostmanTracker(true);
        setShowScannedDeviceModal(false);
      }, 2000);
    };
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

  // Load device locations (from server GPS API)
  const loadDeviceLocations = useCallback(async (deviceId) => {
    try {
      console.log('📍 Loading locations for device:', deviceId);

      if (!deviceId) {
        console.log('⚠️ No device ID provided');
        return;
      }

      // 🔥 FIRST: Load from GPS API server
      try {
        console.log('📡 Fetching from GPS API server...');
        const response = await fetch(`http://localhost:5001/api/gps/path/${deviceId}`);

        if (response.ok) {
          const serverData = await response.json();
          console.log('📡 Server GPS data:', serverData);

          if (serverData.status === 'success' && serverData.data.pathPoints) {
            const serverLocations = serverData.data.pathPoints.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
              timestamp: point.timestamp,
              accuracy: point.accuracy || 10,
              source: 'server_gps'
            }));

            console.log('✅ Loaded', serverLocations.length, 'locations from GPS server');

            // Update device locations state
            setDeviceLocations(prev => ({
              ...prev,
              [deviceId]: serverLocations
            }));

            return serverLocations;
          }
        }
      } catch (serverError) {
        console.log('⚠️ GPS server not available, checking local data:', serverError.message);
      }

      // FALLBACK: Check local device locations
      const localLocations = deviceLocations[deviceId];
      if (localLocations && localLocations.length > 0) {
        console.log(`✅ Found ${localLocations.length} local locations for device ${deviceId}`);
        return;
      }

      // Check local storage as fallback
      try {
        const trackingKey = `realtime_tracking_${deviceId}`;
        const localPath = JSON.parse(localStorage.getItem(trackingKey) || '[]');

        if (localPath.length > 0) {
          setDeviceLocations(prev => ({
            ...prev,
            [deviceId]: localPath
          }));
          console.log(`📱 Loaded ${localPath.length} locations from local storage for device ${deviceId}`);
        } else {
          console.log('📍 No locations found for device:', deviceId);
        }
      } catch (localError) {
        console.error('Failed to load from local storage:', localError);
      }
    } catch (error) {
      console.error('Failed to load device locations:', error);
    }
  }, [deviceLocations]);

  const handleViewDeviceLocation = useCallback((device) => {
    setSelectedDeviceForTracking(device);
    setShowMapModal(true);
  }, []);

  // Load device history for date range from database
  const loadDeviceHistoryForDateRange = useCallback(async (deviceId, startDate, endDate) => {
    if (!deviceId || !startDate || !endDate) return [];

    setLoadingHistory(true);
    try {
      console.log('📅 Loading history from database for device:', deviceId, 'from', startDate, 'to', endDate);

      // PRIORITY 1: Try to load from database using GPS API
      try {
        console.log('🔍 Loading from database via GPS API...');

        const response = await gpsApi.getLocationsByDateRange(deviceId, startDate, endDate);

        if (response.success && response.locations && response.locations.length > 0) {
          const locations = response.locations.map(loc => ({
            ...loc,
            timestamp: loc.timestamp || loc.recordedAt,
            latitude: parseFloat(loc.latitude),
            longitude: parseFloat(loc.longitude)
          }));

          console.log('✅ SUCCESS: Found', locations.length, 'locations from database');

          // Sort by timestamp
          locations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          setDateRangeHistory(locations);
          return locations;
        } else {
          console.log('📅 No locations found in database for date range');
        }
      } catch (error) {
        console.warn('⚠️ Database API call failed:', error);
      }

      // PRIORITY 2: Try to load from legacy GPS API (Postman data) - WITH DATE RANGE
      try {
        console.log('🔍 Checking legacy GPS API for Postman data with date range...');
        console.log('📅 Date range:', startDate, 'to', endDate);

        // Use new location history API with date range
        const response = await api.getLocationHistory(deviceId, startDate, endDate, 1000);

        if (response.success) {
          console.log('📊 Location History API Response:', response);

          if (response.locationHistory && response.locationHistory.length > 0) {
            console.log('✅ SUCCESS: Found', response.locationHistory.length, 'locations from Location History API (Postman data)');

            // Convert and sort by timestamp to ensure proper order
            const sortedLocations = response.locationHistory
              .map(loc => ({
                latitude: loc.location.latitude,
                longitude: loc.location.longitude,
                timestamp: loc.timestamp,
                recordedAt: loc.recordedAt || loc.timestamp,
                accuracy: loc.location.accuracy || 10,
                address: loc.address || 'GPS Location',
                distanceFromPrevious: loc.distanceFromPrevious || 0,
                totalDistance: loc.totalDistance || 0
              }))
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            console.log('📊 Sorted locations:', sortedLocations);
            setDateRangeHistory(sortedLocations);
            return sortedLocations;
          } else {
            console.log('⚠️ Location History API returned success but no locations for date range');
          }
        } else {
          console.log('⚠️ GPS API response not OK:', response.status, response.statusText);
        }
      } catch (apiError) {
        console.error('❌ GPS API error:', apiError);
      }

      // PRIORITY 1.5: Try without date range filter (get all data, then filter)
      try {
        console.log('🔍 Trying Location History API without date filter...');
        const response = await api.getLocationHistory(deviceId, null, null, 1000);

        if (response.success) {
          if (response.locationHistory && response.locationHistory.length > 0) {
            console.log('✅ Found', response.locationHistory.length, 'total locations from Location History API');

            // Filter by date range on client side
            const startDateTime = new Date(startDate).getTime();
            const endDateTime = new Date(endDate + 'T23:59:59').getTime();

            const filteredApiData = response.locationHistory.filter(location => {
              if (!location.timestamp) return false;
              const locationTime = new Date(location.timestamp).getTime();
              const isInRange = locationTime >= startDateTime && locationTime <= endDateTime;
              if (isInRange) {
                console.log('✅ Location in date range:', new Date(location.timestamp).toLocaleString());
              }
              return isInRange;
            });

            if (filteredApiData.length > 0) {
              console.log('✅ SUCCESS: Found', filteredApiData.length, 'API locations for date range');

              // Convert location history format to expected format
              const convertedData = filteredApiData.map(loc => ({
                latitude: loc.location.latitude,
                longitude: loc.location.longitude,
                timestamp: loc.timestamp,
                recordedAt: loc.recordedAt || loc.timestamp,
                accuracy: loc.location.accuracy || 10,
                address: loc.address || 'GPS Location',
                distanceFromPrevious: loc.distanceFromPrevious || 0,
                totalDistance: loc.totalDistance || 0
              }));

              const sortedData = convertedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              setDateRangeHistory(sortedData);
              return sortedData;
            } else {
              console.log('⚠️ No locations found in the specified date range');
            }
          }
        }
      } catch (apiError2) {
        console.warn('⚠️ GPS API (no filter) not available:', apiError2.message);
      }

      // PRIORITY 2: Check localStorage sources
      console.log('🔍 Checking localStorage for device history...');

      // Check device history
      const deviceHistory = JSON.parse(localStorage.getItem(`deviceHistory_${deviceId}`) || '[]');
      console.log('📋 Device history from localStorage:', deviceHistory.length, 'points');

      // Check realtime tracking data
      const realtimeData = JSON.parse(localStorage.getItem(`realtime_tracking_${deviceId}`) || '[]');
      console.log('📋 Realtime tracking data:', realtimeData.length, 'points');

      // Check device locations state
      const currentDeviceLocations = deviceLocations[deviceId] || [];
      console.log('📋 Current device locations state:', currentDeviceLocations.length, 'points');

      // Check user devices data for registration location
      const userDevicesData = JSON.parse(localStorage.getItem('userDevices') || '[]');
      const deviceData = userDevicesData.find(d => d.deviceId === deviceId || d.deviceCode === deviceId);
      console.log('📋 User device data:', deviceData);

      // Combine all available data (remove duplicates)
      let allLocations = [];

      // Add from all sources
      allLocations = [...deviceHistory, ...realtimeData, ...currentDeviceLocations];

      // Add device registration location if available
      if (deviceData && deviceData.location) {
        allLocations.push({
          latitude: deviceData.location.latitude,
          longitude: deviceData.location.longitude,
          timestamp: deviceData.addedDate || new Date().toISOString(),
          accuracy: 10,
          source: 'manual'
        });
      }

      // Remove duplicates based on timestamp and coordinates
      const uniqueLocations = allLocations.filter((location, index, self) => {
        return index === self.findIndex(l =>
          l.timestamp === location.timestamp &&
          l.latitude === location.latitude &&
          l.longitude === location.longitude
        );
      });

      console.log('📊 Total unique locations found:', uniqueLocations.length);
      console.log('📊 All locations:', uniqueLocations);

      if (uniqueLocations.length === 0) {
        console.log('❌ No location data found for device:', deviceId);
        setDateRangeHistory([]);
        return [];
      }

      // Filter by date range
      const startDateTime = new Date(startDate).getTime();
      const endDateTime = new Date(endDate + 'T23:59:59').getTime();

      const filteredHistory = uniqueLocations.filter(location => {
        if (!location.timestamp) return false;
        const locationTime = new Date(location.timestamp).getTime();
        const isInRange = locationTime >= startDateTime && locationTime <= endDateTime;
        if (isInRange) {
          console.log('✅ Location in range:', new Date(location.timestamp).toLocaleString(), location.latitude, location.longitude);
        }
        return isInRange;
      });

      // Sort by timestamp
      filteredHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      console.log('📊 Final filtered history for date range:', filteredHistory.length, 'locations');
      setDateRangeHistory(filteredHistory);
      return filteredHistory;

    } catch (error) {
      console.error('❌ Error loading date range history:', error);
      setDateRangeHistory([]);
      return [];
    } finally {
      setLoadingHistory(false);
    }
  }, [deviceLocations]);

  // Handle date range selection
  const handleDateRangeSelection = useCallback(async () => {
    if (!selectedDeviceForRealTimeTracking || !selectedStartDate || !selectedEndDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a device and both start and end dates',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (new Date(selectedStartDate) > new Date(selectedEndDate)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Date Range',
        text: 'Start date cannot be after end date',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const deviceKey = selectedDeviceForRealTimeTracking.deviceId || selectedDeviceForRealTimeTracking.deviceCode;

    // Show loading
    Swal.fire({
      title: 'Loading History...',
      text: 'Searching for location data in the selected date range',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const history = await loadDeviceHistoryForDateRange(deviceKey, selectedStartDate, selectedEndDate);

      Swal.close();

      if (history.length > 0) {
        // Update map with the filtered history
        setCurrentLocation({
          latitude: history[0].latitude,
          longitude: history[0].longitude
        });

        // Show history section
        setShowHistorySection(true);

        Swal.fire({
          icon: 'success',
          title: 'Route Found!',
          text: `Found ${history.length} location points for the selected date range`,
          confirmButtonColor: '#28a745'
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'No Data Found',
          html: `
            <p>No location data found for the selected date range.</p>
            <br>
            <strong>Possible reasons:</strong>
            <ul style="text-align: left; margin: 10px 0;">
              <li>Device was not tracked during this period</li>
              <li>No GPS coordinates were sent via Postman</li>
              <li>Check if the device code is correct</li>
            </ul>
            <br>
            <small><strong>Device:</strong> ${deviceKey}<br>
            <strong>Date Range:</strong> ${selectedStartDate} to ${selectedEndDate}</small>
          `,
          confirmButtonColor: '#17a2b8'
        });
      }
    } catch (error) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Data',
        text: 'Failed to load location history. Please try again.',
        confirmButtonColor: '#dc3545'
      });
    }
  }, [selectedDeviceForRealTimeTracking, selectedStartDate, selectedEndDate, loadDeviceHistoryForDateRange]);

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
    const initializeUser = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // Verify token with database and get current user data
          const response = await fetch('http://localhost:5001/api/auth/verify', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setUserData(data.user);
              console.log('✅ User authenticated from database:', data.user);

              // Load user devices from database
              await loadUserDevices(data.user.email);

              // Load admin data if user is admin
              if (data.user.role === 'admin' || data.user.role === 'superadmin') {
                await loadAllUsers();
                await loadAdminQRCodes();
              }
            } else {
              throw new Error('Invalid token');
            }
          } else {
            throw new Error('Token verification failed');
          }
        } catch (err) {
          console.error('❌ Authentication failed:', err);
          // Clear only the token, redirect to login
          localStorage.removeItem('token');
          navigate('/login');
        }
      } else {
        console.log('❌ No authentication token found, redirecting to login');
        navigate('/login');
      }
    };

    initializeUser();
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

  // Load statistics data for admin/superadmin
  useEffect(() => {
    if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
      loadStatisticsData();
    }
  }, [userData, loadStatisticsData]);

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
        border-radius: 0;
        box-shadow: none;
        padding: 0.5rem;
        height: 100%;
        margin-top: 0;
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
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: none;
        overflow-x: hidden;
        box-sizing: border-box;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        margin-bottom: 1.5rem;
        min-height: calc(100vh - 200px);
        border: 1px solid rgba(0,0,0,0.05);
        position: relative;
        gap: 1.5rem;
      }

      .dashboard-content::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #4a148c, #7b1fa2, #9c27b0);
        border-radius: 16px 16px 0 0;
      }

      .dashboard-content h2 {
        margin-top: 0.5rem;
        margin-bottom: 1rem;
        color: #2c3e50;
        font-weight: 600;
      }

      .dashboard-content .text-muted {
        color: #6c757d !important;
        margin-bottom: 1.5rem;
      }

      .dashboard-content .card {
        border: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        border-radius: 12px;
        margin-bottom: 1rem;
        width: 100%;
        height: fit-content;
        transition: all 0.3s ease;
      }

      .dashboard-content .card:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }

      /* DYNAMIC GRID LAYOUT FOR CARDS */
      .dashboard-content .dynamic-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        width: 100%;
      }

      .dashboard-content .dynamic-grid-small {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        width: 100%;
      }

      /* CONTENT SPACING UTILITIES */
      .dashboard-content .content-section {
        margin-bottom: 2rem;
      }

      .dashboard-content .content-section:last-child {
        margin-bottom: 0;
      }

      /* RESPONSIVE TEXT SCALING */
      @media (max-width: 768px) {
        .dashboard-content h2 {
          font-size: 1.5rem;
        }

        .dashboard-content h4 {
          font-size: 1.2rem;
        }

        .dashboard-content .dynamic-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .dashboard-content .dynamic-grid-small {
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
      }

      .dashboard-content .btn {
        border-radius: 8px;
        font-weight: 500;
        padding: 0.5rem 1rem;
      }

      /* DYNAMIC RESPONSIVE LAYOUT */
      .dashboard-content .row {
        margin: 0;
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .dashboard-content .col-md-6,
      .dashboard-content .col-lg-4,
      .dashboard-content .col-lg-6,
      .dashboard-content .col-lg-8,
      .dashboard-content .col-12 {
        padding: 0;
        flex: 1 1 auto;
        min-width: 280px;
      }

      .dashboard-content .container,
      .dashboard-content .container-fluid {
        padding: 0;
        margin: 0;
        max-width: none;
        width: 100%;
      }

      /* TABLES AND FORMS FULL WIDTH */
      .dashboard-content .table-responsive {
        width: 100% !important;
        margin: 0 !important;
      }

      .dashboard-content table {
        width: 100% !important;
        table-layout: auto !important;
      }

      .dashboard-content .form-control,
      .dashboard-content .form-select {
        width: 100% !important;
      }

      /* CARDS STRETCH FULL WIDTH */
      .dashboard-content .card {
        width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }

      /* REMOVE BOOTSTRAP CONTAINER LIMITS */
      .dashboard-content .d-flex {
        width: 100% !important;
      }

      .dashboard-content .justify-content-between {
        width: 100% !important;
      }

      /* FORCE ALL CONTENT TO STRETCH HORIZONTALLY */
      .dashboard-content > * {
        width: 100% !important;
        max-width: none !important;
      }

      .dashboard-content .row > .col-md-6,
      .dashboard-content .row > .col-lg-4,
      .dashboard-content .row > .col-lg-6 {
        flex: 1 1 auto !important;
        max-width: none !important;
      }

      /* FULL WIDTH LAYOUTS */
      .dashboard-content .row {
        margin: 0;
        width: 100%;
      }

      .dashboard-content .col-md-6,
      .dashboard-content .col-lg-4,
      .dashboard-content .col-lg-6,
      .dashboard-content .col-lg-8 {
        padding-left: 0.75rem;
        padding-right: 0.75rem;
      }

      .dashboard-content .container-fluid {
        padding: 0;
        max-width: none;
      }

      /* TABLES FULL WIDTH */
      .dashboard-content .table-responsive {
        width: 100%;
        margin: 0;
      }

      .dashboard-content table {
        width: 100%;
        margin-bottom: 0;
      }

      /* 🖥️ DESKTOP LAYOUT FIXES */
      @media (min-width: 769px) {
        /* Ensure sidebar stays beside content on desktop */
        .container-fluid .row {
          display: flex !important;
          flex-wrap: nowrap !important;
          align-items: stretch !important;
        }

        /* Keep flex layouts horizontal on desktop */
        .d-flex.gap-2,
        .d-flex.gap-3 {
          flex-direction: row !important;
        }

        .btn-group {
          flex-direction: row !important;
          width: auto !important;
        }

        .btn-group .btn {
          margin-bottom: 0 !important;
        }

        /* Ensure proper column layouts */
        .col-md-3,
        .col-md-4,
        .col-md-6,
        .col-md-9,
        .col-lg-2,
        .col-lg-10 {
          position: relative !important;
        }

        /* Force sidebar to stay in place */
        .col-md-3.d-md-block,
        .col-lg-2.d-md-block {
          display: block !important;
          flex: 0 0 auto !important;
          max-width: 280px !important;
          min-width: 250px !important;
        }

        /* Force main content to take remaining space */
        .col-md-9,
        .col-lg-10 {
          flex: 1 1 auto !important;
          max-width: none !important;
          width: 100% !important;
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
        }

        /* FORCE DASHBOARD TO USE FULL HORIZONTAL SPACE */
        .col-md-9 .content-wrapper,
        .col-lg-10 .content-wrapper {
          width: 100% !important;
          max-width: none !important;
          padding: 0 !important;
        }

        /* ELIMINATE RIGHT SIDE GAP COMPLETELY */
        .col-md-9,
        .col-lg-10 {
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
        }

        .dashboard-content {
          margin-left: 0 !important;
          margin-right: 0 !important;
          width: 100% !important;
        }

        /* FORCE CONTAINER TO USE FULL WIDTH */
        .container-fluid .row {
          margin-left: 0 !important;
          margin-right: 0 !important;
          width: 100% !important;
        }

        /* QUICK ACTIONS SIDEBAR LAYOUT */
        .dashboard-content .d-flex {
          flex-direction: row !important;
          align-items: flex-start !important;
          gap: 1.5rem !important;
        }

        /* DESKTOP: Make Recent Login History and content boxes wider */
        @media (min-width: 769px) {
          .row.g-3 > [class*="col-"] {
            flex: 1 1 auto !important;
            min-width: 280px !important;
            
            padding: 0 !important;
          }

          /* Make main content area use more space */
          .dashboard-content .table-responsive {
            width: 100% !important;
            min-width: 600px !important;
          }

          /* Recent Login History card should be wider */
          .dashboard-content .card {
            width: 100% !important;
            min-width: 00px !important;
          }

          /* ADMIN/SUPERADMIN: Fix statistics cards alignment */
          .dashboard-content .d-flex.gap-3.mb-4 {
            justify-content: space-between !important;
            align-items: stretch !important;
          }

          .dashboard-content .d-flex.gap-3.mb-4 > div {
            flex: 1 1 240px !important;
            min-width: 240px !important;
            max-width: 280px !important;
          }
        }

        /* ADMIN/SUPERADMIN DASHBOARD: Better alignment without changing features */
        @media (min-width: 769px) {
          .dashboard-content .d-flex.gap-3.mb-4 {
            justify-content: flex-start !important;
            align-items: stretch !important;
            gap: 1rem !important;
          }

          .dashboard-content .d-flex.gap-3.mb-4 > div {
            flex: 1 1 auto !important;
            min-width: 200px !important;
            max-width: 300px !important;
          }
        }

        /* ASSIGNED DEVICES DYNAMIC LAYOUT ONLY */
        .row.g-3 {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 1rem !important;
          margin: 0 !important;
        }

        .row.g-3 > [class*="col-"] {
          flex: 1 1 auto !important;
          min-width: 280px !important;
          max-width: 400px !important;
          padding: 0 !important;
        }
      }

      /* 📱 TABLET RESPONSIVE */
      @media (max-width: 1024px) and (min-width: 769px) {
        .dashboard-content .d-flex {
          flex-direction: column !important;
          gap: 1.5rem !important;
        }

        .dashboard-content .d-flex > div:first-child {
          max-width: 100% !important;
          min-width: 100% !important;
        }

        .dashboard-content .d-flex > div:last-child {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 100% !important;
        }
      }

      /* 📱 MOBILE RESPONSIVE FIXES */
      @media (max-width: 768px) {
        .dashboard-navbar {
          padding: 0.5rem 1rem !important;
          height: 70px !important;
        }



        .dashboard-content {
          padding: 1.5rem !important;
          margin-bottom: 1rem !important;
          border-radius: 12px !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
          min-height: 350px !important;
        }

        .dashboard-content::before {
          height: 3px !important;
          border-radius: 12px 12px 0 0 !important;
        }

        /* MOBILE: Stack Quick Actions below main content */
        .dashboard-content .d-flex {
          flex-direction: column !important;
          gap: 1rem !important;
        }

        .dashboard-content .d-flex > div:first-child {
          max-width: 100% !important;
          min-width: 100% !important;
        }

        .dashboard-content .d-flex > div:last-child {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 100% !important;
        }

        .card-body {
          padding: 1rem !important;
        }

        .card-header {
          padding: 0.75rem 1rem !important;
        }

        /* Fix button groups on mobile ONLY */
        .btn-group {
          flex-direction: column !important;
          width: 100% !important;
        }

        .btn-group .btn {
          margin-bottom: 0.5rem !important;
          border-radius: 8px !important;
        }

        /* Fix flex gaps on mobile ONLY - be more specific */
        .card .d-flex.gap-2,
        .modal .d-flex.gap-2 {
          flex-direction: column !important;
          gap: 0.5rem !important;
        }

        .card .d-flex.gap-3,
        .modal .d-flex.gap-3 {
          flex-direction: column !important;
          gap: 0.75rem !important;
        }

        /* Make tables responsive */
        .table-responsive {
          font-size: 0.85rem !important;
        }

        /* Fix modal content on mobile */
        .modal-dialog {
          margin: 0.5rem !important;
          max-width: calc(100% - 1rem) !important;
        }

        .modal-body {
          padding: 1rem !important;
        }

        /* Fix form layouts on mobile */
        .row .col-md-6,
        .row .col-md-4,
        .row .col-md-3 {
          margin-bottom: 1rem !important;
        }

        /* Fix sidebar on mobile */
        .dashboard-sidebar {
          padding: 1rem !important;
          margin-bottom: 1rem !important;
        }

        /* Fix navbar brand and buttons */
        .navbar-brand {
          font-size: 1.1rem !important;
        }

        .navbar .btn {
          padding: 0.375rem 0.75rem !important;
          font-size: 0.875rem !important;
        }

        /* Fix card layouts on mobile */
        .card .row .col-md-3,
        .card .row .col-md-4,
        .card .row .col-md-6 {
          margin-bottom: 0.75rem !important;
        }

        /* Fix text sizes on mobile */
        h1 { font-size: 1.5rem !important; }
        h2 { font-size: 1.4rem !important; }
        h3 { font-size: 1.3rem !important; }
        h4 { font-size: 1.2rem !important; }
        h5 { font-size: 1.1rem !important; }

        /* Fix QR code displays on mobile */
        .qr-code-container {
          max-width: 200px !important;
          margin: 0 auto !important;
        }

        /* Fix map containers on mobile */
        #simple-map-container,
        .map-container {
          height: 250px !important;
        }

        /* Fix button text wrapping */
        .btn {
          white-space: normal !important;
          word-wrap: break-word !important;
        }

        /* Fix alert layouts */
        .alert {
          padding: 0.75rem !important;
          font-size: 0.9rem !important;
        }

        /* Fix badge layouts */
        .badge {
          font-size: 0.75rem !important;
          padding: 0.25rem 0.5rem !important;
        }
      }

      @media (max-width: 576px) {
        .container-fluid {
          padding: 0 !important;
        }

        .dashboard-content {
          padding: 1rem !important;
          margin-bottom: 0.75rem !important;
          border-radius: 10px !important;
          min-height: 300px !important;
        }

        .dashboard-content::before {
          height: 2px !important;
          border-radius: 10px 10px 0 0 !important;
        }

        .card {
          margin-bottom: 1rem !important;
          border-radius: 8px !important;
        }

        .btn-group .btn {
          font-size: 0.8rem !important;
          padding: 0.5rem !important;
        }

        .modal-dialog {
          margin: 0.25rem !important;
          max-width: calc(100% - 0.5rem) !important;
        }

        .table {
          font-size: 0.75rem !important;
        }

        .form-control,
        .form-select {
          font-size: 0.9rem !important;
        }
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
    // Clear only the authentication token
    localStorage.removeItem('token');

    // Clear user state
    setUserData(null);
    setUserDevices([]);
    setAdminQRCodes([]);
    setAllUsers([]);

    // Redirect to login
    navigate('/login');
  };

  // Device Action Handlers
  const handleDeviceAction = (method) => {
    setDeviceUploadMethod(method);

    if (method === 'scan') {
      console.log('📷 Opening QR scanner for device registration...');

      // Reset any previous scan results
      setScanResult(null);
      setScanError(null);
      setScannedDeviceCode('');

      // Set callback for when QR is scanned
      setQRScanCallback(() => (scannedCode) => {
        console.log('📱 QR code scanned:', scannedCode);
        setScannedDeviceCode(scannedCode);
        setShowQRScanner(false);

        // Check for duplicates
        checkDeviceExists(scannedCode).then(result => {
          if (result === 'ASSIGNED_TO_OTHER_USER') {
            // Device assigned to another user - do nothing (alert already shown)
            return;
          } else if (result) {
            // Device belongs to current user - show GPS tracking
            alert(`✅ Your Device Found!\n\nDevice: ${result.description}\nRedirecting to GPS tracking...`);
            handleStartGPSTracking(result);
          } else {
            // New device - show registration form
            console.log('📝 Opening device form for new device:', scannedCode);
            setShowDeviceFormModal(true);
          }
        });
      });

      // Open QR scanner modal
      setShowQRScanner(true);
    } else if (method === 'upload') {
      // Open file upload dialog
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('📤 QR image uploaded:', file.name);
          setUploadedQRFile(file);

          // Show loading message with image preview
          const imageUrl = URL.createObjectURL(file);
          Swal.fire({
            title: 'Processing QR Code...',
            html: `
              <div>
                <p>Reading QR code from uploaded image</p>
                <div style="margin: 1rem 0;">
                  <img src="${imageUrl}" style="max-width: 200px; max-height: 200px; border: 1px solid #ddd; border-radius: 5px;" alt="Uploaded QR Code" />
                </div>
                <p style="font-size: 0.9em; color: #666;">Processing with multiple scanning methods...</p>
              </div>
            `,
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          try {
            console.log('🔍 Attempting to scan QR code from uploaded image...');
            console.log('📄 File details:', {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: new Date(file.lastModified).toISOString()
            });
            let qrCodeMessage = null;

            // Method 1: Use jsQR library for reliable PNG scanning
            try {
              console.log('🔍 Method 1: Using jsQR for PNG scanning...');
              const jsQR = (await import('jsqr')).default;

              // Create canvas and get image data
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();

              const imageData = await new Promise((resolve, reject) => {
                img.onload = () => {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  resolve(imageData);
                };
                img.onerror = reject;
                img.src = URL.createObjectURL(file);
              });

              // Scan QR code
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              if (code) {
                qrCodeMessage = code.data;
                console.log('✅ Method 1 success:', qrCodeMessage);
              } else {
                throw new Error('No QR code found');
              }
            } catch (scanError) {
              console.log('⚠️ Method 1 failed, trying alternative approaches...');

              // Method 2: Try with image enhancement
              try {
                console.log('🔍 Method 2: Enhanced image processing...');
                const jsQR = (await import('jsqr')).default;

                // Method 3: Enhanced image processing with multiple techniques
                try {
                  console.log('🔍 Method 3: Advanced image processing...');
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();

                  await new Promise((resolve, reject) => {
                    img.onload = async () => {
                      try {
                        // Calculate optimal size (ensure minimum 400px for QR detection)
                        let { width, height } = img;
                        const minSize = 400;
                        const maxSize = 1200;

                        if (width < minSize || height < minSize) {
                          const scale = minSize / Math.min(width, height);
                          width *= scale;
                          height *= scale;
                        } else if (width > maxSize || height > maxSize) {
                          const scale = maxSize / Math.max(width, height);
                          width *= scale;
                          height *= scale;
                        }

                        canvas.width = width;
                        canvas.height = height;

                        // Draw with high quality settings
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);

                        // Try multiple image processing techniques
                        const techniques = [
                          // Technique 1: High contrast black and white
                          () => {
                            const imageData = ctx.getImageData(0, 0, width, height);
                            const data = imageData.data;
                            for (let i = 0; i < data.length; i += 4) {
                              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                              const bw = gray > 140 ? 255 : 0; // Adjusted threshold
                              data[i] = data[i + 1] = data[i + 2] = bw;
                            }
                            ctx.putImageData(imageData, 0, 0);
                          },

                          // Technique 2: Enhanced contrast with gamma correction
                          () => {
                            ctx.clearRect(0, 0, width, height);
                            ctx.filter = 'contrast(200%) brightness(120%) saturate(0%) gamma(1.5)';
                            ctx.drawImage(img, 0, 0, width, height);
                            ctx.filter = 'none';
                          },

                          // Technique 3: Adaptive threshold
                          () => {
                            ctx.clearRect(0, 0, width, height);
                            ctx.drawImage(img, 0, 0, width, height);
                            const imageData = ctx.getImageData(0, 0, width, height);
                            const data = imageData.data;

                            // Calculate average brightness
                            let totalBrightness = 0;
                            for (let i = 0; i < data.length; i += 4) {
                              totalBrightness += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                            }
                            const avgBrightness = totalBrightness / (data.length / 4);
                            const threshold = avgBrightness * 0.8; // Adaptive threshold

                            for (let i = 0; i < data.length; i += 4) {
                              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                              const bw = gray > threshold ? 255 : 0;
                              data[i] = data[i + 1] = data[i + 2] = bw;
                            }
                            ctx.putImageData(imageData, 0, 0);
                          }
                        ];

                        // Try each technique
                        for (let i = 0; i < techniques.length && !qrCodeMessage; i++) {
                          try {
                            console.log(`🔍 Trying image technique ${i + 1}...`);
                            techniques[i]();

                            // Try scanning with jsQR
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const code = jsQR(imageData.data, imageData.width, imageData.height);
                            if (code) {
                              qrCodeMessage = code.data;
                            }
                            console.log(`✅ Method 3 technique ${i + 1} success:`, qrCodeMessage);
                            break;
                          } catch (techniqueError) {
                            console.log(`⚠️ Technique ${i + 1} failed:`, techniqueError.message);
                          }
                        }

                        resolve();
                      } catch (error) {
                        console.log('⚠️ Image processing error:', error);
                        resolve();
                      }
                    };
                    img.onerror = () => {
                      console.log('⚠️ Image load failed');
                      resolve();
                    };
                    img.src = URL.createObjectURL(file);
                  });
                } catch (method3Error) {
                  console.log('⚠️ Method 3 failed:', method3Error.message);
                }
              } catch (method2Error) {
                console.log('⚠️ Method 2 failed:', method2Error.message);
              }
            }

            // Process the QR code result
            if (qrCodeMessage) {
              console.log('✅ QR code successfully extracted:', qrCodeMessage);
              setScannedDeviceCode(qrCodeMessage);

              // Close loading dialog
              Swal.close();

              // Check if device exists in database
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5001/api/devices/check/${qrCodeMessage}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });

                if (response.ok) {
                  const data = await response.json();

                  if (data.exists && data.device) {
                    if (data.device.assignedTo === userData._id) {
                      // Device belongs to current user - show GPS tracking
                      await Swal.fire({
                        icon: 'success',
                        title: 'Your Device Found!',
                        text: `Device: ${data.device.deviceName || data.device.description}`,
                        confirmButtonText: 'View Location',
                        confirmButtonColor: '#28a745'
                      });

                      // Start GPS tracking for this device
                      handleStartGPSTracking(data.device);
                      return;
                    } else if (!data.device.assignedTo || data.device.assignedTo === null || data.device.assignedTo === '') {
                      // Device is unassigned (available for registration) - show form
                      console.log('📝 Unassigned device found, showing form for:', qrCodeMessage);
                      setShowDeviceFormModal(true);
                      return;
                    } else {
                      // Device assigned to another user
                      await Swal.fire({
                        icon: 'warning',
                        title: 'Device Already Assigned',
                        text: `This QR code is already assigned to: ${data.device.assignedToUsername || 'Another User'}`,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#ffc107'
                      });
                      return;
                    }
                  } else {
                    // New device - show form for registration
                    console.log('📝 New device from upload, showing form for:', qrCodeMessage);
                    setShowDeviceFormModal(true);
                  }
                } else {
                  throw new Error('Failed to check device in database');
                }
              } catch (dbError) {
                console.error('❌ Database check failed:', dbError);
                // Fallback to showing form
                console.log('📝 Database check failed, showing form for:', qrCodeMessage);
                setShowDeviceFormModal(true);
              }
            } else {
              Swal.close();

              // QR code reading failed - offer manual entry as alternative
              const result = await Swal.fire({
                icon: 'warning',
                title: 'QR Code Reading Failed',
                html: `
                  <div style="text-align: left;">
                    <p>Could not automatically read the QR code from your image.</p>
                    <div style="margin: 1rem 0;">
                      <p><strong>💡 To improve QR reading:</strong></p>
                      <ul style="margin: 0.5rem 0;">
                        <li>Use a clearer, higher quality image</li>
                        <li>Ensure good lighting when taking the photo</li>
                        <li>Make sure the QR code fills most of the image</li>
                        <li>Avoid shadows, glare, or blurry images</li>
                        <li>Try taking the photo from directly above the QR code</li>
                      </ul>
                    </div>
                    <div style="background: #e3f2fd; padding: 0.8rem; border-radius: 5px; margin-top: 1rem; border-left: 4px solid #2196f3;">
                      <p style="margin: 0;"><strong>💡 Alternative:</strong> You can manually enter the 16-digit code visible in the QR code if automatic reading continues to fail.</p>
                    </div>
                  </div>
                `,
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: '📝 Enter Code Manually',
                denyButtonText: '📷 Try Different Image',
                cancelButtonText: '❌ Cancel',
                confirmButtonColor: '#28a745',
                denyButtonColor: '#007bff',
                cancelButtonColor: '#6c757d'
              });

              if (result.isConfirmed) {
                // User wants to enter code manually
                handleManualEntry();
              }
              // If denied or cancelled, user can try uploading a different image
            }

          } catch (error) {
            console.error('❌ QR code scanning failed:', error);
            Swal.close();

            await Swal.fire({
              icon: 'error',
              title: 'QR Code Reading Failed',
              html: `
                <p>Could not read the QR code from your image.</p>
                <p><strong>Please try:</strong></p>
                <ul style="text-align: left; margin: 1rem 0;">
                  <li>A clearer, higher quality image</li>
                  <li>Better lighting in the photo</li>
                  <li>Ensure the QR code fills most of the image</li>
                  <li>Avoid shadows, glare, or blurry images</li>
                </ul>
              `,
              confirmButtonText: 'Try Again',
              confirmButtonColor: '#007bff'
            });
          }
        }
      };
      fileInput.click();
    } else if (method === 'manual') {
      // Show simplified manual entry with SweetAlert
      handleManualEntry();
    }
  };

  // Handle simplified manual entry with SweetAlert
  const handleManualEntry = async () => {
    try {
      const { value: deviceCode } = await Swal.fire({
        title: '📝 Enter QR Code Manually',
        html: `
          <div style="text-align: left;">
            <p>Please enter the QR code from your device:</p>
            <div style="background: #f8f9fa; padding: 0.8rem; border-radius: 5px; margin: 1rem 0;">
              <p style="margin: 0; font-size: 0.9em;"><strong>💡 Tip:</strong> The QR code is usually printed below or beside the QR image</p>
              <p style="margin: 0.5rem 0 0 0; font-size: 0.9em;"><strong>Examples:</strong></p>
              <ul style="margin: 0.5rem 0; font-size: 0.9em;">
                <li>QR16427534761560</li>
                <li>DEV123456789ABC</li>
                <li>1234567890123456</li>
              </ul>
            </div>
          </div>
        `,
        input: 'text',
        inputPlaceholder: 'Enter QR code (e.g., QR16427534761560)',
        inputAttributes: {
          maxlength: 20,
          style: 'text-align: center; font-family: monospace; font-size: 1.1rem; letter-spacing: 1px;'
        },
        showCancelButton: true,
        confirmButtonText: '🔍 Check Device',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#007bff',
        cancelButtonColor: '#6c757d',
        inputValidator: (value) => {
          if (!value) {
            return 'Please enter the QR code!';
          }
          if (value.length < 10) {
            return 'QR code must be at least 10 characters!';
          }
          if (value.length > 20) {
            return 'QR code must be at most 20 characters!';
          }
          if (!/^[A-Za-z0-9]+$/.test(value)) {
            return 'QR code can only contain letters and numbers!';
          }
          return null;
        },
        customClass: {
          popup: 'swal-wide'
        }
      });

      if (deviceCode) {
        console.log('🔍 Manual entry - checking device:', deviceCode);
        setScannedDeviceCode(deviceCode);

        // Check if device exists in database
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5001/api/devices/check/${deviceCode}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();

            if (data.exists && data.device) {
              if (data.device.assignedTo === userData._id) {
                // Device belongs to current user - show GPS tracking
                await Swal.fire({
                  title: '✅ Your Device Found!',
                  text: `Device: ${data.device.deviceName || data.device.description}`,
                  icon: 'success',
                  confirmButtonText: '📍 Show Location',
                  confirmButtonColor: '#28a745'
                });
                handleStartGPSTracking(data.device);
                return;
              } else if (!data.device.assignedTo || data.device.assignedTo === null || data.device.assignedTo === '') {
                // Device is unassigned (available for registration) - show form
                console.log('📝 Unassigned device found from manual entry, showing form for:', deviceCode);
                setShowDeviceFormModal(true);
                return;
              } else {
                // Device assigned to another user
                await Swal.fire({
                  icon: 'warning',
                  title: 'Device Already Assigned',
                  text: `This QR code is already assigned to: ${data.device.assignedToUsername || 'Another User'}`,
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#ffc107'
                });
                return;
              }
            } else {
              // Device doesn't exist - ask if user wants to register
              const registerChoice = await Swal.fire({
                title: '📝 Device Not Registered',
                text: `QR code "${deviceCode}" is not registered yet.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '✅ Register Now',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#007bff',
                cancelButtonColor: '#6c757d'
              });

              if (registerChoice.isConfirmed) {
                // User wants to register - show registration form
                setDeviceUploadMethod('manual');
                setManualDeviceCode(deviceCode);
                setScannedDeviceCode(deviceCode);
                setShowDeviceFormModal(true);
              }
            }
          } else {
            throw new Error('Failed to check device in database');
          }
        } catch (dbError) {
          console.error('❌ Database check failed:', dbError);
          await Swal.fire({
            title: 'Error',
            text: 'Failed to check device. Please try again.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
          });
        }
      }
    } catch (error) {
      console.error('❌ Manual entry error:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Something went wrong. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // Check if device already exists in database
  const checkDeviceExists = async (deviceCode) => {
    try {
      console.log('🔍 Checking if device exists:', deviceCode);
      const response = await api.checkDeviceExists(deviceCode);
      console.log('📋 Device check response:', response);

      if (response.exists) {
        if (response.ownedByCurrentUser) {
          // Device belongs to current user - return device for GPS tracking
          console.log('✅ Device belongs to current user');
          return response.device;
        } else {
          // Device belongs to another user - show error with SweetAlert
          const assignedToUser = response.device?.assignedToUsername || response.device?.assignedToEmail || 'Unknown User';
          console.log('⚠️ Device belongs to another user:', assignedToUser);
          await Swal.fire({
            title: '❌ QR Code Already Assigned!',
            html: `This QR code is already registered by user: <strong>${assignedToUser}</strong><br><br>Each QR code can only be assigned to one user.<br>Please contact your admin if you believe this is an error.`,
            icon: 'error',
            confirmButtonText: 'Understood',
            confirmButtonColor: '#dc3545'
          });
          return 'ASSIGNED_TO_OTHER_USER';
        }
      } else {
        // Device doesn't exist - available for registration
        console.log('📝 Device available for registration');
        return null;
      }
    } catch (error) {
      console.error('❌ Error checking device:', error);
      return null;
    }
  };

  // Handle GPS tracking redirect - NO POPUP, use inline map
  const handleStartGPSTracking = (device) => {
    console.log('🎯 Starting GPS tracking for device:', device);

    // Set the device for GPS tracking
    setSelectedDeviceForRealTimeTracking(device);
    // NO popup - keep map inline in Add Device section
    setShowRealTimeTracker(false);
    // Stay on add-device tab to show the inline map
    setActiveTab('add-device');

    // Get exact GPS location and show on map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const accuracy = position.coords.accuracy;

          // Validate GPS accuracy for device tracking
          if (accuracy > 100) {
            alert(`⚠️ GPS Accuracy Warning\n\nDetected accuracy: ${accuracy}m\n\nThis appears to be WiFi-based location. For exact device tracking:\n• Go outdoors\n• Enable GPS in device settings\n• Wait for satellite connection`);
          }

          const { latitude, longitude } = position.coords;

          // Set current location to show on map
          setCurrentLocation({ latitude, longitude });

          // Save location to database via API
          const locationData = {
            latitude,
            longitude,
            accuracy: 10,
            source: 'manual',
            timestamp: new Date().toISOString()
          };

          try {
            console.log('💾 Saving location to database:', locationData);
            const saveResult = await api.updateDeviceLocation(device.deviceId, locationData);
            console.log('✅ Location saved to database:', saveResult);
          } catch (saveError) {
            console.error('❌ Failed to save location to database:', saveError);
          }

          // Also update device locations for tracking
          const deviceLocationData = {
            deviceId: device.deviceId,
            deviceName: device.description,
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
            address: 'Loading address...'
          };

          setDeviceLocations(prev => ({
            ...prev,
            [device.deviceId]: [deviceLocationData]
          }));

          console.log('✅ GPS tracking started for existing device:', device.deviceId);
          console.log('📍 Location set for existing device:', { latitude, longitude });
          console.log('📱 Device object:', device);

          // Record GPS tracking session in scan history
          const trackingSession = {
            deviceId: device.deviceId,
            deviceName: device.description || device.deviceName || device.deviceId,
            qrCodeId: device.deviceId,
            scanMethod: 'manual', // GPS tracking sessions recorded as manual
            scanLocation: {
              latitude: latitude,
              longitude: longitude,
              address: 'Getting address...',
              accuracy: position.coords.accuracy || 10
            },
            scannedBy: userData.username,
            scannedAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            rawQRData: device.deviceId,
            deviceType: 'GPS Tracker',
            status: 'tracking_started'
          };

          // Save GPS tracking session to scan history
          saveScanHistoryToDatabase(trackingSession, {
            latitude: latitude,
            longitude: longitude,
            accuracy: position.coords.accuracy || 10,
            address: 'GPS Tracking Location'
          });
        },
        (error) => {
          let errorMessage = 'GPS location failed for device tracking: ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location access and GPS in device settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'GPS satellites unavailable. Please go outdoors.';
              break;
            case error.TIMEOUT:
              errorMessage += 'GPS timeout. Please go outdoors with clear sky view.';
              break;
            default:
              errorMessage += 'Please check device GPS settings.';
              break;
          }
          alert(`❌ ${errorMessage}`);
        },
        { enableHighAccuracy: true, timeout: 45000, maximumAge: 0 }
      );
    } else {
      alert('GPS not supported on this device.');
    }
  };

  const handleDeviceFormSubmit = async () => {
    try {
      // Show loading state
      Swal.fire({
        title: 'Registering Device...',
        text: 'Please wait while we register your QR code',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // GET CURRENT LOCATION FIRST (where user is physically scanning/registering)
      console.log('📍 Getting current scan location...');
      await getCurrentLocation();

      let deviceCode = '';

      if (deviceUploadMethod === 'manual') {
        deviceCode = manualDeviceCode;
      } else if (deviceUploadMethod === 'upload') {
        deviceCode = scannedDeviceCode;
      } else if (deviceUploadMethod === 'scan') {
        deviceCode = scannedDeviceCode;
      }

      if (!deviceCode) {
        Swal.close();
        await Swal.fire({
          icon: 'error',
          title: 'Missing QR Code',
          text: 'Please provide a valid QR code',
          confirmButtonColor: '#dc3545'
        });
        return;
      }

      if (!deviceDescription || !devicePurpose) {
        Swal.close();
        await Swal.fire({
          icon: 'error',
          title: 'Missing Information',
          text: 'Please provide device name and purpose',
          confirmButtonColor: '#dc3545'
        });
        return;
      }

      // Prepare registration data
      const registrationData = {
        deviceId: deviceCode,
        deviceName: deviceDescription,
        description: deviceDescription,
        purpose: devicePurpose,
        location: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy || 10,
          address: currentLocation.address || 'Registration Location'
        } : null
      };

      console.log('💾 Registering device to current user:', registrationData);

      // Register device to current user using new endpoint
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/devices/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const responseData = await response.json();
      console.log('📋 Registration response:', responseData);

      if (response.ok && responseData.success) {
        console.log('✅ Device registered successfully to current user');

        Swal.close();

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'QR Code Registered!',
          text: `${deviceDescription} has been successfully registered to your account`,
          confirmButtonText: 'Start GPS Tracking',
          confirmButtonColor: '#28a745'
        });

        // Update local state with new device
        await loadUserDevices();

        // STORE REGISTRATION LOCATION IN GPS API as the FIRST point (starting point)
        if (currentLocation?.latitude && currentLocation?.longitude) {
          try {
            // Create registration location as starting point
            const registrationLocationData = {
              deviceId: deviceCode,
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              accuracy: currentLocation.accuracy || 10,
              timestamp: new Date().toISOString(),
              source: 'manual'
            };

            console.log('📍 Storing REGISTRATION LOCATION as STARTING POINT in GPS API:', registrationLocationData);
            const gpsResponse = await fetch('http://localhost:5001/api/gps/location', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(registrationLocationData)
            });

            if (gpsResponse.ok) {
              const result = await gpsResponse.json();
              console.log('✅ REGISTRATION LOCATION stored as STARTING POINT:', result);

              // Also store in local state immediately
              const locationPoint = {
                deviceId: deviceCode,
                deviceName: deviceDescription || deviceCode,
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                timestamp: registrationLocationData.timestamp,
                address: 'Registration Location (Starting Point)',
                accuracy: currentLocation.accuracy || 10
              };

              setDeviceLocations(prev => ({
                ...prev,
                [deviceCode]: [locationPoint] // Set as first point
              }));

            } else {
              console.error('❌ Failed to store registration location - HTTP error');
            }
          } catch (error) {
            console.error('❌ Failed to store registration location in GPS API:', error);
          }
        } else {
          console.warn('⚠️ No current location available for registration location storage');
        }

        // Create device object for immediate tracking using response data
        const newDevice = {
          deviceId: deviceCode,
          deviceCode: deviceCode,
          deviceName: deviceDescription,
          description: deviceDescription,
          purpose: devicePurpose,
          status: 'active',
          assignedTo: userData._id,
          registrationDate: new Date(),
          uploadMethod: deviceUploadMethod
        };

        // Reset form
        setDeviceUploadMethod('scan');
        setUploadedQRFile(null);
        setManualDeviceCode('');
        setScannedDeviceCode('');
        setDeviceDescription('');
        setDevicePurpose('');
        setShowDeviceFormModal(false);

        // Start GPS tracking for the newly registered device
        console.log('🎯 Starting GPS tracking for registered device:', deviceCode);
        handleStartGPSTracking(newDevice);

        // Switch to GPS tracking tab to show the device
        setActiveTab('gps-tracking');
      } else {
        console.error('❌ Device registration failed:', responseData);
        Swal.close();

        await Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: responseData.message || 'Failed to register QR code',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      console.error('❌ Error registering device:', error);
      Swal.close();

      let errorMessage = 'Failed to register QR code. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      }

      await Swal.fire({
        icon: 'error',
        title: 'Registration Error',
        text: errorMessage,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleScanDeviceForTracking = (device) => {
    // This will redirect to GPS tracking
    alert(`Starting GPS tracking for: ${device.description}\nDevice Code: ${device.deviceCode}`);
    // TODO: Implement GPS tracking redirect
  };

  const handleViewDeviceDetails = (device) => {
    // Show device details modal
    alert(`Device Details:\n\nDescription: ${device.description}\nCode: ${device.deviceCode}\nPurpose: ${device.purpose}\nAdded: ${new Date(device.addedDate).toLocaleDateString()}\nStatus: ${device.status}`);
  };

  // Load device location history from Location History API
  const loadDeviceLocationHistory = async (deviceId, limit = 100) => {
    try {
      console.log('📍 Loading location history for device:', deviceId);

      // Use new location history API
      const response = await api.getLocationHistory(deviceId, null, null, limit);

      console.log('🔍 Location History API Response:', response);

      if (response.success && response.locationHistory) {
        console.log('✅ Loaded location history:', response.locationHistory.length, 'locations');

        // Convert location history API response to local format and sort by timestamp
        const locationHistory = response.locationHistory
          .map(loc => ({
            deviceId: loc.deviceId,
            deviceName: loc.deviceName || deviceId,
            latitude: loc.location.latitude,
            longitude: loc.location.longitude,
            timestamp: loc.timestamp,
            recordedAt: loc.recordedAt || loc.timestamp,
            address: loc.address || 'GPS Location',
            accuracy: loc.location.accuracy || 10,
            speed: loc.location.speed || 0,
            distanceFromPrevious: loc.distanceFromPrevious || 0,
            totalDistance: loc.totalDistance || 0,
            source: loc.source || 'api'
          }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort chronologically

        console.log('📍 Sorted location history (chronological order):');
        locationHistory.forEach((loc, index) => {
          console.log(`${index + 1}. ${loc.latitude}, ${loc.longitude} at ${loc.timestamp} (${loc.distanceFromPrevious}m from previous)`);
        });

        // Update device locations - ACCUMULATE all points, don't replace
        setDeviceLocations(prev => {
          const existingLocations = prev[deviceId];
          const existingArray = Array.isArray(existingLocations) ? existingLocations : [];

          // Merge existing points with new points, avoiding duplicates
          const allLocations = [...existingArray];

          locationHistory.forEach(newLoc => {
            const exists = allLocations.some(existingLoc =>
              Math.abs(existingLoc.latitude - newLoc.latitude) < 0.000001 &&
              Math.abs(existingLoc.longitude - newLoc.longitude) < 0.000001
            );
            if (!exists) {
              allLocations.push(newLoc);
            }
          });

          // Sort by timestamp to maintain chronological order
          allLocations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          console.log('📍 Total accumulated points for device', deviceId, ':', allLocations.length);
          console.log('🛤️ All points:', allLocations.map(p => `(${p.latitude}, ${p.longitude})`));

        // Show visual feedback when new points are added
        if (allLocations.length > existingArray.length) {
          console.log('🆕 NEW POINTS DETECTED! Map will update automatically.');
        }

          return {
            ...prev,
            [deviceId]: allLocations // Store accumulated points
          };
        });

        // Update current location to latest point
        if (locationHistory.length > 0) {
          const latestLocation = locationHistory[locationHistory.length - 1];
          setCurrentLocation({
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude
          });
        }

        console.log('📍 Location history loaded for device:', deviceId, 'with', locationHistory.length, 'points');
        console.log('🛤️ Path coordinates:', locationHistory.map(point => [point.latitude, point.longitude]));
        console.log('📊 Route info:', response.routeInfo);
        return locationHistory;
      } else {
        console.log('⚠️ No location history found for device:', deviceId);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading location history:', error);
      return [];
    }
  };

  // Load latest device location from GPS API
  const loadLatestDeviceLocation = async (deviceId) => {
    try {
      console.log('📍 Loading latest location for device:', deviceId);

      // Use direct fetch to GPS API endpoint
      const response = await fetch(`http://localhost:5001/api/gps/device/${deviceId}`);
      const data = await response.json();

      console.log('🔍 GPS API Response:', data);

      if (data.status === 'success' && data.data.device) {
        console.log('✅ Latest location loaded from GPS API:', data.data.device);

        const location = {
          deviceId: data.data.device.deviceId,
          deviceName: data.data.device.deviceName || deviceId,
          latitude: data.data.device.latitude,
          longitude: data.data.device.longitude,
          timestamp: data.data.device.timestamp,
          address: 'GPS Location'
        };

        // Update current location for map display
        setCurrentLocation({
          latitude: location.latitude,
          longitude: location.longitude
        });

        // Update device locations - ADD to existing points, don't replace
        setDeviceLocations(prev => {
          const existingLocations = prev[deviceId];
          // Ensure existingLocations is always an array
          const locationsArray = Array.isArray(existingLocations) ? existingLocations : [];

          // Check if this location already exists to avoid duplicates
          const locationExists = locationsArray.some(loc =>
            Math.abs(loc.latitude - location.latitude) < 0.000001 &&
            Math.abs(loc.longitude - location.longitude) < 0.000001
          );

          if (!locationExists) {
            const newLocationsArray = [...locationsArray, location];
            console.log('📍 Added new point. Total points now:', newLocationsArray.length);
            console.log('🛤️ All points:', newLocationsArray.map(p => `(${p.latitude}, ${p.longitude})`));

            return {
              ...prev,
              [deviceId]: newLocationsArray // ADD new location to existing ones
            };
          }
          console.log('📍 Location already exists, not adding duplicate');
          return prev; // Don't add duplicate
        });

        console.log('📍 Latest GPS location set for device:', deviceId, 'at', location.latitude, location.longitude);
        console.log('🗺️ Map should update to:', location.latitude, location.longitude);
        return location;
      } else {
        console.log('⚠️ No latest location found for device:', deviceId);
        console.log('🔍 Full response:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading latest location:', error);
      return null;
    }
  };

  // Load user devices from database
  const loadUserDevices = async () => {
    try {
      console.log('📱 Loading user devices from database...');

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/devices/my-devices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.json();
      console.log('📱 User devices response:', responseData);

      if (response.ok && responseData.success) {
        const devices = responseData.devices || [];
        setUserDevices(devices);
        console.log('✅ Loaded user devices:', devices.length, 'devices');
        console.log('📋 Device details:', devices);
        console.log('🔍 Device structure check:', devices.map(d => ({
          deviceId: d.deviceId,
          deviceCode: d.deviceCode || d.deviceId,
          deviceName: d.deviceName,
          description: d.description,
          status: d.status
        })));

        // Auto-restore selected device after page refresh
        const savedSelectedDevice = localStorage.getItem('selectedDeviceForTracking');
        if (savedSelectedDevice && devices.length > 0) {
          try {
            const parsedDevice = JSON.parse(savedSelectedDevice);
            const foundDevice = devices.find(d =>
              (d.deviceId === parsedDevice.deviceId) ||
              (d.deviceCode === parsedDevice.deviceCode)
            );

            if (foundDevice) {
              console.log('🔄 Auto-restoring selected device after refresh:', foundDevice);
              setSelectedDeviceForRealTimeTracking(foundDevice);

              // Auto-load location history for restored device
              setTimeout(async () => {
                const deviceKey = foundDevice.deviceId || foundDevice.deviceCode;
                console.log('🔄 Auto-loading location history for restored device:', deviceKey);
                await loadDeviceLocationHistory(deviceKey, 100);

                // Start auto-refresh
                if (window.locationRefreshInterval) {
                  clearInterval(window.locationRefreshInterval);
                }
                window.locationRefreshInterval = setInterval(async () => {
                  console.log('🔄 Auto-refreshing for restored device...');
                  await loadDeviceLocationHistory(deviceKey, 100);
                }, 2000);

                console.log('✅ Auto-refresh restored for device:', deviceKey);
              }, 1000);
            }
          } catch (error) {
            console.error('❌ Error restoring selected device:', error);
            localStorage.removeItem('selectedDeviceForTracking');
          }
        }
      } else {
        console.log('⚠️ No devices found or failed to load');
        setUserDevices([]);
      }
    } catch (error) {
      console.error('❌ Error loading user devices:', error);
      setUserDevices([]);
    }
  };

  // Load admin device uploads from database
  const loadAdminDeviceUploads = async () => {
    try {
      console.log('📋 Loading user device uploads from gpstracker database...');

      // Try to load from API first
      try {
        const response = await api.getUserDevices();
        if (response.success && response.data) {
          setAdminDeviceUploads(response.data);
          console.log('✅ Loaded device uploads from API:', response.data.length, 'uploads');
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ Device uploads API not available, loading from localStorage:', apiError);
      }

      // Fallback to localStorage (for development) - get actual user devices
      const userDevicesData = JSON.parse(localStorage.getItem('userDevices') || '[]');
      setAdminDeviceUploads(userDevicesData);
      console.log('✅ Loaded device uploads from localStorage:', userDevicesData.length, 'uploads');
    } catch (error) {
      console.error('❌ Error loading admin device uploads:', error);
      setAdminDeviceUploads([]);
    }
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

  const handleSaveProfile = async () => {
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

      // Update user data in database
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/users/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(editedProfile)
        });

        if (response.ok) {
          setUserData(updatedUserData);
          console.log('✅ User profile updated in database');
        } else {
          throw new Error('Failed to update profile in database');
        }
      } catch (error) {
        console.error('❌ Error updating profile:', error);
        setEditError('Failed to update profile. Please try again.');
        return;
      }

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

  const handlePasswordSubmit = async () => {
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

      // Update password in database
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/auth/change-password', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        });

        if (response.ok) {
          console.log('✅ Password updated in database');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update password');
        }
      } catch (error) {
        console.error('❌ Error updating password:', error);
        setPasswordError(error.message || 'Failed to update password. Please try again.');
        return;
      }

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

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion');
      return;
    }

    try {
      // Verify password with database
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userData._id,
          password: deletePassword
        })
      });

      if (!response.ok) {
        throw new Error('Password verification failed');
      }

      const verificationResult = await response.json();
      if (!verificationResult.success) {
        throw new Error('Invalid password');
      }

      // Delete user account from database
      const deleteResponse = await fetch(`http://localhost:5001/api/users/${userData._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete account from database');
      }

      // Clear user data
      localStorage.removeItem('token');

      // Show success message and redirect to login
      alert('Account deleted successfully');
      window.location.href = '/login';
    } catch (err) {
      setDeleteError('An error occurred while deleting your account');
    }
  };

  // Check camera permissions
  const checkCameraPermissions = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // Stop the stream immediately as we just wanted to check permissions
      stream.getTracks().forEach(track => track.stop());

      console.log('✅ Camera permission granted');
      return true;
    } catch (error) {
      console.error('❌ Camera permission error:', error);

      if (error.name === 'NotAllowedError') {
        setScanError('Camera permission denied. Please allow camera access in your browser settings and refresh the page.');
      } else if (error.name === 'NotFoundError') {
        setScanError('No camera found. Please connect a camera and try again.');
      } else {
        setScanError(`Camera error: ${error.message}`);
      }

      return false;
    }
  };

  const handleStartScan = async () => {
    console.log('🚀 Starting QR scanner...');
    setShowQRScanner(true);
    setScanResult(null);
    setScanError(null);

    // Check camera permissions first
    const hasPermission = await checkCameraPermissions();
    if (!hasPermission) {
      return;
    }

    // Initialize scanner after modal is shown
    setTimeout(() => {
      console.log('⏰ Initializing scanner after timeout...');

      // Clear any existing scanner first
      if (scannerRef.current) {
        console.log('🧹 Clearing existing scanner...');
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.warn('Warning clearing scanner:', error);
        }
        scannerRef.current = null;
      }

      try {
        console.log('📷 Creating new Html5QrcodeScanner...');
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true
          },
          false
        );

        console.log('🎬 Rendering scanner...');
        scannerRef.current.render(
          (decodedText) => {
            // Success callback
            console.log('🎯 QR Code scanned successfully:', decodedText);
            console.log('📏 QR Code data length:', decodedText.length);
            console.log('🔍 QR Code preview:', decodedText.substring(0, 200) + (decodedText.length > 200 ? '...' : ''));

            setScanResult(decodedText);
            if (scannerRef.current) {
              scannerRef.current.clear();
              scannerRef.current = null;
            }
            setShowQRScanner(false);

            // Check if this is for device registration (callback is set)
            if (qrScanCallback && typeof qrScanCallback === 'function') {
              console.log('📱 Camera scan for device registration:', decodedText);
              qrScanCallback(decodedText);
            } else {
              // Handle the scanned QR code data for GPS tracking
              handleQRCodeData(decodedText, 'scan').catch(error => {
                console.error('❌ Error handling QR code data:', error);
              });
            }
          },
          (errorMessage) => {
            // Error callback - only log significant errors, not continuous scanning attempts
            if (!errorMessage.includes('No QR code found') &&
                !errorMessage.includes('NotFoundException') &&
                !errorMessage.includes('No MultiFormat Readers')) {
              console.warn('⚠️ QR Scanner error:', errorMessage);

              // Check for camera permission errors
              if (errorMessage.includes('Permission denied') ||
                  errorMessage.includes('NotAllowedError') ||
                  errorMessage.includes('camera')) {
                setScanError('Camera permission denied. Please allow camera access and try again.');
              } else {
                setScanError(errorMessage);
              }
            }
          }
        );
        console.log('✅ Scanner initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing scanner:', error);
        setScanError('Failed to initialize camera. Please check camera permissions and try again.');
      }
    }, 1000); // Increased timeout to ensure modal is fully rendered
  };

  const handleQRCodeData = async (data, scanMethod = 'scan') => {
    console.log('🔄 Processing QR code data...');
    console.log('📄 Raw QR data:', data);
    console.log('📏 Data length:', data.length);
    console.log('📱 Scan method:', scanMethod);

    // Capture current location as starting point
    try {
      const startingLocation = await getCurrentLocationAsStartingPoint();
      await processQRCodeWithStartingPoint(data, startingLocation, scanMethod);
    } catch (error) {
      console.error('❌ Could not get exact GPS location:', error);
      alert(`❌ GPS Location Required\n\n${error.message}\n\nQR code processing cancelled. Please fix GPS issues and try again for exact location tracking.`);
      return; // Don't proceed without exact GPS
    }
  };

  // Get current location as starting point for GPS tracking
  const getCurrentLocationAsStartingPoint = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      console.log('📍 Getting current location as starting point...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const accuracy = position.coords.accuracy;

          // Validate GPS accuracy for starting point
          if (accuracy > 100) {
            alert(`⚠️ Starting Point Accuracy Warning\n\nDetected accuracy: ${accuracy}m\n\nThis appears to be WiFi-based location. For exact starting point:\n• Go outdoors\n• Enable GPS in device settings\n• Wait for satellite connection`);
          }

          const startingLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            source: accuracy <= 100 ? 'exact_gps' : 'network_location',
            address: 'Getting address...' // Will be updated with reverse geocoding
          };

          // Get address for the starting location
          getAddressFromCoordinates(startingLocation.latitude, startingLocation.longitude)
            .then(address => {
              startingLocation.address = address;
              resolve(startingLocation);
            })
            .catch(() => {
              startingLocation.address = 'Address not available';
              resolve(startingLocation);
            });
        },
        (error) => {
          let errorMessage = 'GPS starting point failed: ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location access and GPS.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'GPS satellites unavailable. Please go outdoors.';
              break;
            case error.TIMEOUT:
              errorMessage += 'GPS timeout. Please go outdoors with clear sky view.';
              break;
            default:
              errorMessage += 'Please check device GPS settings.';
              break;
          }
          console.error('❌', errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,  // Force GPS
          timeout: 45000,           // Wait longer for GPS
          maximumAge: 0             // No cached location
        }
      );
    });
  };

  // Get address from coordinates using Geoapify
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      console.log('🗺️ Getting address for coordinates:', latitude, longitude);

      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=de2893b1cf944153a664eafec9121e98`
      );
      const data = await response.json();

      console.log('🗺️ Geoapify response:', data);

      if (data.features && data.features.length > 0) {
        const address = data.features[0].properties.formatted;
        console.log('✅ Address found:', address);
        return address;
      }

      console.log('⚠️ No address found from Geoapify, using coordinates');
      return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('❌ Error getting address:', error);
      return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  // Save device with starting location to database
  const saveDeviceWithStartingLocation = async (deviceInfo) => {
    try {
      console.log('💾 Saving device with starting location to database:', deviceInfo);

      const deviceData = {
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        assignedTo: userData.username,
        assignedBy: userData.username,
        assignedAt: new Date().toISOString(),
        status: 'active',
        startingLocation: deviceInfo.startingLocation,
        trackingPath: deviceInfo.trackingPath || [deviceInfo.startingLocation],
        currentLocation: deviceInfo.startingLocation, // Current location is starting location initially
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        metadata: {
          scannedAt: deviceInfo.scannedAt,
          scannedBy: deviceInfo.scannedBy,
          manufacturer: deviceInfo.manufacturer,
          model: deviceInfo.model,
          rawQRData: deviceInfo.rawQRData
        }
      };

      // Save to database via API
      const response = await api.registerDevice(deviceData);

      if (response.success) {
        console.log('✅ Device saved to database successfully:', response.device);

        // Also save the initial location point
        await saveLocationPoint(deviceInfo.deviceId, deviceInfo.startingLocation, 'starting_point');

        // Update local state
        const updatedDevices = [...allDevices, response.device];
        setAllDevices(updatedDevices);

        Swal.fire({
          icon: 'success',
          title: 'Device Registered!',
          text: `${deviceInfo.deviceName} has been registered with starting location`,
          timer: 3000,
          showConfirmButton: false
        });
      } else {
        throw new Error(response.message || 'Failed to save device');
      }
    } catch (error) {
      console.error('❌ Error saving device to database:', error);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: 'Failed to register device. Please try again.',
        confirmButtonText: 'OK'
      });
    }
  };

  // Save individual location point to database
  const saveLocationPoint = async (deviceId, locationData, pointType = 'tracking_point') => {
    try {
      const locationPoint = {
        deviceId: deviceId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy || 10,
        address: locationData.address || 'Address not available',
        timestamp: locationData.timestamp || new Date().toISOString(),
        source: locationData.source || 'manual',
        pointType: pointType, // 'starting_point', 'tracking_point', 'ending_point'
        recordedBy: userData.username,
        recordedAt: new Date().toISOString()
      };

      console.log('📍 Saving location point:', locationPoint);

      // Save via GPS API
      const response = await gpsApi.saveLocation(locationPoint);

      if (response.success) {
        console.log('✅ Location point saved successfully');
        return response.location;
      } else {
        throw new Error(response.message || 'Failed to save location');
      }
    } catch (error) {
      console.error('❌ Error saving location point:', error);
      throw error;
    }
  };

  // Update device location and tracking path (for API updates from Postman)
  const updateDeviceLocation = async (deviceId, newLocationData) => {
    try {
      console.log('🔄 Updating device location:', deviceId, newLocationData);

      // Get address for the new location
      const address = await getAddressFromCoordinates(newLocationData.latitude, newLocationData.longitude);

      const locationWithAddress = {
        ...newLocationData,
        address: address,
        timestamp: new Date().toISOString(),
        source: 'network',
        deviceId: deviceId
      };

      // Save the new location point to database
      await saveLocationPoint(deviceId, locationWithAddress, 'tracking_point');

      // Update device locations state for immediate UI update
      const deviceKey = deviceId;
      setDeviceLocations(prev => {
        const existingLocations = prev[deviceKey] || [];
        const updatedLocations = [...existingLocations, locationWithAddress];
        console.log('📍 Updated device locations for', deviceKey, ':', updatedLocations.length, 'total points');
        return {
          ...prev,
          [deviceKey]: updatedLocations
        };
      });

      // Update the device's tracking path in allDevices
      setAllDevices(prev => {
        const updatedDevices = prev.map(device => {
          if (device.deviceId === deviceId) {
            const existingPath = device.trackingPath || [];
            const updatedPath = [...existingPath, locationWithAddress];
            console.log('🔴 Updated tracking path for', deviceId, ':', updatedPath.length, 'total points');
            return {
              ...device,
              currentLocation: locationWithAddress,
              trackingPath: updatedPath,
              lastUpdated: new Date().toISOString()
            };
          }
          return device;
        });
        console.log('📱 Updated devices state');
        return updatedDevices;
      });

      // Update the map if this device is currently being tracked
      if (selectedDeviceForRealTimeTracking && selectedDeviceForRealTimeTracking.deviceId === deviceId) {
        setSelectedDeviceForRealTimeTracking(prev => ({
          ...prev,
          currentLocation: locationWithAddress,
          trackingPath: [...(prev.trackingPath || []), locationWithAddress]
        }));
      }

      console.log('✅ Device location updated successfully');
      console.log('📍 Location saved to localStorage and state');
      return locationWithAddress;
    } catch (error) {
      console.error('❌ Error updating device location:', error);
      throw error;
    }
  };

  // Poll for location updates (to catch API updates from Postman)
  useEffect(() => {
    if (!userData || userData.role !== 'user') return;

    const pollForLocationUpdates = async () => {
      try {
        // Get all devices for current user
        const userDevices = allDevices.filter(device => device.assignedTo === userData.username);

        for (const device of userDevices) {
          // Check for new location updates from API
          const response = await gpsApi.getLatestLocation(device.deviceId);

          if (response.success && response.location) {
            const latestLocation = response.location;
            const currentLocation = device.currentLocation;

            // Check if this is a new location update
            if (!currentLocation ||
                latestLocation.timestamp > currentLocation.timestamp ||
                latestLocation.latitude !== currentLocation.latitude ||
                latestLocation.longitude !== currentLocation.longitude) {

              console.log('🆕 New location update detected for device:', device.deviceId);
              await updateDeviceLocation(device.deviceId, latestLocation);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error polling for location updates:', error);
      }
    };

    // Poll every 30 seconds for location updates
    const pollInterval = setInterval(pollForLocationUpdates, 30000);

    // Initial poll
    pollForLocationUpdates();

    return () => clearInterval(pollInterval);
  }, [userData, allDevices]);

  // Calendar-based location tracking (MOVED BEFORE useEffect)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
  const [calendarLocationHistory, setCalendarLocationHistory] = useState([]);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [loadingCalendarData, setLoadingCalendarData] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);

  // Load device locations from database when user logs in
  useEffect(() => {
    if (userData && userData.role === 'user' && allDevices.length > 0) {
      loadAllDeviceLocationsFromDatabase();
    }
  }, [userData, allDevices.length]);

  // Auto-refresh GPS data when device is selected for tracking
  useEffect(() => {
    if (selectedDeviceForRealTimeTracking && showPathLines) {
      const deviceId = selectedDeviceForRealTimeTracking.deviceId || selectedDeviceForRealTimeTracking.deviceCode;

      console.log('🔄 Setting up auto-refresh for device:', deviceId);

      // Initial load
      loadDeviceLocations(deviceId);

      // Set up auto-refresh every 5 seconds for real-time updates
      const refreshInterval = setInterval(async () => {
        console.log('🔄 Auto-refreshing GPS data for device:', deviceId);
        await loadDeviceLocations(deviceId);

        // Also refresh calendar data if date is selected
        if (selectedCalendarDate) {
          await loadLocationHistoryForDate(deviceId, selectedCalendarDate);
        }
      }, 5000); // Every 5 seconds for faster updates

      return () => {
        console.log('🛑 Stopping auto-refresh for device:', deviceId);
        clearInterval(refreshInterval);
      };
    }
  }, [selectedDeviceForRealTimeTracking, showPathLines, selectedCalendarDate]);

  // Load scan history when scan history section is accessed
  useEffect(() => {
    if (userData && userData.role === 'user' && activeTab === 'scan-history') {
      loadScanHistoryFromDatabase();
    }
  }, [userData, activeTab]);

  // Scan History states
  const [scanHistory, setScanHistory] = useState([]);
  const [loadingScanHistory, setLoadingScanHistory] = useState(false);
  const [scanHistoryError, setScanHistoryError] = useState('');

  // Load location history for a specific date from GPS API
  const loadLocationHistoryForDate = async (deviceId, selectedDate) => {
    try {
      setLoadingCalendarData(true);
      console.log('📅 Loading location history from GPS API for date:', selectedDate, 'device:', deviceId);

      // 🔥 FIRST: Try GPS API for path data
      try {
        const gpsResponse = await fetch(`http://localhost:5001/api/gps/path/${deviceId}`);

        if (gpsResponse.ok) {
          const gpsData = await gpsResponse.json();
          console.log('📡 GPS API response:', gpsData);

          if (gpsData.status === 'success' && gpsData.data.pathPoints) {
            // Filter locations by selected date
            const selectedDateStr = new Date(selectedDate).toDateString();
            const filteredLocations = gpsData.data.pathPoints.filter(point => {
              const pointDate = new Date(point.timestamp).toDateString();
              return pointDate === selectedDateStr;
            });

            console.log('📅 Filtered locations for date:', filteredLocations.length, 'points');

            if (filteredLocations.length > 0) {
              const locations = filteredLocations.map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                accuracy: loc.accuracy || 10,
                timestamp: loc.timestamp,
                source: 'gps_api'
              }));

              setCalendarLocationHistory(locations);
              return locations;
            }
          }
        }
      } catch (gpsError) {
        console.log('⚠️ GPS API failed, trying location history API:', gpsError.message);
      }

      // FALLBACK: Call location history API
      const response = await api.getLocationHistoryForDate(deviceId, selectedDate);

      if (response.success && response.locationHistory) {
        const locations = response.locationHistory.map(loc => ({
          ...loc,
          latitude: loc.location.latitude,
          longitude: loc.location.longitude,
          accuracy: loc.location.accuracy,
          timestamp: loc.timestamp,
          recordedAt: loc.recordedAt || loc.timestamp,
          address: loc.address || '',
          distanceFromPrevious: loc.distanceFromPrevious || 0,
          totalDistance: loc.totalDistance || 0
        }));

        console.log('✅ Location history loaded for date:', locations.length, 'points');
        console.log('📊 Route stats:', response.routeStats);
        setCalendarLocationHistory(locations);

        // Show route statistics
        if (response.routeStats && response.routeStats.totalDistance > 0) {
          console.log(`🛣️ Route: ${response.routeStats.totalDistance.toFixed(2)}m, ${response.routeStats.totalPoints} points, ${(response.routeStats.duration / 60).toFixed(1)} minutes`);
        }

        return locations;
      } else {
        console.log('📅 No locations found in database for date:', selectedDate);
        setCalendarLocationHistory([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading calendar location history from database:', error);
      setCalendarLocationHistory([]);
      return [];
    } finally {
      setLoadingCalendarData(false);
    }
  };

  // Get available dates with location data
  const getAvailableDatesWithData = async (deviceId) => {
    try {
      console.log('📅 Getting available dates for device:', deviceId);

      // Get available dates from location history API
      const response = await api.getAvailableDatesForDevice(deviceId);

      if (response.success && response.dates) {
        const dates = response.dates.map(dateInfo => dateInfo.date);

        console.log('📅 Available dates with data:', dates);
        console.log('📊 Date details:', response.dates);
        setAvailableDates(dates);
        return dates;
      } else {
        console.log('📅 No location data found for device');
        setAvailableDates([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Error getting available dates:', error);
      setAvailableDates([]);
      return [];
    }
  };

  // Handle calendar date selection
  const handleCalendarDateChange = async (date) => {
    setSelectedCalendarDate(date);

    if (selectedDeviceForRealTimeTracking && date) {
      const deviceId = selectedDeviceForRealTimeTracking.deviceId || selectedDeviceForRealTimeTracking.deviceCode;
      await loadLocationHistoryForDate(deviceId, date);
    }
  };

  // Save scan history to database
  const saveScanHistoryToDatabase = async (deviceInfo, startingLocation) => {
    try {
      console.log('📝 Saving scan history to database...');

      const scanHistoryData = {
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        qrCodeId: deviceInfo.qrCodeId,
        scanMethod: deviceInfo.scanMethod || 'unknown', // scan, upload, manual
        scanLocation: {
          latitude: startingLocation.latitude,
          longitude: startingLocation.longitude,
          address: startingLocation.address,
          accuracy: startingLocation.accuracy
        },
        scannedBy: userData.username,
        scannedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        rawQRData: deviceInfo.rawData || deviceInfo.deviceId,
        deviceType: deviceInfo.deviceType || 'GPS Tracker',
        status: 'completed'
      };

      console.log('📝 Scan history data:', scanHistoryData);

      // Save via API
      const response = await api.saveScanHistory(scanHistoryData);

      if (response.success) {
        console.log('✅ Scan history saved successfully');
        // Refresh scan history if user is viewing it
        if (activeTab === 'scan-history') {
          loadScanHistoryFromDatabase();
        }
      } else {
        throw new Error(response.message || 'Failed to save scan history');
      }
    } catch (error) {
      console.error('❌ Error saving scan history:', error);
      // Don't show error to user as this is background operation
    }
  };

  // Load scan history from database
  const loadScanHistoryFromDatabase = async () => {
    try {
      setLoadingScanHistory(true);
      setScanHistoryError('');
      console.log('📜 Loading scan history from database...');

      const response = await api.getScanHistory(userData.username);

      if (response.success && response.scanHistory) {
        const history = response.scanHistory.map(scan => ({
          ...scan,
          scannedAt: scan.scannedAt || scan.timestamp,
          scanLocation: scan.scanLocation || {}
        }));

        // Sort by most recent first
        history.sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));

        console.log('✅ Scan history loaded:', history.length, 'entries');
        setScanHistory(history);
      } else {
        console.log('📜 No scan history found');
        setScanHistory([]);
      }
    } catch (error) {
      console.error('❌ Error loading scan history:', error);
      setScanHistoryError('Failed to load scan history');
      setScanHistory([]);
    } finally {
      setLoadingScanHistory(false);
    }
  };

  // Load all device locations from database for current user
  const loadAllDeviceLocationsFromDatabase = async () => {
    try {
      if (!userData || userData.role !== 'user') return;

      console.log('📍 Loading all device locations from database for user:', userData.username);

      // Get all devices for current user
      const userDevices = allDevices.filter(device => device.assignedTo === userData.username);

      for (const device of userDevices) {
        try {
          // Get all locations for this device from database
          const response = await gpsApi.getAllLocationsForDevice(device.deviceId);

          if (response.success && response.locations) {
            const locations = response.locations.map(loc => ({
              ...loc,
              timestamp: loc.timestamp || loc.recordedAt,
              latitude: parseFloat(loc.latitude),
              longitude: parseFloat(loc.longitude)
            }));

            console.log(`✅ Loaded ${locations.length} locations for device ${device.deviceId}`);

            // Update device locations state
            setDeviceLocations(prev => ({
              ...prev,
              [device.deviceId]: locations
            }));

            // Update device tracking path
            const updatedDevices = allDevices.map(d => {
              if (d.deviceId === device.deviceId) {
                return {
                  ...d,
                  trackingPath: locations,
                  currentLocation: locations.length > 0 ? locations[locations.length - 1] : null
                };
              }
              return d;
            });

            setAllDevices(updatedDevices);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load locations for device ${device.deviceId}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error loading device locations from database:', error);
    }
  };

  // Process QR code with starting location
  const processQRCodeWithStartingPoint = async (data, startingLocation, scanMethod = 'scan') => {
    console.log('🔄 Processing QR code with starting location:', startingLocation);
    console.log('📱 Scan method:', scanMethod);

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
            scannedBy: userData?.username || 'Unknown',
            scanMethod: scanMethod, // scan, upload, manual
            // Add starting location where QR was scanned
            startingLocation: startingLocation,
            trackingPath: [startingLocation] // Initialize tracking path with starting point
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
            status: qrCode.status,
            scanMethod: scanMethod, // scan, upload, manual
            // Add starting location where QR was scanned
            startingLocation: startingLocation,
            trackingPath: [startingLocation] // Initialize tracking path with starting point
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
              rawData: cleanData,
              // Add starting location where QR was scanned
              startingLocation: startingLocation,
              trackingPath: [startingLocation] // Initialize tracking path with starting point
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
              error: 'Invalid JSON format',
              // Add starting location where QR was scanned
              startingLocation: startingLocation,
              trackingPath: [startingLocation] // Initialize tracking path with starting point
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
            // Use starting location instead of default coordinates
            latitude: startingLocation.latitude,
            longitude: startingLocation.longitude,
            accuracy: startingLocation.accuracy || 10,
            // Add starting location where QR was scanned
            startingLocation: startingLocation,
            trackingPath: [startingLocation] // Initialize tracking path with starting point
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
        scanMethod: scanMethod, // Add scan method (scan, upload, manual)

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

      // Save device with starting location to database
      saveDeviceWithStartingLocation(enhancedDeviceInfo);

      // Save scan history to database
      saveScanHistoryToDatabase(enhancedDeviceInfo, startingLocation);

      // Save scan location as the first location entry in location history
      try {
        console.log('📍 Saving scan location as starting point in location history...');

        // Get real address for the scan location
        const realAddress = await getAddressFromCoordinates(
          startingLocation.latitude,
          startingLocation.longitude
        );

        const locationData = {
          deviceId: enhancedDeviceInfo.deviceId,
          latitude: startingLocation.latitude,
          longitude: startingLocation.longitude,
          accuracy: startingLocation.accuracy || 10,
          source: 'manual', // Scan location is manual entry
          address: realAddress
        };

        const response = await api.updateLocation(locationData);
        if (response.success) {
          console.log('✅ Scan location saved as starting point with address:', realAddress);
        }
      } catch (error) {
        console.error('❌ Error saving scan location:', error);
      }

      // Check if there's a callback from device action (scan/upload)
      if (qrScanCallback && typeof qrScanCallback === 'function') {
        // Call the callback with the device ID for device registration flow
        console.log('📞 Calling QR scan callback with device ID:', enhancedDeviceInfo.deviceId);
        qrScanCallback(enhancedDeviceInfo.deviceId);
        return; // Exit early to avoid showing the device details modal
      }

      // Show the device details modal (for regular QR scanning)
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

  // Simple and reliable QR scanner function
  const startQRScanner = async (retryCount = 0) => {
    try {
      console.log('🚀 Starting QR scanner...');

      // Check if the qr-reader element exists
      const qrReaderElement = document.getElementById('qr-reader');
      console.log('🔍 Looking for qr-reader element:', qrReaderElement);
      console.log('🔍 All elements with id containing "qr":', document.querySelectorAll('[id*="qr"]'));

      if (!qrReaderElement) {
        if (retryCount < 5) {
          console.error(`❌ QR reader element not found, retrying in 1 second... (attempt ${retryCount + 1}/5)`);
          setTimeout(() => {
            startQRScanner(retryCount + 1);
          }, 1000);
          return;
        } else {
          console.error('❌ QR reader element not found after 5 attempts, giving up');
          setScanError('Failed to initialize scanner. Please close and try again.');
          return;
        }
      }

      console.log('✅ QR reader element found, initializing scanner...');

      // Clear any existing scanner
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Error clearing existing scanner:', e);
        }
        scannerRef.current = null;
      }

      // Import the scanner
      const { Html5QrcodeScanner } = await import('html5-qrcode');

      // Create new scanner with DOM safety checks
      try {
        // Double-check DOM element exists
        const qrElement = document.getElementById('qr-reader');
        if (!qrElement) {
          throw new Error('QR reader element not found');
        }

        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true
          },
          false
        );
      } catch (scannerCreateError) {
        console.error('❌ Failed to create QR scanner:', scannerCreateError);
        setScanError('Failed to initialize scanner. Please close and try again.');
        return;
      }

      // Start scanning
      scannerRef.current.render(
        (decodedText) => {
          console.log('✅ QR Code scanned:', decodedText);
          setScanResult(decodedText);

          // Clear scanner
          if (scannerRef.current) {
            try {
              scannerRef.current.clear();
            } catch (e) {
              console.warn('Error clearing scanner:', e);
            }
            scannerRef.current = null;
          }

          // Close modal
          setShowQRScanner(false);

          // Check if this is for device registration (callback is set)
          if (qrScanCallback && typeof qrScanCallback === 'function') {
            console.log('📱 Camera scan for device registration:', decodedText);
            qrScanCallback(decodedText);
          } else {
            // Process the QR code for GPS tracking
            handleQRCodeData(decodedText).catch(error => {
              console.error('❌ Error handling QR code data:', error);
            });
          }
        },
        (errorMessage) => {
          // Only show significant errors
          if (!errorMessage.includes('No QR code found') &&
              !errorMessage.includes('NotFoundException')) {
            console.warn('Scanner error:', errorMessage);
            if (errorMessage.includes('Permission denied') ||
                errorMessage.includes('NotAllowedError')) {
              setScanError('Camera permission denied. Please allow camera access.');
            }
          }
        }
      );

      console.log('✅ Scanner started successfully');
    } catch (error) {
      console.error('❌ Failed to start scanner:', error);
      setScanError(`Failed to start camera: ${error.message}`);
    }
  };

  // Start scanner when modal opens
  useEffect(() => {
    if (showQRScanner) {
      console.log('📱 QR Scanner modal opened, starting scanner...');
      const timer = setTimeout(() => {
        startQRScanner();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [showQRScanner]);

  const handleCloseScanner = () => {
    console.log('🔒 Closing QR scanner...');

    if (scannerRef.current) {
      try {
        console.log('🧹 Clearing scanner instance...');
        scannerRef.current.clear();
        scannerRef.current = null;
        console.log('✅ Scanner cleared successfully');
      } catch (error) {
        console.warn('⚠️ Error clearing scanner:', error);
        scannerRef.current = null;
      }
    }

    setShowQRScanner(false);
    setScanResult(null);
    setScanError(null);
    console.log('🏁 Scanner closed');
  };



  // Handle QR code image upload with better detection
  const handleQRImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show loading state
    alert('📁 Processing QR code image... Please wait.');

    try {
      console.log('📁 Processing uploaded QR image:', file.name);

      // Method 1: Use jsQR for reliable PNG scanning
      try {
        console.log('🔍 Method 1: Using jsQR for PNG scanning...');
        const jsQR = (await import('jsqr')).default;

        // Create canvas and get image data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const result = await new Promise((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Scan QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              resolve(code.data);
            } else {
              reject(new Error('No QR code found'));
            }
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });

        console.log('✅ QR Code detected from uploaded image:', result);

        // Set scan result and trigger the same flow as camera scanning
        setScanResult(result);
        handleQRCodeData(result, 'upload').catch(error => {
          console.error('❌ Error handling QR code data:', error);
        });

        alert('✅ QR Code successfully read from image!');
        return;

      } catch (scanError) {
        console.log('Method 1 failed, trying alternative methods...');
      }

      // Method 2: Try with image enhancement
      try {
        console.log('🔍 Method 2: Enhanced image processing...');
        const jsQR = (await import('jsqr')).default;

        // Create canvas and enhance image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const result = await new Promise((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Apply contrast enhancement
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Increase contrast
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, data[i] * 1.5);     // Red
              data[i + 1] = Math.min(255, data[i + 1] * 1.5); // Green
              data[i + 2] = Math.min(255, data[i + 2] * 1.5); // Blue
            }

            ctx.putImageData(imageData, 0, 0);
            const enhancedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Scan QR code
            const code = jsQR(enhancedImageData.data, enhancedImageData.width, enhancedImageData.height);
            if (code) {
              resolve(code.data);
            } else {
              reject(new Error('No QR code found'));
            }
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });

        console.log('✅ QR Code detected (method 2):', result);
        setScanResult(result);
        handleQRCodeData(result, 'upload').catch(error => {
          console.error('❌ Error handling QR code data:', error);
        });
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
              handleQRCodeData(code.data).catch(error => {
                console.error('❌ Error handling QR code data:', error);
              });
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

        // Try scanning the enhanced image directly
        try {
          // Put enhanced image back on canvas
          ctx.putImageData(enhancedImageData, 0, 0);

          // Import jsQR and scan
          const jsQR = (await import('jsqr')).default;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            const result = code.data;
            console.log(`✅ QR Code detected with enhancement technique ${i + 1}:`, result);
            setScanResult(result);
            handleQRCodeData(result).catch(error => {
              console.error('❌ Error handling QR code data:', error);
            });
            alert('✅ QR Code successfully read from enhanced image!');
            return;
          }
        } catch (enhancedScanError) {
          console.log(`Enhancement technique ${i + 1} scan failed:`, enhancedScanError);
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
        handleQRCodeData(userInput.trim(), 'manual').catch(error => {
          console.error('❌ Error handling QR code data:', error);
        });
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
        {/* Dynamic Two Column Layout: Main Content + Quick Actions Sidebar */}
        <div className="d-flex flex-wrap" style={{
          gap: '1.5rem',
          alignItems: 'flex-start',
          minHeight: '100%'
        }}>

          {/* Main Content Area - Dynamic Width */}
          <div style={{
            flex: '1 1 auto',
            marginLeft: 0,
            minWidth: '300px',
            maxWidth: 'calc(100% - 320px)'
          }}>
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
          <Col lg={3}>
            {(userData.role === 'admin' || userData.role === 'superadmin') ? (
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center ">
                    <h5 className="mb-0"> GPSTracker Overview</h5>
                    <div className="d-flex ">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={async () => {
                          try {
                            await loadAllUsers();
                            await loadAdminQRCodes();
                            alert('✅ Dashboard data refreshed from gpstracker database!');
                          } catch (error) {
                            alert(`❌ Failed to refresh: ${error.message}`);
                          }
                        }}
                      >
                        🔄 Refresh Data
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setShowQRManagementModal(true)}
                      >
                        Manage QR Codes
                      </Button>
                    </div>
                  </div>

                  {/* Statistics Cards - Keep Original Dynamic Layout */}
                  <div className="d-flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Card className="border-primary h-100">
                        <Card.Body className="text-center">
                          <h3 className="text-primary">{Array.isArray(allUsers) ? allUsers.length : 0}</h3>
                          <small className="text-muted">Total Users</small>
                        </Card.Body>
                      </Card>
                    </div>
                    <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Card className="border-success h-100">
                        <Card.Body className="text-center">
                          <h3 className="text-success">{generatedQRCodes.filter(qr => qr.status === 'available').length}</h3>
                          <small className="text-muted">Available QR Codes</small>
                        </Card.Body>
                      </Card>
                    </div>
                    <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Card className="border-warning h-100">
                        <Card.Body className="text-center">
                          <h3 className="text-warning">{Array.isArray(allQRCodes) ? allQRCodes.length : 0}</h3>
                          <small className="text-muted">Assigned QR Codes</small>
                        </Card.Body>
                      </Card>
                    </div>
                    <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Card className="border-info h-100">
                        <Card.Body className="text-center">
                          <h3 className="text-info">{Array.isArray(allUsers) ? allUsers.filter(user => user.role === 'admin' || user.role === 'superadmin').length : 0}</h3>
                          <small className="text-muted">Admin Users</small>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h6>Recent QR Code Activity</h6>
                    {allDevices.length === 0 ? (
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
                            {allDevices.slice(0, 5).map((qr) => (
                              <tr key={qr.id}>
                                <td><code style={{ fontSize: '0.8rem' }}>{qr.deviceId}</code></td>
                                <td>
                                  <Badge bg={
                                    (!qr.assignedTo || qr.assignedTo === null) ? 'success' :
                                    qr.assignedTo ? 'warning' : 'info'
                                  } size="sm">
                                    {(!qr.assignedTo || qr.assignedTo === null) ? 'available' : 'assigned'}
                                  </Badge>
                                </td>
                                <td>{qr.assignedTo || '-'}</td>
                                <td>{new Date(qr.assignedDate || Date.now()).toLocaleDateString()}</td>
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

        </Row>
          </div>

          {/* Quick Actions Sidebar - Dynamic Width */}
          <div style={{
            width: '300px',
            minWidth: '280px',
            maxWidth: '320px',
            flexShrink: 0,
            marginLeft: 0,
            height: 'fit-content'
          }}>
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
                    onClick={showGPSInstructions}
                    className="d-flex align-items-center justify-content-start p-3"
                  >
                    <span className="me-2">📍</span>
                    <div className="text-start">
                      <div>GPS Setup Guide</div>
                      <small className="text-muted">Get exact GPS location</small>
                    </div>
                  </Button>

                </div>
              </Card.Body>
            </Card>
          </div>

        </div>
      </div>
    );
  };

  const renderSettingsContent = () => {
    if (!userData) return null;

    return (
      <div className="dashboard-content">
        <h2>⚙️ Account Settings</h2>
        <p className="text-muted mb-4">Manage your account security and preferences</p>
        <Row>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">Security Settings</h5>
                <div className="d-grid gap-2">
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowPasswordModal(true)}
                    style={{ backgroundColor: '#4a148c', borderColor: '#4a148c', color: 'white' }}
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

  // Render My Devices Content - Redirect to new structure
  const renderMyDevicesContent = () => {
    return (
      <div className="dashboard-content">
        <div className="text-center py-5">
          <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>📱</div>
          <h2>Device Management</h2>
          <p className="text-muted mb-4">Use the sidebar to manage your devices</p>

          <Row className="justify-content-center">
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="mb-3">📋 Available Options:</h5>
                  <div className="d-grid gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setActiveTab('add-my-device')}
                      style={{ backgroundColor: '#4a148c', borderColor: '#4a148c' }}
                    >
                      ➕ Add My Device
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="lg"
                      onClick={() => setActiveTab('assigned-devices')}
                    >
                      📋 View Assigned Devices
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    );
  };


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
        <h2>❓ Help Center</h2>
        <p className="text-muted mb-4">Find answers to common questions and get help with GPS tracking</p>
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
        <h2>📞 Contact Support</h2>
        <p className="text-muted mb-4">Get in touch with our support team for assistance</p>
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

  // Render Add My Device Content
  const renderAddMyDeviceContent = () => {
    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2><SVGIcons.Device size={24} className="me-2" />Add My Device</h2>
            <p className="text-muted">Choose how to add your device received from admin</p>
          </div>
        </div>

        {/* Top Row: Buttons and Controls */}
        <Row className=" mb-2">
          {/* Device Action Buttons */}
          <Col lg={8}>
            <Card className="mb-2 border-0 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex gap-3 justify-content-start">
                  {/* Scan QR Code Button */}
                  <Button
                    variant="primary"
                    onClick={() => handleDeviceAction('scan')}
                    style={{
                      minWidth: '160px',
                      padding: '1rem 2rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}
                  >
                    <SVGIcons.QRCode size={18} className="me-2" />Scan QR Code
                  </Button>

                  {/* Upload QR Code Button */}
                  <Button
                    variant="success"
                    onClick={() => handleDeviceAction('upload')}
                    style={{
                      minWidth: '160px',
                      padding: '1rem 2rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}
                  >
                    <SVGIcons.Upload size={18} className="me-2" />Upload QR Code
                  </Button>

                  {/* Manual Entry Button */}
                  <Button
                    variant="warning"
                    onClick={() => handleDeviceAction('manual')}
                    style={{
                      minWidth: '160px',
                      padding: '1rem 2rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '1rem',
                      color: '#fff'
                    }}
                  >
                    <SVGIcons.Edit size={18} className="me-2" />Manual Entry
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Control Panel - Moved up next to buttons */}
          <Col lg={4}>
            {/* Device Selection */}
            <Card className="shadow-sm mb-2">
              <Card.Header>
                <h6 className="mb-0"><SVGIcons.Device size={16} className="me-2" />Select Device</h6>
              </Card.Header>
              <Card.Body>
                <Form.Select
                  value={selectedDeviceForRealTimeTracking?.deviceId || selectedDeviceForRealTimeTracking?.deviceCode || ''}
                  onChange={async (e) => {
                    const deviceId = e.target.value;
                    const device = userDevices.find(d => (d.deviceId === deviceId || d.deviceCode === deviceId));
                    console.log('📱 Device selected from dropdown:', device);
                    setSelectedDeviceForRealTimeTracking(device || null);

                    // Auto-load location history when device is selected
                    if (device) {
                      const deviceKey = device.deviceId || device.deviceCode;
                      console.log('🔄 Auto-loading location history for:', deviceKey);

                      // Clear any existing intervals
                      if (window.locationRefreshInterval) {
                        clearInterval(window.locationRefreshInterval);
                      }

                      // Load initial data from database
                      const initialData = await loadDeviceLocationHistory(deviceKey, 100);
                      console.log('📊 Initial database load result:', initialData?.length || 0, 'points');

                      // Auto-load available dates for calendar functionality
                      await getAvailableDatesWithData(deviceKey);

                      // Start VERY aggressive auto-refresh to catch new Postman updates immediately
                      window.locationRefreshInterval = setInterval(async () => {
                        console.log('🔄 Auto-refreshing for new Postman data...');
                        try {
                          const refreshData = await loadDeviceLocationHistory(deviceKey, 100);
                          console.log('📊 Refresh load result:', refreshData?.length || 0, 'points');

                          // Also check if there are new points and update map immediately
                          if (refreshData && refreshData.length > 0) {
                            const latestPoint = refreshData[refreshData.length - 1];
                            setCurrentLocation({
                              latitude: latestPoint.latitude,
                              longitude: latestPoint.longitude
                            });
                            console.log('🗺️ Map updated with latest point:', latestPoint.latitude, latestPoint.longitude);
                          }
                        } catch (error) {
                          console.error('❌ Auto-refresh error:', error);
                        }
                      }, 1000); // Check every 1 second for immediate updates

                      console.log('✅ AGGRESSIVE auto-refresh started for device:', deviceKey, '(every 1 second)');
                    }
                  }}
                >
                  <option value="">Choose your registered device...</option>
                  {userDevices && userDevices.length > 0 ? (
                    userDevices.map((device, index) => {
                      // Use deviceId first, then deviceCode as fallback
                      const deviceKey = device.deviceId || device.deviceCode;
                      const deviceName = device.description || device.name || 'Unnamed Device';

                      console.log(`📋 Device ${index + 1}:`, {
                        deviceKey,
                        deviceName,
                        status: device.status
                      });

                      return (
                        <option key={index} value={deviceKey}>
                          {deviceKey} - {deviceName}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>No devices found</option>
                  )}
                </Form.Select>

                {userDevices.length === 0 && (
                  <div className="mt-2">
                    <small className="text-muted">
                      ℹ️ No devices registered yet. Register a device first in the "Add Device" section.
                    </small>
                  </div>
                )}

                {userDevices.length > 0 && (
                  <div className="mt-2 d-flex justify-content-between align-items-center">
                    <small className="text-success">
                      ✅ {userDevices.length} device(s) registered to your account
                    </small>

                  </div>
                )}

                {selectedDeviceForRealTimeTracking && (
                  <div className="mt-2">
                    <small className="text-muted">
                      {deviceLocations[selectedDeviceForRealTimeTracking.deviceId]?.length || 0} locations tracked
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Map Section - Closer to buttons */}
        <Row style={{ position: 'relative' }}>
          {/* Map Section - Takes up most of the width */}
          <Col lg={8}>
            <Card
              className="shadow-sm mb-3"
              style={{
                height: '500px',
                position: 'relative',
                zIndex: 1,
                marginTop: '-60px'
              }}
            >
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0"><SVGIcons.Map size={20} color="white" className="me-2" />Device Tracking Map</h5>
              </Card.Header>
              <Card.Body style={{ padding: 0, height: 'calc(500px - 60px)' }}>
                {(() => {
                  console.log('🗺️ Map render check - currentLocation:', currentLocation);
                  console.log('📱 Map render check - selectedDevice:', selectedDeviceForRealTimeTracking);
                  if (currentLocation) {
                    console.log('✅ Rendering map with coordinates:', currentLocation.latitude, currentLocation.longitude);
                    console.log('📱 Device name for map:', selectedDeviceForRealTimeTracking?.description || 'Current Location');
                  }
                  return currentLocation;
                })() && currentLocation && typeof currentLocation.latitude === 'number' && typeof currentLocation.longitude === 'number' ? (
                  <GeoapifyMap
                    latitude={currentLocation.latitude}
                    longitude={currentLocation.longitude}
                    deviceName={selectedDeviceForRealTimeTracking ?
                      `${selectedDeviceForRealTimeTracking.description}${selectedStartDate && selectedEndDate ? ` (${selectedStartDate} to ${selectedEndDate})` : ''}` :
                      "Current Location"
                    }
                    height="440px"
                    showControls={true}
                    locationHistory={(() => {
                      if (!selectedDeviceForRealTimeTracking) return [];

                      const deviceKey = selectedDeviceForRealTimeTracking.deviceId || selectedDeviceForRealTimeTracking.deviceCode;

                      // First check if device has tracking path from state
                      const deviceWithPath = allDevices.find(d => d.deviceId === deviceKey);
                      if (deviceWithPath && deviceWithPath.trackingPath && deviceWithPath.trackingPath.length > 0) {
                        console.log('📍 Using tracking path from device state:', deviceWithPath.trackingPath.length, 'points');
                        console.log('🔴 Tracking path points:', deviceWithPath.trackingPath);
                        return deviceWithPath.trackingPath;
                      }

                      // Check deviceLocations state
                      if (deviceLocations[deviceKey] && deviceLocations[deviceKey].length > 0) {
                        console.log('📍 Using tracking path from deviceLocations:', deviceLocations[deviceKey].length, 'points');
                        console.log('🔴 DeviceLocations points:', deviceLocations[deviceKey]);
                        return deviceLocations[deviceKey];
                      }

                      // If date range is selected, use date range history
                      if (dateRangeHistory.length > 0) {
                        console.log('🗺️ Using date range history:', dateRangeHistory.length, 'points');
                        return dateRangeHistory;
                      }

                      // Combine ALL location sources for complete path
                      let allLocationSources = [];

                      // 1. Get device SCAN/ENTRY location (starting point) - NOT registration
                      const userDevicesData = JSON.parse(localStorage.getItem('userDevices') || '[]');
                      const deviceData = userDevicesData.find(d => d.deviceId === deviceKey || d.deviceCode === deviceKey);

                      if (deviceData && deviceData.scanLocation) {
                        // Use scan/entry location as starting point
                        allLocationSources.push({
                          latitude: deviceData.scanLocation.latitude,
                          longitude: deviceData.scanLocation.longitude,
                          timestamp: deviceData.scanTimestamp || deviceData.addedDate || new Date().toISOString(),
                          accuracy: deviceData.scanLocation.accuracy || 10,
                          source: 'manual',
                          isStartPoint: true
                        });
                        console.log('🎯 Added scan/entry location as starting point:', deviceData.scanLocation);
                      } else if (deviceData && deviceData.location) {
                        // Fallback to device location if scan location not available
                        allLocationSources.push({
                          latitude: deviceData.location.latitude,
                          longitude: deviceData.location.longitude,
                          timestamp: deviceData.addedDate || new Date().toISOString(),
                          accuracy: 10,
                          source: 'manual',
                          isStartPoint: true
                        });
                        console.log('📍 Added device location as starting point:', deviceData.location);
                      }

                      // 2. Get current device locations from state
                      const stateLocations = deviceLocations[deviceKey] || [];
                      allLocationSources = [...allLocationSources, ...stateLocations];

                      // 3. Get localStorage data
                      const deviceHistory = JSON.parse(localStorage.getItem(`deviceHistory_${deviceKey}`) || '[]');
                      const realtimeData = JSON.parse(localStorage.getItem(`realtime_tracking_${deviceKey}`) || '[]');
                      allLocationSources = [...allLocationSources, ...deviceHistory, ...realtimeData];

                      // Remove duplicates and sort by timestamp
                      const uniqueLocations = allLocationSources.filter((location, index, self) => {
                        return index === self.findIndex(l =>
                          Math.abs(l.latitude - location.latitude) < 0.000001 &&
                          Math.abs(l.longitude - location.longitude) < 0.000001 &&
                          l.timestamp === location.timestamp
                        );
                      });

                      // Sort by timestamp to create proper path
                      const sortedLocations = uniqueLocations.sort((a, b) =>
                        new Date(a.timestamp) - new Date(b.timestamp)
                      );

                      console.log('🗺️ Complete path for device:', deviceKey);
                      console.log('🗺️ Total unique locations:', sortedLocations.length);
                      console.log('🗺️ Path data:', sortedLocations);

                      return sortedLocations;
                    })()}
                    showPath={showPathLines} // Show/hide red lines based on state
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <SVGIcons.Map size={48} className="mb-3" style={{ opacity: 0.5 }} />
                      <h5>Geoapify Map Ready</h5>
                      <p>Add a device or start GPS tracking to see location on map</p>
                      <Button
                        variant="outline-primary"
                        onClick={() => getCurrentLocation()}
                        className="mt-2 me-2"
                      >
                        <SVGIcons.Location size={16} className="me-2" />Get Current Location
                      </Button>

                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Remaining Controls - Location and Path Controls */}
          <Col lg={4}>
            <div style={{
              height: '500px',
              overflowY: 'auto',
              position: 'relative',
              zIndex: 2
            }}>

            {/* Location Controls */}
            <Card className="shadow-sm mb-3">
              <Card.Header>
                <h6 className="mb-0"><SVGIcons.Location size={16} className="me-2" />Location Controls</h6>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="d-grid gap-2">
                  <Button
                    variant="outline-success"
                    onClick={() => showCurrentLocationOnly()}
                  >
                    <SVGIcons.Location size={16} className="me-2" />Get Current Location
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={async () => {
                      if (selectedDeviceForRealTimeTracking) {
                        const deviceKey = selectedDeviceForRealTimeTracking.deviceId || selectedDeviceForRealTimeTracking.deviceCode;
                        console.log('🔄 Manual refresh for device:', deviceKey);

                        try {
                          // Reload the data
                          await loadDeviceLocationHistory(deviceKey, 100);
                          alert(`✅ Data refreshed for device: ${deviceKey}`);
                        } catch (error) {
                          console.error('❌ Refresh error:', error);
                          alert(`❌ Failed to refresh data for device: ${deviceKey}`);
                        }
                      }
                    }}
                    disabled={!selectedDeviceForRealTimeTracking}
                  >
                    <SVGIcons.Refresh size={16} className="me-2" />Refresh
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Date Range Calendar with Available Dates */}
            <Card className="shadow-sm mb-3">
              <Card.Header>
                <h6 className="mb-0">📅 Date Range Selection & Route History</h6>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row>
                    <Col xs={6}>
                      <Form.Group className="mb-2">
                        <Form.Label style={{ fontSize: '0.8rem' }}>Start Date</Form.Label>
                        <Form.Control
                          type="date"
                          size="sm"
                          value={selectedStartDate}
                          onChange={(e) => setSelectedStartDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group className="mb-2">
                        <Form.Label style={{ fontSize: '0.8rem' }}>End Date</Form.Label>
                        <Form.Control
                          type="date"
                          size="sm"
                          value={selectedEndDate}
                          onChange={(e) => setSelectedEndDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Available Dates Display */}
                  {selectedDeviceForRealTimeTracking && availableDates.length > 0 && (
                    <div className="mb-3">
                      <Form.Label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>📊 Available Dates with Location Data:</Form.Label>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '8px' }}>
                        {availableDates.map((dateInfo, index) => (
                          <Button
                            key={index}
                            variant="outline-success"
                            size="sm"
                            className="me-2 mb-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => {
                              const dateStr = dateInfo.date;
                              setSelectedStartDate(dateStr);
                              setSelectedEndDate(dateStr);
                              // Auto-trigger route loading for single date
                              setTimeout(() => handleDateRangeSelection(), 100);
                            }}
                          >
                            📅 {new Date(dateInfo.date).toLocaleDateString()}
                            <br />
                            <small>({dateInfo.count} points)</small>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Row>
                    <Col xs={6}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDateRangeSelection}
                        disabled={!selectedDeviceForRealTimeTracking || !selectedStartDate || !selectedEndDate || loadingHistory}
                        className="w-100"
                      >
                        {loadingHistory ? 'Loading...' : 'Show Route for Date Range'}
                      </Button>
                    </Col>
                    <Col xs={6}>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={async () => {
                          if (selectedDeviceForRealTimeTracking) {
                            const deviceId = selectedDeviceForRealTimeTracking.deviceId || selectedDeviceForRealTimeTracking.deviceCode;
                            await getAvailableDatesWithData(deviceId);
                          }
                        }}
                        disabled={!selectedDeviceForRealTimeTracking}
                        className="w-100"
                      >
                        🔍 Check Available Dates
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            {/* Path Controls */}
            <Card className="shadow-sm mb-3">
              <Card.Header>
                <h6 className="mb-0"><SVGIcons.Map size={16} className="me-2" />Path Controls</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button
                    variant={showPathLines ? "success" : "outline-success"}
                    size="sm"
                    onClick={async () => {
                      setShowPathLines(true);
                      // Force refresh device locations from GPS API
                      if (selectedDeviceForRealTimeTracking) {
                        console.log('🔄 Force refreshing GPS data...');
                        await loadDeviceLocations(selectedDeviceForRealTimeTracking.deviceId);

                        // Also refresh calendar data if date is selected
                        if (selectedCalendarDate) {
                          await loadLocationHistoryForDate(selectedDeviceForRealTimeTracking.deviceId, selectedCalendarDate);
                        }
                      }
                    }}
                    disabled={!selectedDeviceForRealTimeTracking}
                  >
                    <SVGIcons.Location size={14} className="me-2" />🔄 Refresh & Show Red Lines
                  </Button>
                  <Button
                    variant={!showPathLines ? "danger" : "outline-danger"}
                    size="sm"
                    onClick={() => {
                      setShowPathLines(false);
                    }}
                    disabled={!selectedDeviceForRealTimeTracking}
                  >
                    <SVGIcons.Refresh size={14} className="me-2" />Hide Red Lines
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => {
                      if (selectedDeviceForRealTimeTracking) {
                        setShowHistorySection(!showHistorySection);
                        if (!showHistorySection && dateRangeHistory.length === 0) {
                          // Load all history for the device if no date range is selected
                          const deviceKey = selectedDeviceForRealTimeTracking.deviceId || selectedDeviceForRealTimeTracking.deviceCode;
                          const deviceHistory = JSON.parse(localStorage.getItem(`deviceHistory_${deviceKey}`) || '[]');
                          setDateRangeHistory(deviceHistory);
                        }
                      }
                    }}
                    disabled={!selectedDeviceForRealTimeTracking}
                  >
                    📊 {showHistorySection ? 'Hide' : 'Show'} History
                  </Button>
                  {/* Calendar button removed - functionality integrated into date range selection */}

                </div>
              </Card.Body>
            </Card>

            {/* Calendar View Section */}
            {showCalendarView && selectedDeviceForRealTimeTracking && (
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-success text-white">
                  <h6 className="mb-0">📅 Calendar-Based Location Tracking</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Select Date to View Locations</Form.Label>
                        <Form.Control
                          type="date"
                          value={selectedCalendarDate}
                          onChange={(e) => handleCalendarDateChange(e.target.value)}
                          max={new Date().toISOString().split('T')[0]} // Don't allow future dates
                        />
                      </Form.Group>

                      {/* Show available dates with data */}
                      {/* Debug: Show database status */}
                      <div className="mb-3">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={async () => {
                            if (selectedDeviceForRealTimeTracking) {
                              const deviceId = selectedDeviceForRealTimeTracking.deviceId || selectedDeviceForRealTimeTracking.deviceCode;
                              console.log('🔍 Checking database for device:', deviceId);

                              try {
                                const response = await gpsApi.getAllLocationsForDevice(deviceId);
                                console.log('📊 Database response:', response);

                                if (response.success && response.locations) {
                                  const locations = response.locations;
                                  console.log('📍 Total locations in database:', locations.length);

                                  // Group by date
                                  const dateGroups = {};
                                  locations.forEach(loc => {
                                    const date = new Date(loc.timestamp || loc.recordedAt).toISOString().split('T')[0];
                                    if (!dateGroups[date]) dateGroups[date] = [];
                                    dateGroups[date].push(loc);
                                  });

                                  console.log('📅 Dates with data:', Object.keys(dateGroups));
                                  Object.keys(dateGroups).forEach(date => {
                                    console.log(`📅 ${date}: ${dateGroups[date].length} locations`);
                                  });

                                  Swal.fire({
                                    title: 'Database Status',
                                    html: `
                                      <strong>Device ID:</strong> ${deviceId}<br>
                                      <strong>Total Locations:</strong> ${locations.length}<br>
                                      <strong>⚠️ Postman Device ID:</strong> Use exactly "<code>${deviceId}</code>" in your requests<br><br>
                                      <strong>Dates with Data:</strong><br>
                                      ${Object.keys(dateGroups).length > 0 ?
                                        Object.keys(dateGroups).map(date =>
                                          `📅 ${new Date(date).toLocaleDateString()}: ${dateGroups[date].length} points`
                                        ).join('<br>') :
                                        '❌ No location data found'
                                      }<br><br>
                                      <strong>📡 Postman Request:</strong><br>
                                      <code>POST http://localhost:5001/api/gps/location</code><br>
                                      <code>{"deviceId": "${deviceId}", "latitude": 17.3850, "longitude": 78.4867}</code>
                                    `,
                                    icon: 'info',
                                    width: '600px'
                                  });
                                } else {
                                  Swal.fire({
                                    title: 'No Data Found',
                                    text: 'No location data found in database for this device',
                                    icon: 'warning'
                                  });
                                }
                              } catch (error) {
                                console.error('❌ Error checking database:', error);
                                Swal.fire({
                                  title: 'Database Error',
                                  text: 'Failed to check database. Error: ' + error.message,
                                  icon: 'error'
                                });
                              }
                            }
                          }}
                        >
                          🔍 Check Database
                        </Button>
                      </div>

                      {availableDates.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-success">📅 Available Dates with Routes:</h6>
                          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                            {availableDates.slice(0, 10).map((date, index) => (
                              <Button
                                key={date}
                                variant={selectedCalendarDate === date ? "primary" : "outline-primary"}
                                size="sm"
                                className="me-2 mb-2"
                                onClick={() => handleCalendarDateChange(date)}
                                style={{ fontSize: '0.75rem' }}
                              >
                                {new Date(date).toLocaleDateString()}
                              </Button>
                            ))}
                            {availableDates.length > 10 && (
                              <div>
                                <small className="text-muted">... and {availableDates.length - 10} more dates</small>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {availableDates.length === 0 && (
                        <div className="mb-3">
                          <div className="alert alert-warning">
                            <h6>📅 No Route Data Found</h6>
                            <p className="mb-2">To create route data:</p>
                            <ol className="mb-0">
                              <li>Scan/upload a QR code to set starting point</li>
                              <li>Use Postman to send location updates to: <code>POST /api/gps/location</code></li>
                              <li>Include: deviceId, latitude, longitude in the request</li>
                            </ol>
                          </div>
                        </div>
                      )}

                      {selectedCalendarDate && (
                        <div className="mt-2">
                          <small className="text-muted">
                            📍 Locations for {new Date(selectedCalendarDate).toLocaleDateString()}:
                            <Badge bg="info" className="ms-2">
                              {calendarLocationHistory.length} points
                            </Badge>
                          </small>
                        </div>
                      )}
                    </Col>

                    <Col md={6}>
                      {loadingCalendarData && (
                        <div className="text-center">
                          <Spinner animation="border" size="sm" />
                          <p className="mt-2">Loading locations...</p>
                        </div>
                      )}

                      {selectedCalendarDate && calendarLocationHistory.length > 0 && (
                        <div>
                          <h6>📍 Location Summary</h6>
                          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {calendarLocationHistory.slice(0, 5).map((location, index) => (
                              <div key={index} className="d-flex justify-content-between align-items-center mb-1 p-2"
                                   style={{ backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                                <small>
                                  <strong>
                                    {index === 0 ? '🟢 First' : index === calendarLocationHistory.length - 1 ? '🔴 Last' : `📍 ${index + 1}`}
                                  </strong>
                                  <br />
                                  <span className="text-muted">
                                    {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                                  </span>
                                </small>
                                <small className="text-muted">
                                  {new Date(location.timestamp).toLocaleTimeString()}
                                </small>
                              </div>
                            ))}
                            {calendarLocationHistory.length > 5 && (
                              <div className="text-center">
                                <small className="text-muted">... and {calendarLocationHistory.length - 5} more locations</small>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedCalendarDate && calendarLocationHistory.length === 0 && !loadingCalendarData && (
                        <div className="text-center text-muted">
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
                          <p>No locations found for this date</p>
                          <small>The device may not have been tracked on this day</small>
                        </div>
                      )}
                    </Col>
                  </Row>

                  {/* Show calendar locations on map */}
                  {selectedCalendarDate && calendarLocationHistory.length > 0 && (
                    <div className="mt-3">
                      <h6>🗺️ Map View for {new Date(selectedCalendarDate).toLocaleDateString()}</h6>
                      <GeoapifyMap
                        latitude={calendarLocationHistory[0].latitude}
                        longitude={calendarLocationHistory[0].longitude}
                        deviceName={`${selectedDeviceForRealTimeTracking.description} - ${new Date(selectedCalendarDate).toLocaleDateString()}`}
                        height="300px"
                        showControls={true}
                        locationHistory={calendarLocationHistory}
                        showPath={true}
                      />
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Device History Section */}
            {showHistorySection && (
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-info text-white">
                  <h6 className="mb-0">📊 Device History</h6>
                  <small>
                    {selectedStartDate && selectedEndDate
                      ? `${selectedStartDate} to ${selectedEndDate} (${dateRangeHistory.length} points)`
                      : `All History (${dateRangeHistory.length} points)`
                    }
                  </small>
                </Card.Header>
                <Card.Body style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
                  {dateRangeHistory.length > 0 ? (
                    <Table striped hover size="sm" style={{ fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '0.25rem' }}>#</th>
                          <th style={{ padding: '0.25rem' }}>Time</th>
                          <th style={{ padding: '0.25rem' }}>Lat</th>
                          <th style={{ padding: '0.25rem' }}>Lng</th>
                          <th style={{ padding: '0.25rem' }}>Acc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dateRangeHistory.slice(0, 50).map((location, index) => (
                          <tr key={index}>
                            <td style={{ padding: '0.25rem' }}>{index + 1}</td>
                            <td style={{ padding: '0.25rem' }}>
                              <div style={{ fontSize: '0.7rem' }}>
                                {new Date(location.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#666' }}>
                                {new Date(location.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td style={{ padding: '0.25rem' }}>
                              <code style={{ fontSize: '0.65rem' }}>
                                {location.latitude.toFixed(4)}
                              </code>
                            </td>
                            <td style={{ padding: '0.25rem' }}>
                              <code style={{ fontSize: '0.65rem' }}>
                                {location.longitude.toFixed(4)}
                              </code>
                            </td>
                            <td style={{ padding: '0.25rem' }}>
                              <Badge
                                bg={location.accuracy < 10 ? 'success' : location.accuracy < 50 ? 'warning' : 'danger'}
                                style={{ fontSize: '0.6rem' }}
                              >
                                {location.accuracy?.toFixed(0) || '?'}m
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
                      <p style={{ fontSize: '0.8rem', margin: 0 }}>No location history found</p>
                      <small>
                        {selectedDeviceForRealTimeTracking
                          ? 'Try selecting a date range or track the device first'
                          : 'Select a device to view history'
                        }
                      </small>
                    </div>
                  )}

                  {dateRangeHistory.length > 50 && (
                    <div className="text-center mt-2">
                      <small className="text-muted">
                        Showing first 50 of {dateRangeHistory.length} points
                      </small>
                    </div>
                  )}

                  {dateRangeHistory.length > 0 && (
                    <div className="mt-2 d-flex gap-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowHistorySection(false)}
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                      >
                        Hide
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          const csvContent = "data:text/csv;charset=utf-8," +
                            "Index,Date,Time,Latitude,Longitude,Accuracy\n" +
                            dateRangeHistory.map((location, index) =>
                              `${index + 1},"${new Date(location.timestamp).toLocaleDateString()}","${new Date(location.timestamp).toLocaleTimeString()}",${location.latitude},${location.longitude},${location.accuracy || 0}`
                            ).join("\n");

                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `device_history_${selectedDeviceForRealTimeTracking?.deviceCode}_${selectedStartDate || 'all'}_to_${selectedEndDate || 'all'}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                      >
                        Export
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            </div>
          </Col>
        </Row>

        {/* Add some spacing before journey section */}
        <div style={{ height: '40px' }}></div>

        {/* Device History Section */}
        {showHistorySection && dateRangeHistory.length > 0 && (
          <Row className="mb-4">
            <Col lg={12}>
              <Card className="shadow-sm">
                <Card.Header className="bg-info text-white">
                  <h5 className="mb-0">📊 Device History - {selectedDeviceForRealTimeTracking?.description}</h5>
                  <small>
                    {selectedStartDate} to {selectedEndDate} ({dateRangeHistory.length} location points)
                  </small>
                </Card.Header>
                <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date & Time</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Accuracy</th>
                        <th>Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateRangeHistory.map((location, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <small>
                              {new Date(location.timestamp).toLocaleDateString()}<br/>
                              {new Date(location.timestamp).toLocaleTimeString()}
                            </small>
                          </td>
                          <td>
                            <code style={{ fontSize: '0.75rem' }}>
                              {location.latitude.toFixed(6)}
                            </code>
                          </td>
                          <td>
                            <code style={{ fontSize: '0.75rem' }}>
                              {location.longitude.toFixed(6)}
                            </code>
                          </td>
                          <td>
                            <Badge bg={location.accuracy < 10 ? 'success' : location.accuracy < 50 ? 'warning' : 'danger'}>
                              ±{location.accuracy?.toFixed(0) || '?'}m
                            </Badge>
                          </td>
                          <td>
                            <small className="text-muted">
                              {location.address || 'Address not available'}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div className="mt-3 text-center">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setShowHistorySection(false)}
                    >
                      Hide History
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="ms-2"
                      onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8," +
                          "Index,Date,Time,Latitude,Longitude,Accuracy,Address\n" +
                          dateRangeHistory.map((location, index) =>
                            `${index + 1},"${new Date(location.timestamp).toLocaleDateString()}","${new Date(location.timestamp).toLocaleTimeString()}",${location.latitude},${location.longitude},${location.accuracy || 0},"${location.address || 'N/A'}"`
                          ).join("\n");

                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `device_history_${selectedDeviceForRealTimeTracking?.deviceCode}_${selectedStartDate}_to_${selectedEndDate}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      Export CSV
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Detailed Location History Below Map */}
        {selectedDeviceForRealTimeTracking && (
          <Row className="mt-5 pt-4">
            <Col>
              <Card className="shadow-sm" style={{ marginTop: '30px' }}>
                <Card.Header className="bg-info text-white">
                  <h5 className="mb-0">🛤️ Location Journey for {selectedDeviceForRealTimeTracking.description || selectedDeviceForRealTimeTracking.deviceCode}</h5>
                </Card.Header>
                <Card.Body>
                  {(() => {
                    const deviceKey = selectedDeviceForRealTimeTracking.deviceId || selectedDeviceForRealTimeTracking.deviceCode;
                    const locations = deviceLocations[deviceKey] || deviceLocations[selectedDeviceForRealTimeTracking.deviceCode] || [];

                    if (locations.length === 0) {
                      return (
                        <div className="text-center text-muted py-4">
                          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                          <h5>No Location Data Yet</h5>
                          <p>Start by scanning/registering this device, then send coordinates via Postman to see the journey.</p>
                        </div>
                      );
                    }

                    // Ensure locations is always an array and sort by timestamp
                    const locationsArray = Array.isArray(locations) ? locations : [];
                    const sortedLocations = [...locationsArray].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                    return (
                      <div>
                        <div className="mb-3 d-flex justify-content-between align-items-center">
                          <div>
                            <strong>📊 Journey Summary:</strong>
                            <span className="ms-2 badge bg-primary">{sortedLocations.length} locations</span>
                            <span className="ms-2 badge bg-success">
                              {sortedLocations.length > 1 ? `${(sortedLocations.length - 1)} path segments` : 'Starting point'}
                            </span>
                          </div>
                          <div>
                            <small className="text-muted">
                              {sortedLocations.length > 1 && (
                                <>
                                  Journey Duration: {Math.round((new Date(sortedLocations[sortedLocations.length - 1].timestamp) - new Date(sortedLocations[0].timestamp)) / (1000 * 60))} minutes
                                </>
                              )}
                            </small>
                          </div>
                        </div>

                        <div className="location-timeline">
                          {sortedLocations.map((location, index) => {
                            const isFirst = index === 0;
                            const isLast = index === sortedLocations.length - 1;
                            const isRecent = index >= sortedLocations.length - 3; // Last 3 locations

                            return (
                              <div key={index} className={`location-entry mb-3 p-3 rounded ${isRecent ? 'bg-light border-start border-primary border-3' : 'bg-white border'}`}>
                                <div className="d-flex justify-content-between align-items-start">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center mb-2">
                                      <span className={`badge me-2 ${isFirst ? 'bg-success' : isLast ? 'bg-danger' : 'bg-secondary'}`}>
                                        {isFirst ? '🟢 START' : isLast ? '🔴 CURRENT' : `📍 POINT ${index + 1}`}
                                      </span>
                                      <strong className="text-primary">
                                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                      </strong>
                                      {location.accuracy && (
                                        <span className="ms-2 badge bg-info">±{location.accuracy}m</span>
                                      )}
                                    </div>

                                    <div className="row">
                                      <div className="col-md-6">
                                        <small className="text-muted d-block">
                                          <strong>📅 Time:</strong> {new Date(location.timestamp).toLocaleString()}
                                        </small>
                                        {location.address && (
                                          <small className="text-muted d-block">
                                            <strong>📍 Address:</strong> {location.address}
                                          </small>
                                        )}
                                      </div>
                                      <div className="col-md-6">
                                        {index > 0 && (
                                          <small className="text-muted d-block">
                                            <strong>⏱️ Time from previous:</strong> {Math.round((new Date(location.timestamp) - new Date(sortedLocations[index - 1].timestamp)) / (1000 * 60))} minutes
                                          </small>
                                        )}
                                        {location.speed && (
                                          <small className="text-muted d-block">
                                            <strong>🏃 Speed:</strong> {location.speed} km/h
                                          </small>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-end">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => {
                                        // Center map on this location
                                        setCurrentLocation({
                                          latitude: location.latitude,
                                          longitude: location.longitude
                                        });
                                      }}
                                    >
                                      🎯 Focus
                                    </Button>
                                  </div>
                                </div>

                                {index < sortedLocations.length - 1 && (
                                  <div className="text-center mt-2">
                                    <div className="text-muted">
                                      <small>⬇️ Path continues to next location</small>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    );
  };

  // Render Assigned Devices Content
  const renderAssignedDevicesContent = () => {
    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>📋 Assigned Devices</h2>
            <p className="text-muted">View and manage your registered devices</p>
          </div>
          <Badge bg="info" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            Total Devices: {userDevices.length}
          </Badge>
        </div>

        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">📱 My Registered Devices</h5>
              </Card.Header>
              <Card.Body>
                {userDevices.length === 0 ? (
                  <div className="text-center py-5">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: '0.5' }}>📱</div>
                    <h5>No Devices Assigned Yet</h5>
                    <p className="text-muted">Go to "Add My Device" to register your first device</p>

                    <Button
                      variant="primary"
                      onClick={() => setActiveTab('add-my-device')}
                      style={{ backgroundColor: '#4a148c', borderColor: '#4a148c' }}
                    >
                      ➕ Add Your First Device
                    </Button>
                  </div>
                ) : (
                  <div className="row g-3">
                    {userDevices.map((device, index) => {
                      // Dynamic column calculation based on number of devices
                      const deviceCount = userDevices.length;
                      let colClass = '';

                      if (deviceCount === 1) {
                        colClass = 'col-12 col-md-8 col-lg-6'; // Single device - medium width
                      } else if (deviceCount === 2) {
                        colClass = 'col-12 col-md-6'; // Two devices - half width each
                      } else if (deviceCount === 3) {
                        colClass = 'col-12 col-md-6 col-lg-4'; // Three devices - third width each
                      } else if (deviceCount === 4) {
                        colClass = 'col-12 col-md-6 col-lg-3'; // Four devices - quarter width each
                      } else if (deviceCount >= 5) {
                        colClass = 'col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2'; // Many devices - smaller cards
                      }

                      return (
                        <div key={index} className={`${colClass} mb-3`}>
                        <Card className="h-100 shadow-sm" style={{ border: '1px solid #e9ecef', borderRadius: '12px' }}>
                          <Card.Body>
                            <div className="mb-3">
                              <h6 className="card-title" style={{ fontWeight: '600', color: '#4a148c' }}>
                                {device.description || 'Device'}
                              </h6>
                            </div>

                            <div className="mb-3">
                              <p className="text-muted small mb-2">
                                <strong>Device ID:</strong>
                                <br />
                                <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                  {device.deviceId || device.deviceCode || 'N/A'}
                                </code>
                              </p>
                              <p className="text-muted small mb-2">
                                <strong>Description:</strong> {device.description || 'No description'}
                              </p>
                              <p className="text-muted small mb-2">
                                <strong>Purpose:</strong> {device.purpose || 'Not specified'}
                              </p>
                              <p className="text-muted small mb-2">
                                <strong>Upload Method:</strong>
                                <Badge bg="info" className="ms-1" style={{ fontSize: '0.7rem' }}>
                                  {device.uploadMethod === 'scan' ? '📷 Scan' :
                                   device.uploadMethod === 'upload' ? '📤 Upload' :
                                   device.uploadMethod === 'manual' ? '⌨️ Manual' : 'scan'}
                                </Badge>
                              </p>
                              <p className="text-muted small mb-2">
                                <strong>Status:</strong>
                                <Badge
                                  bg={device.status === 'approved' ? 'success' : device.status === 'pending' ? 'warning' : 'success'}
                                  className="ms-1"
                                  style={{ fontSize: '0.7rem' }}
                                >
                                  {device.status === 'approved' ? '✅ Active' :
                                   device.status === 'pending' ? '⏳ Pending' : '✅ Active'}
                                </Badge>
                              </p>
                              <p className="text-muted small mb-3">
                                <strong>Added:</strong> {
                                  device.addedDate ?
                                    (new Date(device.addedDate).toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: true
                                    })) :
                                    new Date().toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: true
                                    })
                                }
                              </p>
                            </div>

                            {/* Device Location Map */}
                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <strong className="text-muted small">📍 Device Location:</strong>
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const deviceKey = device.deviceCode || device.deviceId;
                                      console.log('🔍 Debug Info:');
                                      console.log('📱 Device:', device);
                                      console.log('🗺️ All deviceLocations:', deviceLocations);
                                      console.log('🔑 Device key:', deviceKey);
                                      console.log('📍 Has location:', !!(deviceLocations[deviceKey]));
                                      alert(`Debug Info:\nDevice Key: ${deviceKey}\nDevice Code: ${device.deviceCode}\nDevice ID: ${device.deviceId}\nHas Location: ${!!(deviceLocations[deviceKey])}\nCheck console for details`);
                                    }}
                                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                                  >
                                    🔍
                                  </Button>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    console.log('📍 Track Now clicked for device:', device);

                                    // Get the correct device key (deviceCode or deviceId)
                                    const deviceKey = device.deviceCode || device.deviceId;
                                    console.log('🔑 Using device key:', deviceKey);

                                    // Get exact GPS location for this device
                                    if (navigator.geolocation) {
                                      navigator.geolocation.getCurrentPosition(
                                        async (position) => {
                                          const accuracy = position.coords.accuracy;

                                          // Validate GPS accuracy for device tracking
                                          if (accuracy > 100) {
                                            alert(`⚠️ Device Tracking Accuracy Warning\n\nDetected accuracy: ${accuracy}m\n\nThis appears to be WiFi-based location. For exact device tracking:\n• Go outdoors\n• Enable GPS in device settings\n• Wait for satellite connection`);
                                          }

                                          const { latitude, longitude } = position.coords;

                                          // Save location to database via API
                                          const apiLocationData = {
                                            latitude,
                                            longitude,
                                            accuracy: 10,
                                            source: 'manual',
                                            timestamp: new Date().toISOString()
                                          };

                                          try {
                                            console.log('💾 Saving Track Now location to database:', apiLocationData);
                                            const saveResult = await api.updateDeviceLocation(deviceKey, apiLocationData);
                                            console.log('✅ Track Now location saved to database:', saveResult);
                                          } catch (saveError) {
                                            console.error('❌ Failed to save Track Now location to database:', saveError);
                                          }

                                          // Create location data
                                          const locationData = {
                                            deviceId: deviceKey,
                                            deviceName: device.description,
                                            latitude,
                                            longitude,
                                            timestamp: new Date().toISOString(),
                                            address: 'Loading address...'
                                          };

                                          // Update device locations
                                          setDeviceLocations(prev => {
                                            const updated = {
                                              ...prev,
                                              [deviceKey]: [locationData]
                                            };
                                            console.log('📍 Updated deviceLocations state:', updated);
                                            return updated;
                                          });

                                          console.log('✅ Location updated for device:', deviceKey);
                                          console.log('📱 Device object:', device);
                                          console.log('📍 Location data:', locationData);

                                          // Force re-render by updating a dummy state
                                          setTimeout(() => {
                                            console.log('🔄 Forcing component re-render...');
                                            setUserDevices(prev => [...prev]);
                                          }, 100);
                                        },
                                        (error) => {
                                          let errorMessage = 'GPS tracking failed: ';
                                          switch (error.code) {
                                            case error.PERMISSION_DENIED:
                                              errorMessage += 'Please enable location access and GPS.';
                                              break;
                                            case error.POSITION_UNAVAILABLE:
                                              errorMessage += 'GPS satellites unavailable. Please go outdoors.';
                                              break;
                                            case error.TIMEOUT:
                                              errorMessage += 'GPS timeout. Please go outdoors with clear sky view.';
                                              break;
                                            default:
                                              errorMessage += 'Please check device GPS settings.';
                                              break;
                                          }
                                          alert(`❌ ${errorMessage}`);
                                        },
                                        { enableHighAccuracy: true, timeout: 45000, maximumAge: 0 }
                                      );
                                    } else {
                                      alert('GPS not supported on this device.');
                                    }
                                  }}
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                >
                                  📍 Track Now
                                </Button>
                              </div>
                              </div>

                              {/* Small Location Map */}
                              <div style={{
                                height: '150px',
                                border: '1px solid #dee2e6',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#f8f9fa'
                              }}>
                                {(() => {
                                  const deviceKey = device.deviceCode || device.deviceId;
                                  const hasLocation = deviceLocations[deviceKey] && deviceLocations[deviceKey].length > 0;

                                  console.log('🗺️ Checking location for device:', deviceKey, 'hasLocation:', hasLocation);
                                  if (hasLocation) {
                                    console.log('📍 Device location data:', deviceLocations[deviceKey][0]);
                                  }

                                  return hasLocation ? (
                                    <div>
                                      {/* Show tracking path information */}
                                      {device.trackingPath && device.trackingPath.length > 0 && (
                                        <div className="mb-2">
                                          <div className="d-flex justify-content-between align-items-center mb-1">
                                            <small className="text-primary fw-bold">📍 Tracking Path</small>
                                            <Badge bg="info" style={{ fontSize: '0.7rem' }}>
                                              {device.trackingPath.length} points
                                            </Badge>
                                          </div>
                                          <div style={{ maxHeight: '80px', overflowY: 'auto', fontSize: '0.75rem' }}>
                                            {device.trackingPath.slice(0, 3).map((point, index) => (
                                              <div key={index} className="d-flex justify-content-between align-items-center mb-1 px-2 py-1"
                                                   style={{
                                                     backgroundColor: index === 0 ? '#e8f5e8' : index === device.trackingPath.length - 1 ? '#ffe8e8' : '#f8f9fa',
                                                     borderRadius: '3px',
                                                     border: '1px solid #dee2e6'
                                                   }}>
                                                <span>
                                                  {index === 0 ? '🟢 Start' : index === device.trackingPath.length - 1 ? '🔴 Current' : `📍 ${index + 1}`}
                                                </span>
                                                <span className="text-muted">
                                                  {new Date(point.timestamp).toLocaleTimeString()}
                                                </span>
                                              </div>
                                            ))}
                                            {device.trackingPath.length > 3 && (
                                              <div className="text-center">
                                                <small className="text-muted">... and {device.trackingPath.length - 3} more points</small>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      <div className="text-center mb-1">
                                        <small className="text-success">
                                          📍 Current: {device.currentLocation ?
                                            `${device.currentLocation.latitude.toFixed(6)}, ${device.currentLocation.longitude.toFixed(6)}` :
                                            `${deviceLocations[deviceKey][0].latitude.toFixed(6)}, ${deviceLocations[deviceKey][0].longitude.toFixed(6)}`
                                          }
                                        </small>
                                        {device.currentLocation && device.currentLocation.address && (
                                          <div>
                                            <small className="text-muted d-block">
                                              📍 {device.currentLocation.address}
                                            </small>
                                          </div>
                                        )}
                                      </div>
                                      <GeoapifyMap
                                        latitude={device.currentLocation ? device.currentLocation.latitude : deviceLocations[deviceKey][0].latitude}
                                        longitude={device.currentLocation ? device.currentLocation.longitude : deviceLocations[deviceKey][0].longitude}
                                        deviceName={`📱 ${device.description || device.deviceCode}`}
                                        height="200px"
                                        showControls={false}
                                        locationHistory={(() => {
                                          const history = device.trackingPath || deviceLocations[deviceKey] || [];
                                          console.log('🗺️ MAP DEBUG - Device:', deviceKey, 'History length:', history.length);
                                          if (history.length > 0) {
                                            console.log('🗺️ MAP DEBUG - First location:', history[0]);
                                            console.log('🗺️ MAP DEBUG - Last location:', history[history.length - 1]);
                                          }
                                          return history;
                                        })()}
                                        showPath={true}
                                      />
                                    </div>
                                  ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                      <div className="text-center">
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
                                        <small>No location data yet</small>
                                        <br />
                                        <small>Click "📍 Track Now" to get current location</small>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                          </Card.Body>
                        </Card>
                      </div>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Render User Device Uploads Content (Admin View)
  const renderUserDeviceUploadsContent = () => {

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>📤 User Device Uploads</h2>
            <p className="text-muted">View and manage devices uploaded by users</p>
          </div>
          <Badge bg="info" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            Total Uploads: {Array.isArray(adminDeviceUploads) ? adminDeviceUploads.length : 0}
          </Badge>
        </div>

        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">📋 All User Device Uploads</h5>
              </Card.Header>
              <Card.Body>
                {!Array.isArray(adminDeviceUploads) || adminDeviceUploads.length === 0 ? (
                  <div className="text-center py-4">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
                    <h5>No Device Uploads Yet</h5>
                    <p className="text-muted">Users haven't uploaded any devices yet</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Device Code</th>
                          <th>Description</th>
                          <th>Purpose</th>
                          <th>Upload Method</th>
                          <th>Date Added</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(adminDeviceUploads) && adminDeviceUploads.map((device, index) => (
                          <tr key={index}>
                            <td>
                              <div>
                                <strong>{device.userName}</strong>
                                <br />
                                <small className="text-muted">{device.userEmail}</small>
                              </div>
                            </td>
                            <td>
                              <code>{device.deviceCode}</code>
                            </td>
                            <td>{device.description}</td>
                            <td>
                              <Badge bg="secondary">{device.purpose}</Badge>
                            </td>
                            <td>
                              <Badge bg={device.uploadMethod === 'qr' ? 'primary' : 'info'}>
                                {device.uploadMethod === 'qr' ? '📷 QR Upload' : '⌨️ Manual Entry'}
                              </Badge>
                            </td>
                            <td>{new Date(device.addedDate).toLocaleDateString()}</td>
                            <td>
                              <Badge bg={device.status === 'pending_approval' ? 'warning' : 'success'}>
                                {device.status === 'pending_approval' ? 'Pending' : 'Approved'}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button size="sm" variant="outline-success" title="Approve">
                                  ✅
                                </Button>
                                <Button size="sm" variant="outline-danger" title="Reject">
                                  ❌
                                </Button>
                                <Button size="sm" variant="outline-info" title="View Details">
                                  👁️
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
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
        <h2>💬 Send Feedback</h2>
        <p className="text-muted mb-4">Share your thoughts and suggestions to help us improve</p>
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
            /* Responsive Design Fixes */
            .dashboard-content {
              width: 100%;
              max-width: 100%;
              overflow-x: hidden;
              padding: 1rem;
              box-sizing: border-box;
            }

            @media (max-width: 768px) {
              .dashboard-content {
                padding: 0.5rem;
              }
            }

            /* Container Responsive */
            .container-fluid {
              padding-left: 15px;
              padding-right: 15px;
              max-width: 100%;
              overflow-x: hidden;
            }

            /* Row and Column Fixes */
            .row {
              margin-left: -15px;
              margin-right: -15px;
              max-width: 100%;
            }

            .col, .col-md-6, .col-lg-4, .col-lg-8, .col-xl-3, .col-xl-6, .col-xl-9 {
              padding-left: 15px;
              padding-right: 15px;
              max-width: 100%;
              box-sizing: border-box;
            }

            /* Card Responsive */
            .card {
              margin-bottom: 1rem;
              max-width: 100%;
              overflow: hidden;
            }

            .card-body {
              padding: 1rem;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }

            @media (max-width: 576px) {
              .card-body {
                padding: 0.75rem;
              }
            }

            /* Table Responsive */
            .table-responsive {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }

            .table {
              min-width: 600px;
            }

            @media (max-width: 768px) {
              .table {
                font-size: 0.875rem;
              }
            }

            /* Button Responsive */
            .btn {
              word-wrap: break-word;
              white-space: normal;
            }

            @media (max-width: 576px) {
              .btn {
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
              }

              .btn-group .btn {
                margin-bottom: 0.25rem;
              }
            }

            /* Modal Responsive */
            .modal-dialog {
              max-width: 95vw;
              margin: 1rem auto;
            }

            .modal-content {
              max-height: 90vh;
              overflow-y: auto;
            }

            @media (max-width: 576px) {
              .modal-dialog {
                margin: 0.5rem;
                max-width: calc(100vw - 1rem);
              }
            }

            /* QR Scanner Responsive */
            #qr-reader {
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              min-height: 250px !important;
            }

            #qr-reader video {
              width: 100% !important;
              height: auto !important;
              max-width: 100% !important;
            }

            @media (max-width: 768px) {
              #qr-reader {
                min-height: 200px !important;
              }
            }

            /* Map Container Responsive */
            .map-container {
              width: 100%;
              height: 400px;
              max-width: 100%;
              overflow: hidden;
            }

            @media (max-width: 768px) {
              .map-container {
                height: 300px;
              }
            }

            @media (max-width: 576px) {
              .map-container {
                height: 250px;
              }
            }

            /* Sidebar Responsive */
            .sidebar {
              transition: all 0.3s ease;
            }

            @media (max-width: 991px) {
              .sidebar {
                position: fixed;
                top: 0;
                left: -250px;
                width: 250px;
                height: 100vh;
                z-index: 1050;
                background: white;
                box-shadow: 2px 0 5px rgba(0,0,0,0.1);
              }

              .sidebar.show {
                left: 0;
              }

              .main-content {
                margin-left: 0 !important;
                width: 100% !important;
              }
            }

            /* Text Responsive */
            h1, h2, h3, h4, h5, h6 {
              word-wrap: break-word;
              overflow-wrap: break-word;
            }

            @media (max-width: 576px) {
              h1 { font-size: 1.75rem; }
              h2 { font-size: 1.5rem; }
              h3 { font-size: 1.25rem; }
              h4 { font-size: 1.1rem; }
              h5 { font-size: 1rem; }
              h6 { font-size: 0.9rem; }
            }

            /* Form Responsive */
            .form-control, .form-select {
              max-width: 100%;
              box-sizing: border-box;
            }

            .input-group {
              flex-wrap: wrap;
            }

            @media (max-width: 576px) {
              .input-group > * {
                margin-bottom: 0.25rem;
              }
            }

            /* Utility Classes */
            .text-truncate-responsive {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            @media (max-width: 576px) {
              .text-truncate-responsive {
                white-space: normal;
                word-wrap: break-word;
              }
            }

            /* DevTools Responsive Fix */
            @media (max-height: 600px) {
              .modal-dialog {
                max-height: 95vh;
              }

              .modal-content {
                max-height: 90vh;
              }

              .card-body {
                padding: 0.5rem;
              }

              .map-container {
                height: 200px;
              }
            }

            /* Viewport Meta Fix */
            html, body {
              overflow-x: hidden;
              max-width: 100%;
            }

            * {
              box-sizing: border-box;
            }

            .quick-actions-container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 20px;
              padding: 2rem;
              margin-bottom: 2rem;
              color: white;
              max-width: 100%;
              overflow: hidden;
            }

            @media (max-width: 768px) {
              .quick-actions-container {
                padding: 1.5rem;
                border-radius: 15px;
              }
            }

            @media (max-width: 576px) {
              .quick-actions-container {
                padding: 1rem;
                border-radius: 10px;
              }
            }

            /* QR Scanner Styles */
            #qr-reader {
              border: none !important;
            }

            #qr-reader__dashboard {
              background: transparent !important;
            }

            #qr-reader__camera_selection {
              margin-bottom: 1rem;
            }

            #qr-reader__scan_region {
              border: 2px solid #007bff !important;
              border-radius: 8px !important;
            }

            #qr-reader__scan_region video {
              border-radius: 6px !important;
            }

            .qr-scanner-button {
              background: #007bff !important;
              color: white !important;
              border: none !important;
              padding: 0.5rem 1rem !important;
              border-radius: 6px !important;
              margin: 0.25rem !important;
            }

            /* SweetAlert2 Custom Styles */
            .swal-wide {
              width: 600px !important;
            }

            .swal2-input {
              font-family: 'Courier New', monospace !important;
              font-size: 1.2rem !important;
              text-align: center !important;
              letter-spacing: 2px !important;
              font-weight: bold !important;
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
                    onClick={() => handleDeviceAction('scan')}
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
                  <div id="qr-reader-container" style={{ display: 'none' }}></div>
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

                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* QR Scanner Modal - REMOVED DUPLICATE (using the one at the bottom) */}

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

  // User Management render function - Updated to match user interface styling
  const renderUserManagementContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return (
        <div className="dashboard-content">
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: '0.5' }}>🚫</div>
            <h5>Access Denied</h5>
            <p className="text-muted">You don't have permission to access this section</p>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>👥 User Management</h2>
            <p className="text-muted">Manage system users and their roles</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={loadAllUsers}
              style={{ backgroundColor: '#4a148c', borderColor: '#4a148c', color: 'white' }}
            >
              🔄 Refresh Users
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateUser}
              style={{ backgroundColor: '#4a148c', borderColor: '#4a148c' }}
            >
              ➕ Add New User
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

        {!Array.isArray(allUsers) || allUsers.length === 0 ? (
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
                  {Array.isArray(allUsers) && allUsers.map((user, index) => (
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

  // Device Management render function - Updated to match user interface styling
  const renderDeviceManagementContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return (
        <div className="dashboard-content">
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: '0.5' }}>🚫</div>
            <h5>Access Denied</h5>
            <p className="text-muted">You don't have permission to access this section</p>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>📱 Device Management</h2>
            <p className="text-muted">Manage all devices in the system</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={loadAllDevices}
              style={{ backgroundColor: '#4a148c', borderColor: '#4a148c', color: 'white' }}
            >
              🔄 Refresh Devices
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateDevice}
              style={{ backgroundColor: '#4a148c', borderColor: '#4a148c' }}
            >
              ➕ Add Device
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
                  {Array.isArray(allDevices) && allDevices.map((device, index) => (
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

  // Load QR codes from gpstracker database for admin management
  const loadAdminQRCodes = useCallback(async () => {
    if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
      try {
        console.log('🔲 ADMIN: Loading QR assignments from gpstracker database...');
        console.log('🌐 Trying multiple endpoints to get QR data on port 5001...');

        // Try to load from multiple API endpoints
        let qrCodes = [];

        // Method 1: Try the proper devices API endpoint first
        try {
          console.log('📡 Method 1: Loading all devices via /api/devices...');
          const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');

          const response = await fetch('http://localhost:5001/api/devices?limit=1000', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('📋 Devices API response:', data);

            if (data.success && data.data && data.data.devices && Array.isArray(data.data.devices)) {
              console.log('✅ Found', data.data.devices.length, 'devices in database');

              // Map all devices from database
              const allDevices = data.data.devices.map(device => ({
                id: device._id,
                qrId: device.deviceId,
                deviceCode: device.deviceId,
                deviceId: device.deviceId,
                deviceName: device.name || device.deviceName,
                assignedTo: device.assignedTo ?
                  (device.assignedTo.firstName && device.assignedTo.lastName ?
                    `${device.assignedTo.firstName} ${device.assignedTo.lastName}` :
                    device.assignedTo.username || device.assignedTo.email) :
                  null,
                assignedDate: device.registrationDate || device.createdAt,
                purpose: device.purpose || 'General Use',
                description: device.description || 'No description',
                status: device.status || 'active',
                userId: device.assignedTo ? device.assignedTo._id : null,
                _id: device._id
              }));

              // Store all devices (for Send QR Codes section)
              setAllDevices(allDevices);

              // For QR Management section: Show ONLY assigned/registered QR codes
              qrCodes = allDevices.filter(device => {
                return device.assignedTo &&
                       device.assignedTo !== null &&
                       device.assignedTo !== '' &&
                       device.assignedTo !== 'Unknown User';
              });

              setAllQRCodes(qrCodes);
              console.log('📊 Total devices in database:', allDevices.length);
              console.log('📊 Assigned devices (shown in QR Management):', qrCodes.length);
              console.log('📊 Unassigned devices (available for sending):', allDevices.filter(qr => !qr.assignedTo || qr.assignedTo === null || qr.assignedTo === '').length);
              console.log('🔍 QR Management will show only assigned QR codes:', qrCodes.slice(0, 3));
              return;
            }
          }
        } catch (apiError) {
          console.warn('⚠️ Devices API failed:', apiError.message);
        }

        // Method 2: Load QR assignments from legacy database
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');

          const response = await fetch('http://localhost:5001/api/devices/admin/user-uploads', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();

            if (data.success && data.uploads && Array.isArray(data.uploads)) {
              // Filter out test/debug data and duplicates
              const filteredUploads = data.uploads.filter(device => {
                const deviceCode = device.deviceCode?.toLowerCase() || '';
                const description = device.description?.toLowerCase() || '';
                const purpose = device.purpose?.toLowerCase() || '';

                // Remove test/debug entries
                return !deviceCode.includes('test') &&
                       !deviceCode.includes('debug') &&
                       !description.includes('test') &&
                       !description.includes('debug') &&
                       !purpose.includes('test') &&
                       !purpose.includes('testing');
              });

              // Remove duplicates based on deviceCode
              const uniqueUploads = filteredUploads.filter((device, index, self) =>
                index === self.findIndex(d => d.deviceCode === device.deviceCode)
              );

              qrCodes = uniqueUploads.map(device => ({
                id: device.id,
                qrId: device.deviceCode,
                deviceCode: device.deviceCode,
                deviceName: device.description,
                assignedTo: device.userEmail || device.userName || 'Unknown User',
                assignedDate: device.addedDate,
                purpose: device.purpose || 'Not specified',
                description: device.description || 'No description',
                uploadMethod: device.uploadMethod || 'unknown',
                status: device.status || 'active',
                userId: device.userId
              }));

              setAllQRCodes(qrCodes);
              console.log('✅ Loaded', qrCodes.length, 'QR assignments (filtered)');
              return;
            }
          }
        } catch (apiError) {
          console.warn('⚠️ API failed:', apiError.message);
        }

        // Method 2: Try API service as backup
        try {
          console.log('📡 Method 2: Trying API service...');
          const response = await api.get('/devices/admin/user-uploads');
          console.log('📋 API service response:', response);

          if (response.success && response.uploads && Array.isArray(response.uploads)) {
            qrCodes = response.uploads.map(device => ({
              qrId: device.deviceCode,
              deviceCode: device.deviceCode,
              deviceName: device.description,
              assignedTo: device.userEmail || device.userName || 'Unknown User',
              assignedDate: device.addedDate,
              purpose: device.purpose || 'Not specified',
              description: device.description || 'No description',
              uploadMethod: device.uploadMethod || 'unknown',
              status: device.status || 'active',
              userId: device.userId
            }));

            if (qrCodes.length > 0) {
              setAllQRCodes(qrCodes);
              console.log('✅ SUCCESS: Loaded', qrCodes.length, 'QR assignments from API service');
              return;
            }
          }
        } catch (fetchError) {
          console.warn('⚠️ API service failed:', fetchError);
        }

        // Method 3: Fallback to localStorage
        console.log('📡 Method 3: Loading from localStorage...');
        const userDevicesData = JSON.parse(localStorage.getItem('userDevices') || '[]');
        console.log('📋 localStorage userDevices:', userDevicesData);

        if (Array.isArray(userDevicesData) && userDevicesData.length > 0) {
          qrCodes = userDevicesData.map(device => ({
            qrId: device.deviceCode || device.deviceId,
            deviceCode: device.deviceCode,
            deviceName: device.description || device.deviceCode,
            assignedTo: device.userEmail || device.userId || 'Unknown User',
            assignedDate: device.addedDate || new Date().toISOString(),
            purpose: device.purpose || 'Not specified',
            description: device.description || 'No description',
            uploadMethod: device.uploadMethod || 'manual',
            status: 'active',
            location: 'Unknown'
          }));

          setAllQRCodes(qrCodes);
          console.log('✅ Loaded', qrCodes.length, 'QR assignments from localStorage');
        } else {
          console.log('⚠️ No QR data found in localStorage');
          setAllQRCodes([]);
        }

      } catch (error) {
        console.error('❌ Error loading QR codes:', error);
        setAllQRCodes([]);
      }
    }
  }, [userData]);

  // QR CRUD Operations
  const handleEditQR = (qr) => {
    setEditingQR(qr);
    setQRFormData({
      deviceCode: qr.deviceCode,
      deviceName: qr.deviceName,
      purpose: qr.purpose,
      description: qr.description,
      assignedTo: qr.assignedTo,
      status: qr.status
    });
    setShowQRModal(true);
  };

  const handleDeleteQR = async (qr) => {
    if (window.confirm(`Are you sure you want to delete QR code: ${qr.deviceCode}?`)) {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');

        // Try to find the device by deviceId first to get the correct _id
        const findResponse = await fetch(`http://localhost:5001/api/devices?limit=1000`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (findResponse.ok) {
          const data = await findResponse.json();
          const device = data.data?.devices?.find(d => d.deviceId === qr.deviceCode || d._id === qr.id);

          if (device) {
            const deleteResponse = await fetch(`http://localhost:5001/api/devices/${device._id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });

            if (deleteResponse.ok) {
              await loadAdminQRCodes(); // Refresh the list
              alert('✅ QR code deleted successfully!');
            } else {
              try {
                const errorData = await deleteResponse.json();
                alert(`❌ Failed to delete QR code: ${errorData.message || 'Unknown error'}`);
              } catch {
                alert('❌ Failed to delete QR code');
              }
            }
          } else {
            alert('❌ Device not found in database');
          }
        } else {
          alert('❌ Failed to fetch device details');
        }
      } catch (error) {
        console.error('Error deleting QR:', error);
        alert('❌ Error deleting QR code');
      }
    }
  };

  const handleSaveQR = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');

      // Use the generate-qr endpoint for new QR codes, regular endpoint for updates
      const url = editingQR
        ? `http://localhost:5001/api/devices/${editingQR.id}`
        : 'http://localhost:5001/api/devices/admin/generate-qr';

      const method = editingQR ? 'PUT' : 'POST';

      const requestBody = editingQR ? {
        // Update existing device
        deviceId: qrFormData.deviceCode,
        name: qrFormData.deviceName,
        deviceName: qrFormData.deviceName,
        purpose: qrFormData.purpose,
        description: qrFormData.description,
        assignedTo: qrFormData.assignedTo || null,
        status: qrFormData.status || 'available'
      } : {
        // Create new QR code using generate endpoint
        count: 1,
        purpose: qrFormData.purpose || 'General Use',
        description: qrFormData.description || 'Admin created QR code'
      };

      console.log('💾 Saving QR code:', { url, method, requestBody });

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('💾 Save response:', data);

      if (response.ok) {
        await loadAdminQRCodes(); // Refresh the list
        setShowQRModal(false);
        setEditingQR(null);
        setQRFormData({
          deviceCode: '',
          deviceName: '',
          purpose: '',
          description: '',
          assignedTo: '',
          status: 'active'
        });

        if (editingQR) {
          alert('✅ QR code updated successfully!');
        } else {
          alert(`✅ QR code created successfully! ID: ${data.devices?.[0]?.deviceId || 'Generated'}`);
        }
      } else {
        alert(`❌ Failed to save QR code: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving QR:', error);
      alert('❌ Error saving QR code');
    }
  };

  // QR Code Management render function - Updated to show real database data
  const renderQRManagementContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return (
        <div className="dashboard-content">
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: '0.5' }}>🚫</div>
            <h5>Access Denied</h5>
            <p className="text-muted">You don't have permission to access this section</p>
          </div>
        </div>
      );
    }

    // Use QR codes from database
    const qrCodes = Array.isArray(allQRCodes) ? allQRCodes : [];

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>🔲 QR Code Management</h2>
            <p className="text-muted">Complete QR code assignments - which QR ID is assigned to whom, device purpose and description</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Badge bg="info" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              Total Assignments: {qrCodes.length}
            </Badge>
            <Button
              variant="success"
              onClick={() => {
                setEditingQR(null);
                setQRFormData({
                  deviceCode: '',
                  deviceName: '',
                  purpose: '',
                  description: '',
                  assignedTo: '',
                  status: 'active'
                });
                setShowQRModal(true);
              }}
            >
              ➕ Add QR Code
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                const result = await Swal.fire({
                  title: '🔲 Generate QR Codes',
                  html: `
                    <div style="text-align: left;">
                      <div class="mb-3">
                        <label class="form-label">Number of QR Codes:</label>
                        <input type="number" id="qr-count" class="form-control" value="1" min="1" max="100">
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Purpose:</label>
                        <select id="qr-purpose" class="form-control">
                          <option value="Equipment Management">Equipment Management</option>
                          <option value="Asset Tracking">Asset Tracking</option>
                          <option value="Vehicle Tracking">Vehicle Tracking</option>
                          <option value="Personnel Tracking">Personnel Tracking</option>
                          <option value="General Use">General Use</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Description:</label>
                        <input type="text" id="qr-description" class="form-control" placeholder="Enter description...">
                      </div>
                    </div>
                  `,
                  showCancelButton: true,
                  confirmButtonText: '🔲 Generate QR Codes',
                  cancelButtonText: 'Cancel',
                  preConfirm: () => {
                    const count = document.getElementById('qr-count').value;
                    const purpose = document.getElementById('qr-purpose').value;
                    const description = document.getElementById('qr-description').value;

                    if (!count || count < 1) {
                      Swal.showValidationMessage('Please enter a valid number of QR codes');
                      return false;
                    }

                    return { count: parseInt(count), purpose, description };
                  }
                });

                if (result.isConfirmed) {
                  try {
                    const { count, purpose, description } = result.value;

                    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
                    const response = await fetch('http://localhost:5001/api/devices/admin/generate-qr', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ count, purpose, description })
                    });

                    const data = await response.json();

                    if (data.success) {
                      await Swal.fire({
                        icon: 'success',
                        title: '✅ QR Codes Generated!',
                        text: `Successfully generated ${data.count} QR code(s)`,
                        timer: 2000
                      });

                      // Refresh the QR codes list
                      await loadAdminQRCodes();
                    } else {
                      throw new Error(data.message || 'Failed to generate QR codes');
                    }
                  } catch (error) {
                    await Swal.fire({
                      icon: 'error',
                      title: '❌ Generation Failed',
                      text: error.message
                    });
                  }
                }
              }}
            >
              🔲 Generate QR Codes
            </Button>
            <Button
              variant="outline-primary"
              style={{ backgroundColor: '#4a148c', borderColor: '#4a148c', color: 'white' }}
              onClick={loadAdminQRCodes}
            >
              🔄 Refresh Data
            </Button>


            <Button
              variant="outline-danger"
              onClick={async () => {
                try {
                  const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Delete Unassigned QR Codes?',
                    html: `
                      <div style="text-align: left; margin: 20px 0;">
                        <p><strong>⚠️ This will delete:</strong></p>
                        <ul style="text-align: left;">
                          <li>All QR codes not assigned to any user</li>
                          <li>QR codes that haven't been registered yet</li>
                          <li>QR codes in "Send QR Codes" dropdown</li>
                        </ul>
                        <hr>
                        <p><strong>✅ This will keep:</strong></p>
                        <ul style="text-align: left;">
                          <li>QR codes already assigned to users</li>
                          <li>QR codes that appear in QR Management</li>
                          <li>All user registration data</li>
                        </ul>
                      </div>
                    `,
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: '🗑️ Delete Unassigned',
                    cancelButtonText: '❌ Cancel'
                  });

                  if (!result.isConfirmed) return;

                  // Show loading
                  Swal.fire({
                    title: 'Deleting Unassigned QR Codes...',
                    text: 'Please wait while we clean up unassigned QR codes.',
                    icon: 'info',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => {
                      Swal.showLoading();
                    }
                  });

                  const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');

                  const response = await fetch('http://localhost:5001/api/devices/admin/delete-unassigned-qr', {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });

                  const data = await response.json();

                  if (data.success) {
                    Swal.fire({
                      icon: 'success',
                      title: 'Cleanup Complete!',
                      html: `
                        <div style="text-align: center; margin: 20px 0;">
                          <p><strong>🗑️ Deleted:</strong> ${data.deletedCount} unassigned QR codes</p>
                          <hr>
                          <p style="color: #28a745;"><strong>✅ Ready for fresh QR code generation!</strong></p>
                          <p style="color: #6c757d; font-size: 0.9em;">You can now generate new QR codes and send them to users.</p>
                        </div>
                      `,
                      confirmButtonColor: '#28a745'
                    });

                    // Refresh the QR codes list
                    loadAdminQRCodes();
                  } else {
                    Swal.fire({
                      icon: 'error',
                      title: 'Cleanup Failed',
                      text: data.message || 'Failed to delete unassigned QR codes. Please try again.',
                      confirmButtonColor: '#dc3545'
                    });
                  }

                } catch (error) {
                  console.error('Delete unassigned QR codes error:', error);
                  Swal.fire({
                    icon: 'error',
                    title: 'Error During Cleanup',
                    text: error.message || 'An unexpected error occurred. Please try again.',
                    confirmButtonColor: '#dc3545'
                  });
                }
              }}
            >
              🗑️ Clean Unassigned QR Codes
            </Button>

            <Button
              variant="success"
              onClick={async () => {
                try {
                  // Check localStorage for QR codes
                  const localQRs = localStorage.getItem('generatedQRCodes');
                  if (!localQRs) {
                    alert('❌ No QR codes found in localStorage to migrate!');
                    return;
                  }

                  const qrCodes = JSON.parse(localQRs);
                  if (!Array.isArray(qrCodes) || qrCodes.length === 0) {
                    alert('❌ No valid QR codes found in localStorage!');
                    return;
                  }

                  const confirmed = window.confirm(`🔄 Found ${qrCodes.length} QR codes in localStorage.\n\nMigrate them to database?\n\nThis will make them available in Send QR Codes dropdown.`);
                  if (!confirmed) return;

                  const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
                  let migrated = 0;
                  let errors = 0;

                  for (const qr of qrCodes) {
                    try {
                      const response = await fetch('http://localhost:5001/api/devices/admin/generate-qr', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          count: 1,
                          purpose: qr.purpose || qr.deviceName || 'General Use',
                          description: qr.description || 'Migrated from localStorage'
                        })
                      });

                      if (response.ok) {
                        migrated++;
                      } else {
                        errors++;
                      }
                    } catch (error) {
                      console.error('Migration error:', error);
                      errors++;
                    }
                  }

                  // Clear localStorage after migration
                  if (migrated > 0) {
                    localStorage.removeItem('generatedQRCodes');
                  }

                  // Refresh the data
                  await loadAdminQRCodes();

                  alert(`🎉 Migration Complete!\n\n✅ Migrated: ${migrated} QR codes\n❌ Errors: ${errors}\n\nQR codes are now available in Send QR Codes dropdown!`);

                } catch (error) {
                  console.error('Migration failed:', error);
                  alert(`❌ Migration failed: ${error.message}`);
                }
              }}
            >
              🔄 Migrate localStorage QRs
            </Button>
          </div>
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
              <h4>No QR Assignments Found</h4>
              <p className="text-muted">No QR codes have been assigned to users yet. Check console for debugging info.</p>
              <Button
                variant="outline-primary"
                onClick={loadAdminQRCodes}
                style={{ backgroundColor: '#4a148c', borderColor: '#4a148c', color: 'white' }}
              >
                🔄 Try Loading Again
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">📋 QR Code Assignments Database</h5>
              <small className="text-muted">Shows only QR codes that have been assigned to users (registered devices)</small>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>QR ID / Device Code</th>
                      <th>Assigned To</th>
                      <th>Device Name</th>
                      <th>Purpose</th>
                      <th>Description</th>
                      <th>Assignment Date</th>
                      <th>Upload Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qrCodes.map((qr, index) => (
                      <tr key={index}>
                        <td>
                          <strong style={{ color: '#4a148c' }}>{qr.qrId || qr.deviceCode}</strong>
                        </td>
                        <td>
                          <div>
                            <strong>{qr.assignedTo}</strong>
                          </div>
                        </td>
                        <td>{qr.deviceName}</td>
                        <td>
                          <Badge bg="secondary">{qr.purpose}</Badge>
                        </td>
                        <td>{qr.description}</td>
                        <td>{new Date(qr.assignedDate).toLocaleDateString()}</td>
                        <td>
                          <Badge bg={qr.uploadMethod === 'scan' ? 'primary' : qr.uploadMethod === 'upload' ? 'success' : 'warning'}>
                            {qr.uploadMethod === 'scan' ? '📷 QR Scan' :
                             qr.uploadMethod === 'upload' ? '📤 QR Upload' : '⌨️ Manual Entry'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={qr.status === 'active' ? 'success' : 'secondary'}>
                            {qr.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleEditQR(qr)}
                              title="Edit QR Code"
                            >
                              ✏️
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteQR(qr)}
                              title="Delete QR Code"
                            >
                              🗑️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* QR Code Edit/Create Modal */}
        <Modal show={showQRModal} onHide={() => setShowQRModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editingQR ? 'Edit QR Code' : 'Add New QR Code'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Device Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={qrFormData.deviceCode}
                      onChange={(e) => setQRFormData({...qrFormData, deviceCode: e.target.value})}
                      placeholder="Enter device code"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Device Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={qrFormData.deviceName}
                      onChange={(e) => setQRFormData({...qrFormData, deviceName: e.target.value})}
                      placeholder="Enter device name"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Purpose</Form.Label>
                    <Form.Control
                      type="text"
                      value={qrFormData.purpose}
                      onChange={(e) => setQRFormData({...qrFormData, purpose: e.target.value})}
                      placeholder="Enter purpose"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Assigned To</Form.Label>
                    <Form.Control
                      type="email"
                      value={qrFormData.assignedTo}
                      onChange={(e) => setQRFormData({...qrFormData, assignedTo: e.target.value})}
                      placeholder="Enter user email"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={qrFormData.description}
                  onChange={(e) => setQRFormData({...qrFormData, description: e.target.value})}
                  placeholder="Enter description"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={qrFormData.status}
                  onChange={(e) => setQRFormData({...qrFormData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowQRModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveQR}
              style={{ backgroundColor: '#4a148c', borderColor: '#4a148c' }}
            >
              {editingQR ? 'Update QR Code' : 'Create QR Code'}
            </Button>
          </Modal.Footer>
        </Modal>
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

  // Send QR Codes render function - New feature for admin/superadmin
  const renderSendQRCodesContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return (
        <div className="dashboard-content">
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: '0.5' }}>🚫</div>
            <h5>Access Denied</h5>
            <p className="text-muted">You don't have permission to access this section</p>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>📧 Send QR Codes</h2>
            <p className="text-muted">Send unassigned QR codes to users via email (only shows QR codes not yet assigned to anyone)</p>
          </div>
          <div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                console.log('🔄 Refreshing Send QR Codes data...');
                loadAdminQRCodes();
                loadAllUsers();
                Swal.fire({
                  icon: 'success',
                  title: 'Refreshed!',
                  text: 'QR codes and users data updated',
                  timer: 1500,
                  showConfirmButton: false
                });
              }}
            >
              🔄 Refresh Data
            </Button>
          </div>
        </div>

        <Row>
          <Col lg={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">📱 Send QR Codes to Users</h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="info" className="mb-4">
                  <Alert.Heading>📋 How it works:</Alert.Heading>
                  <ul className="mb-0">
                    <li>Select users from the registered database</li>
                    <li>Choose QR codes to send (from available unassigned QR codes)</li>
                    <li>Send via email or SMS using stored contact information</li>
                    <li>Track delivery status and user registration</li>
                  </ul>
                </Alert>

                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>👥 Select Users</Form.Label>
                        <Form.Select>
                          <option value="">Choose users to send QR codes...</option>
                          {Array.isArray(allUsers) && allUsers
                            .filter(user => user.role === 'user') // Only regular users
                            .map(user => (
                              <option key={user._id} value={user._id}>
                                {user.firstName} {user.lastName} ({user.email})
                              </option>
                            ))
                          }
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Select users who need QR codes
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>📱 Select QR Codes</Form.Label>
                        <Form.Select>
                          <option value="">Choose QR codes to send...</option>
                          {(() => {
                            // Use the same qrCodes variable as QR Management section
                            const qrCodes = Array.isArray(allQRCodes) ? allQRCodes : [];
                            console.log('🔍 DEBUG: All QR Codes for dropdown:', qrCodes);

                            // Filter to show only unassigned QR codes from DATABASE (server-generated)
                            // Use allDevices (database) - this contains server-generated QR codes
                            console.log('🔍 DEBUG: All devices from database for dropdown:', allDevices.length);
                            console.log('🔍 DEBUG: First few database devices:', allDevices.slice(0, 3));

                            const availableQRs = allDevices.filter(qr => {
                              // Filter unassigned QR codes from database
                              const isUnassigned = (!qr.assignedTo || qr.assignedTo === null || qr.assignedTo === '');

                              console.log('🔍 QR Code:', qr.deviceId, 'AssignedTo:', qr.assignedTo, 'IsUnassigned:', isUnassigned);
                              return isUnassigned;
                            });

                            console.log('🔍 DEBUG: Available QRs after filtering:', availableQRs.length);
                            console.log('🔍 DEBUG: Available QRs:', availableQRs);
                            console.log('🔍 DEBUG: Sample available QR:', availableQRs[0]);

                            console.log('🔍 Available QR Codes for dropdown:', availableQRs);

                            if (availableQRs.length === 0) {
                              return (
                                <option value="" disabled>No available QR codes found</option>
                              );
                            }

                            return availableQRs.map((qr, index) => {
                              // Use database structure (allDevices from server)
                              const qrId = qr.deviceId; // database uses 'deviceId' field
                              const displayName = qr.name || qr.deviceName || 'GPS Device';

                              return (
                                <option key={qr._id || index} value={qrId}>
                                  {qrId} - {displayName}
                                </option>
                              );
                            });
                          })()}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Only unassigned QR codes are available
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>📧 Delivery Method</Form.Label>
                        <div>
                          <Form.Check
                            type="radio"
                            id="email-delivery"
                            name="deliveryMethod"
                            label="📧 Send via Email"
                            defaultChecked
                          />
                          <Form.Check
                            type="radio"
                            id="sms-delivery"
                            name="deliveryMethod"
                            label="📱 Send via SMS"
                          />
                          <Form.Check
                            type="radio"
                            id="both-delivery"
                            name="deliveryMethod"
                            label="📧📱 Send via Both"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>💬 Custom Message (Optional)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Add a custom message to include with the QR code..."
                        />
                        <Form.Text className="text-muted">
                          This message will be included with the QR code
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={async () => {
                        try {
                          // Get selected users and QR codes from the form - try multiple selectors
                          const userSelect = document.querySelector('select[name="selectedUsers"]') ||
                                           document.querySelector('#selectedUsers') ||
                                           document.querySelector('.user-select select') ||
                                           document.querySelector('select:has(option[value])');

                          const qrSelect = document.querySelector('select[name="selectedQRs"]') ||
                                         document.querySelector('#selectedQRs') ||
                                         document.querySelector('.qr-select select') ||
                                         document.querySelectorAll('select')[1]; // Second select element

                          console.log('🔍 User select element:', userSelect);
                          console.log('🔍 QR select element:', qrSelect);
                          console.log('🔍 User value:', userSelect?.value);
                          console.log('🔍 QR value:', qrSelect?.value);

                          if (!userSelect || !userSelect.value || userSelect.value === '') {
                            Swal.fire({
                              icon: 'warning',
                              title: 'No User Selected',
                              text: 'Please select at least one user to send QR codes to.',
                              confirmButtonColor: '#3085d6'
                            });
                            return;
                          }

                          if (!qrSelect || !qrSelect.value || qrSelect.value === '') {
                            Swal.fire({
                              icon: 'warning',
                              title: 'No QR Code Selected',
                              text: 'Please select at least one QR code to send.',
                              confirmButtonColor: '#3085d6'
                            });
                            return;
                          }

                          const userIds = [userSelect.value];
                          const qrCodeIds = [qrSelect.value];

                          // Get user and QR code names for confirmation
                          const userName = userSelect.options[userSelect.selectedIndex]?.text || 'Selected User';
                          const qrCodeName = qrSelect.options[qrSelect.selectedIndex]?.text || 'Selected QR Code';

                          const result = await Swal.fire({
                            icon: 'question',
                            title: 'Send QR Code via Email?',
                            html: `
                              <div style="text-align: left; margin: 20px 0;">
                                <p><strong>📧 Recipient:</strong> ${userName}</p>
                                <p><strong>🔲 QR Code:</strong> ${qrCodeName}</p>
                                <p><strong>📨 Action:</strong> Send personalized email with QR code details</p>
                              </div>
                            `,
                            showCancelButton: true,
                            confirmButtonColor: '#28a745',
                            cancelButtonColor: '#dc3545',
                            confirmButtonText: '📤 Send Email',
                            cancelButtonText: '❌ Cancel'
                          });

                          if (!result.isConfirmed) return;

                          // Show loading
                          Swal.fire({
                            title: 'Sending Email...',
                            text: 'Please wait while we send the QR code via email.',
                            icon: 'info',
                            allowOutsideClick: false,
                            showConfirmButton: false,
                            willOpen: () => {
                              Swal.showLoading();
                            }
                          });

                          const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');

                          const response = await fetch('http://localhost:5001/api/email/send-qr-codes', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              userIds: userIds,
                              qrCodeIds: qrCodeIds
                            })
                          });

                          const data = await response.json();

                          if (data.success) {
                            Swal.fire({
                              icon: 'success',
                              title: 'Email Sent Successfully!',
                              html: `
                                <div style="text-align: left; margin: 20px 0;">
                                  <p><strong>✅ Successful:</strong> ${data.results.successCount}</p>
                                  <p><strong>❌ Failed:</strong> ${data.results.errorCount}</p>
                                  <p><strong>📊 Total QR Codes:</strong> ${data.results.totalQRCodes}</p>
                                  <p><strong>👥 Total Users:</strong> ${data.results.totalUsers}</p>
                                  <hr>
                                  <p style="color: #28a745;"><strong>📧 Check your email inbox for the QR code details!</strong></p>
                                </div>
                              `,
                              confirmButtonColor: '#28a745'
                            });
                          } else {
                            Swal.fire({
                              icon: 'error',
                              title: 'Email Sending Failed',
                              text: data.message || 'Failed to send emails. Please try again.',
                              confirmButtonColor: '#dc3545'
                            });
                          }

                        } catch (error) {
                          console.error('Email sending error:', error);
                          Swal.fire({
                            icon: 'error',
                            title: 'Error Sending Email',
                            text: error.message || 'An unexpected error occurred. Please try again.',
                            confirmButtonColor: '#dc3545'
                          });
                        }
                      }}
                    >
                      📤 Send QR Codes via Email
                    </Button>

                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">📊 Sending Statistics</h6>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <div className="display-6 text-success mb-2">📧</div>
                  <h5>Email Delivery</h5>
                  <p className="text-muted">Ready to send</p>
                </div>

                <hr />

                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Total Users:</span>
                    <Badge bg="primary">{Array.isArray(allUsers) ? allUsers.filter(u => u.role === 'user').length : 0}</Badge>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Total QR Codes:</span>
                    <Badge bg="info">{Array.isArray(allQRCodes) ? allQRCodes.length : 0}</Badge>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Available QR Codes:</span>
                    <Badge bg="success">
                      {Array.isArray(allQRCodes) ? allQRCodes.filter(qr =>
                        !qr.assignedTo ||
                        qr.assignedTo === 'Unknown User' ||
                        qr.assignedTo === '' ||
                        qr.assignedTo === null ||
                        qr.status === 'available'
                      ).length : 0}
                    </Badge>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Assigned QR Codes:</span>
                    <Badge bg="warning">
                      {Array.isArray(allQRCodes) ? allQRCodes.filter(qr =>
                        qr.assignedTo &&
                        qr.assignedTo !== 'Unknown User' &&
                        qr.assignedTo !== '' &&
                        qr.assignedTo !== null &&
                        qr.status !== 'available'
                      ).length : 0}
                    </Badge>
                  </div>
                </div>

                <Alert variant="info" className="small">
                  <strong>💡 Tip:</strong> Users will receive QR codes with instructions on how to register and start tracking.
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
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
                <Button variant="success" className="w-100 mb-2" onClick={() => setShowQRGenerationModal(true)}>
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
      return (
        <div className="dashboard-content">
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: '0.5' }}>🚫</div>
            <h5>Access Denied</h5>
            <p className="text-muted">Super Admin privileges required</p>
          </div>
        </div>
      );
    }
    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>⚙️ System Settings</h2>
            <p className="text-muted">Configure system settings and monitor gpstracker database performance</p>
          </div>
          <div className="d-flex gap-2">
            <Badge bg="info" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              Total Users: {Array.isArray(allUsers) ? allUsers.length : 0}
            </Badge>
            <Badge bg="success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              Total QR Codes: {Array.isArray(allQRCodes) ? allQRCodes.length : 0}
            </Badge>
            <Button
              variant="outline-info"
              onClick={async () => {
                try {
                  console.log('📊 Refreshing system data from gpstracker database...');
                  await loadAllUsers();
                  await loadAdminQRCodes();
                  alert('✅ System data refreshed from gpstracker database!');
                } catch (error) {
                  alert(`❌ Failed to refresh: ${error.message}`);
                }
              }}
            >
              🔄 Refresh Data
            </Button>
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
                <h5 className="mb-0">📊 GPSTracker Database Status</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Database Connection</span>
                    <Badge bg="success">gpstracker DB Connected</Badge>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Total Users</span>
                    <Badge bg="info">{Array.isArray(allUsers) ? allUsers.length : 0}</Badge>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Active QR Codes</span>
                    <Badge bg="success">{Array.isArray(allQRCodes) ? allQRCodes.filter(qr => qr.status === 'active').length : 0}</Badge>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Total QR Assignments</span>
                    <Badge bg="primary">{Array.isArray(allQRCodes) ? allQRCodes.length : 0}</Badge>
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
      return (
        <div className="dashboard-content">
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: '0.5' }}>🚫</div>
            <h5>Access Denied</h5>
            <p className="text-muted">Super Admin privileges required</p>
          </div>
        </div>
      );
    }

    // Filter admin users from gpstracker database
    const adminUsers = Array.isArray(allUsers) ? allUsers.filter(user => user.role === 'admin' || user.role === 'superadmin') : [];

    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>👨‍💼 Admin Management</h2>
            <p className="text-muted">Manage admin users from gpstracker database and their privileges</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Badge bg="info" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              Total Admins: {adminUsers.length}
            </Badge>
            <Button
              variant="outline-info"
              onClick={async () => {
                try {
                  await loadAllUsers();
                  alert('✅ Admin data refreshed from gpstracker database!');
                } catch (error) {
                  alert(`❌ Failed to refresh: ${error.message}`);
                }
              }}
            >
              🔄 Refresh Admins
            </Button>
            <Button variant="primary" onClick={handleCreateUser}>
              ➕ Add New Admin
            </Button>
          </div>
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
                {adminUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <div style={{ opacity: '0.5' }}>
                        👨‍💼 No admin users found in gpstracker database
                      </div>
                    </td>
                  </tr>
                ) : (
                  adminUsers.map((user, index) => (
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
                  ))
                )}
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

  // Statistics render function with charts and graphs
  const renderStatisticsContent = () => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return (
        <div className="dashboard-content">
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: '0.5' }}>🚫</div>
            <h5>Access Denied</h5>
            <p className="text-muted">You don't have permission to access this section</p>
          </div>
        </div>
      );
    }

    // Chart options with transparent background
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0,0,0,0.1)'
          }
        },
        x: {
          grid: {
            color: 'rgba(0,0,0,0.1)'
          }
        }
      }
    };

    // Pie chart options
    const pieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff'
        }
      }
    };

    // Users by role pie chart data
    const userRoleData = {
      labels: Object.keys(statisticsData.users.byRole || {}),
      datasets: [{
        data: Object.values(statisticsData.users.byRole || {}),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 2
      }]
    };

    // Device status pie chart data
    const deviceStatusData = {
      labels: Object.keys(statisticsData.devices.byStatus || {}),
      datasets: [{
        data: Object.values(statisticsData.devices.byStatus || {}),
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 2
      }]
    };

    // Daily activity bar chart data
    const dailyActivityData = {
      labels: (statisticsData.activity.daily || []).map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Users',
          data: (statisticsData.activity.daily || []).map(d => d.users),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2
        },
        {
          label: 'Devices',
          data: (statisticsData.activity.daily || []).map(d => d.devices),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2
        },
        {
          label: 'Locations',
          data: (statisticsData.activity.daily || []).map(d => d.locations),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2
        }
      ]
    };

    // Monthly trend line chart data
    const monthlyTrendData = {
      labels: (statisticsData.activity.monthly || []).map(m => m.month),
      datasets: [
        {
          label: 'Users',
          data: (statisticsData.activity.monthly || []).map(m => m.users),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Devices',
          data: (statisticsData.activity.monthly || []).map(m => m.devices),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    return (
      <div className="dashboard-content" style={{ background: 'rgba(255,255,255,0.95)' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2><FaChartBar className="me-2" />Statistics Dashboard</h2>
            <p className="text-muted">Comprehensive analytics and insights from database</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={loadStatisticsData}
              disabled={statisticsLoading}
            >
              {statisticsLoading ? <Spinner size="sm" className="me-1" /> : <FaSync className="me-1" />}
              Refresh
            </Button>
          </div>
        </div>

        {statisticsError && (
          <Alert variant="danger" className="mb-4">
            <FaExclamationTriangle className="me-2" />
            {statisticsError}
          </Alert>
        )}

        {statisticsLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading statistics...</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <Row className="mb-4">
              <Col md={3}>
                <Card className="shadow-sm h-100" style={{ background: 'rgba(54, 162, 235, 0.1)', border: '1px solid rgba(54, 162, 235, 0.3)' }}>
                  <Card.Body className="text-center">
                    <FaUsers size={40} className="text-primary mb-3" />
                    <h3 className="mb-1">{statisticsData.users.total || 0}</h3>
                    <p className="text-muted mb-0">Total Users</p>
                    <small className="text-success">
                      {statisticsData.users.active || 0} active
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100" style={{ background: 'rgba(255, 99, 132, 0.1)', border: '1px solid rgba(255, 99, 132, 0.3)' }}>
                  <Card.Body className="text-center">
                    <FaQrcode size={40} className="text-danger mb-3" />
                    <h3 className="mb-1">{statisticsData.devices.total || 0}</h3>
                    <p className="text-muted mb-0">Total Devices</p>
                    <small className="text-info">
                      {statisticsData.devices.assigned || 0} assigned
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100" style={{ background: 'rgba(75, 192, 192, 0.1)', border: '1px solid rgba(75, 192, 192, 0.3)' }}>
                  <Card.Body className="text-center">
                    <FaMapMarkerAlt size={40} className="text-info mb-3" />
                    <h3 className="mb-1">{statisticsData.locations.total || 0}</h3>
                    <p className="text-muted mb-0">Total Locations</p>
                    <small className="text-warning">
                      {statisticsData.locations.recent || 0} recent
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100" style={{ background: 'rgba(255, 205, 86, 0.1)', border: '1px solid rgba(255, 205, 86, 0.3)' }}>
                  <Card.Body className="text-center">
                    <FaChartLine size={40} className="text-warning mb-3" />
                    <h3 className="mb-1">{statisticsData.qrCodes.scanned || 0}</h3>
                    <p className="text-muted mb-0">QR Scanned</p>
                    <small className="text-success">
                      {Math.round(((statisticsData.qrCodes.scanned || 0) / (statisticsData.qrCodes.total || 1)) * 100) || 0}% rate
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Charts Row 1 */}
            <Row className="mb-4">
              <Col md={6}>
                <Card className="shadow-sm h-100" style={{ background: 'rgba(255,255,255,0.9)' }}>
                  <Card.Header style={{ background: 'rgba(54, 162, 235, 0.1)' }}>
                    <h5 className="mb-0"><FaChartPie className="me-2" />Users by Role</h5>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: '300px' }}>
                      <Pie data={userRoleData} options={pieOptions} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="shadow-sm h-100" style={{ background: 'rgba(255,255,255,0.9)' }}>
                  <Card.Header style={{ background: 'rgba(75, 192, 192, 0.1)' }}>
                    <h5 className="mb-0"><FaChartPie className="me-2" />Device Status</h5>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: '300px' }}>
                      <Doughnut data={deviceStatusData} options={pieOptions} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Charts Row 2 */}
            <Row className="mb-4">
              <Col md={12}>
                <Card className="shadow-sm" style={{ background: 'rgba(255,255,255,0.9)' }}>
                  <Card.Header style={{ background: 'rgba(255, 99, 132, 0.1)' }}>
                    <h5 className="mb-0"><FaChartBar className="me-2" />Daily Activity (Last 7 Days)</h5>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: '400px' }}>
                      <Bar data={dailyActivityData} options={chartOptions} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Charts Row 3 */}
            <Row className="mb-4">
              <Col md={12}>
                <Card className="shadow-sm" style={{ background: 'rgba(255,255,255,0.9)' }}>
                  <Card.Header style={{ background: 'rgba(153, 102, 255, 0.1)' }}>
                    <h5 className="mb-0"><FaChartArea className="me-2" />Monthly Trends (Last 6 Months)</h5>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: '400px' }}>
                      <Line data={monthlyTrendData} options={chartOptions} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    );
  };

  // Render Scan History Content
  const renderScanHistoryContent = () => {
    return (
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>📜 Scan History</h2>
            <p className="text-muted">View all your QR code scanning activities with timestamps and locations</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={loadScanHistoryFromDatabase}
              disabled={loadingScanHistory}
            >
              {loadingScanHistory ? <Spinner size="sm" className="me-1" /> : '🔄'}
              Refresh
            </Button>
          </div>
        </div>

        {scanHistoryError && (
          <Alert variant="danger" className="mb-4">
            <strong>Error:</strong> {scanHistoryError}
          </Alert>
        )}

        {loadingScanHistory ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading scan history...</p>
          </div>
        ) : (
          <>
            {scanHistory.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: '0.5' }}>📱</div>
                <h5>No Scan History Found</h5>
                <p className="text-muted">Start scanning QR codes to see your history here</p>
                <Button variant="primary" onClick={() => setActiveTab('add-device')}>
                  Scan Your First QR Code
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-3">
                  <h5>📊 Summary</h5>
                  <Row>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-primary">{scanHistory.length}</h4>
                          <small className="text-muted">Total Scans</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-success">{scanHistory.filter(s => s.scanMethod === 'scan').length}</h4>
                          <small className="text-muted">Camera Scans</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-info">{scanHistory.filter(s => s.scanMethod === 'upload').length}</h4>
                          <small className="text-muted">Image Uploads</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-warning">{scanHistory.filter(s => s.scanMethod === 'manual').length}</h4>
                          <small className="text-muted">Manual Entries</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>

                <Card>
                  <Card.Header>
                    <h5 className="mb-0">📱 Scan History Details</h5>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      {scanHistory.map((scan, index) => (
                        <div key={index} className="border rounded p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                          <Row>
                            <Col md={8}>
                              <div className="d-flex align-items-center mb-2">
                                <div className="me-3">
                                  {scan.scanMethod === 'scan' && <span className="badge bg-success">📷 Camera Scan</span>}
                                  {scan.scanMethod === 'upload' && <span className="badge bg-info">📁 Image Upload</span>}
                                  {scan.scanMethod === 'manual' && <span className="badge bg-warning">✏️ Manual Entry</span>}
                                </div>
                                <h6 className="mb-0">{scan.deviceName || scan.deviceId}</h6>
                              </div>

                              <div className="mb-2">
                                <strong>Device ID:</strong> <code>{scan.deviceId}</code>
                              </div>

                              {scan.scanLocation && scan.scanLocation.address && (
                                <div className="mb-2">
                                  <strong>📍 Scan Location:</strong> {scan.scanLocation.address}
                                </div>
                              )}

                              {scan.scanLocation && scan.scanLocation.latitude && (
                                <div className="mb-2">
                                  <strong>🌐 Coordinates:</strong> {scan.scanLocation.latitude.toFixed(6)}, {scan.scanLocation.longitude.toFixed(6)}
                                </div>
                              )}
                            </Col>

                            <Col md={4} className="text-end">
                              <div className="mb-2">
                                <strong>📅 Date:</strong><br />
                                <span className="text-muted">
                                  {new Date(scan.scannedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="mb-2">
                                <strong>🕒 Time:</strong><br />
                                <span className="text-muted">
                                  {new Date(scan.scannedAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <div>
                                <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>
                                  {scan.deviceType || 'GPS Tracker'}
                                </Badge>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const getSidebarContent = () => {
    // Base sections for regular users
    const userSections = [
      {
        key: "dashboard",
        title: "Dashboard",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
        ),
        isDirectLink: true,
        id: "dashboard"
      },
      {
        key: "add-my-device",
        title: "Add My Device",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        ),
        isDirectLink: true,
        id: "add-my-device"
      },
      {
        key: "assigned-devices",
        title: "Assigned Devices",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 4h10v14H7V4z"/>
          </svg>
        ),
        isDirectLink: true,
        id: "assigned-devices"
      },
      {
        key: "scan-history",
        title: "Scan History",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
        ),
        isDirectLink: true,
        id: "scan-history"
      },
      {
        key: "profile",
        title: "My Account",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        ),
        items: [
          {
            id: "profile",
            label: "View Profile",
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )
          },
          {
            id: "settings",
            label: "Account Settings",
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            )
          }
        ]
      },
      {
        key: "support",
        title: "Help & Support",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 6h-2l-1.27-1.27c-.4-.4-.86-.73-1.38-.73H7.65c-.52 0-.98.33-1.38.73L5 6H3c-.55 0-1 .45-1 1s.45 1 1 1h1v9c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8h1c.55 0 1-.45 1-1s-.45-1-1-1zM12 16c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/>
          </svg>
        ),
        items: [
          {
            id: "help",
            label: "Help Center",
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            )
          },
          {
            id: "contact",
            label: "Contact Support",
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            )
          },
          {
            id: "feedback",
            label: "Send Feedback",
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
              </svg>
            )
          }
        ]
      }
    ];



    // Admin sections - Simplified with only essential sections
    const adminSections = [
      {
        id: "statistics",
        label: "Statistics",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        )
      },
      {
        id: "all-users",
        label: "User Management",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 7c0-2.21-1.79-4-4-4S8 4.79 8 7s1.79 4 4 4 4-1.79 4-4zm-4 6c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/>
          </svg>
        )
      },
      {
        id: "qr-management",
        label: "QR Management",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4z"/>
            <rect x="15" y="13" width="2" height="2"/>
            <rect x="15" y="17" width="2" height="2"/>
            <rect x="17" y="15" width="2" height="2"/>
            <rect x="19" y="13" width="2" height="2"/>
            <rect x="19" y="17" width="2" height="2"/>
            <rect x="21" y="15" width="2" height="2"/>
          </svg>
        )
      },
      {
        id: "send-qr-codes",
        label: "Send QR Codes",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        )
      }
    ];

    // Super admin sections - Unique SVG icons (matching user interface)
    const superAdminSections = [
      {
        id: "system-settings",
        label: "System Settings",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        )
      },
      {
        id: "admin-management",
        label: "Admin Management",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21ZM14 15.5C14 14.11 15.11 13 16.5 13S19 14.11 19 15.5 17.89 18 16.5 18 14 16.89 14 15.5ZM16.5 19C18.71 19 20.5 17.21 20.5 15C20.5 12.79 18.71 11 16.5 11S12.5 12.79 12.5 15C12.5 17.21 14.29 19 16.5 19Z"/>
          </svg>
        )
      }
    ];

    // Default to user sections if userData is not available
    let sections = [...userSections];

    // Assign sections based on user role
    if (userData) {
      if (userData.role === 'admin') {
        sections = [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            )
          },
          ...adminSections
        ];
      } else if (userData.role === 'superadmin' || userData.role === 'super_admin') {
        sections = [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            )
          },
          ...adminSections,
          ...superAdminSections
        ];
      } else {
        // Regular user
        sections = [...userSections];
      }
    }

    return (
      <div className="dashboard-sidebar">
        {sections && sections.map(section => (
          section.isDirectLink || section.label ? (
            // Direct link sections (Dashboard, Add Device, etc.)
            <div
              key={section.id || section.key}
              className="sidebar-item-custom direct-link"
              onClick={() => {
                console.log('🖱️ Sidebar clicked, setting activeTab to:', section.id);
                setActiveTab(section.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                margin: '0.5rem 0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: activeTab === section.id ? '#4a148c' : 'transparent',
                color: activeTab === section.id ? 'white' : '#333',
                border: '3px solid',
                borderColor: activeTab === section.id ? '#4a148c' : '#d1d5db',
                boxShadow: activeTab === section.id ? '0 4px 12px rgba(74, 20, 140, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                if (activeTab !== section.id) {
                  e.currentTarget.style.backgroundColor = '#f8f5ff';
                  e.currentTarget.style.borderColor = '#7b1fa2';
                  e.currentTarget.style.color = '#4a148c';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== section.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#e9ecef';
                  e.currentTarget.style.color = '#333';
                }
              }}
            >
              <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>
                {section.icon}
              </span>
              <span style={{ fontWeight: '600', fontSize: '1rem' }}>
                {section.label || section.title}
              </span>
            </div>
          ) : (
            // Accordion sections (My Account, Help & Support)
            <Accordion key={section.key} className="mb-2">
              <Accordion.Item eventKey={section.key} className="sidebar-section">
                <Accordion.Header
                  className={`sidebar-header ${activeTab.startsWith(section.key) ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ marginRight: '0.75rem', fontSize: '1.1rem' }}>
                    {section.icon}
                  </span>
                  <span style={{ fontWeight: '600' }}>
                    {section.title}
                  </span>
                </Accordion.Header>
                <Accordion.Body className="p-0">
                  {section.items && section.items.map(item => (
                    <div
                      key={item.id}
                      className="sidebar-item-custom"
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backgroundColor: activeTab === item.id ? '#4a148c' : 'transparent',
                        color: activeTab === item.id ? 'white' : '#333',
                        borderLeft: activeTab === item.id ? '4px solid #7b1fa2' : '4px solid transparent',
                        borderRadius: activeTab === item.id ? '0 8px 8px 0' : '0'
                      }}
                      onMouseOver={(e) => {
                        if (activeTab !== item.id) {
                          e.currentTarget.style.backgroundColor = '#f8f5ff';
                          e.currentTarget.style.color = '#4a148c';
                          e.currentTarget.style.borderLeft = '4px solid #7b1fa2';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (activeTab !== item.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#333';
                          e.currentTarget.style.borderLeft = '4px solid transparent';
                        }
                      }}
                    >
                      <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>
                        {item.icon}
                      </span>
                      <span style={{ fontWeight: '500' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )
        ))}

        {/* Logout Button at Bottom */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          right: '1rem'
        }}>
          <div
            className="logout-item-custom"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: '#dc3545',
              color: 'white',
              border: '1px solid #dc3545',
              boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)',
              fontWeight: '600'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#c82333';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#dc3545';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.3)';
            }}
          >
            <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </span>
            <span style={{ fontWeight: '600', fontSize: '1rem' }}>
              Logout
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    console.log('🎯 renderContent called with activeTab:', activeTab);
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
      case 'add-my-device':
        return renderAddMyDeviceContent();
      case 'assigned-devices':
        return renderAssignedDevicesContent();
      case 'scan-history':
        console.log('🔍 Rendering scan history content');
        return renderScanHistoryContent();
      case 'user-device-uploads':
        return renderUserDeviceUploadsContent();

      // Statistics Page
      case 'statistics':
        return renderStatisticsContent();

      // User Management Pages
      case 'all-users':
        return renderUserManagementContent();
      case 'send-qr-codes':
        return renderSendQRCodesContent();



      // Super Admin - System Administration Pages
      case 'system-settings':
        return renderSystemSettingsContent();
      case 'system-logs':
        return renderSystemLogsContent();
      case 'admin-management':
        return renderAdminManagementContent();



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
          padding: isDevToolsOpen ? '0.25rem 0' : (isMobile ? '0.5rem 0' : '0.8rem 0'),
          width: '100%',
          zIndex: 1000
        }}
      >
        <Container fluid style={{ padding: `0 ${getResponsivePadding()}` }}>
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

              {/* User Profile Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: window.innerWidth < 768 ? '0.375rem 0.75rem' : '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '25px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                marginLeft: window.innerWidth < 768 ? '0.5rem' : '1rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '0.75rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    lineHeight: '1.2',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {userData?.name || userData?.username || 'User'}
                  </span>
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'capitalize',
                    letterSpacing: '0.5px'
                  }}>
                    {userData?.role || 'Member'}
                  </span>
                </div>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div style={{ paddingTop: '80px', height: 'calc(100vh - 80px)' }}>
        <Container fluid style={{ height: '100%' }}>
          <Row style={{
            height: '100%',
            margin: 0,
            display: 'flex',
            flexWrap: window.innerWidth >= 768 ? 'nowrap' : 'wrap'
          }}>
            {/* Mobile Sidebar Toggle */}
            <div className="d-md-none position-fixed" style={{
              top: '90px',
              left: '10px',
              zIndex: 1050,
              backgroundColor: '#4a148c',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(74, 20, 140, 0.3)'
            }}
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </div>

            {/* Sidebar */}
            <Col
              md={3}
              lg={2}
              className={`d-md-block ${showMobileSidebar ? 'd-block' : 'd-none'}`}
              style={{
                height: '100%',
                position: window.innerWidth < 768 ? 'fixed' : 'sticky',
                top: '0',
                left: window.innerWidth < 768 ? (showMobileSidebar ? '0' : '-100%') : 'auto',
                overflowY: 'auto',
                padding: 0,
                backgroundColor: '#fff',
                borderRight: '1px solid #e9ecef',
                zIndex: window.innerWidth < 768 ? 1040 : 'auto',
                width: window.innerWidth < 768 ? '280px' : 'auto',
                maxWidth: window.innerWidth >= 768 ? '280px' : '280px',
                minWidth: window.innerWidth >= 768 ? '250px' : '280px',
                flex: window.innerWidth >= 768 ? '0 0 auto' : 'none',
                transition: 'left 0.3s ease',
                boxShadow: window.innerWidth < 768 ? '2px 0 10px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {/* Mobile Sidebar Close Button */}
              {window.innerWidth < 768 && (
                <div className="d-flex justify-content-end p-2 d-md-none">
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      color: '#666',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              {getSidebarContent()}
            </Col>

            {/* Mobile Sidebar Overlay */}
            {showMobileSidebar && window.innerWidth < 768 && (
              <div
                className="position-fixed d-md-none"
                style={{
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 1030
                }}
                onClick={() => setShowMobileSidebar(false)}
              />
            )}

            {/* Main Content */}
            <Col
              md={9}
              lg={10}
              style={{
                height: '100vh',
                overflowY: 'auto',
                padding: window.innerWidth < 768 ? '0.5rem' : '1rem',
                backgroundColor: '#f8f9fa',
                width: '100%',
                maxWidth: '100%',
                flex: window.innerWidth >= 768 ? '1 1 auto' : 'none'
              }}
            >
              <div className="content-wrapper" style={{
                width: '100%',
                maxWidth: 'none',
                padding: 0,
                margin: 0,
                boxSizing: 'border-box',
                overflowX: 'hidden',
                display: 'block',
                minHeight: '100%',
                flex: '1 1 auto'
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
          <Button variant="primary" onClick={handleAdminDeviceFormSubmit}>
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

          /* Mobile Responsive Styles */
          @media (max-width: 767.98px) {
            .dashboard-sidebar {
              height: calc(100vh - 80px) !important;
              width: 280px !important;
            }

            .sidebar-item-custom, .logout-item-custom {
              padding: 1rem 0.75rem !important;
              margin: 0.25rem 0 !important;
            }

            .modal-dialog {
              margin: 0.5rem !important;
              max-width: calc(100% - 1rem) !important;
            }

            .modal-body {
              padding: 1rem 0.75rem !important;
            }

            .btn {
              padding: 0.75rem 1rem !important;
              font-size: 1rem !important;
              min-height: 44px !important;
            }

            .form-control, .form-select {
              padding: 0.75rem !important;
              font-size: 1rem !important;
              min-height: 44px !important;
            }

            .card {
              margin-bottom: 1rem !important;
            }

            .table-responsive {
              font-size: 0.875rem !important;
            }

            .navbar-brand {
              font-size: 1.25rem !important;
            }

            .badge {
              font-size: 0.75rem !important;
              padding: 0.375rem 0.5rem !important;
            }
          }

          @media (max-width: 575.98px) {
            .dashboard-sidebar {
              width: 100% !important;
            }

            .modal-dialog {
              margin: 0 !important;
              max-width: 100% !important;
              height: 100% !important;
            }

            .modal-content {
              height: 100% !important;
              border-radius: 0 !important;
            }

            .btn-group {
              flex-direction: column !important;
            }

            .btn-group .btn {
              border-radius: 0.375rem !important;
              margin-bottom: 0.25rem !important;
            }

            .d-flex.gap-2 {
              flex-direction: column !important;
              gap: 0.5rem !important;
            }

            .text-nowrap {
              white-space: normal !important;
            }
          }
        `}
      </style>

      {/* Geoapify GPS Tracker Modal */}
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

      {/* NEW SYSTEM: QR Code Management Modal - Shows ALL QR codes from Database */}
      <Modal show={showQRManagementModal} onHide={() => setShowQRManagementModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>📋 All QR Codes from Database - Device Management</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="mb-4">
            <h6>📊 QR Code Statistics (Database)</h6>
            <div className="d-flex gap-3 mb-3">
              <Badge bg="secondary" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                Total: {allDevices.length}
              </Badge>
              <Badge bg="success" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                Unassigned: {(() => {
                  const unassignedCount = allDevices.filter(qr => !qr.assignedTo || qr.assignedTo === null || qr.assignedTo === '').length;
                  console.log('📊 STATISTICS: Unassigned count:', unassignedCount);
                  console.log('📊 STATISTICS: All devices:', allDevices.length);
                  return unassignedCount;
                })()}
              </Badge>
              <Badge bg="warning" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                Assigned: {allDevices.filter(qr => qr.assignedTo && qr.assignedTo !== null && qr.assignedTo !== '').length}
              </Badge>
              <Badge bg="info" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                Active: {allDevices.filter(qr => qr.status === 'active').length}
              </Badge>
            </div>
            <Alert variant="info" className="mb-3">
              <small>
                <strong>📋 Database QR Codes:</strong> Shows all QR codes from database.
                <strong>Unassigned</strong> codes appear in "Send QR Codes" section.
                <strong>Assigned</strong> codes appear in "QR Management" section.
              </small>
            </Alert>
          </div>

          {allDevices.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔲</div>
              <h4>No QR Codes in Database</h4>
              <p className="text-muted">Click "Generate QR Codes" to create device QR codes in the database</p>
            </div>
          ) : (
            <Row>
              {allDevices.map((qr) => (
                <Col md={4} lg={3} key={qr._id || qr.id} className="mb-4">
                  <Card className={`h-100 ${
                    (!qr.assignedTo || qr.assignedTo === null || qr.assignedTo === '') ? 'border-success' :
                    qr.assignedTo ? 'border-warning' : 'border-info'
                  }`}>
                    <Card.Body className="text-center">
                      {/* QR Code Display */}
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
                        {/* Actual QR Code Image */}
                        <QRCodeDisplay qrData={qr.deviceId || qr.qrId} size={110} />
                      </div>

                      {/* QR Code Details */}
                      <h6 className="mb-2">Device QR Code</h6>
                      <div className="mb-2">
                        <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                          {qr.deviceId || qr.qrId}
                        </code>
                      </div>

                      <Badge
                        bg={
                          (!qr.assignedTo || qr.assignedTo === null || qr.assignedTo === '') ? 'success' :
                          qr.assignedTo ? 'warning' : 'info'
                        }
                        className="mb-2"
                      >
                        {(!qr.assignedTo || qr.assignedTo === null || qr.assignedTo === '') ? 'UNASSIGNED' : 'ASSIGNED'}
                      </Badge>

                      {qr.assignedTo && qr.assignedTo !== null && qr.assignedTo !== '' && (
                        <div className="mb-2">
                          <small className="text-muted">Assigned to:</small><br/>
                          <strong>{qr.assignedTo}</strong>
                        </div>
                      )}

                      <div className="mb-2">
                        <small className="text-muted">Purpose:</small><br/>
                        <strong>{qr.purpose || 'GPS Tracking Device'}</strong>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">Description:</small><br/>
                        <strong>{qr.description || 'No description'}</strong>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">
                          Created: {qr.createdAt ? new Date(qr.createdAt).toLocaleDateString() : 'Unknown'}<br/>
                          Status: {qr.status || 'active'}
                        </small>
                      </div>

                      {/* Actions */}
                      <div className="d-grid gap-1">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => {
                            // Copy QR code to clipboard
                            navigator.clipboard.writeText(qr.deviceId || qr.qrId);
                            Swal.fire({
                              icon: 'success',
                              title: 'Copied!',
                              text: 'QR code copied to clipboard',
                              timer: 1500,
                              showConfirmButton: false
                            });
                          }}
                        >
                          📋 Copy Code
                        </Button>

                        {(!qr.assignedTo || qr.assignedTo === null || qr.assignedTo === '') ? (
                          <div className="text-center">
                            <Badge bg="success" style={{ fontSize: '0.7rem', padding: '0.3rem' }}>
                              ✅ Available for Sending
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Badge bg="warning" style={{ fontSize: '0.7rem', padding: '0.3rem' }}>
                              👤 Assigned to User
                            </Badge>
                          </div>
                        )}
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
            <div className="d-flex gap-2">
              <Button
                variant="outline-danger"
                onClick={async () => {
                  try {
                    const result = await Swal.fire({
                      icon: 'warning',
                      title: 'Delete Unassigned QR Codes?',
                      html: `
                        <div style="text-align: left; margin: 20px 0;">
                          <p><strong>⚠️ This will delete:</strong></p>
                          <ul style="text-align: left;">
                            <li>All QR codes not assigned to any user</li>
                            <li>QR codes that haven't been registered yet</li>
                            <li>QR codes in "Send QR Codes" dropdown</li>
                          </ul>
                          <hr>
                          <p><strong>✅ This will keep:</strong></p>
                          <ul style="text-align: left;">
                            <li>QR codes already assigned to users</li>
                            <li>QR codes that appear in QR Management</li>
                            <li>All user registration data</li>
                          </ul>
                        </div>
                      `,
                      showCancelButton: true,
                      confirmButtonColor: '#dc3545',
                      cancelButtonColor: '#6c757d',
                      confirmButtonText: '🗑️ Delete Unassigned',
                      cancelButtonText: '❌ Cancel'
                    });

                    if (!result.isConfirmed) return;

                    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');

                    const response = await fetch('http://localhost:5001/api/devices/admin/delete-unassigned-qr', {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });

                    const data = await response.json();

                    if (data.success) {
                      Swal.fire({
                        icon: 'success',
                        title: 'Cleanup Complete!',
                        text: `Deleted ${data.deletedCount} unassigned QR codes`,
                        confirmButtonColor: '#28a745'
                      });

                      // Refresh the data
                      loadAdminQRCodes();
                    } else {
                      Swal.fire({
                        icon: 'error',
                        title: 'Cleanup Failed',
                        text: data.message || 'Failed to delete unassigned QR codes',
                        confirmButtonColor: '#dc3545'
                      });
                    }

                  } catch (error) {
                    console.error('Delete unassigned QR codes error:', error);
                    Swal.fire({
                      icon: 'error',
                      title: 'Error During Cleanup',
                      text: error.message || 'An unexpected error occurred',
                      confirmButtonColor: '#dc3545'
                    });
                  }
                }}
                disabled={allDevices.length === 0}
              >
                🗑️ Clean Unassigned QR Codes
              </Button>
            </div>

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

      {/* Real-Time GPS Path Tracker Modal - DISABLED: Using inline map instead */}
      {/* Map now shows directly in Add Device section - no popup needed */}

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
            <Modal.Title>🗺️ Real-Time GPS Path Tracking</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 0, height: '70vh' }}>
            {qrScanLocationData && trackedDeviceId ? (
              <RealTimePathMap
                deviceData={{
                  deviceId: trackedDeviceId,
                  deviceName: qrScanLocationData.deviceName || 'Unknown Device',
                  location: {
                    latitude: qrScanLocationData.latitude || 0,
                    longitude: qrScanLocationData.longitude || 0
                  },
                  path: [],
                  isRealTime: true
                }}
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
            <Modal.Title>🗺️ Real-Time GPS Path Tracking</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 0, height: '70vh' }}>
            <RealTimePathMap
              deviceData={{
                deviceId: trackedDeviceId,
                deviceName: qrScanLocationData.deviceName || 'Unknown Device',
                location: {
                  latitude: qrScanLocationData.latitude || 0,
                  longitude: qrScanLocationData.longitude || 0
                },
                path: [],
                isRealTime: true
              }}
              onClose={() => setShowQRToPostmanTracker(false)}
            />
          </Modal.Body>
        </Modal>
      )}



      {/* 📱 Device Form Modal */}
      <Modal show={showDeviceFormModal} onHide={() => setShowDeviceFormModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>📝 Device Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success" className="mb-4">
            <div className="d-flex align-items-center">
              <div style={{ fontSize: '1.5rem', marginRight: '10px' }}>✅</div>
              <div>
                <strong>Device Code Detected!</strong>
                <br />
                <small>Please provide additional information about this device</small>
              </div>
            </div>
          </Alert>

          {/* Show detected/entered code */}
          <div className="mb-4">
            <Form.Group>
              <Form.Label>📱 Device Code</Form.Label>
              <Form.Control
                type="text"
                value={deviceUploadMethod === 'manual' ? manualDeviceCode : scannedDeviceCode}
                onChange={
                  deviceUploadMethod === 'manual' ?
                    (e) => setManualDeviceCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20)) :
                    deviceUploadMethod === 'upload' && !scannedDeviceCode ?
                      (e) => setScannedDeviceCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20)) :
                      undefined
                }
                placeholder="Enter QR code (e.g., QR16427534761560)"
                maxLength={20}
                disabled={deviceUploadMethod === 'scan' || (deviceUploadMethod === 'upload' && scannedDeviceCode)}
              />
              <Form.Text className="text-muted">
                {deviceUploadMethod === 'manual' ?
                  'Enter the QR code provided by your admin (letters and numbers allowed)' :
                  deviceUploadMethod === 'upload' && !scannedDeviceCode ?
                    '⚠️ QR code could not be read from image. Please enter the code manually above.' :
                    'Code detected from QR scan/upload'
                }
              </Form.Text>
            </Form.Group>
          </div>

          {/* Device Details */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>📝 Device Description *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Office Laptop, Company Car"
                  value={deviceDescription}
                  onChange={(e) => setDeviceDescription(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Give a clear name for this device
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>🎯 Purpose *</Form.Label>
                <Form.Select
                  value={devicePurpose}
                  onChange={(e) => setDevicePurpose(e.target.value)}
                >
                  <option value="">Select Purpose</option>
                  <option value="Asset Tracking">Asset Tracking</option>
                  <option value="Vehicle Monitoring">Vehicle Monitoring</option>
                  <option value="Equipment Management">Equipment Management</option>
                  <option value="Personal Device">Personal Device</option>
                  <option value="Security Monitoring">Security Monitoring</option>
                  <option value="Other">Other</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  What will this device be used for?
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Upload method info */}
          <div className="mb-3">
            <small className="text-muted">
              <strong>Upload Method:</strong>
              <Badge bg={deviceUploadMethod === 'scan' ? 'primary' : deviceUploadMethod === 'upload' ? 'success' : 'warning'} className="ms-2">
                {deviceUploadMethod === 'scan' ? '📷 QR Scan' :
                 deviceUploadMethod === 'upload' ? '📤 QR Upload' : '⌨️ Manual Entry'}
              </Badge>
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeviceFormModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDeviceFormSubmit}
            disabled={
              (deviceUploadMethod === 'manual' && manualDeviceCode.length < 10) ||
              (deviceUploadMethod !== 'manual' && !scannedDeviceCode) ||
              !deviceDescription || !devicePurpose
            }
            style={{ backgroundColor: '#4a148c', borderColor: '#4a148c' }}
          >
            💾 Save Device
          </Button>
        </Modal.Footer>
      </Modal>

      {/* QR Scanner Modal - Available globally */}
      <Modal
        show={showQRScanner}
        onHide={handleCloseScanner}
        size="lg"
        centered
        onShow={() => {
          console.log('📱 QR Scanner modal is now showing');
        }}
      >
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
                  <li>Allow camera access when prompted by your browser</li>
                  <li>Hold your mobile device with the QR code in front of the camera</li>
                  <li>Make sure the QR code is well-lit and clearly visible</li>
                  <li>Keep the QR code steady within the camera frame</li>
                  <li>Wait for the scanner to detect and process the QR code</li>
                </ol>
              </div>
            </div>
          </Alert>

          {!navigator.mediaDevices && (
            <Alert variant="warning" className="mb-3">
              <strong>⚠️ Camera Not Available:</strong> Your browser doesn't support camera access.
              Please use a modern browser like Chrome, Firefox, or Safari.
            </Alert>
          )}

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
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">📷 Camera Scanner</h6>
            </Card.Header>
            <Card.Body style={{ padding: '1rem' }}>
              <div
                id="qr-reader"
                style={{
                  width: '100%',
                  minHeight: '350px'
                }}
              ></div>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseScanner}>
            Close Scanner
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default WelcomePage;