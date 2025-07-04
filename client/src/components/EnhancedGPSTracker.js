import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const EnhancedGPSTracker = ({ show, onHide, device, onLocationUpdate }) => {
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
  const [mapInstance, setMapInstance] = useState(null);
  const [pathPolyline, setPathPolyline] = useState(null);
  const [currentMarker, setCurrentMarker] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  
  const watchIdRef = useRef(null);
  const mapContainerRef = useRef(null);
  const durationIntervalRef = useRef(null);

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

  // Initialize Leaflet map with enhanced features
  const initializeMap = useCallback((lat, lng) => {
    if (!window.L || !mapContainerRef.current || !leafletLoaded) {
      console.log('Map initialization skipped - Leaflet not ready');
      return;
    }

    // Clear existing map
    if (mapInstance) {
      mapInstance.remove();
    }

    // Create new map with better tile layer
    const map = window.L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 18,
      zoomControl: true,
      attributionControl: true
    });

    // Use multiple high-quality tile layers
    const satelliteLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    });

    const streetLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO © OpenStreetMap contributors',
      maxZoom: 19
    });

    const topoLayer = window.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap contributors',
      maxZoom: 17
    });

    // Add satellite layer as default (more accurate for GPS tracking)
    satelliteLayer.addTo(map);

    // Layer control with better options
    const baseLayers = {
      "🛰️ Satellite": satelliteLayer,
      "🗺️ Street Map": streetLayer,
      "🏔️ Topographic": topoLayer
    };
    window.L.control.layers(baseLayers).addTo(map);

    // Custom device marker
    const deviceIcon = window.L.divIcon({
      html: `<div style="
        background: linear-gradient(45deg, #007bff, #0056b3);
        border: 3px solid white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      ">📱</div>`,
      className: 'custom-device-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Add current location marker
    const marker = window.L.marker([lat, lng], { icon: deviceIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center;">
          <strong>${device?.name || 'Device'}</strong><br>
          <small>Real-time GPS Tracking</small><br>
          <small>Lat: ${lat.toFixed(6)}</small><br>
          <small>Lng: ${lng.toFixed(6)}</small>
        </div>
      `);

    setMapInstance(map);
    setCurrentMarker(marker);

    return map;
  }, [device, mapInstance, leafletLoaded]);

  // Start real-time GPS tracking
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

    // Enhanced GPS tracking options for maximum accuracy
    const options = {
      enableHighAccuracy: true,    // Force GPS instead of network location
      timeout: 15000,              // Longer timeout for better GPS lock
      maximumAge: 0                // Always get fresh location data
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        // Validate GPS accuracy - only accept readings with good accuracy
        if (position.coords.accuracy > 100) {
          console.log('GPS accuracy too low:', position.coords.accuracy + 'm');
          return; // Skip this reading if accuracy is worse than 100m
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

            // Only add to distance if movement is significant (> 2 meters)
            if (distance > 2) {
              setTotalDistance(prev => prev + distance);
              
              // Calculate speed
              const timeDiff = (newLocation.timestamp - lastLocation.timestamp) / 1000; // seconds
              const currentSpeed = distance / timeDiff; // m/s
              
              if (currentSpeed > maxSpeed) {
                setMaxSpeed(currentSpeed);
              }

              // Update average speed
              const totalTime = (newLocation.timestamp - trackingStartTime) / 1000;
              setAverageSpeed(totalDistance / totalTime);
            }
          }

          return newPath;
        });

        // Update map
        if (mapInstance && currentMarker) {
          currentMarker.setLatLng([newLocation.latitude, newLocation.longitude]);
          mapInstance.setView([newLocation.latitude, newLocation.longitude], 18);
          
          // Update path polyline
          if (pathPolyline) {
            pathPolyline.remove();
          }
          
          if (locationPath.length > 1) {
            const pathCoords = locationPath.map(loc => [loc.latitude, loc.longitude]);
            const newPolyline = window.L.polyline(pathCoords, {
              color: '#007bff',
              weight: 4,
              opacity: 0.8
            }).addTo(mapInstance);
            setPathPolyline(newPolyline);
          }
        } else if (!mapInstance) {
          // Initialize map if not already done
          initializeMap(newLocation.latitude, newLocation.longitude);
        }

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
  }, [calculateDistance, initializeMap, mapInstance, currentMarker, pathPolyline, locationPath, trackingStartTime, totalDistance, maxSpeed, onLocationUpdate]);

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

  // Load Leaflet library with proper loading state
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      console.log('Leaflet loaded successfully');
      setLeafletLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Leaflet');
      setError('Failed to load map library. Please refresh the page.');
    };
    document.head.appendChild(script);
  }, []);

  // Initialize map when Leaflet is loaded and we have a location
  useEffect(() => {
    if (leafletLoaded && currentLocation && !mapInstance) {
      console.log('Initializing map with current location');
      initializeMap(currentLocation.latitude, currentLocation.longitude);
    }
  }, [leafletLoaded, currentLocation, mapInstance, initializeMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [stopTracking, mapInstance]);

  // Check if Google Maps API key is available
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const useGoogleMaps = googleMapsApiKey && googleMapsApiKey !== 'undefined';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey || 'dummy-key', // Provide fallback to prevent errors
    libraries: ['geometry']
  });

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          🌍 Enhanced GPS Tracker - {device?.name || 'Device'}
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
                  <h6 className="mb-0">Real-time GPS Map</h6>
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
                {useGoogleMaps && isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ height: '400px', width: '100%', borderRadius: '0 0 8px 8px' }}
                    center={currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : { lat: 0, lng: 0 }}
                    zoom={18}
                    options={{
                      mapTypeId: 'hybrid',
                      streetViewControl: false,
                      fullscreenControl: false
                    }}
                  >
                    {currentLocation && (
                      <Marker
                        position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
                        title="Current Location"
                      />
                    )}
                  </GoogleMap>
                ) : (
                  <div
                    ref={mapContainerRef}
                    style={{
                      height: '400px',
                      width: '100%',
                      borderRadius: '0 0 8px 8px',
                      backgroundColor: '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    {!leafletLoaded ? (
                      <div style={{ textAlign: 'center', color: '#6c757d' }}>
                        <div className="spinner-border text-primary mb-3" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <h5>Loading Map...</h5>
                        <p>Initializing OpenStreetMap</p>
                        <small>Please wait while we load the map library</small>
                      </div>
                    ) : !currentLocation ? (
                      <div style={{ textAlign: 'center', color: '#6c757d' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                        <h5>GPS Map Ready</h5>
                        <p>Start tracking to see your location</p>
                        <small>Using OpenStreetMap (Leaflet)</small>
                      </div>
                    ) : null}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            {/* Tracking Controls */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Tracking Controls</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  {!isTracking ? (
                    <Button
                      variant="success"
                      size="lg"
                      onClick={startTracking}
                    >
                      🚀 Start Tracking
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
                      <small className="text-success">Live GPS Tracking Active</small>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Tracking Statistics */}
            <Card>
              <Card.Header>
                <h6 className="mb-0">Tracking Statistics</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <small className="text-muted">Duration</small>
                  <div className="fw-bold">{formatDuration(trackingDuration)}</div>
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">Total Distance</small>
                  <div className="fw-bold">{(totalDistance / 1000).toFixed(2)} km</div>
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">Average Speed</small>
                  <div className="fw-bold">{formatSpeed(averageSpeed)}</div>
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">Max Speed</small>
                  <div className="fw-bold">{formatSpeed(maxSpeed)}</div>
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">Points Tracked</small>
                  <div className="fw-bold">{locationPath.length}</div>
                </div>

                {currentLocation && (
                  <div>
                    <small className="text-muted">Current Position</small>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div>Lat: {currentLocation.latitude.toFixed(6)}</div>
                      <div>Lng: {currentLocation.longitude.toFixed(6)}</div>
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
                const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=18`;
                window.open(googleMapsUrl, '_blank');
              }}
            >
              🗺️ Google Maps
            </Button>
            <Button
              variant="outline-info"
              onClick={() => {
                const lat = currentLocation.latitude;
                const lng = currentLocation.longitude;
                const appleMapsUrl = `https://maps.apple.com/?q=${lat},${lng}&z=18`;
                window.open(appleMapsUrl, '_blank');
              }}
            >
              🍎 Apple Maps
            </Button>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default EnhancedGPSTracker;