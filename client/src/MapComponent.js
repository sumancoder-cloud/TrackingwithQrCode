import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const MapComponent = () => {
  const [currentPosition, setCurrentPosition] = useState(null);

  const mapStyles = {
    height: "400px",
    width: "100%"
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({
          lat: latitude,
          lng: longitude
        });
      },
      () => {
        // Handle error or set a default location
        setCurrentPosition({
          lat: 40.712776,
          lng: -74.005974
        });
      }
    );
  }, []);

  return (
    <LoadScript googleMapsApiKey="YOUR_API_KEY">
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={13}
        center={currentPosition}
      >
        {currentPosition && <Marker position={currentPosition} />}
      </GoogleMap>
    </LoadScript>
  )
}

export default MapComponent;