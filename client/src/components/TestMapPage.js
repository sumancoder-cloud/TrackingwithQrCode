import React, { useState } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import RealTimePathMap from './RealTimePathMap';

const TestMapPage = () => {
  const [showMap, setShowMap] = useState(false);

  // Test device data
  const testDevice = {
    deviceId: 'QR112562854',
    deviceName: 'Test GPS Tracker',
    location: {
      latitude: 14.4673,
      longitude: 78.8242
    },
    path: [
      {
        latitude: 14.4673,
        longitude: 78.8242,
        timestamp: new Date().toISOString(),
        speed: 0
      }
    ],
    isRealTime: true
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h4>🗺️ Map Component Test</h4>
        </Card.Header>
        <Card.Body>
          {!showMap ? (
            <div className="text-center">
              <Alert variant="info">
                <h6>Test the Real-Time Path Map Component</h6>
                <p>This is a simple test to verify the map component works correctly.</p>
              </Alert>
              <Button 
                variant="primary" 
                onClick={() => setShowMap(true)}
              >
                🚀 Show Test Map
              </Button>
            </div>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>📍 Test Device: {testDevice.deviceName}</h6>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setShowMap(false)}
                >
                  ✕ Close Map
                </Button>
              </div>
              
              <Alert variant="success">
                <strong>🔴 Test Mode:</strong> Map should show a red path when you update coordinates via Postman
              </Alert>
              
              <RealTimePathMap 
                deviceData={testDevice}
                onClose={() => setShowMap(false)}
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TestMapPage;
