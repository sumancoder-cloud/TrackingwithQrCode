import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, Row, Col } from 'react-bootstrap';
import RealTimePathMap from './RealTimePathMap';

const PostmanPathDemo = () => {
  const [showMap, setShowMap] = useState(false);
  const [deviceData, setDeviceData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [pathPoints, setPathPoints] = useState(0);

  // Demo device data
  const demoDevice = {
    deviceId: 'QR112562854',
    deviceName: 'Puppy GPS Tracker',
    location: {
      latitude: 14.4673,
      longitude: 78.8242
    },
    path: [],
    isRealTime: true
  };

  // Fetch latest device data from server
  const fetchDeviceData = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/gps/device/QR112562854');
      if (response.ok) {
        const data = await response.json();
        const device = data.data.device;
        
        // Get path data
        const pathResponse = await fetch('http://localhost:5001/api/gps/path/QR112562854');
        let pathData = [];
        if (pathResponse.ok) {
          const pathResult = await pathResponse.json();
          pathData = pathResult.data || [];
        }

        setDeviceData({
          deviceId: 'QR112562854',
          deviceName: device.deviceName || 'Puppy GPS Tracker',
          location: {
            latitude: device.latitude,
            longitude: device.longitude
          },
          path: pathData,
          isRealTime: true
        });

        setLastUpdate(new Date(device.timestamp));
        setPathPoints(pathData.length);
      }
    } catch (error) {
      console.error('Error fetching device data:', error);
    }
  };

  // Auto-refresh device data
  useEffect(() => {
    if (showMap) {
      fetchDeviceData();
      const interval = setInterval(fetchDeviceData, 5000);
      return () => clearInterval(interval);
    }
  }, [showMap]);

  const startDemo = () => {
    setDeviceData(demoDevice);
    setShowMap(true);
    fetchDeviceData();
  };

  return (
    <div className="container-fluid p-4">
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Header>
              <h4>🗺️ Real-Time Path Tracking Demo</h4>
              <p className="mb-0 text-muted">
                Test GPS location updates via Postman and see the red path visualization in real-time
              </p>
            </Card.Header>
            <Card.Body>
              {!showMap ? (
                <div className="text-center">
                  <h5>📍 GPS Path Tracking with Postman Integration</h5>
                  <p>
                    This demo shows how location updates from Postman API calls 
                    create a <strong style={{color: 'red'}}>red path visualization</strong> on the map in real-time.
                  </p>
                  
                  <Alert variant="info">
                    <h6>🎯 How to Test:</h6>
                    <ol className="text-start">
                      <li>Click "Start Real-Time Tracking" below</li>
                      <li>Open Postman and import the Location Testing Collection</li>
                      <li>Send location updates to: <code>POST /api/gps/location</code></li>
                      <li>Watch the red path appear on the map as you change coordinates!</li>
                    </ol>
                  </Alert>

                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={startDemo}
                    className="mt-3"
                  >
                    🚀 Start Real-Time Tracking
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6>📱 Device: {deviceData?.deviceName}</h6>
                      <div className="d-flex gap-2">
                        <Badge bg="success">🔴 LIVE</Badge>
                        <Badge bg="info">Path Points: {pathPoints}</Badge>
                        {lastUpdate && (
                          <Badge bg="secondary">
                            Last Update: {lastUpdate.toLocaleTimeString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => setShowMap(false)}
                    >
                      ✕ Close
                    </Button>
                  </div>

                  <Alert variant="success">
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      <strong>🔴 LIVE TRACKING:</strong> Map updates automatically when you send location updates via Postman
                    </div>
                  </Alert>

                  <Alert variant="warning">
                    <h6>📮 Postman Testing Instructions:</h6>
                    <p className="mb-2">Send POST requests to update device location:</p>
                    <code>
                      POST http://localhost:5001/api/gps/location<br/>
                      {`{
  "deviceId": "QR112562854",
  "deviceName": "Puppy GPS Tracker",
  "latitude": 14.4673,
  "longitude": 78.8242,
  "accuracy": 5,
  "speed": 25,
  "heading": 45
}`}
                    </code>
                    <p className="mt-2 mb-0">
                      <strong>Change the latitude/longitude values and watch the red path grow!</strong>
                    </p>
                  </Alert>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {showMap && deviceData && (
        <Row>
          <Col md={12}>
            <RealTimePathMap 
              deviceData={deviceData}
              onClose={() => setShowMap(false)}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default PostmanPathDemo;
