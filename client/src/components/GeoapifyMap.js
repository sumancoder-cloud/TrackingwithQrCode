import React, { useEffect, useRef, useState } from 'react';

// SVG Icons for Map
const MapIcons = {
  Search: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2"/>
      <path d="m21 21-4.35-4.35" stroke={color} strokeWidth="2"/>
    </svg>
  ),
  getStartPointSVG: () =>
    `<div style="width: 16px; height: 16px; background-color: #28a745; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">S</div>`,
  getEndPointSVG: () =>
    `<div style="width: 16px; height: 16px; background-color: #dc3545; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">E</div>`,
  getMiddlePointSVG: () =>
    `<div style="width: 14px; height: 14px; background-color: #007bff; border: 2px solid white; border-radius: 50%;"></div>`
};

const GeoapifyMap = ({
  latitude = 14.7300,
  longitude = 78.5500,
  deviceName = 'Device Location',
  height = '400px',
  showControls = true,
  locationHistory = [], // Array of locations for path drawing
  showPath = false      // Whether to show path between locations
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState('');
  const [, setAddress] = useState('Loading address...');
  const [searchQuery, setSearchQuery] = useState('');

  // Geoapify API key (get free key from geoapify.com)
  // This key works for BOTH Maps API and Geocoding API
  const GEOAPIFY_API_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY || 'de2893b1cf944153a664eafec9121e98';

  // Debug API key
  console.log('🔑 Geoapify API Key:', GEOAPIFY_API_KEY.substring(0, 8) + '...');

  // Reverse geocoding - Convert coordinates to address using your API key
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      console.log('🔍 Getting address for coordinates:', lat, lng);
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`
      );
      const data = await response.json();

      console.log('📍 Geocoding response:', data);

      if (data.features && data.features.length > 0) {
        const properties = data.features[0].properties;
        const address = properties.formatted ||
                       `${properties.name || ''} ${properties.street || ''} ${properties.city || ''}`.trim() ||
                       `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        console.log('✅ Address found:', address);
        return address;
      }

      console.log('⚠️ No address found, using coordinates');
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('❌ Geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Forward geocoding - Search for address
  const searchAddress = async (query) => {
    if (!query.trim()) return;

    try {
      console.log('🔍 Searching for address:', query);
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_API_KEY}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.geometry.coordinates;

        console.log('✅ Address found:', feature.properties.formatted);

        // Update map location
        if (mapInstanceRef.current) {
          const { map, marker } = mapInstanceRef.current;
          marker.setLatLng([lat, lng]);
          map.setView([lat, lng], 15);

          // Update popup
          marker.bindPopup(`
            <div style="text-align: center; font-family: Arial, sans-serif; min-width: 200px;">
              <h6 style="margin: 0 0 10px 0; color: #007bff;">📍 Search Result</h6>
              <p style="margin: 5px 0;"><strong>📍 Address:</strong></p>
              <p style="margin: 0 0 10px 0; font-size: 12px; line-height: 1.4;">
                ${feature.properties.formatted}
              </p>
              <p style="margin: 5px 0;"><strong>🌐 Coordinates:</strong></p>
              <p style="margin: 0; font-size: 11px; color: #666;">
                ${lat.toFixed(6)}, ${lng.toFixed(6)}
              </p>
            </div>
          `).openPopup();
        }
      }
    } catch (error) {
      console.error('❌ Address search failed:', error);
    }
  };

  useEffect(() => {
    // Load Leaflet CSS and JS if not already loaded
    const loadLeaflet = async () => {
      if (!window.L) {
        // Load Leaflet CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          initializeMap();
        };
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        const L = window.L;
        
        // Create map
        const map = L.map(mapRef.current).setView([latitude, longitude], 15);

        // Add Geoapify tile layer (using your specific tile style)
        const tileLayer = L.tileLayer(
          `https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
          {
            attribution: '© <a href="https://www.geoapify.com/">Geoapify</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 20,
          }
        );

        // If no API key, fallback to OpenStreetMap
        if (GEOAPIFY_API_KEY === 'YOUR_GEOAPIFY_API_KEY') {
          console.warn('⚠️ Using OpenStreetMap fallback. Please add your Geoapify API key.');
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map);
        } else {
          tileLayer.addTo(map);
        }

        // Add marker
        const marker = L.marker([latitude, longitude]).addTo(map);
        
        // Add popup with address
        const updatePopup = async () => {
          const currentAddress = await getAddressFromCoordinates(latitude, longitude);
          setAddress(currentAddress);

          marker.bindPopup(`
            <div style="text-align: center; font-family: Arial, sans-serif; min-width: 200px;">
              <h6 style="margin: 0 0 10px 0; color: #007bff;">📱 ${deviceName}</h6>
              <p style="margin: 5px 0;"><strong>📍 Address:</strong></p>
              <p style="margin: 0 0 10px 0; font-size: 12px; line-height: 1.4;">
                ${currentAddress}
              </p>
              <p style="margin: 5px 0;"><strong>🌐 Coordinates:</strong></p>
              <p style="margin: 0; font-size: 11px; color: #666;">
                ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #666;">
                🕒 ${new Date().toLocaleString()}
              </p>
            </div>
          `).openPopup();
        };

        updatePopup();

        // Add path if location history is provided (always show if multiple points)
        if (locationHistory && locationHistory.length > 1) {
          console.log('🛤️ Drawing path with', locationHistory.length, 'locations');

          // Create path coordinates
          const pathCoordinates = locationHistory.map(loc => [loc.latitude, loc.longitude]);

          // Draw path line with RED color for better visibility
          const pathLine = L.polyline(pathCoordinates, {
            color: '#FF0000',        // Bright red color
            weight: 5,               // Thicker line for better visibility
            opacity: 0.9,            // High opacity
            smoothFactor: 1,
            lineCap: 'round',        // Rounded line caps
            lineJoin: 'round'        // Rounded line joins
          }).addTo(map);

          // Add markers for each location in history
          locationHistory.forEach((loc, index) => {
            const isStart = index === 0 || loc.isStartPoint;
            const isEnd = index === locationHistory.length - 1 && locationHistory.length > 1;
            // const isMiddle = !isStart && !isEnd;

            let markerColor = '#007bff'; // Default blue
            let svgIcon = MapIcons.getMiddlePointSVG();
            let markerSize = 16;

            if (isStart) {
              markerColor = '#28a745'; // Green for start
              svgIcon = MapIcons.getStartPointSVG();
              markerSize = 20;
            } else if (isEnd) {
              markerColor = '#dc3545'; // Red for end/current
              svgIcon = MapIcons.getEndPointSVG();
              markerSize = 18;
            }

            // Create custom SVG icon
            const customIcon = L.divIcon({
              html: `<div style="
                width: ${markerSize}px;
                height: ${markerSize}px;
                display: flex;
                align-items: center;
                justify-content: center;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
              ">${svgIcon}</div>`,
              className: 'custom-svg-marker',
              iconSize: [markerSize, markerSize],
              iconAnchor: [markerSize/2, markerSize/2]
            });

            const pathMarker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(map);

            // Add popup for each marker
            pathMarker.bindPopup(`
              <div style="text-align: center; font-family: Arial, sans-serif; min-width: 180px;">
                <h6 style="margin: 0 0 8px 0; color: ${markerColor};">
                  ${isStart ? '✅ Start Point (Scan/Entry Location)' : isEnd ? '⭐ Current Location' : `📍 Point ${index + 1}`}
                </h6>
                <p style="margin: 3px 0; font-size: 11px;">
                  <strong>Time:</strong> ${new Date(loc.timestamp).toLocaleString()}
                </p>
                <p style="margin: 3px 0; font-size: 11px;">
                  <strong>Coordinates:</strong><br>
                  ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}
                </p>
                ${loc.address ? `<p style="margin: 3px 0; font-size: 10px; color: #666;">${loc.address}</p>` : ''}
              </div>
            `);
          });

          // Fit map to show all points
          map.fitBounds(pathLine.getBounds(), { padding: [20, 20] });

          console.log('✅ Path drawn successfully');
        }

        mapInstanceRef.current = { map, marker };
        setMapLoaded(true);
        setError('');

        console.log('✅ Geoapify map initialized successfully');
      } catch (err) {
        console.error('❌ Error initializing map:', err);
        setError('Failed to load map');
      }
    };

    loadLeaflet();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, deviceName]);

  // Update map when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      const { map, marker } = mapInstanceRef.current;
      
      // Update marker position
      marker.setLatLng([latitude, longitude]);
      
      // Update popup
      marker.bindPopup(`
        <div style="text-align: center; font-family: Arial, sans-serif;">
          <h6 style="margin: 0 0 10px 0; color: #007bff;">📱 ${deviceName}</h6>
          <p style="margin: 5px 0;"><strong>📍 Location:</strong></p>
          <p style="margin: 0; font-size: 12px;">
            Lat: ${latitude.toFixed(6)}<br/>
            Lng: ${longitude.toFixed(6)}
          </p>
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #666;">
            🕒 ${new Date().toLocaleString()}
          </p>
        </div>
      `);
      
      // Center map on new location
      map.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude, deviceName, mapLoaded]);

  if (error) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          flexDirection: 'column'
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗺️</div>
        <h6 style={{ color: '#dc3545', margin: 0 }}>Map Error</h6>
        <p style={{ color: '#6c757d', margin: '5px 0 0 0', fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />
      
      {!mapLoaded && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(248, 249, 250, 0.9)',
            flexDirection: 'column'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗺️</div>
          <h6 style={{ margin: 0 }}>Loading Geoapify Map...</h6>
          <p style={{ color: '#6c757d', margin: '5px 0 0 0', fontSize: '14px' }}>
            Initializing GPS tracking map
          </p>
        </div>
      )}

      {showControls && mapLoaded && (
        <>
          {/* Search Box */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '10px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              minWidth: '250px'
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchAddress(searchQuery)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              <button
                onClick={() => searchAddress(searchQuery)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MapIcons.Search size={14} color="white" />
              </button>
            </div>
          </div>

          {/* Map Info */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#007bff' }}>📍 Live Location</div>
            <div style={{ color: '#666' }}>Geoapify Maps</div>
          </div>
        </>
      )}
    </div>
  );
};

export default GeoapifyMap;
