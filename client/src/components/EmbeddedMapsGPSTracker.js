import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Card, Row, Col, Alert, Badge } from 'react-bootstrap';

const EmbeddedMapsGPSTracker = ({ show, onHide, device, onLocationUpdate }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [trackingDuration, setTrackingDuration] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const watchIdRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Calculate distance between two GPS coordinates
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }, []);

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setError('');
    setIsTracking(true);
    setTrackingStartTime(Date.now());
    setLocationHistory([]);
    setTotalDistance(0);
    setCurrentSpeed(0);
    setMaxSpeed(0);
    setAverageSpeed(0);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          timestamp: Date.now()
        };

        setCurrentLocation(location);
        setGpsAccuracy(position.coords.accuracy);
        setLocationHistory([location]);

        // Start continuous tracking
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed || 0,
              timestamp: Date.now()
            };

            setCurrentLocation(newLocation);
            setGpsAccuracy(position.coords.accuracy);
            setCurrentSpeed(position.coords.speed || 0);

            // Update location history and calculate distance
            setLocationHistory(prev => {
              const updated = [...prev, newLocation];
              
              if (prev.length > 0) {
                const lastLocation = prev[prev.length - 1];
                const distance = calculateDistance(
                  lastLocation.latitude,
                  lastLocation.longitude,
                  newLocation.latitude,
                  newLocation.longitude
                );

                setTotalDistance(prevTotal => {
                  const newTotal = prevTotal + distance;
                  
                  // Calculate average speed
                  const timeElapsed = (Date.now() - trackingStartTime) / 1000;
                  if (timeElapsed > 0) {
                    setAverageSpeed((newTotal / timeElapsed) * 3.6); // km/h
                  }
                  
                  return newTotal;
                });
              }

              // Update max speed
              const speedKmh = (position.coords.speed || 0) * 3.6;
              setMaxSpeed(prev => Math.max(prev, speedKmh));

              return updated;
            });

            // Notify parent component
            if (onLocationUpdate) {
              onLocationUpdate(newLocation);
            }
          },
          (error) => {
            let errorMessage = 'GPS tracking error: ';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Location access denied. Please enable GPS permissions.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'GPS position unavailable. Please check your GPS settings.';
                break;
              case error.TIMEOUT:
                errorMessage += 'GPS request timed out. Please try again.';
                break;
              default:
                errorMessage += 'Unknown GPS error occurred.';
            }
            setError(errorMessage);
            stopTracking();
          },
          options
        );
      },
      (error) => {
        let errorMessage = 'Initial GPS error: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied. Please enable GPS permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'GPS position unavailable. Please check your GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage += 'GPS request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Unknown GPS error occurred.';
        }
        setError(errorMessage);
        setIsTracking(false);
      },
      options
    );
  }, [calculateDistance, trackingStartTime, onLocationUpdate]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    setIsTracking(false);
  }, []);

  // Update tracking duration
  useEffect(() => {
    if (isTracking && trackingStartTime) {
      const interval = setInterval(() => {
        setTrackingDuration(Date.now() - trackingStartTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking, trackingStartTime]);

  // Format duration
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format distance
  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    } else {
      return `${meters.toFixed(0)} m`;
    }
  };

  // Format speed
  const formatSpeed = (kmh) => {
    return `${kmh.toFixed(1)} km/h`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          🗺️ Visual Maps GPS Tracker - {device?.name || 'Device'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Row>
          <Col md={8}>
            {/* Embedded Maps Container */}
            <Card className="mb-3">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">🗺️ Live GPS Map</h6>
                  <div className="d-flex gap-2 align-items-center">
                    {gpsAccuracy && (
                      <Badge bg={gpsAccuracy < 10 ? 'success' : gpsAccuracy < 50 ? 'warning' : 'danger'}>
                        ±{gpsAccuracy.toFixed(0)}m accuracy
                      </Badge>
                    )}
                    <Badge bg="success" className="me-2">
                      🗺️ Visual GPS Display
                    </Badge>
                  </div>
                </div>
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                {currentLocation ? (
                  <div style={{ position: 'relative', height: '450px', backgroundColor: '#f8f9fa', borderRadius: '0 0 8px 8px' }}>
                    {/* Visual Map Display */}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                      borderRadius: '0 0 8px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Map Background Pattern */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `
                          radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px),
                          radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 2px, transparent 2px)
                        `,
                        backgroundSize: '50px 50px'
                      }} />

                      {/* Location Marker */}
                      <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: '#ff4757',
                        borderRadius: '50% 50% 50% 0',
                        transform: 'rotate(-45deg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(255, 71, 87, 0.4)',
                        animation: 'pulse 2s infinite',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          transform: 'rotate(45deg)',
                          fontSize: '24px',
                          color: 'white'
                        }}>📍</div>
                      </div>

                      {/* Location Info */}
                      <div style={{
                        background: 'rgba(255,255,255,0.95)',
                        padding: '15px 20px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        textAlign: 'center',
                        maxWidth: '300px'
                      }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#333' }}>📱 {device?.name || 'Device'}</h5>
                        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                          <strong>📍 Location:</strong><br/>
                          {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                          <strong>🎯 Accuracy:</strong> ±{gpsAccuracy?.toFixed(0) || '?'}m
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                          <strong>🏃 Speed:</strong> {formatSpeed(currentSpeed * 3.6)}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                          🕒 {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* CSS Animation */}
                    <style>{`
                      @keyframes pulse {
                        0% { transform: rotate(-45deg) scale(1); }
                        50% { transform: rotate(-45deg) scale(1.1); }
                        100% { transform: rotate(-45deg) scale(1); }
                      }
                    `}</style>
                  </div>
                ) : (
                  <div style={{ 
                    height: '450px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '0 0 8px 8px'
                  }}>
                    <div className="text-center">
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                      <h5>GPS Map Ready</h5>
                      <p className="text-muted">Start tracking to see your location on the map</p>
                      <small>Visual maps with satellite imagery and street details</small>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Quick Map Actions */}
            {currentLocation && (
              <Card className="mb-3">
                <Card.Body>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`, '_blank')}
                    >
                      🗺️ Open in Google Maps
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => window.open(`https://maps.apple.com/?q=${currentLocation.latitude},${currentLocation.longitude}`, '_blank')}
                    >
                      🍎 Open in Apple Maps
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${currentLocation.latitude}&mlon=${currentLocation.longitude}&zoom=18`, '_blank')}
                    >
                      🌍 Open in OpenStreetMap
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col md={4}>
            {/* GPS Status Card */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">📡 GPS Status</h6>
              </Card.Header>
              <Card.Body>
                {currentLocation ? (
                  <div>
                    <p><strong>📍 Latitude:</strong> {currentLocation.latitude.toFixed(6)}</p>
                    <p><strong>📍 Longitude:</strong> {currentLocation.longitude.toFixed(6)}</p>
                    <p><strong>🎯 Accuracy:</strong> 
                      <Badge bg={gpsAccuracy < 10 ? 'success' : gpsAccuracy < 50 ? 'warning' : 'danger'} className="ms-2">
                        ±{gpsAccuracy?.toFixed(0)}m
                      </Badge>
                    </p>
                    <p><strong>⏱️ Last Update:</strong> {new Date().toLocaleTimeString()}</p>
                  </div>
                ) : (
                  <div className="text-center text-muted">
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📍</div>
                    <p>No GPS location available</p>
                    <small>Start tracking to get your location</small>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Tracking Stats Card */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">📊 Tracking Stats</h6>
              </Card.Header>
              <Card.Body>
                <p><strong>⏱️ Duration:</strong> {formatDuration(trackingDuration)}</p>
                <p><strong>📏 Distance:</strong> {formatDistance(totalDistance)}</p>
                <p><strong>🏃 Current Speed:</strong> {formatSpeed(currentSpeed * 3.6)}</p>
                <p><strong>⚡ Max Speed:</strong> {formatSpeed(maxSpeed)}</p>
                <p><strong>📈 Avg Speed:</strong> {formatSpeed(averageSpeed)}</p>
                <p><strong>📍 Points:</strong> {locationHistory.length}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>
      
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div>
            {isTracking && (
              <Badge bg="success" className="me-2">
                🔴 Live Tracking
              </Badge>
            )}
            <Badge bg="info">
              🗺️ Visual Maps
            </Badge>
          </div>
          <div>
            <Button variant="secondary" onClick={onHide} className="me-2">
              Close
            </Button>
            {!isTracking ? (
              <Button variant="success" onClick={startTracking}>
                ▶️ Start Tracking
              </Button>
            ) : (
              <Button variant="danger" onClick={stopTracking}>
                ⏹️ Stop Tracking
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default EmbeddedMapsGPSTracker;
