const express = require('express');
const User = require('../models/User');
const Device = require('../models/Device');
const DeviceRequest = require('../models/DeviceRequest');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route   POST api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', [
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      username,
      email,
      password
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @desc    Get all users (Admin/SuperAdmin)
// @route   GET /api/users
// @access  Private (Admin/SuperAdmin)
router.get('/', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const { role, status, page = 1, limit = 10, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .populate('createdBy', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get user by ID (Admin/SuperAdmin)
// @route   GET /api/users/:id
// @access  Private (Admin/SuperAdmin)
router.get('/:id', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('createdBy', 'username firstName lastName');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get user's device requests
  const deviceRequests = await DeviceRequest.find({ requestedBy: user._id })
    .populate('devices.approvedBy', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get user's devices
  const devices = await Device.find({ assignedTo: user._id })
    .populate('approvedBy', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      user,
      recentRequests: deviceRequests,
      assignedDevices: devices
    }
  });
}));

// @desc    Create user (Admin/SuperAdmin)
// @route   POST /api/users
// @access  Private (Admin/SuperAdmin)
router.post('/', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res, next) => {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    role = 'user',
    company,
    phone,
    status = 'active'
  } = req.body;

  // Validation
  if (!username || !email || !password || !firstName || !lastName) {
    return next(new AppError('Please provide all required fields', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError('Email already registered', 400));
    }
    if (existingUser.username === username) {
      return next(new AppError('Username already exists', 400));
    }
  }

  // Only superadmin can create admin/superadmin users
  if ((role === 'admin' || role === 'superadmin') && req.user.role !== 'superadmin') {
    return next(new AppError('Only super admin can create admin users', 403));
  }

  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    role,
    company,
    phone,
    status,
    isVerified: true,
    createdBy: req.user._id
  });

  // Remove password from response
  user.password = undefined;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user
    }
  });
}));

// @desc    Update user (Admin/SuperAdmin)
// @route   PUT /api/users/:id
// @access  Private (Admin/SuperAdmin)
router.put('/:id', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    role,
    company,
    phone,
    status
  } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Only superadmin can modify admin/superadmin users
  if ((user.role === 'admin' || user.role === 'superadmin') && req.user.role !== 'superadmin') {
    return next(new AppError('Only super admin can modify admin users', 403));
  }

  // Only superadmin can assign admin/superadmin roles
  if ((role === 'admin' || role === 'superadmin') && req.user.role !== 'superadmin') {
    return next(new AppError('Only super admin can assign admin roles', 403));
  }

  // Check if email is already taken by another user
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingUser) {
      return next(new AppError('Email already in use by another account', 400));
    }
  }

  // Build update object
  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (company !== undefined) updateData.company = company;
  if (phone !== undefined) updateData.phone = phone;
  if (status) updateData.status = status;

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: updatedUser
    }
  });
}));

// @desc    Update own profile (Self-update)
// @route   PUT /api/users/profile
// @access  Private (Any authenticated user)
router.put('/profile', authenticate, asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    company,
    phone
  } = req.body;

  // Build update object (only allow certain fields for self-update)
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (company !== undefined) updateData.company = company;
  if (phone !== undefined) updateData.phone = phone;
  updateData.lastUpdated = new Date();

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  });
}));

// @desc    Delete user (Admin/SuperAdmin)
// @route   DELETE /api/users/:id
// @access  Private (Admin/SuperAdmin)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Cannot delete yourself
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  // Only superadmin can delete admin/superadmin users
  if ((user.role === 'admin' || user.role === 'superadmin') && req.user.role !== 'superadmin') {
    return next(new AppError('Only super admin can delete admin users', 403));
  }

  // Check if user has assigned devices
  const assignedDevices = await Device.countDocuments({ assignedTo: user._id });
  if (assignedDevices > 0) {
    return next(new AppError('Cannot delete user with assigned devices. Please reassign devices first.', 400));
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// @desc    Get user activity/statistics
// @route   GET /api/users/:id/activity
// @access  Private (Admin/SuperAdmin)
router.get('/:id/activity', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get user's device requests
  const deviceRequests = await DeviceRequest.find({ requestedBy: user._id })
    .populate('devices.approvedBy', 'username firstName lastName')
    .populate('devices.rejectedBy', 'username firstName lastName')
    .sort({ createdAt: -1 });

  // Get user's devices
  const devices = await Device.find({ assignedTo: user._id })
    .populate('approvedBy', 'username firstName lastName')
    .sort({ createdAt: -1 });

  // Calculate statistics
  const stats = {
    totalRequests: deviceRequests.length,
    totalDevices: devices.length,
    activeDevices: devices.filter(d => d.status === 'active').length,
    pendingRequests: deviceRequests.filter(r => r.status === 'pending').length,
    approvedRequests: deviceRequests.filter(r => r.status === 'fully_approved').length,
    rejectedRequests: deviceRequests.filter(r => r.status === 'rejected').length
  };

  // Create activity timeline
  const activities = [];

  // Add registration activity
  activities.push({
    type: 'User Registration',
    action: 'Account Created',
    timestamp: user.createdAt,
    details: `New ${user.role} account created`,
    status: 'completed'
  });

  // Add device request activities
  deviceRequests.forEach(request => {
    activities.push({
      type: 'Device Request',
      action: 'Device Requested',
      timestamp: request.createdAt,
      details: `Requested ${request.devices.length} device(s)`,
      status: request.status
    });

    // Add approval/rejection activities
    request.devices.forEach((device, index) => {
      if (device.approvedAt) {
        activities.push({
          type: 'Device Approval',
          action: 'Device Approved',
          timestamp: device.approvedAt,
          details: `${device.name} approved`,
          status: 'approved'
        });
      }
      if (device.rejectedAt) {
        activities.push({
          type: 'Device Rejection',
          action: 'Device Rejected',
          timestamp: device.rejectedAt,
          details: `${device.name} rejected`,
          status: 'rejected'
        });
      }
    });
  });

  // Sort activities by timestamp (newest first)
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    success: true,
    data: {
      user,
      stats,
      activities: activities.slice(0, 20), // Limit to 20 most recent activities
      deviceRequests,
      devices
    }
  });
}));

// @desc    Reset user password (Admin/SuperAdmin)
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin/SuperAdmin)
router.put('/:id/reset-password', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res, next) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return next(new AppError('Please provide new password', 400));
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Only superadmin can reset admin/superadmin passwords
  if ((user.role === 'admin' || user.role === 'superadmin') && req.user.role !== 'superadmin') {
    return next(new AppError('Only super admin can reset admin passwords', 403));
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

module.exports = router;