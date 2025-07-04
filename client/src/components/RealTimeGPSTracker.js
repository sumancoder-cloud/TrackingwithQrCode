import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Badge, Row, Col, Alert, Modal } from 'react-bootstrap';
import api from '../services/api';

const RealTimeGPSTracker = ({ deviceId, deviceName, onClose }) => {
  const [locations, setLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState('');
  const [pathVisible, setPathVisible] = useState(true);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const pathRef = useRef(null);
  const intervalRef = useRef(null);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Create map with dynamic center (will be updated when locations load)
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: { lat: 0, lng: 0 }, // Will be updated dynamically
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      mapInstanceRef.current = map;
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map. Please check your internet connection.');
    }
  }, []);

  // Load location history
  const loadLocationHistory = useCallback(async () => {
    try {
      const response = await api.get(`/locations/device/${deviceId}?limit=100`);
      if (response.success && response.locations) {
        setLocations(response.locations);
        if (response.locations.length > 0) {
          setCurrentLocation(response.locations[response.locations.length - 1]);
        }
        console.log(`Loaded ${response.locations.length} location points for device ${deviceName}`);
      }
    } catch (error) {
      console.error('Error loading location history:', error);
      setError('Failed to load location history');
    }
  }, [deviceId, deviceName]);

  // Update map with locations and path
  const updateMapDisplay = useCallback(() => {
    if (!mapInstanceRef.current || locations.length === 0) return;

    try {
      // Clear existing markers and path
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (pathRef.current) {
        pathRef.current.setMap(null);
      }

      const map = mapInstanceRef.current;
      const bounds = new window.google.maps.LatLngBounds();

      // Create path coordinates
      const pathCoordinates = locations.map(loc => ({
        lat: loc.location.latitude,
        lng: loc.location.longitude
      }));

      // Add path line
      if (pathVisible && pathCoordinates.length > 1) {
        pathRef.current = new window.google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 3
        });
        pathRef.current.setMap(map);
      }

      // Add markers for start, end, and intermediate points
      locations.forEach((location, index) => {
        const position = {
          lat: location.location.latitude,
          lng: location.location.longitude
        };

        let icon, title;
        if (index === 0) {
          // Start point
          icon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="#00FF00" stroke="#000" stroke-width="2"/>
                <text x="10" y="14" text-anchor="middle" font-size="10" fill="#000">S</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(20, 20)
          };
          title = `Start: ${deviceName}`;
        } else if (index === locations.length - 1) {
          // Current/End point
          icon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#FF0000" stroke="#000" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" font-size="10" fill="#FFF">📍</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24)
          };
          title = `Current: ${deviceName}`;
        } else {
          // Intermediate points
          icon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="6" r="4" fill="#0066FF" stroke="#000" stroke-width="1"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(12, 12)
          };
          title = `Point ${index + 1}`;
        }

        const marker = new window.google.maps.Marker({
          position,
          map,
          icon,
          title
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div>
              <h6>${title}</h6>
              <p><strong>Time:</strong> ${new Date(location.timestamp).toLocaleString()}</p>
              <p><strong>Coordinates:</strong> ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}</p>
              ${location.location.address ? `<p><strong>Address:</strong> ${location.location.address}</p>` : ''}
              ${location.location.accuracy ? `<p><strong>Accuracy:</strong> ${location.location.accuracy}m</p>` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
      });

      // Fit map to show all points
      if (locations.length > 1) {
        map.fitBounds(bounds);
      } else if (locations.length === 1) {
        map.setCenter({
          lat: locations[0].location.latitude,
          lng: locations[0].location.longitude
        });
        map.setZoom(16);
      }

    } catch (error) {
      console.error('Error updating map display:', error);
      setError('Failed to update map display');
    }
  }, [locations, pathVisible, deviceName]);

  // Start real-time tracking
  const startTracking = useCallback(() => {
    if (intervalRef.current) return;

    setIsTracking(true);
    console.log(`Starting real-time tracking for device: ${deviceName}`);

    // Refresh location data every 5 seconds
    intervalRef.current = setInterval(() => {
      loadLocationHistory();
    }, 5000);
  }, [loadLocationHistory, deviceName]);

  // Stop real-time tracking
  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
    console.log(`Stopped real-time tracking for device: ${deviceName}`);
  }, [deviceName]);

  // Calculate total distance
  const calculateTotalDistance = useCallback(() => {
    if (locations.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1].location;
      const curr = locations[i].location;
      
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = (curr.latitude - prev.latitude) * Math.PI / 180;
      const dLng = (curr.longitude - prev.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      totalDistance += distance;
    }
    
    return totalDistance;
  }, [locations]);

  // Initialize map when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeMap]);

  // Load initial data
  useEffect(() => {
    loadLocationHistory();
  }, [loadLocationHistory]);

  // Update map when locations change
  useEffect(() => {
    updateMapDisplay();
  }, [updateMapDisplay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      if (mapInstanceRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
        if (pathRef.current) {
          pathRef.current.setMap(null);
        }
      }
    };
  }, [stopTracking]);

  const totalDistance = calculateTotalDistance();

  return (
    <Modal show={true} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>🗺️ Real-Time GPS Tracking - {deviceName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {/* Tracking Controls */}
        <Row className="mb-3">
          <Col md={6}>
            <div className="d-flex gap-2">
              <Button
                variant={isTracking ? "danger" : "success"}
                onClick={isTracking ? stopTracking : startTracking}
              >
                {isTracking ? "⏹️ Stop Tracking" : "▶️ Start Tracking"}
              </Button>
              <Button
                variant="outline-primary"
                onClick={loadLocationHistory}
              >
                🔄 Refresh
              </Button>
              <Button
                variant={pathVisible ? "warning" : "outline-warning"}
                onClick={() => setPathVisible(!pathVisible)}
              >
                {pathVisible ? "🚫 Hide Path" : "🛤️ Show Path"}
              </Button>
            </div>
          </Col>
          <Col md={6}>
            <div className="d-flex gap-3 justify-content-end">
              <Badge bg="info" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                📍 Points: {locations.length}
              </Badge>
              <Badge bg="success" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                📏 Distance: {totalDistance.toFixed(2)} km
              </Badge>
              {isTracking && (
                <Badge bg="danger" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                  🔴 LIVE
                </Badge>
              )}
            </div>
          </Col>
        </Row>

        {/* Map Container */}
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '500px',
            border: '2px solid #dee2e6',
            borderRadius: '8px'
          }}
        />

        {/* Current Location Info */}
        {currentLocation && (
          <Card className="mt-3">
            <Card.Body>
              <h6>📍 Current Location</h6>
              <Row>
                <Col md={6}>
                  <p><strong>Coordinates:</strong> {currentLocation.location.latitude.toFixed(6)}, {currentLocation.location.longitude.toFixed(6)}</p>
                  <p><strong>Last Update:</strong> {new Date(currentLocation.timestamp).toLocaleString()}</p>
                </Col>
                <Col md={6}>
                  {currentLocation.location.address && (
                    <p><strong>Address:</strong> {currentLocation.location.address}</p>
                  )}
                  {currentLocation.location.accuracy && (
                    <p><strong>Accuracy:</strong> {currentLocation.location.accuracy}m</p>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default RealTimeGPSTracker;
