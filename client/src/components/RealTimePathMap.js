import React, { useEffect, useRef, useState } from 'react';
import { Card, Button, Badge, Alert } from 'react-bootstrap';

const RealTimePathMap = ({ deviceData, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const pathRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pathPoints, setPathPoints] = useState([]);

  // Initialize map
  useEffect(() => {
    if (!deviceData || !deviceData.location) {
      console.log('⚠️ RealTimePathMap: Missing device data or location');
      return;
    }

    const initMap = () => {
      try {
        // Check if Leaflet is available
        if (typeof window.L === 'undefined') {
          console.error('❌ Leaflet library not loaded');
          return;
        }

        // Check if map container exists
        if (!mapRef.current) {
          console.error('❌ Map container not found');
          return;
        }

        // Check if device data is valid
        if (!deviceData.location || !deviceData.location.latitude || !deviceData.location.longitude) {
          console.error('❌ Invalid device location data');
          return;
        }

        const L = window.L;

        // Create simple map using OpenStreetMap (free)
        const map = L.map(mapRef.current).setView(
          [deviceData.location.latitude, deviceData.location.longitude],
          16
        );

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add initial marker
        const marker = L.marker([deviceData.location.latitude, deviceData.location.longitude])
          .addTo(map)
          .bindPopup(`📱 ${deviceData.deviceName || 'GPS Device'}<br/>📍 Current Location`);

        // 🔴 Initialize RED path polyline for movement tracking
        const pathLine = L.polyline([], {
          color: '#FF0000',        // Bright red color
          weight: 4,               // Thicker line for visibility
          opacity: 0.9,            // High opacity
          dashArray: '5, 5',       // Dashed line for movement effect
          lineCap: 'round',        // Rounded line caps
          lineJoin: 'round'        // Rounded line joins
        }).addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;
        pathRef.current = pathLine;
        setMapLoaded(true);

        console.log('🗺️ Real-time path map initialized successfully');
      } catch (error) {
        console.error('❌ Map initialization failed:', error);
        // Set an error state or show fallback UI
      }
    };

    // Load Leaflet if not already loaded
    if (typeof window.L === 'undefined') {
      console.log('📦 Loading Leaflet library...');

      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);

      const leafletJS = document.createElement('script');
      leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletJS.onload = () => {
        console.log('✅ Leaflet library loaded');
        setTimeout(initMap, 100); // Small delay to ensure L is available
      };
      leafletJS.onerror = () => {
        console.error('❌ Failed to load Leaflet library');
      };
      document.head.appendChild(leafletJS);
    } else {
      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [deviceData]);

  // Update map when device location changes
  useEffect(() => {
    if (!mapLoaded || !deviceData || !deviceData.location || typeof window.L === 'undefined') return;

    const updateMapPosition = () => {
      const { latitude, longitude } = deviceData.location;
      const newPoint = [latitude, longitude];

      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng(newPoint);
      }

      // Update path
      if (pathRef.current && deviceData.path) {
        const pathCoords = deviceData.path.map(point => [point.latitude, point.longitude]);
        pathRef.current.setLatLngs(pathCoords);
        setPathPoints(pathCoords);
      }

      // Center map on current location
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(newPoint, 16);
      }

      console.log('🗺️ Map updated with new position:', latitude, longitude);
    };

    updateMapPosition();
  }, [deviceData, mapLoaded]);

  // Monitor real-time updates
  useEffect(() => {
    if (!deviceData?.deviceId) return;

    const trackingKey = `realtime_tracking_${deviceData.deviceId}`;
    
    const checkForUpdates = async () => {
      try {
        // Check localStorage for local updates
        const storedPath = JSON.parse(localStorage.getItem(trackingKey) || '[]');

        // 🔥 ENHANCED: Also check server for Postman updates
        let serverPath = [];
        try {
          const response = await fetch(`http://localhost:5001/api/gps/path/${deviceData.deviceId}`);
          if (response.ok) {
            const serverData = await response.json();
            // Fix: Extract pathPoints from server response
            serverPath = Array.isArray(serverData.data?.pathPoints) ? serverData.data.pathPoints : [];
            console.log('🔍 Server path points:', serverPath.length, 'Local path points:', storedPath.length);
          }
        } catch (serverError) {
          console.log('⚠️ Server check failed, using local data:', serverError.message);
        }

        // Use server data if available and newer, otherwise use local data
        const pathToUse = serverPath.length > 0 ? serverPath : storedPath;

        if (pathToUse.length > pathPoints.length || serverPath.length > 0) {
          console.log('📍 New path points detected:', pathToUse.length, 'Previous:', pathPoints.length);
          const newPathCoords = pathToUse.map(point => [
            point.latitude || 0,
            point.longitude || 0
          ]).filter(coord => coord[0] !== 0 && coord[1] !== 0);

          if (newPathCoords.length > 0) {
            setPathPoints(newPathCoords);
            console.log('🗺️ Updated path coordinates:', newPathCoords.length, 'points');
          }

          // 🔴 Update RED path on map
          if (pathRef.current && newPathCoords.length > 0) {
            pathRef.current.setLatLngs(newPathCoords);
            console.log('🔴 RED path updated with', newPathCoords.length, 'points');
          }

          // Move marker to latest position
          if (markerRef.current && pathToUse.length > 0) {
            const latest = pathToUse[pathToUse.length - 1];
            if (latest && latest.latitude && latest.longitude) {
              const latestPoint = [latest.latitude, latest.longitude];
              markerRef.current.setLatLng(latestPoint);

              // 📍 Update marker popup with latest info
              const timestamp = latest.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : 'Unknown';
              markerRef.current.setPopupContent(
                `📱 ${deviceData.deviceName || 'GPS Device'}<br/>` +
                `📍 ${latest.latitude.toFixed(6)}, ${latest.longitude.toFixed(6)}<br/>` +
                `⏰ ${timestamp}<br/>` +
                `🚀 Speed: ${latest.speed || 0} km/h<br/>` +
                `🎯 Updated via: ${serverPath.length > 0 ? 'Postman/API' : 'Local GPS'}`
              );

              // Center map on latest position
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView(latestPoint, 16);
              }

              console.log('📍 Marker moved to:', latest.latitude, latest.longitude);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error checking for updates:', error);
      }
    };

    // 🔥 Check for updates every 2 seconds (optimized for Postman testing)
    checkForUpdates(); // Check immediately
    const interval = setInterval(checkForUpdates, 2000);
    
    return () => clearInterval(interval);
  }, [deviceData?.deviceId, pathPoints.length]);

  return (
    <Card className="h-100">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">🗺️ Real-Time Path Tracking</h5>
          <small className="text-muted">
            Device: {deviceData?.deviceName} | Path Points: {pathPoints.length}
          </small>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          ✕ Close
        </Button>
      </Card.Header>
      <Card.Body style={{ padding: 0 }}>
        {deviceData?.isRealTime && (
          <Alert variant="success" className="m-2 mb-0">
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              <strong>🔴 LIVE:</strong> Real-time tracking active
            </div>
          </Alert>
        )}
        
        <div 
          ref={mapRef} 
          style={{ 
            height: '400px', 
            width: '100%',
            backgroundColor: '#f0f0f0'
          }}
        >
          {!mapLoaded && (
            <div className="d-flex align-items-center justify-content-center h-100">
              <div className="text-center">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div>Loading map...</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-2 bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Badge bg="primary" className="me-2">
                📍 {pathPoints.length} Points
              </Badge>
              {deviceData?.location && (
                <small className="text-muted">
                  Latest: {deviceData.location.latitude.toFixed(6)}, {deviceData.location.longitude.toFixed(6)}
                </small>
              )}
            </div>
            <div>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => {
                  if (mapInstanceRef.current && deviceData?.location) {
                    mapInstanceRef.current.setView(
                      [deviceData.location.latitude, deviceData.location.longitude], 
                      18
                    );
                  }
                }}
              >
                🎯 Center
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default RealTimePathMap;
