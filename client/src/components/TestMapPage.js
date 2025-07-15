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
            >
              📍 Test GPS Location
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
