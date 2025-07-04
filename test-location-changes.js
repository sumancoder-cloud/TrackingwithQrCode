const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testLocationChanges() {
  console.log('🗺️ Testing GPS Location Changes...\n');

  const deviceId = 'QR112562854';
  
  // Define a journey from Kadapa to Proddatur with multiple stops
  const locations = [
    {
      name: 'Kadapa (Starting Point)',
      latitude: 14.4673,
      longitude: 78.8242,
      description: 'Starting from Kadapa city center'
    },
    {
      name: 'Kadapa Outskirts',
      latitude: 14.4800,
      longitude: 78.8300,
      description: 'Moving towards highway'
    },
    {
      name: 'Highway Junction',
      latitude: 14.5200,
      longitude: 78.8500,
      description: 'On the main highway'
    },
    {
      name: 'Midway Point',
      latitude: 14.6000,
      longitude: 78.7000,
      description: 'Halfway to Proddatur'
    },
    {
      name: 'Proddatur Approach',
      latitude: 14.7200,
      longitude: 78.5600,
      description: 'Approaching Proddatur'
    },
    {
      name: 'Proddatur (Destination)',
      latitude: 14.7300,
      longitude: 78.5500,
      description: 'Reached Proddatur city center'
    }
  ];

  try {
    console.log('📍 Starting Location Journey Test...\n');

    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      
      console.log(`${i + 1}️⃣ Updating to: ${location.name}`);
      console.log(`   📍 Coordinates: ${location.latitude}, ${location.longitude}`);
      console.log(`   📝 Description: ${location.description}`);

      // Update device location
      const updateResponse = await axios.post(`${BASE_URL}/api/gps/location`, {
        deviceId: deviceId,
        deviceName: 'Puppy GPS Tracker',
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: Math.floor(Math.random() * 10) + 1, // Random accuracy 1-10m
        speed: Math.floor(Math.random() * 50) + 10,   // Random speed 10-60 km/h
        heading: Math.floor(Math.random() * 360)      // Random direction 0-360°
      });

      console.log(`   ✅ Update Status: ${updateResponse.data.message}`);
      console.log(`   📊 Path Points: ${updateResponse.data.data.pathPoints}`);

      // Get current location to verify
      const currentResponse = await axios.get(`${BASE_URL}/api/gps/device/${deviceId}`);
      const currentLoc = currentResponse.data.data.device;
      
      console.log(`   🔍 Verified Location: ${currentLoc.latitude}, ${currentLoc.longitude}`);
      console.log(`   ⏰ Timestamp: ${new Date(currentLoc.timestamp).toLocaleTimeString()}`);
      
      // Calculate distance from previous location (if not first)
      if (i > 0) {
        const prevLoc = locations[i - 1];
        const distance = calculateDistance(
          prevLoc.latitude, prevLoc.longitude,
          location.latitude, location.longitude
        );
        console.log(`   📏 Distance from previous: ${distance.toFixed(2)} km`);
      }

      console.log('   ' + '-'.repeat(50));
      
      // Wait 2 seconds between updates to simulate real movement
      if (i < locations.length - 1) {
        console.log('   ⏳ Moving to next location...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Get complete path history
    console.log('\n📈 Getting Complete Path History...');
    const pathResponse = await axios.get(`${BASE_URL}/api/gps/path/${deviceId}`);
    const pathData = pathResponse.data.data;
    
    console.log(`✅ Total Path Points: ${pathData.length}`);
    console.log('📍 Journey Summary:');
    
    pathData.slice(-6).forEach((point, index) => {
      const time = new Date(point.timestamp).toLocaleTimeString();
      console.log(`   ${index + 1}. [${time}] ${point.latitude}, ${point.longitude} (${point.speed || 0} km/h)`);
    });

    // Calculate total journey distance
    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      const dist = calculateDistance(
        locations[i-1].latitude, locations[i-1].longitude,
        locations[i].latitude, locations[i].longitude
      );
      totalDistance += dist;
    }

    console.log(`\n🎯 Journey Complete!`);
    console.log(`📏 Total Distance: ${totalDistance.toFixed(2)} km`);
    console.log(`📍 Start: Kadapa (${locations[0].latitude}, ${locations[0].longitude})`);
    console.log(`📍 End: Proddatur (${locations[locations.length-1].latitude}, ${locations[locations.length-1].longitude})`);
    console.log(`⏱️ Total Updates: ${locations.length}`);

  } catch (error) {
    console.error('❌ Location test failed:', error.response?.data?.message || error.message);
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

testLocationChanges();
