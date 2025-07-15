const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    unique: true,
    trim: true,
    minlength: [10, 'Device ID must be at least 10 characters'],
    maxlength: [20, 'Device ID must be at most 20 characters'],
    match: [/^[A-Za-z0-9]+$/, 'Device ID must contain only alphanumeric characters']
  },
  name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
    maxlength: [100, 'Device name cannot exceed 100 characters']
  },
  deviceName: {
    type: String,
    trim: true,
    maxlength: [100, 'Device name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  purpose: {
    type: String,
    required: [true, 'Device purpose is required'],
    trim: true,
    maxlength: [200, 'Purpose cannot exceed 200 characters']
  },
  serialNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Serial number cannot exceed 50 characters']
  },
  model: {
    type: String,
    trim: true,
    maxlength: [50, 'Model cannot exceed 50 characters']
  },
  category: {
    type: String,
    enum: ['gps', 'vehicle', 'asset', 'personal', 'other'],
    default: 'gps'
  },
  type: {
    type: String,
    enum: ['gps', 'qr', 'hybrid'],
    default: 'gps'
  },
  uploadMethod: {
    type: String,
    enum: ['scan', 'upload', 'manual'],
    default: 'manual'
  },
  qrImageName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'inactive', 'maintenance'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastKnownLocation: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    accuracy: {
      type: Number
    },
    timestamp: {
      type: Date
    },
    address: {
      type: String,
      trim: true
    }
  },
  qrCode: {
    data: {
      type: String // JSON string containing QR code data
    },
    generatedAt: {
      type: Date
    },
    validUntil: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: {
      type: String,
      trim: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  signalStrength: {
    type: Number,
    min: 0,
    max: 100
  },
  lastSeen: {
    type: Date,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  trackingEnabled: {
    type: Boolean,
    default: false
  },
  trackingStartedAt: {
    type: Date
  },
  trackingStoppedAt: {
    type: Date
  },
  settings: {
    updateInterval: {
      type: Number,
      default: 30, // seconds
      min: 10,
      max: 3600
    },
    accuracyThreshold: {
      type: Number,
      default: 100, // meters
      min: 1,
      max: 1000
    },
    alertsEnabled: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    manufacturer: String,
    firmwareVersion: String,
    hardwareVersion: String,
    imei: String,
    simCardNumber: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location queries
deviceSchema.index({ location: '2dsphere' });

// Index for performance
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ assignedTo: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ trackingEnabled: 1 });
deviceSchema.index({ isOnline: 1 });

// Virtual for QR code status
deviceSchema.virtual('qrCodeStatus').get(function() {
  if (!this.qrCode.data) return 'not_generated';
  if (!this.qrCode.isActive) return 'inactive';
  if (this.qrCode.validUntil && this.qrCode.validUntil < new Date()) return 'expired';
  return 'active';
});

// Virtual for tracking status
deviceSchema.virtual('trackingStatus').get(function() {
  if (!this.trackingEnabled) return 'disabled';
  if (!this.isOnline) return 'offline';
  return 'active';
});

// Pre-save middleware to update lastSeen when device comes online
deviceSchema.pre('save', function(next) {
  if (this.isModified('isOnline') && this.isOnline) {
    this.lastSeen = new Date();
  }
  next();
});

// Static method to generate unique device ID
deviceSchema.statics.generateDeviceId = function() {
  let deviceId = '';
  for (let i = 0; i < 16; i++) {
    deviceId += Math.floor(Math.random() * 10).toString();
  }
  return deviceId;
};

// Static method to find devices near a location
deviceSchema.statics.findNearby = function(longitude, latitude, maxDistance = 1000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isOnline: true
  });
};

// Instance method to update location
deviceSchema.methods.updateLocation = function(longitude, latitude, address = null) {
  this.location = {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: address,
    lastUpdated: new Date()
  };
  this.lastSeen = new Date();
  return this.save();
};

// Instance method to start tracking
deviceSchema.methods.startTracking = function() {
  this.trackingEnabled = true;
  this.trackingStartedAt = new Date();
  this.trackingStoppedAt = undefined;
  return this.save();
};

// Instance method to stop tracking
deviceSchema.methods.stopTracking = function() {
  this.trackingEnabled = false;
  this.trackingStoppedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Device', deviceSchema);
