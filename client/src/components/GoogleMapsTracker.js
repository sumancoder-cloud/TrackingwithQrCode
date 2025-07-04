import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Alert, Card, Row, Col, Badge } from 'react-bootstrap';

const GoogleMapsTracker = ({ show, onHide, device, onLocationUpdate }) => {
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
  const [currentMarker, setCurrentMarker] = useState(null);
  const [pathPolyline, setPathPolyline] = useState(null);
  
  const watchIdRef = useRef(null);
  const mapContainerRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Google Maps API Key from environment
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

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

  // Load Google Maps API
  const loadGoogleMapsAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps API failed to load'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };
      
      document.head.appendChild(script);
    });
  }, [GOOGLE_MAPS_API_KEY]);

  // Initialize Google Maps
  const initializeGoogleMap = useCallback(async (lat, lng) => {
    try {
      const maps = await loadGoogleMapsAPI();
      
      if (!mapContainerRef.current) return;

      // Clear existing map
      if (mapInstance) {
        // Google Maps doesn't need explicit cleanup
      }

      // Create new Google Map
      const map = new maps.Map(mapContainerRef.current, {
        center: { lat, lng },
        zoom: 18,
        mapTypeId: maps.MapTypeId.HYBRID, // Satellite view with labels
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: maps.ControlPosition.TOP_CENTER,
          mapTypeIds: [
            maps.MapTypeId.ROADMAP,
            maps.MapTypeId.SATELLITE,
            maps.MapTypeId.HYBRID,
            maps.MapTypeId.TERRAIN
          ]
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: maps.ControlPosition.RIGHT_BOTTOM
        },
        zoomControl: true,
        zoomControlOptions: {
          position: maps.ControlPosition.RIGHT_CENTER
        },
        fullscreenControl: true,
        gestureHandling: 'cooperative'
      });

      // Custom device marker
      const marker = new maps.Marker({
        position: { lat, lng },
        map: map,
        title: device?.name || 'Device Location',
        animation: maps.Animation.DROP
      });

      // Info window with device details
      const infoWindow = new maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h6 style="margin: 0 0 10px 0; color: #1976d2;">📱 ${device?.name || 'Device'}</h6>
            <div style="font-size: 12px; color: #666;">
              <strong>Real-time GPS Tracking</strong><br/>
              <strong>Latitude:</strong> ${lat.toFixed(6)}<br/>
              <strong>Longitude:</strong> ${lng.toFixed(6)}<br/>
              <strong>Accuracy:</strong> ±${gpsAccuracy || 'Unknown'}m<br/>
              <strong>Updated:</strong> ${new Date().toLocaleTimeString()}
            </div>
            <div style="margin-top: 10px;">
              <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}', '_blank')" 
                      style="background: #4285F4; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                🧭 Get Directions
              </button>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Accuracy circle
      const accuracyCircle = new maps.Circle({
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        map: map,
        center: { lat, lng },
        radius: gpsAccuracy || 10
      });

      setMapInstance(map);
      setCurrentMarker(marker);

      // Auto-open info window
      setTimeout(() => {
        infoWindow.open(map, marker);
      }, 1000);

      return map;
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setError(`Failed to load Google Maps: ${error.message}`);
      return null;
    }
  }, [device, gpsAccuracy, loadGoogleMapsAPI, mapInstance]);

  // Enhanced reverse geocoding with Google Maps Geocoding API
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps API not loaded');
      }

      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode(
          { 
            location: { lat, lng },
            language: 'en',
            region: 'IN' // India region for better local results
          },
          (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const result = results[0];
              const addressComponents = result.address_components;
              
              // Extract detailed address information
              const locationInfo = {
                address: result.formatted_address,
                placeId: result.place_id,
                types: result.types,
                
                // Extract specific components
                streetNumber: '',
                route: '',
                locality: '',
                city: '',
                district: '',
                state: '',
                country: '',
                postalCode: '',
                
                // Additional info
                coordinates: { lat, lng },
                accuracy: 'High (Google Maps)',
                source: 'Google Maps Geocoding API'
              };

              // Parse address components
              addressComponents.forEach(component => {
                const types = component.types;
                
                if (types.includes('street_number')) {
                  locationInfo.streetNumber = component.long_name;
                } else if (types.includes('route')) {
                  locationInfo.route = component.long_name;
                } else if (types.includes('locality')) {
                  locationInfo.locality = component.long_name;
                  locationInfo.city = component.long_name;
                } else if (types.includes('administrative_area_level_2')) {
                  locationInfo.district = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                  locationInfo.state = component.long_name;
                } else if (types.includes('country')) {
                  locationInfo.country = component.long_name;
                } else if (types.includes('postal_code')) {
                  locationInfo.postalCode = component.long_name;
                }
              });

              // If no city found in locality, try sublocality
              if (!locationInfo.city) {
                const sublocality = addressComponents.find(c => 
                  c.types.includes('sublocality') || c.types.includes('sublocality_level_1')
                );
                if (sublocality) {
                  locationInfo.city = sublocality.long_name;
                }
              }

              console.log('Google Maps Geocoding Result:', locationInfo);
              resolve(locationInfo);
            } else {
              console.warn('Geocoding failed:', status);
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }, []);

  // Start real-time GPS tracking with Google Maps integration
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

    // High accuracy GPS tracking
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading,
          altitude: position.coords.altitude,
          timestamp: Date.now()
        };

        setCurrentLocation(newLocation);
        setGpsAccuracy(position.coords.accuracy);

        // Enhanced geocoding with Google Maps
        try {
          const geocodeResult = await reverseGeocode(newLocation.latitude, newLocation.longitude);
          if (geocodeResult) {
            newLocation.address = geocodeResult.address;
            newLocation.city = geocodeResult.city;
            newLocation.state = geocodeResult.state;
            newLocation.country = geocodeResult.country;
            newLocation.placeId = geocodeResult.placeId;
            newLocation.googleMapsEnhanced = true;
          }
        } catch (geocodeError) {
          console.warn('Geocoding failed:', geocodeError);
        }

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

            // Only add to distance if movement is significant (> 3 meters)
            if (distance > 3) {
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

        // Update Google Map
        if (mapInstance && currentMarker) {
          const newPos = { lat: newLocation.latitude, lng: newLocation.longitude };
          currentMarker.setPosition(newPos);
          mapInstance.setCenter(newPos);
          
          // Update path polyline
          if (pathPolyline) {
            pathPolyline.setMap(null);
          }
          
          if (locationPath.length > 1) {
            const pathCoords = locationPath.map(loc => ({
              lat: loc.latitude,
              lng: loc.longitude
            }));
            
            const newPolyline = new window.google.maps.Polyline({
              path: pathCoords,
              geodesic: true,
              strokeColor: '#4285F4',
              strokeOpacity: 1.0,
              strokeWeight: 4
            });
            
            newPolyline.setMap(mapInstance);
            setPathPolyline(newPolyline);
          }
        } else if (!mapInstance) {
          // Initialize Google Map if not already done
          initializeGoogleMap(newLocation.latitude, newLocation.longitude);
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
  }, [calculateDistance, initializeGoogleMap, mapInstance, currentMarker, pathPolyline, locationPath, trackingStartTime, totalDistance, maxSpeed, onLocationUpdate, reverseGeocode]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          🗺️ Google Maps GPS Tracker - {device?.name || 'Device'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {gpsAccuracy && gpsAccuracy > 1000 && (
          <Alert variant="warning">
            <strong>Low GPS Accuracy:</strong> The current location is highly inaccurate. Please ensure you have a clear view of the sky for a better GPS signal.
          </Alert>
        )}
        
        {GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE' && (
          <Alert variant="warning">
            <strong>Google Maps API Key Required:</strong> Please add your Google Maps API key to the .env file as REACT_APP_GOOGLE_MAPS_API_KEY
          </Alert>
        )}
        
        <Row>
          <Col md={8}>
            {/* Google Maps Container */}
            <Card className="mb-3">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">🗺️ Google Maps - Real-time GPS</h6>
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
                <div
                  ref={mapContainerRef}
                  style={{
                    height: '450px',
                    width: '100%',
                    borderRadius: '0 0 8px 8px'
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            {/* Tracking Controls */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">🎮 Tracking Controls</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  {!isTracking ? (
                    <Button
                      variant="success"
                      size="lg"
                      onClick={startTracking}
                      disabled={GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE'}
                    >
                      🚀 Start GPS Tracking
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
                <h6 className="mb-0">📊 Tracking Statistics</h6>
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
                      {currentLocation.address && (
                        <div className="mt-1">
                          <strong>Address:</strong><br/>
                          <small>{currentLocation.address}</small>
                        </div>
                      )}
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
          <>
            <Button
              variant="primary"
              onClick={() => {
                const lat = currentLocation.latitude;
                const lng = currentLocation.longitude;
                const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                window.open(googleMapsUrl, '_blank');
              }}
            >
              🗺️ Open in Google Maps
            </Button>
            <Button
              variant="success"
              onClick={() => {
                const lat = currentLocation.latitude;
                const lng = currentLocation.longitude;
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                window.open(directionsUrl, '_blank');
              }}
            >
              🧭 Get Directions
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default GoogleMapsTracker;
