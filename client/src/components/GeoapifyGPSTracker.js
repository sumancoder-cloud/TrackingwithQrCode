import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Card, Row, Col, Alert, Badge } from 'react-bootstrap';

const GeoapifyGPSTracker = ({ show, onHide, device, onLocationUpdate }) => {
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
  const [mapLayer, setMapLayer] = useState('osm'); // 'osm', 'satellite', 'terrain'

  const watchIdRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentLayerRef = useRef(null);

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

  // Get map layer configuration
  const getMapLayer = useCallback((layerType) => {
    const layers = {
      osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        name: 'OpenStreetMap'
      },
      satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri, Maxar, Earthstar Geographics',
        maxZoom: 18,
        name: 'Satellite'
      },
      terrain: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenTopoMap contributors',
        maxZoom: 17,
        name: 'Terrain'
      },
      cartodb: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '© CARTO, © OpenStreetMap contributors',
        maxZoom: 19,
        name: 'CartoDB Voyager'
      }
    };
    return layers[layerType] || layers.osm;
  }, []);

  // Initialize map with detailed layers
  const initializeMap = useCallback((lat, lng) => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Create map using Leaflet
      const L = window.L;
      if (!L) {
        console.error('Leaflet not loaded');
        setError('Map library not available');
        return;
      }

      // Initialize map with higher zoom for better detail
      const map = L.map(mapRef.current).setView([lat, lng], 17);

      // Add initial layer
      const layerConfig = getMapLayer(mapLayer);
      const tileLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      currentLayerRef.current = tileLayer;

      // Add custom marker with better styling
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: #ff4757;
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="transform: rotate(45deg); color: white; font-size: 16px;">📍</div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Enhanced popup with more information
      marker.bindPopup(`
        <div style="min-width: 200px; font-family: Arial, sans-serif;">
          <div style="background: #007bff; color: white; padding: 8px; margin: -10px -10px 10px -10px; border-radius: 5px 5px 0 0;">
            <strong>📱 ${device?.name || 'GPS Device'}</strong>
          </div>
          <div style="padding: 5px 0;">
            <strong>📍 Location:</strong><br/>
            Lat: ${lat.toFixed(6)}<br/>
            Lng: ${lng.toFixed(6)}
          </div>
          <div style="padding: 5px 0;">
            <strong>🎯 Accuracy:</strong> ±${gpsAccuracy?.toFixed(0) || '?'}m
          </div>
          <div style="padding: 5px 0;">
            <strong>🕒 Time:</strong> ${new Date().toLocaleTimeString()}
          </div>
          <div style="padding: 5px 0;">
            <strong>🗺️ Map:</strong> ${layerConfig.name}
          </div>
        </div>
      `).openPopup();

      // Add scale control
      L.control.scale().addTo(map);

      mapInstanceRef.current = { map, marker, layer: tileLayer };
      console.log('✅ Enhanced map initialized successfully with', layerConfig.name);
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      setError('Failed to initialize map');
    }
  }, [device, gpsAccuracy, mapLayer, getMapLayer]);

  // Change map layer
  const changeMapLayer = useCallback((newLayerType) => {
    if (!mapInstanceRef.current) return;

    try {
      const { map } = mapInstanceRef.current;
      const layerConfig = getMapLayer(newLayerType);

      // Remove current layer
      if (currentLayerRef.current) {
        map.removeLayer(currentLayerRef.current);
      }

      // Add new layer
      const newLayer = window.L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      currentLayerRef.current = newLayer;
      setMapLayer(newLayerType);

      console.log('🗺️ Map layer changed to:', layerConfig.name);
    } catch (error) {
      console.error('❌ Error changing map layer:', error);
    }
  }, [getMapLayer]);

  // Update map with new location
  const updateMap = useCallback((lat, lng) => {
    if (!mapInstanceRef.current) return;

    try {
      const { map, marker } = mapInstanceRef.current;
      
      // Update marker position
      marker.setLatLng([lat, lng]);
      
      // Update popup content
      marker.bindPopup(`
        <div>
          <strong>📱 ${device?.name || 'Device'}</strong><br/>
          📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}<br/>
          🎯 ±${gpsAccuracy?.toFixed(0) || '?'}m accuracy<br/>
          🏃 ${formatSpeed(currentSpeed * 3.6)}<br/>
          🕒 ${new Date().toLocaleTimeString()}
        </div>
      `);
      
      // Center map on new location
      map.setView([lat, lng], 16);
      
      console.log('📍 Map updated with new location');
    } catch (error) {
      console.error('❌ Error updating map:', error);
    }
  }, [device, gpsAccuracy, currentSpeed]);

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

        // Initialize map with first location
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

            // Update map
            updateMap(newLocation.latitude, newLocation.longitude);

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
  }, [calculateDistance, trackingStartTime, onLocationUpdate, initializeMap, updateMap]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stopTracking]);

  // Load Leaflet CSS and JS
  useEffect(() => {
    if (!window.L) {
      // Add Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Add Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        console.log('✅ Leaflet loaded successfully');
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          🗺️ Enhanced GPS Tracker with Street Maps - {device?.name || 'Device'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Row>
          <Col md={8}>
            {/* Geoapify Map Container */}
            <Card className="mb-3">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <h6 className="mb-0">🗺️ Live GPS Map with Street Details</h6>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    {/* Map Layer Buttons */}
                    <div className="btn-group btn-group-sm">
                      <Button
                        variant={mapLayer === 'osm' ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => changeMapLayer('osm')}
                        title="OpenStreetMap - Detailed street names and city information"
                      >
                        🗺️ Streets
                      </Button>
                      <Button
                        variant={mapLayer === 'satellite' ? 'success' : 'outline-success'}
                        size="sm"
                        onClick={() => changeMapLayer('satellite')}
                        title="Satellite imagery"
                      >
                        🛰️ Satellite
                      </Button>
                      <Button
                        variant={mapLayer === 'terrain' ? 'warning' : 'outline-warning'}
                        size="sm"
                        onClick={() => changeMapLayer('terrain')}
                        title="Terrain and topographic map"
                      >
                        🏔️ Terrain
                      </Button>
                      <Button
                        variant={mapLayer === 'cartodb' ? 'info' : 'outline-info'}
                        size="sm"
                        onClick={() => changeMapLayer('cartodb')}
                        title="CartoDB Voyager - Clean and modern style"
                      >
                        🎨 Modern
                      </Button>
                    </div>
                    {gpsAccuracy && (
                      <Badge bg={gpsAccuracy < 10 ? 'success' : gpsAccuracy < 50 ? 'warning' : 'danger'}>
                        ±{gpsAccuracy.toFixed(0)}m accuracy
                      </Badge>
                    )}
                  </div>
                </div>
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                <div 
                  ref={mapRef} 
                  style={{ 
                    height: '450px', 
                    width: '100%',
                    borderRadius: '0 0 8px 8px'
                  }}
                >
                  {!currentLocation && (
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
                        <h5>Geoapify GPS Map Ready</h5>
                        <p className="text-muted">Start tracking to see your location on the map</p>
                        <small>Fast and reliable mapping with Geoapify</small>
                      </div>
                    </div>
                  )}
                </div>
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
              🗺️ Enhanced Maps with Street Details
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

export default GeoapifyGPSTracker;
