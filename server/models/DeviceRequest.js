const mongoose = require('mongoose');

const deviceRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    default: function() {
      return 'REQ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Request must have a requester']
  },
  devices: [{
    name: {
      type: String,
      required: [true, 'Device name is required'],
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
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
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
    deviceId: {
      type: String // Will be set when approved and device is created
    },
    qrCode: {
      type: String // JSON string containing QR code data
    }
  }],
  additionalInfo: {
    type: String,
    trim: true,
    maxlength: [1000, 'Additional information cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'partially_approved', 'fully_approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  businessJustification: {
    type: String,
    trim: true,
    maxlength: [1000, 'Business justification cannot exceed 1000 characters']
  },
  expectedUsageDuration: {
    type: String,
    enum: ['1_month', '3_months', '6_months', '1_year', 'permanent'],
    default: '6_months'
  },
  budget: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: [3, 'Currency code cannot exceed 3 characters']
    }
  },
  approvalWorkflow: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'pending']
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [500, 'Comments cannot exceed 500 characters']
    },
    actionDate: {
      type: Date
    }
  }],
  notifications: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['request_submitted', 'request_approved', 'request_rejected', 'device_ready']
    },
    message: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    readAt: {
      type: Date
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
deviceRequestSchema.index({ requestedBy: 1 });
deviceRequestSchema.index({ status: 1 });
deviceRequestSchema.index({ priority: 1 });
deviceRequestSchema.index({ submittedAt: -1 });
deviceRequestSchema.index({ 'devices.status': 1 });

// Virtual for total devices count
deviceRequestSchema.virtual('totalDevices').get(function() {
  return this.devices.length;
});

// Virtual for approved devices count
deviceRequestSchema.virtual('approvedDevicesCount').get(function() {
  return this.devices.filter(device => device.status === 'approved').length;
});

// Virtual for pending devices count
deviceRequestSchema.virtual('pendingDevicesCount').get(function() {
  return this.devices.filter(device => device.status === 'pending').length;
});

// Virtual for rejected devices count
deviceRequestSchema.virtual('rejectedDevicesCount').get(function() {
  return this.devices.filter(device => device.status === 'rejected').length;
});

// Virtual for completion percentage
deviceRequestSchema.virtual('completionPercentage').get(function() {
  const total = this.devices.length;
  const processed = this.devices.filter(device => device.status !== 'pending').length;
  return total > 0 ? Math.round((processed / total) * 100) : 0;
});

// Pre-save middleware to update overall status
deviceRequestSchema.pre('save', function(next) {
  const deviceStatuses = this.devices.map(device => device.status);
  const uniqueStatuses = [...new Set(deviceStatuses)];
  
  if (uniqueStatuses.length === 1) {
    // All devices have the same status
    if (uniqueStatuses[0] === 'approved') {
      this.status = 'fully_approved';
      this.completedAt = new Date();
    } else if (uniqueStatuses[0] === 'rejected') {
      this.status = 'rejected';
      this.completedAt = new Date();
    } else {
      this.status = 'pending';
    }
  } else if (uniqueStatuses.includes('approved')) {
    // Some devices approved, some not
    this.status = 'partially_approved';
  } else {
    this.status = 'pending';
  }
  
  next();
});

// Static method to get requests by status
deviceRequestSchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('requestedBy', 'username firstName lastName email')
    .populate('devices.approvedBy', 'username firstName lastName')
    .populate('devices.rejectedBy', 'username firstName lastName')
    .sort({ submittedAt: -1 });
};

// Static method to get user's requests
deviceRequestSchema.statics.getUserRequests = function(userId) {
  return this.find({ requestedBy: userId })
    .populate('devices.approvedBy', 'username firstName lastName')
    .populate('devices.rejectedBy', 'username firstName lastName')
    .sort({ submittedAt: -1 });
};

// Instance method to approve device
deviceRequestSchema.methods.approveDevice = function(deviceIndex, approverId, qrCode = null) {
  if (deviceIndex >= 0 && deviceIndex < this.devices.length) {
    this.devices[deviceIndex].status = 'approved';
    this.devices[deviceIndex].approvedBy = approverId;
    this.devices[deviceIndex].approvedAt = new Date();
    if (qrCode) {
      this.devices[deviceIndex].qrCode = qrCode;
    }
    return this.save();
  }
  throw new Error('Invalid device index');
};

// Instance method to reject device
deviceRequestSchema.methods.rejectDevice = function(deviceIndex, rejectorId, reason = null) {
  if (deviceIndex >= 0 && deviceIndex < this.devices.length) {
    this.devices[deviceIndex].status = 'rejected';
    this.devices[deviceIndex].rejectedBy = rejectorId;
    this.devices[deviceIndex].rejectedAt = new Date();
    if (reason) {
      this.devices[deviceIndex].rejectionReason = reason;
    }
    return this.save();
  }
  throw new Error('Invalid device index');
};

// Instance method to add notification
deviceRequestSchema.methods.addNotification = function(recipientId, type, message) {
  this.notifications.push({
    recipient: recipientId,
    type: type,
    message: message
  });
  return this.save();
};

module.exports = mongoose.model('DeviceRequest', deviceRequestSchema);
