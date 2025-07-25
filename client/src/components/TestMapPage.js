import React, { useState } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import GeoapifyMap from './GeoapifyMap';

const TestMapPage = () => {
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const testMap = () => {
    console.log('🧪 Testing map...');
    setShowMap(true);
    
    // Test with default location (New York)
    setCurrentLocation({
      latitude: 40.7128,
      longitude: -74.0060
    });
  };

  const testGPS = () => {
    console.log('📍 Testing GPS...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('✅ GPS location:', latitude, longitude);
          setCurrentLocation({ latitude, longitude });
          setShowMap(true);
        },
        (error) => {
          console.error('❌ GPS error:', error);
          alert('GPS error: ' + error.message);
        }
      );
    } else {
      alert('GPS not supported');
    }
  };

  // Test function to fetch location from server (Postman data)
  const testServerLocation = async () => {
    try {
      const token = localStorage.getItem('token');
      const deviceId = prompt('Enter your device ID:', 'TEST123456789') || 'TEST123456789';

      console.log('🔍 Fetching location from server for device:', deviceId);

      const response = await fetch(`http://localhost:5001/api/locations/${deviceId}/latest`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      console.log('📡 Server response:', result);

      if (result.success && result.data.location) {
        const location = result.data.location;
        // Note: Your API returns GeoJSON format [longitude, latitude]
        const lat = location.coordinates.coordinates[1];
        const lng = location.coordinates.coordinates[0];

        setCurrentLocation({
          latitude: lat,
          longitude: lng
        });
        setShowMap(true);
        console.log('✅ Server location loaded:', lat, lng);
        alert(`✅ Location loaded from server!\nLat: ${lat}\nLng: ${lng}`);
      } else {
        console.log('❌ No location found:', result);
        alert('❌ No location found on server for this device');
      }
    } catch (error) {
      console.error('❌ Error fetching server location:', error);
      alert('❌ Error fetching location from server: ' + error.message);
    }
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>🗺️ Map Test Page</h3>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <Button
              variant="primary"
              onClick={testMap}
              className="me-2"
            >
              🗺️ Test Map (New York)
            </Button>
            <Button
              variant="success"
              onClick={testGPS}
              className="me-2"
            >
              📍 Test GPS Location
            </Button>
            <Button
              variant="warning"
              onClick={testServerLocation}
            >
              📡 Test Server Location (Postman Data)
            </Button>
          </div>

          {showMap && currentLocation ? (
            <div>
              <h5>Map Test Result:</h5>
              <p>Latitude: {currentLocation.latitude}</p>
              <p>Longitude: {currentLocation.longitude}</p>
              
              <GeoapifyMap
                latitude={currentLocation.latitude}
                longitude={currentLocation.longitude}
                deviceName="Test Location"
                height="400px"
                showControls={true}
              />
            </div>
          ) : (
            <div className="text-center p-4 bg-light">
              <p>Click a button above to test the map</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TestMapPage;
