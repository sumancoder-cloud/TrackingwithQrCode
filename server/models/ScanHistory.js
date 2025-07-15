const mongoose = require('mongoose');

const scanHistorySchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  deviceName: {
    type: String,
    default: ''
  },
  qrCodeId: {
    type: String,
    default: ''
  },
  scanMethod: {
    type: String,
    enum: ['scan', 'upload', 'manual'],
    required: true,
    default: 'scan'
  },
  scanLocation: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      default: ''
    },
    accuracy: {
      type: Number,
      default: 10
    }
  },
  scannedBy: {
    type: String,
    required: true,
    index: true
  },
  scannedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  rawQRData: {
    type: String,
    default: ''
  },
  deviceType: {
    type: String,
    default: 'GPS Tracker'
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'pending'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Index for efficient queries
scanHistorySchema.index({ scannedBy: 1, scannedAt: -1 });
scanHistorySchema.index({ deviceId: 1, scannedAt: -1 });

module.exports = mongoose.model('ScanHistory', scanHistorySchema);
