const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  deviceName: {
    type: String,
    default: ''
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    accuracy: {
      type: Number,
      default: 10
    },
    altitude: {
      type: Number,
      default: null
    },
    speed: {
      type: Number,
      default: null
    },
    heading: {
      type: Number,
      default: null
    }
  },
  address: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  recordedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['gps', 'network', 'passive', 'api', 'manual', 'scan'],
    default: 'api'
  },
  assignedTo: {
    type: String,
    default: '',
    index: true
  },
  // Distance calculation fields
  distanceFromPrevious: {
    type: Number,
    default: 0 // Distance in meters from previous location
  },
  totalDistance: {
    type: Number,
    default: 0 // Cumulative distance in meters
  },
  // Route tracking
  routeId: {
    type: String,
    default: '' // Group locations by route/session
  },
  isStartPoint: {
    type: Boolean,
    default: false
  },
  isEndPoint: {
    type: Boolean,
    default: false
  },
  // Additional metadata
  batteryLevel: {
    type: Number,
    default: null
  },
  signalStrength: {
    type: Number,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
locationHistorySchema.index({ deviceId: 1, timestamp: -1 });
locationHistorySchema.index({ assignedTo: 1, timestamp: -1 });
locationHistorySchema.index({ deviceId: 1, recordedAt: -1 });
locationHistorySchema.index({ routeId: 1, timestamp: 1 });

// Date-based index for calendar queries
locationHistorySchema.index({ 
  deviceId: 1, 
  timestamp: 1 
});

// Compound index for date range queries
locationHistorySchema.index({
  deviceId: 1,
  timestamp: 1,
  assignedTo: 1
});

module.exports = mongoose.model('LocationHistory', locationHistorySchema);
