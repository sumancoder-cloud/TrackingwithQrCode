const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Location must be associated with a device']
  },
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    index: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates format'
      }
    }
  },
  altitude: {
    type: Number, // meters above sea level
    default: null
  },
  accuracy: {
    type: Number, // accuracy in meters
    required: [true, 'Accuracy is required'],
    min: [0, 'Accuracy cannot be negative']
  },
  speed: {
    type: Number, // speed in m/s
    default: null,
    min: [0, 'Speed cannot be negative']
  },
  heading: {
    type: Number, // direction in degrees (0-360)
    default: null,
    min: [0, 'Heading must be between 0 and 360'],
    max: [360, 'Heading must be between 0 and 360']
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    formattedAddress: String
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  signalStrength: {
    type: Number,
    min: 0,
    max: 100
  },
  source: {
    type: String,
    enum: ['gps', 'network', 'passive', 'manual'],
    default: 'gps'
  },
  recordedAt: {
    type: Date,
    required: [true, 'Recorded time is required'],
    default: Date.now
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    provider: String, // GPS provider info
    satellites: Number, // number of satellites used
    hdop: Number, // horizontal dilution of precision
    vdop: Number, // vertical dilution of precision
    pdop: Number, // position dilution of precision
    temperature: Number, // device temperature
    humidity: Number, // environmental humidity
    pressure: Number // atmospheric pressure
  },
  geofences: [{
    name: String,
    type: {
      type: String,
      enum: ['enter', 'exit', 'dwell']
    },
    triggeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['speed_limit', 'geofence', 'low_battery', 'device_offline', 'panic_button']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    message: String,
    triggeredAt: {
      type: Date,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location queries
locationSchema.index({ coordinates: '2dsphere' });

// Compound indexes for performance
locationSchema.index({ device: 1, recordedAt: -1 });
locationSchema.index({ deviceId: 1, recordedAt: -1 });
locationSchema.index({ recordedAt: -1 });
locationSchema.index({ isActive: 1, recordedAt: -1 });

// Virtual for latitude
locationSchema.virtual('latitude').get(function() {
  return this.coordinates.coordinates[1];
});

// Virtual for longitude
locationSchema.virtual('longitude').get(function() {
  return this.coordinates.coordinates[0];
});

// Virtual for formatted coordinates
locationSchema.virtual('formattedCoordinates').get(function() {
  const lat = this.coordinates.coordinates[1].toFixed(6);
  const lng = this.coordinates.coordinates[0].toFixed(6);
  return `${lat}, ${lng}`;
});

// Virtual for age of location data
locationSchema.virtual('ageInMinutes').get(function() {
  return Math.round((Date.now() - this.recordedAt.getTime()) / (1000 * 60));
});

// Virtual for distance calculation (requires comparison point)
locationSchema.virtual('distanceFromPrevious').get(function() {
  return this._distanceFromPrevious || null;
});

// Static method to get latest location for device
locationSchema.statics.getLatestForDevice = function(deviceId) {
  return this.findOne({ 
    deviceId: deviceId, 
    isActive: true 
  })
  .sort({ recordedAt: -1 })
  .populate('device', 'name status');
};

// Static method to get location history for device
locationSchema.statics.getHistoryForDevice = function(deviceId, startDate, endDate, limit = 100) {
  const query = { 
    deviceId: deviceId, 
    isActive: true 
  };
  
  if (startDate || endDate) {
    query.recordedAt = {};
    if (startDate) query.recordedAt.$gte = new Date(startDate);
    if (endDate) query.recordedAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ recordedAt: -1 })
    .limit(limit)
    .populate('device', 'name status');
};

// Static method to find locations within radius
locationSchema.statics.findNearby = function(longitude, latitude, maxDistance = 1000) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  })
  .sort({ recordedAt: -1 })
  .populate('device', 'name status deviceId');
};

// Static method to calculate distance between two points (Haversine formula)
locationSchema.statics.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Instance method to calculate distance from another location
locationSchema.methods.distanceTo = function(otherLocation) {
  const lat1 = this.coordinates.coordinates[1];
  const lon1 = this.coordinates.coordinates[0];
  const lat2 = otherLocation.coordinates.coordinates[1];
  const lon2 = otherLocation.coordinates.coordinates[0];
  
  return this.constructor.calculateDistance(lat1, lon1, lat2, lon2);
};

// Instance method to add alert
locationSchema.methods.addAlert = function(type, severity, message) {
  this.alerts.push({
    type: type,
    severity: severity,
    message: message
  });
  return this.save();
};

// Instance method to acknowledge alert
locationSchema.methods.acknowledgeAlert = function(alertIndex, userId) {
  if (alertIndex >= 0 && alertIndex < this.alerts.length) {
    this.alerts[alertIndex].acknowledged = true;
    this.alerts[alertIndex].acknowledgedBy = userId;
    this.alerts[alertIndex].acknowledgedAt = new Date();
    return this.save();
  }
  throw new Error('Invalid alert index');
};

// Pre-save middleware to validate coordinates
locationSchema.pre('save', function(next) {
  // Ensure coordinates are within valid ranges
  const [longitude, latitude] = this.coordinates.coordinates;
  
  if (longitude < -180 || longitude > 180) {
    return next(new Error('Longitude must be between -180 and 180'));
  }
  
  if (latitude < -90 || latitude > 90) {
    return next(new Error('Latitude must be between -90 and 90'));
  }
  
  next();
});

module.exports = mongoose.model('Location', locationSchema);
