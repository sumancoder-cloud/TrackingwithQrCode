import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Alert, Card, Row, Col, Badge } from 'react-bootstrap';

const GoogleMapsGPSTracker = ({ show, onHide, device, onLocationUpdate }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPath, setLocationPath] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [trackingDuration, setTrackingDuration] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [error, setError] = useState('');
  
  const watchIdRef = useRef(null);
  const mapContainerRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Calculate distance between two GPS points (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Distance in meters
  }, []);

  // Initialize map with embedded Google Maps or alternative
  const initializeMap = useCallback((lat, lng) => {
    if (!mapContainerRef.current) return;

    // Clear existing content
    mapContainerRef.current.innerHTML = '';

    // Create embedded map using Google Maps (no API key required for basic embed)
    const mapHtml = `
      <div style="width: 100%; height: 100%; position: relative;">
        <iframe
          width="100%"
          height="100%"
          frameborder="0"
          style="border:0; border-radius: 8px;"
          src="https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dkmvnRAoKlNOKE&center=${lat},${lng}&zoom=18&maptype=satellite"
          allowfullscreen>
        </iframe>
        <div style="
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255,255,255,0.95);
          padding: 8px 12px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          font-size: 12px;
          font-weight: bold;
          color: #333;
        ">
          📱 ${device?.name || 'Device'}<br>
          📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
          🎯 ±${gpsAccuracy?.toFixed(0) || '?'}m accuracy
        </div>
      </div>
    `;

    mapContainerRef.current.innerHTML = mapHtml;
  }, [device, gpsAccuracy]);

  // Start real-time GPS tracking with enhanced accuracy
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setError('');
    setIsTracking(true);
    setTrackingStartTime(Date.now());
    setLocationPath([]);
    setTotalDistance(0);
    setAverageSpeed(0);
    setMaxSpeed(0);

    // Start duration timer
    durationIntervalRef.current = setInterval(() => {
      if (trackingStartTime) {
        setTrackingDuration(Date.now() - trackingStartTime);
      }
    }, 1000);

    // Enhanced GPS options for maximum accuracy
    const options = {
      enableHighAccuracy: true,    // Force GPS instead of network location
      timeout: 20000,              // Longer timeout for better GPS lock
      maximumAge: 0                // Always get fresh location data
    };

    // Get initial position with high accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const initialLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading,
          timestamp: Date.now()
        };

        setCurrentLocation(initialLocation);
        setGpsAccuracy(position.coords.accuracy);
        setLocationPath([initialLocation]);

        // Initialize map with initial location
        initializeMap(initialLocation.latitude, initialLocation.longitude);

        // Start continuous tracking
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            // Enhanced accuracy filtering
            if (position.coords.accuracy > 50) {
              console.log('GPS accuracy too low:', position.coords.accuracy + 'm');
              return; // Skip readings with poor accuracy
            }

            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed || 0,
              heading: position.coords.heading,
              timestamp: Date.now()
            };

            setCurrentLocation(newLocation);
            setGpsAccuracy(position.coords.accuracy);

            // Update path and calculate distance
            setLocationPath(prevPath => {
              const newPath = [...prevPath, newLocation];
              
              if (prevPath.length > 0) {
                const lastLocation = prevPath[prevPath.length - 1];
                const distance = calculateDistance(
                  lastLocation.latitude,
                  lastLocation.longitude,
                  newLocation.latitude,
                  newLocation.longitude
                );

                // Only add to distance if movement is significant (> 3 meters)
                if (distance > 3) {
                  setTotalDistance(prev => prev + distance);
                  
                  // Calculate speed
                  const timeDiff = (newLocation.timestamp - lastLocation.timestamp) / 1000; // seconds
                  const currentSpeed = distance / timeDiff; // m/s
                  
                  if (currentSpeed > maxSpeed) {
                    setMaxSpeed(currentSpeed);
                  }

                  // Update average speed
                  const totalTime = (newLocation.timestamp - trackingStartTime) / 1000;
                  if (totalTime > 0) {
                    setAverageSpeed(totalDistance / totalTime);
                  }
                }
              }

              return newPath;
            });

            // Update map with new location
            initializeMap(newLocation.latitude, newLocation.longitude);

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
  }, [calculateDistance, initializeMap, trackingStartTime, totalDistance, maxSpeed, onLocationUpdate]);

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

  // Format duration
  const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
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

  // Format speed
  const formatSpeed = (mps) => {
    const kmh = mps * 3.6;
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
          🌍 Google Maps GPS Tracker - {device?.name || 'Device'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Row>
          <Col md={8}>
            {/* Map Container */}
            <Card className="mb-3">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">🛰️ Satellite GPS Map</h6>
                  <div>
                    {gpsAccuracy && (
                      <Badge bg={gpsAccuracy < 10 ? 'success' : gpsAccuracy < 30 ? 'warning' : 'danger'}>
                        ±{gpsAccuracy.toFixed(0)}m accuracy
                      </Badge>
                    )}
                  </div>
                </div>
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                <div
                  ref={mapContainerRef}
                  style={{
                    height: '400px',
                    width: '100%',
                    borderRadius: '0 0 8px 8px',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {!currentLocation && (
                    <div className="text-center text-muted">
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                      <h5>Start tracking to view map</h5>
                      <p>High-accuracy GPS with Google Maps</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            {/* Tracking Controls */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">🚀 Tracking Controls</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  {!isTracking ? (
                    <Button
                      variant="success"
                      size="lg"
                      onClick={startTracking}
                    >
                      🚀 Start GPS Tracking
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="lg"
                      onClick={stopTracking}
                    >
                      ⏹️ Stop Tracking
                    </Button>
                  )}
                </div>
                
                {isTracking && (
                  <div className="mt-3">
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm text-success me-2" />
                      <small className="text-success">🛰️ High-Accuracy GPS Active</small>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Enhanced Statistics */}
            <Card>
              <Card.Header>
                <h6 className="mb-0">📊 Live Statistics</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <small className="text-muted">⏱️ Duration</small>
                  <div className="fw-bold text-primary">{formatDuration(trackingDuration)}</div>
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">📏 Total Distance</small>
                  <div className="fw-bold text-success">{(totalDistance / 1000).toFixed(3)} km</div>
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">🚗 Average Speed</small>
                  <div className="fw-bold text-info">{formatSpeed(averageSpeed)}</div>
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">⚡ Max Speed</small>
                  <div className="fw-bold text-warning">{formatSpeed(maxSpeed)}</div>
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">📍 GPS Points</small>
                  <div className="fw-bold">{locationPath.length}</div>
                </div>

                {currentLocation && (
                  <div>
                    <small className="text-muted">🌍 Current Position</small>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div><strong>Lat:</strong> {currentLocation.latitude.toFixed(6)}</div>
                      <div><strong>Lng:</strong> {currentLocation.longitude.toFixed(6)}</div>
                      <div><strong>Alt:</strong> {currentLocation.altitude?.toFixed(1) || 'N/A'}m</div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        {currentLocation && (
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={() => {
                const lat = currentLocation.latitude;
                const lng = currentLocation.longitude;
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
                window.open(googleMapsUrl, '_blank');
              }}
            >
              🗺️ Navigate Here
            </Button>
            <Button
              variant="outline-success"
              onClick={() => {
                const lat = currentLocation.latitude;
                const lng = currentLocation.longitude;
                const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
                window.open(wazeUrl, '_blank');
              }}
            >
              🚗 Open in Waze
            </Button>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default GoogleMapsGPSTracker;
