import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Alert, Badge, Row, Col } from 'react-bootstrap';

const QRToPostmanPathTracker = ({ deviceId, deviceName, qrScanLocation, onClose }) => {
  const [postmanLocation, setPostmanLocation] = useState(null);
  const [pathVisible, setPathVisible] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [distance, setDistance] = useState(0);
  const [mapError, setMapError] = useState(null);
  const [isValidData, setIsValidData] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const scanMarkerRef = useRef(null);
  const postmanMarkerRef = useRef(null);
  const pathLineRef = useRef(null);

  // Check data validity on mount
  useEffect(() => {
    if (!deviceId || !qrScanLocation) {
      setIsValidData(false);
    } else {
      setIsValidData(true);
    }
  }, [deviceId, qrScanLocation]);

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Initialize map with error handling
  useEffect(() => {
    if (!isValidData || !qrScanLocation || !mapRef.current) {
      console.log('⚠️ QRToPostmanPathTracker: Missing required data');
      return;
    }

    const initMap = () => {
      try {
        if (typeof window === 'undefined' || typeof window.L === 'undefined') {
          console.error('❌ Leaflet library not loaded or window not available');
          return;
        }

        if (!mapRef.current) {
          console.error('❌ Map container not available');
          return;
        }

        if (!qrScanLocation || !qrScanLocation.latitude || !qrScanLocation.longitude) {
          console.error('❌ Invalid QR scan location data');
          return;
        }

        const L = window.L;

        // Create map centered on QR scan location
        const map = L.map(mapRef.current).setView(
          [qrScanLocation.latitude, qrScanLocation.longitude],
          15
        );

        // Add map tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add QR scan location marker (GREEN - starting point)
        const scanMarker = L.marker([qrScanLocation.latitude, qrScanLocation.longitude], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background-color: #28a745; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📱</div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map).bindPopup(
          `📱 QR Scan Location<br/>` +
          `📍 ${qrScanLocation.latitude.toFixed(6)}, ${qrScanLocation.longitude.toFixed(6)}<br/>` +
          `⏰ Scanned: ${new Date(qrScanLocation.timestamp).toLocaleTimeString()}<br/>` +
          `🎯 Device: ${deviceName}`
        );

        // Initialize red path line (hidden initially)
        const pathLine = L.polyline([], {
          color: '#FF0000',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 5',
          lineCap: 'round'
        }).addTo(map);

        mapInstanceRef.current = map;
        scanMarkerRef.current = scanMarker;
        pathLineRef.current = pathLine;

        console.log('🗺️ QR-to-Postman path tracker initialized');
      } catch (error) {
        console.error('❌ Map initialization failed:', error);
      }
    };

    // Load Leaflet if not available
    if (typeof window.L === 'undefined') {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);

      const leafletJS = document.createElement('script');
      leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletJS.onload = () => setTimeout(initMap, 100);
      document.head.appendChild(leafletJS);
    } else {
      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [qrScanLocation, deviceName, isValidData]);

  // Start/Stop tracking function
  const handleStartTracking = () => {
    if (isTracking) {
      setIsTracking(false);
      setPostmanLocation(null);
      setLastUpdate(null);
      setDistance(0);
      console.log('🛑 Tracking stopped');
    } else {
      setIsTracking(true);
      console.log('🚀 Tracking started');
    }
  };

  // Poll for Postman updates with error handling
  useEffect(() => {
    if (!isValidData || !deviceId || !qrScanLocation || !isTracking) {
      console.log('⚠️ Missing deviceId, qrScanLocation, or tracking not started');
      return;
    }

    const checkForPostmanUpdates = async () => {
      try {
        console.log('🔍 DEBUG: Checking for updates with deviceId:', deviceId);
        console.log('🔍 DEBUG: deviceId type:', typeof deviceId);

        // Extract actual device ID - robust extraction
        let actualDeviceId = deviceId;

        console.log('🔍 Raw deviceId input:', JSON.stringify(deviceId));

        if (typeof deviceId === 'string') {
          // Check if it's a JSON string
          if (deviceId.startsWith('{')) {
            try {
              const parsed = JSON.parse(deviceId);
              if (parsed.deviceId) {
                actualDeviceId = parsed.deviceId;
                console.log('🔧 Extracted deviceId from JSON string:', actualDeviceId);
              }
            } catch (e) {
              // If parsing fails, try to extract manually with regex
              const match = deviceId.match(/"deviceId"\s*:\s*"([^"]+)"/);
              if (match) {
                actualDeviceId = match[1];
                console.log('🔧 Extracted deviceId with regex:', actualDeviceId);
              } else {
                // Try to find any QR followed by numbers
                const qrMatch = deviceId.match(/QR\d+/);
                if (qrMatch) {
                  actualDeviceId = qrMatch[0];
                  console.log('🔧 Found QR code pattern:', actualDeviceId);
                } else {
                  actualDeviceId = deviceId;
                  console.log('⚠️ Could not extract deviceId, using as-is:', actualDeviceId);
                }
              }
            }
          } else {
            // Clean string, use as-is
            actualDeviceId = deviceId;
            console.log('✅ Using clean string deviceId:', actualDeviceId);
          }
        } else if (typeof deviceId === 'object' && deviceId.deviceId) {
          actualDeviceId = deviceId.deviceId;
          console.log('🔧 Extracted deviceId from object:', actualDeviceId);
        }

        // Final validation - ensure it's a clean string
        if (typeof actualDeviceId === 'string' && actualDeviceId.includes('{')) {
          const qrMatch = actualDeviceId.match(/QR\d+/);
          if (qrMatch) {
            actualDeviceId = qrMatch[0];
            console.log('🔧 Final cleanup - extracted QR pattern:', actualDeviceId);
          }
        }

        const apiUrl = `http://localhost:5001/api/gps/device/${actualDeviceId}`;
        console.log('📡 API URL:', apiUrl);

        const response = await fetch(apiUrl);
        console.log('📡 API Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('📊 API Response data:', data);

          // Try different response structures
          let serverLocation = null;
          if (data.data && data.data.device) {
            serverLocation = data.data.device;
          } else if (data.device) {
            serverLocation = data.device;
          } else if (data.data) {
            serverLocation = data.data;
          } else {
            serverLocation = data;
          }

          console.log('📍 Extracted server location:', serverLocation);

          if (serverLocation && serverLocation.latitude && serverLocation.longitude) {
            const newPostmanLocation = {
              latitude: parseFloat(serverLocation.latitude),
              longitude: parseFloat(serverLocation.longitude),
              timestamp: serverLocation.timestamp || new Date().toISOString(),
              speed: serverLocation.speed || 0,
              updatedVia: serverLocation.updatedVia || 'Postman'
            };

            console.log('🎯 New Postman location received:', newPostmanLocation);

            // Always update (remove the change check to force updates)
            setPostmanLocation(newPostmanLocation);
            setLastUpdate(new Date());

            // Calculate distance from QR scan location
            const dist = calculateDistance(
              qrScanLocation.latitude, qrScanLocation.longitude,
              newPostmanLocation.latitude, newPostmanLocation.longitude
            );
            setDistance(dist);
            console.log('📏 Distance calculated:', dist.toFixed(2), 'km');

            // Force map update
            updateMapWithPostmanLocation(newPostmanLocation);

            console.log('✅ Map updated with new Postman coordinates!');
            console.log('📍 QR Scan Location:', qrScanLocation.latitude, qrScanLocation.longitude);
            console.log('🎯 Postman Location:', newPostmanLocation.latitude, newPostmanLocation.longitude);
          } else {
            console.log('⚠️ No valid location data in server response');
          }
        } else {
          console.log('❌ API request failed:', response.status, response.statusText);
          if (response.status === 404) {
            console.log('💡 Device not found. Make sure to send Postman updates to create the device first.');
          }
        }
      } catch (error) {
        console.error('❌ Error checking Postman updates:', error);
      }
    };

    // Check immediately and then every 2 seconds for faster updates
    checkForPostmanUpdates();
    const interval = setInterval(checkForPostmanUpdates, 2000);

    return () => clearInterval(interval);
  }, [deviceId, qrScanLocation, postmanLocation, isValidData, isTracking]);

  // Update map with Postman location
  const updateMapWithPostmanLocation = (newLocation) => {
    console.log('🗺️ updateMapWithPostmanLocation called with:', newLocation);

    if (!mapInstanceRef.current) {
      console.log('❌ No map instance available');
      return;
    }

    if (typeof window.L === 'undefined') {
      console.log('❌ Leaflet not available');
      return;
    }

    const L = window.L;
    console.log('✅ Map and Leaflet available, updating...');

    try {
      // Remove existing Postman marker
      if (postmanMarkerRef.current) {
        mapInstanceRef.current.removeLayer(postmanMarkerRef.current);
      }

      // Add new Postman location marker (RED - destination point)
      const postmanMarker = L.marker([newLocation.latitude, newLocation.longitude], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: '<div style="background-color: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎯</div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(mapInstanceRef.current).bindPopup(
        `🎯 Postman Updated Location<br/>` +
        `📍 ${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}<br/>` +
        `⏰ Updated: ${new Date(newLocation.timestamp).toLocaleTimeString()}<br/>` +
        `🚀 Speed: ${newLocation.speed} km/h<br/>` +
        `📡 Via: ${newLocation.updatedVia}`
      );

      postmanMarkerRef.current = postmanMarker;

      // Update red path line connecting QR scan to Postman location
      if (pathLineRef.current && pathVisible) {
        const pathCoords = [
          [qrScanLocation.latitude, qrScanLocation.longitude],
          [newLocation.latitude, newLocation.longitude]
        ];
        console.log('🔴 Updating red path line with coordinates:', pathCoords);
        pathLineRef.current.setLatLngs(pathCoords);
        console.log('✅ Red path line updated successfully');
      } else {
        console.log('⚠️ Path line not available or not visible:', {
          pathLineExists: !!pathLineRef.current,
          pathVisible: pathVisible
        });
      }

      // Fit map to show both points
      const group = L.featureGroup([scanMarkerRef.current, postmanMarker]);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));

    } catch (error) {
      console.error('❌ Error updating map with Postman location:', error);
    }
  };

  // Render error states
  if (!isValidData) {
    return (
      <Alert variant="warning">
        <h6>⚠️ Missing Required Data</h6>
        <p>Device ID or QR scan location data is missing. Please scan a QR code first.</p>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </Alert>
    );
  }

  if (mapError) {
    return (
      <Alert variant="danger">
        <h6>❌ Map Error</h6>
        <p>{mapError}</p>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </Alert>
    );
  }

  try {
    return (
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">🗺️ QR Scan → Postman Path Tracking</h5>
            <small className="text-muted">
              Device: {deviceName || 'Unknown'} | Distance: {distance.toFixed(2)} km
            </small>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={onClose}>
            ✕ Close
          </Button>
        </Card.Header>
      
      <Card.Body style={{ padding: 0 }}>
        <Alert variant="info" className="m-2 mb-0">
          <Row>
            <Col md={6}>
              <div className="d-flex align-items-center">
                <span style={{color: '#28a745', fontSize: '18px', marginRight: '8px'}}>📱</span>
                <div>
                  <strong>QR Scan Location:</strong><br/>
                  <small>{qrScanLocation.latitude.toFixed(6)}, {qrScanLocation.longitude.toFixed(6)}</small>
                </div>
              </div>
            </Col>
            <Col md={6}>
              {postmanLocation ? (
                <div className="d-flex align-items-center">
                  <span style={{color: '#dc3545', fontSize: '18px', marginRight: '8px'}}>🎯</span>
                  <div>
                    <strong>Current Location:</strong><br/>
                    <small>{postmanLocation.latitude.toFixed(6)}, {postmanLocation.longitude.toFixed(6)}</small>
                  </div>
                </div>
              ) : (
                <div className="text-muted">
                  <strong>{isTracking ? 'Waiting for location updates...' : 'Ready to track'}</strong><br/>
                  <small>{isTracking ? 'Send coordinates via Postman API' : 'Click Start Tracking to begin'}</small>
                </div>
              )}
            </Col>
          </Row>
        </Alert>

        {/* Start Tracking Button */}
        <div className="m-2">
          <Button
            variant={isTracking ? "danger" : "success"}
            size="lg"
            onClick={handleStartTracking}
            className="w-100"
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '12px'
            }}
          >
            {isTracking ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                🛑 Stop Tracking
              </>
            ) : (
              <>
                🚀 Start Tracking
              </>
            )}
          </Button>
          {isTracking && (
            <small className="text-muted d-block text-center mt-2">
              📡 Checking for location updates every 2 seconds...
            </small>
          )}
        </div>

        {postmanLocation && isTracking && (
          <Alert variant="success" className="m-2 mb-0">
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              <div>
                <strong>🔴 LIVE TRACKING:</strong> Red path shows QR scan → Current location
                {lastUpdate && (
                  <div>
                    <Badge bg="secondary" className="ms-2">
                      Last Update: {lastUpdate.toLocaleTimeString()}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        <div 
          ref={mapRef} 
          style={{ 
            height: '400px', 
            width: '100%',
            border: '1px solid #ddd'
          }}
        />
      </Card.Body>
    </Card>
  );
  } catch (renderError) {
    console.error('❌ QRToPostmanPathTracker render error:', renderError);
    return (
      <Alert variant="danger">
        <h6>❌ Component Error</h6>
        <p>Failed to render QR-to-Postman path tracker. Please try again.</p>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </Alert>
    );
  }
};

export default QRToPostmanPathTracker;
