import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Card, Row, Col, Alert, Badge } from 'react-bootstrap';

const MapboxGPSTracker = ({ show, onHide, device, onLocationUpdate }) => {
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
  const [mapInstance, setMapInstance] = useState(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);

  const watchIdRef = useRef(null);
  const mapContainerRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Load Mapbox GL JS
  useEffect(() => {
    if (window.mapboxgl) {
      setMapboxLoaded(true);
      return;
    }

    // Load Mapbox CSS
    const cssLink = document.createElement('link');
    cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    cssLink.rel = 'stylesheet';
    document.head.appendChild(cssLink);

    // Load Mapbox JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;
    script.onload = () => {
      console.log('Mapbox GL JS loaded successfully');
      // Set access token (using public demo token)
      window.mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
      setMapboxLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load Mapbox GL JS library');
    };
    document.head.appendChild(script);
  }, []);

  // Initialize Mapbox map
  const initializeMap = useCallback((lat, lng) => {
    if (!window.mapboxgl || !mapContainerRef.current || !mapboxLoaded) {
      console.log('Mapbox not ready yet');
      return;
    }

    try {
      // Clear existing map
      if (mapInstance) {
        mapInstance.remove();
      }

      // Create new map
      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellite view with streets
        center: [lng, lat], // Note: Mapbox uses [lng, lat] format
        zoom: 18,
        pitch: 0,
        bearing: 0
      });

      // Add navigation controls
      map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      // Add geolocate control
      map.addControl(
        new window.mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );

      // Add fullscreen control
      map.addControl(new window.mapboxgl.FullscreenControl(), 'top-right');

      // Wait for map to load
      map.on('load', () => {
        console.log('Mapbox map loaded successfully');

        // Add current location marker
        const marker = new window.mapboxgl.Marker({
          color: '#4285F4',
          scale: 1.2
        })
        .setLngLat([lng, lat])
        .addTo(map);

        // Add popup with device info
        const popup = new window.mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        })
        .setLngLat([lng, lat])
        .setHTML(`
          <div style="padding: 10px; font-family: Arial, sans-serif;">
            <h6 style="margin: 0 0 8px 0; color: #333;">📱 ${device?.name || 'Device'}</h6>
            <p style="margin: 0; font-size: 12px; color: #666;">
              📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
              🎯 Accuracy: ±${gpsAccuracy?.toFixed(0) || '?'}m<br>
              🕒 ${new Date().toLocaleTimeString()}
            </p>
          </div>
        `)
        .addTo(map);

        // Store marker reference
        map.currentMarker = marker;
        map.currentPopup = popup;
      });

      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Map loading error. Please try again.');
      });

      setMapInstance(map);
      return map;
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      setError(`Failed to initialize map: ${error.message}`);
      return null;
    }
  }, [device, gpsAccuracy, mapboxLoaded]);

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

        // Initialize map with current location
        initializeMap(location.latitude, location.longitude);

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

            // Update map marker position
            if (mapInstance && mapInstance.currentMarker) {
              mapInstance.currentMarker.setLngLat([newLocation.longitude, newLocation.latitude]);
              mapInstance.flyTo({
                center: [newLocation.longitude, newLocation.latitude],
                zoom: 18,
                speed: 1.2
              });

              // Update popup content
              if (mapInstance.currentPopup) {
                mapInstance.currentPopup.setHTML(`
                  <div style="padding: 10px; font-family: Arial, sans-serif;">
                    <h6 style="margin: 0 0 8px 0; color: #333;">📱 ${device?.name || 'Device'}</h6>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                      📍 ${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}<br>
                      🎯 Accuracy: ±${newLocation.accuracy?.toFixed(0) || '?'}m<br>
                      🏃 Speed: ${((newLocation.speed || 0) * 3.6).toFixed(1)} km/h<br>
                      🕒 ${new Date().toLocaleTimeString()}
                    </p>
                  </div>
                `);
              }
            }

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
  }, [calculateDistance, trackingStartTime, onLocationUpdate, initializeMap, mapInstance, device]);

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
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [stopTracking, mapInstance]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          🗺️ Mapbox GPS Tracker - {device?.name || 'Device'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Row>
          <Col md={8}>
            {/* Mapbox Container */}
            <Card className="mb-3">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">🛰️ Mapbox Satellite - Real-time GPS</h6>
                  <div>
                    {gpsAccuracy && (
                      <Badge bg={gpsAccuracy < 10 ? 'success' : gpsAccuracy < 50 ? 'warning' : 'danger'}>
                        ±{gpsAccuracy.toFixed(0)}m accuracy
                      </Badge>
                    )}
                  </div>
                </div>
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                {!mapboxLoaded ? (
                  <div style={{ 
                    height: '450px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '0 0 8px 8px'
                  }}>
                    <div className="text-center">
                      <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <h5>Loading Mapbox...</h5>
                      <p className="text-muted">Initializing satellite maps</p>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={mapContainerRef}
                    style={{
                      height: '450px',
                      width: '100%',
                      borderRadius: '0 0 8px 8px'
                    }}
                  />
                )}
              </Card.Body>
            </Card>
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
              🛰️ Mapbox Satellite
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

export default MapboxGPSTracker;
