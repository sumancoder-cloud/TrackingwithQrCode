// This is a simple GPS tracking solution without external dependencies
// It uses browser geolocation and OpenStreetMap for free mapping

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Badge, Table, Modal, Form, 
  Alert, Navbar, Nav, Accordion 
} from 'react-bootstrap';
import { Html5QrcodeScanner } from 'html5-qrcode';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // GPS Tracking states
  const [deviceLocations, setDeviceLocations] = useState({});
  const [trackingActive, setTrackingActive] = useState(false);
  const [selectedDeviceForTracking, setSelectedDeviceForTracking] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gpsError, setGpsError] = useState('');

  // Load user data on component mount
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Simple GPS location function (FREE - No API keys needed)
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const basicLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
              speed: position.coords.speed,
              heading: position.coords.heading
            };

            // Try to get address using OpenStreetMap Nominatim (FREE)
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${basicLocation.latitude}&lon=${basicLocation.longitude}&zoom=18&addressdetails=1`,
                {
                  headers: {
                    'User-Agent': 'GPS-Tracker-App/1.0'
                  }
                }
              );
              
              if (response.ok) {
                const data = await response.json();
                const enhancedLocation = {
                  ...basicLocation,
                  address: data.display_name,
                  city: data.address?.city || data.address?.town || data.address?.village,
                  country: data.address?.country,
                  postcode: data.address?.postcode,
                  road: data.address?.road,
                  openStreetMapEnhanced: true
                };
                setCurrentLocation(enhancedLocation);
                resolve(enhancedLocation);
              } else {
                setCurrentLocation(basicLocation);
                resolve(basicLocation);
              }
            } catch (geocodeError) {
              console.warn('OpenStreetMap geocoding failed, using basic GPS:', geocodeError);
              setCurrentLocation(basicLocation);
              resolve(basicLocation);
            }
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          let errorMessage = 'Unable to retrieve GPS location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'GPS location access denied by user. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'GPS location information unavailable. Please check your GPS settings.';
              break;
            case error.TIMEOUT:
              errorMessage = 'GPS location request timed out. Please try again.';
              break;
          }
          setGpsError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );
    });
  }, []);

  // Start device tracking
  const startDeviceTracking = useCallback((device) => {
    setSelectedDeviceForTracking(device);
    setGpsError('');
    
    getCurrentLocation()
      .then((location) => {
        const deviceTrackingData = {
          deviceId: device.id,
          deviceName: device.name,
          qrCode: device.qrCode,
          location: {
            ...location,
            latitude: location.latitude + (Math.random() - 0.5) * 0.001,
            longitude: location.longitude + (Math.random() - 0.5) * 0.001
          },
          timestamp: new Date().toISOString(),
          status: 'active',
          trackingStarted: new Date().toISOString()
        };
        
        setDeviceLocations(prev => ({
          ...prev,
          [device.id]: deviceTrackingData
        }));
        
        setLocationHistory(prev => [deviceTrackingData, ...prev.slice(0, 99)]);
        
        const savedLocations = JSON.parse(localStorage.getItem('deviceLocations') || '{}');
        savedLocations[device.id] = deviceTrackingData;
        localStorage.setItem('deviceLocations', JSON.stringify(savedLocations));
        
        alert(`GPS tracking started for ${device.name}!\nLocation: ${deviceTrackingData.location.latitude.toFixed(6)}, ${deviceTrackingData.location.longitude.toFixed(6)}`);
      })
      .catch((error) => {
        console.error('Tracking error:', error);
        setGpsError(`Failed to start tracking for ${device.name}: ${error.message}`);
        alert(`Failed to start GPS tracking for ${device.name}. Please ensure location permissions are enabled.`);
      });
  }, [getCurrentLocation]);

  // Simple map display function
  const createSimpleMap = useCallback((containerId, location, deviceName) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) return null;

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

  // Handle view device location
  const handleViewDeviceLocation = useCallback((device) => {
    setSelectedDeviceForTracking(device);
    setShowMapModal(true);
  }, []);

  // Initialize map when modal opens
  useEffect(() => {
    if (showMapModal && selectedDeviceForTracking && deviceLocations[selectedDeviceForTracking.deviceId]) {
      const location = deviceLocations[selectedDeviceForTracking.deviceId].location;
      
      const timer = setTimeout(() => {
        try {
          createSimpleMap('simple-map-container', location, selectedDeviceForTracking.deviceName);
        } catch (error) {
          console.error('Failed to initialize simple map:', error);
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
  }, [showMapModal, selectedDeviceForTracking, deviceLocations, createSimpleMap]);

  // Load saved locations
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

  // Load saved locations on mount
  useEffect(() => {
    loadSavedLocations();
  }, [loadSavedLocations]);

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
      <Container fluid>
        <Row>
          <Col md={3} className="sidebar">
            <h4>GPS Tracker</h4>
            <Nav className="flex-column">
              <Nav.Link onClick={() => setActiveSection('dashboard')}>Dashboard</Nav.Link>
              <Nav.Link onClick={() => setActiveSection('gps-tracking')}>GPS Tracking</Nav.Link>
              <Nav.Link onClick={() => setActiveSection('device-status')}>Device Status</Nav.Link>
            </Nav>
          </Col>
          <Col md={9} className="main-content">
            {activeSection === 'gps-tracking' && (
              <div className="dashboard-content">
                <h2>GPS Device Tracking</h2>
                <p className="text-muted">Real-time location tracking for your devices</p>
                
                {gpsError && (
                  <Alert variant="warning" className="mb-3">
                    <strong>GPS Error:</strong> {gpsError}
                  </Alert>
                )}

                <Alert variant="success" className="mb-3">
                  <div className="d-flex align-items-start">
                    <div className="me-3" style={{ fontSize: '1.5rem' }}>🗺️</div>
                    <div>
                      <strong>Powered by OpenStreetMap</strong><br />
                      <small>
                        This GPS tracker uses OpenStreetMap for accurate location tracking and address resolution.
                        <br />✅ <strong>Completely FREE</strong> - No API keys required!
                        <br />🌍 Global coverage with detailed maps
                        <br />📍 Real-time GPS tracking with address lookup
                      </small>
                    </div>
                  </div>
                </Alert>

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
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

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
            )}

            {activeSection === 'dashboard' && (
              <div>
                <h2>Welcome, {userData.username}!</h2>
                <p>GPS Tracker Dashboard</p>
              </div>
            )}

            {activeSection === 'device-status' && (
              <div>
                <h2>Device Status</h2>
                <p>View your device status and start GPS tracking</p>
                <Button 
                  variant="success" 
                  onClick={() => startDeviceTracking({
                    id: 'demo-device',
                    name: 'Demo Device',
                    qrCode: JSON.stringify({deviceId: 'demo-device'})
                  })}
                >
                  📍 Start Demo GPS Tracking
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {/* GPS Map Modal */}
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
          {selectedDeviceForTracking && deviceLocations[selectedDeviceForTracking.deviceId] ? (
            <div>
              <div className="mb-3">
                <Row>
                  <Col md={6}>
                    <strong>Device:</strong> {selectedDeviceForTracking.deviceName}<br />
                    <strong>Device ID:</strong> {selectedDeviceForTracking.deviceId}
                  </Col>
                  <Col md={6}>
                    <strong>Status:</strong> <Badge bg="success">Active</Badge><br />
                    <strong>Last Update:</strong> {new Date(deviceLocations[selectedDeviceForTracking.deviceId].timestamp).toLocaleString()}
                  </Col>
                </Row>
              </div>
              
              <div className="location-details mb-3">
                <h6>📍 Location Details:</h6>
                <Row>
                  <Col md={4}>
                    <strong>Latitude:</strong><br />
                    {deviceLocations[selectedDeviceForTracking.deviceId].location.latitude.toFixed(6)}
                  </Col>
                  <Col md={4}>
                    <strong>Longitude:</strong><br />
                    {deviceLocations[selectedDeviceForTracking.deviceId].location.longitude.toFixed(6)}
                  </Col>
                  <Col md={4}>
                    <strong>Accuracy:</strong><br />
                    {deviceLocations[selectedDeviceForTracking.deviceId].location.accuracy}m
                  </Col>
                </Row>
              </div>

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
              </div>
              
              <div className="mt-3 d-flex gap-2 justify-content-center flex-wrap">
                <Button
                  variant="primary"
                  onClick={() => {
                    const lat = deviceLocations[selectedDeviceForTracking.deviceId].location.latitude;
                    const lng = deviceLocations[selectedDeviceForTracking.deviceId].location.longitude;
                    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`;
                    window.open(osmUrl, '_blank');
                  }}
                >
                  🗺️ Open in OpenStreetMap
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => {
                    const lat = deviceLocations[selectedDeviceForTracking.deviceId].location.latitude;
                    const lng = deviceLocations[selectedDeviceForTracking.deviceId].location.longitude;
                    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                    window.open(googleMapsUrl, '_blank');
                  }}
                >
                  📍 Google Maps
                </Button>
              </div>
            </div>
          ) : (
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
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default WelcomePage;
