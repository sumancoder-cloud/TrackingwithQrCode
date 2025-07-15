const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, authenticate, sensitiveOperationLimit } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// 📧 Email configuration for OTP sending
const createEmailTransporter = () => {
  // Use Gmail SMTP for sending real emails
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'suman.tati2005@gmail.com', // Your Gmail address
      pass: 'ryvv esyi kuzw gmca'    // Gmail App Password (not regular password)
    }
  });
};

// 🔐 In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// 🔧 Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// 🔧 Helper function to send OTP email
const sendOTPEmail = async (email, otp, firstName) => {
  try {
    // 📧 Always log OTP to console for debugging
    console.log('\n🔐 ===== OTP EMAIL SENDING =====');
    console.log(`📧 To: ${email}`);
    console.log(`👤 Name: ${firstName}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log(`⏰ Valid for: 10 minutes`);
    console.log('===============================\n');

    // 🚀 Try to send actual email
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: 'suman.tati2005@gmail.com',
      to: email,
      subject: '🔐 GPS Tracker - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0;">🗺️ GPS Tracker</h1>
              <h2 style="color: #333; margin: 10px 0;">Password Reset Request</h2>
            </div>

            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hello <strong>${firstName}</strong>,
            </p>

            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              We received a request to reset your password for your GPS Tracker account.
              Use the following OTP (One-Time Password) to reset your password:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                ${otp}
              </div>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Security Notice:</strong><br>
                • This OTP is valid for <strong>10 minutes</strong> only<br>
                • Do not share this OTP with anyone<br>
                • If you didn't request this, please ignore this email
              </p>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              If you have any questions, please contact our support team at
              <a href="mailto:suman.tati2005@gmail.com" style="color: #007bff;">suman.tati2005@gmail.com</a>
            </p>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2024 GPS Tracker by ADDWISE. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', email);
      console.log('📧 Message ID:', result.messageId);
      return true;
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError.message);
      console.log('🔧 Email configuration may need setup. Using console OTP for now.');

      // For development/testing, still return true so the flow continues
      // In production, you might want to return false here
      return true;
    }
  } catch (error) {
    console.error('❌ General error in sendOTPEmail:', error.message);
    return false;
  }
};

// @desc    Auth API health check
// @route   GET /api/auth/health
// @access  Public
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Auth API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      health: 'GET /api/auth/health'
    }
  });
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', asyncHandler(async (req, res, next) => {
  const {
    username,
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    role = 'user',
    company,
    phone,
    agreeToTerms
  } = req.body;

  // Validation
  if (!username || !email || !password || !firstName || !lastName) {
    return next(new AppError('Please provide all required fields', 400));
  }

  if (!agreeToTerms) {
    return next(new AppError('Please agree to the terms and conditions', 400));
  }

  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  // Validate email
  if (!validator.isEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // Validate username
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return next(new AppError('Username must be 3-20 characters long and can only contain letters, numbers, and underscores', 400));
  }

  // Validate password strength
  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }

  if (!/[A-Z]/.test(password)) {
    return next(new AppError('Password must contain at least one uppercase letter', 400));
  }

  if (!/[a-z]/.test(password)) {
    return next(new AppError('Password must contain at least one lowercase letter', 400));
  }

  if (!/[0-9]/.test(password)) {
    return next(new AppError('Password must contain at least one number', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError('Email already registered. Please use a different email or try logging in.', 400));
    }
    if (existingUser.username === username) {
      return next(new AppError('Username already exists. Please choose a different username.', 400));
    }
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    role,
    company,
    phone,
    isVerified: true // Auto-verify for now
  });

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  user.password = undefined;

  res.status(201).json({
    success: true,
    message: `Account created successfully! Welcome to Addwise Tracker, ${firstName}!`,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
        phone: user.phone,
        signupTime: user.createdAt
      },
      token
    }
  });
}));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res, next) => {
  const { username, password, role } = req.body;

  // Validation
  if (!username || !password) {
    return next(new AppError('Please provide username and password', 400));
  }

  // Check if it's super admin login
  if (username === 'superadmin' && role === 'superadmin') {
    try {
      // Find super admin user in database
      const superAdmin = await User.findOne({ 
        username: 'superadmin',
        role: 'superadmin'
      }).select('+password');

      if (!superAdmin) {
        return next(new AppError('Super admin account not found', 401));
      }

      // Verify password
      const isPasswordValid = await superAdmin.comparePassword(password);
      if (!isPasswordValid) {
        return next(new AppError('Invalid super admin credentials', 401));
      }

      return res.json({
        success: true,
        requiresOTP: true,
        message: 'Please verify your identity with OTP'
      });
    } catch (error) {
      console.error('Super admin login error:', error);
      return next(new AppError('Authentication failed', 500));
    }
  }

  try {
    // Find user by credentials
    const user = await User.findByCredentials(username, password);

    // Check role if specified
    if (role && user.role !== role) {
      return res.status(400).json({
        success: false,
        message: `This account is registered as a ${user.role}. Please switch to the ${user.role} login or use the role switcher.`,
        correctRole: user.role,
        redirectUrl: `/login/${user.role}`
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Prepare user data for response
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      company: user.company,
      phone: user.phone,
      signupTime: user.createdAt,
      loginTime: new Date().toISOString()
    };

    res.json({
      success: true,
      message: `Welcome back, ${user.firstName}! (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`,
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    // Check if user exists with different credentials
    const userExists = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (userExists) {
      return next(new AppError('Incorrect password. Please try again.', 401));
    } else {
      return next(new AppError(`No account found with username "${username}". Please check your username or sign up for a new account.`, 401));
    }
  }
}));

// @desc    Send QR code via email
// @route   POST /api/auth/send-qr-email
// @access  Private
router.post('/send-qr-email', authenticate, asyncHandler(async (req, res, next) => {
  const { qrData, recipientEmail, deviceInfo } = req.body;

  if (!qrData || !recipientEmail) {
    return next(new AppError('Please provide QR data and recipient email', 400));
  }

  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: 'suman.tati2005@gmail.com',
      to: recipientEmail,
      subject: '🔐 GPS Tracker - QR Code for Device Tracking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0;">🗺️ GPS Tracker</h1>
              <h2 style="color: #333; margin: 10px 0;">QR Code for Device Tracking</h2>
            </div>

            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hello,
            </p>

            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Here is your QR code for GPS device tracking. Please scan this QR code with your mobile device to start tracking.
            </p>

            ${deviceInfo ? `
            <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Device Information:</h3>
              <p style="color: #666; margin: 5px 0;"><strong>Device ID:</strong> ${deviceInfo.deviceId || 'N/A'}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Description:</strong> ${deviceInfo.description || 'N/A'}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Purpose:</strong> ${deviceInfo.purpose || 'N/A'}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; display: inline-block;">
                <h3 style="margin: 0 0 10px 0;">QR Code Data:</h3>
                <p style="margin: 0; font-family: monospace; font-size: 14px; word-break: break-all;">${qrData}</p>
              </div>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>📱 Instructions:</strong><br>
                • Open the GPS Tracker app on your device<br>
                • Go to the QR Scanner section<br>
                • Scan this QR code to start tracking<br>
                • The device will be automatically registered for tracking
              </p>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              If you have any questions, please contact our support team at
              <a href="mailto:suman.tati2005@gmail.com" style="color: #007bff;">suman.tati2005@gmail.com</a>
            </p>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2024 GPS Tracker by ADDWISE. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ QR code email sent successfully to:', recipientEmail);
    
    res.json({
      success: true,
      message: 'QR code sent successfully via email'
    });
  } catch (error) {
    console.error('❌ Failed to send QR email:', error);
    return next(new AppError('Failed to send QR code email', 500));
  }
}));

// @desc    Send OTP for super admin login
// @route   POST /api/auth/superadmin-otp
// @access  Public
router.post('/superadmin-otp', asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // Find super admin user in database
    let user = await User.findOne({
      username: 'superadmin_1',
      role: 'superadmin'
    }).select('+password');

    // Create superadmin user if it doesn't exist
    if (!user) {
      console.log('👑 Creating superadmin_1 user...');
      user = await User.create({
        username: 'superadmin_1',
        email: 'sumanyadav.tati28@gmail.com',
        password: 'Suman@2005',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        company: 'Addwise Tracker',
        phone: '1234567890',
        isVerified: true,
        status: 'active'
      });
      console.log('✅ Superadmin user created successfully');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid super admin credentials', 401));
    }

    const otp = generateOTP();
    const email = 'sumanyadav.tati28@gmail.com';
    
    // Store OTP with expiration (10 minutes)
    otpStorage.set('superadmin_otp', {
      otp,
      email,
      userId: user._id,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, user.firstName);
    
    if (emailSent) {
      res.json({
        success: true,
        message: 'OTP sent to your email address'
      });
    } else {
      return next(new AppError('Failed to send OTP. Please try again.', 500));
    }
  } catch (error) {
    console.error('Super admin OTP error:', error);
    return next(new AppError('Authentication failed', 500));
  }
}));

// @desc    Verify super admin OTP and login
// @route   POST /api/auth/superadmin-verify
// @access  Public
router.post('/superadmin-verify', asyncHandler(async (req, res, next) => {
  const { otp } = req.body;

  if (!otp) {
    return next(new AppError('Please provide OTP', 400));
  }

  const storedOTPData = otpStorage.get('superadmin_otp');
  
  if (!storedOTPData) {
    return next(new AppError('No OTP request found. Please request OTP again.', 400));
  }

  if (Date.now() > storedOTPData.expiresAt) {
    otpStorage.delete('superadmin_otp');
    return next(new AppError('OTP has expired. Please request a new OTP.', 400));
  }

  if (storedOTPData.otp !== otp) {
    return next(new AppError('Invalid OTP. Please try again.', 400));
  }

  try {
    // Get super admin user from database
    const user = await User.findById(storedOTPData.userId);
    
    if (!user) {
      return next(new AppError('Super admin account not found', 401));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Prepare user data for response
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      company: user.company,
      phone: user.phone,
      signupTime: user.createdAt,
      loginTime: new Date().toISOString()
    };

    // Clear OTP after successful verification
    otpStorage.delete('superadmin_otp');

    res.json({
      success: true,
      message: 'Welcome back, Super Admin!',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Super admin verification error:', error);
    return next(new AppError('Authentication failed', 500));
  }
}));

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
        phone: user.phone,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  });
}));

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', authenticate, asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    company,
    phone
  } = req.body;

  // Build update object
  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (email) updateData.email = email;
  if (company) updateData.company = company;
  if (phone) updateData.phone = phone;

  // Validate email if provided
  if (email && !validator.isEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.user._id } 
    });
    
    if (existingUser) {
      return next(new AppError('Email already in use by another account', 400));
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
        phone: user.phone
      }
    }
  });
}));

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', authenticate, sensitiveOperationLimit(3), asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new AppError('Please provide current password, new password, and confirmation', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError('New passwords do not match', 400));
  }

  // Validate new password strength
  if (newPassword.length < 8) {
    return next(new AppError('New password must be at least 8 characters long', 400));
  }

  if (!/[A-Z]/.test(newPassword)) {
    return next(new AppError('New password must contain at least one uppercase letter', 400));
  }

  if (!/[a-z]/.test(newPassword)) {
    return next(new AppError('New password must contain at least one lowercase letter', 400));
  }

  if (!/[0-9]/.test(newPassword)) {
    return next(new AppError('New password must contain at least one number', 400));
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled on the client side
  // by removing the token. Here we just confirm the logout.
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', sensitiveOperationLimit(3), asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide your email address', 400));
  }

  if (!validator.isEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('No account found with this email address', 404));
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store OTP in memory (in production, use Redis or database)
  otpStorage.set(email, {
    otp,
    expiry: otpExpiry,
    userId: user._id,
    attempts: 0
  });

  // Send OTP email
  const emailSent = await sendOTPEmail(email, otp, user.firstName);

  if (!emailSent) {
    return next(new AppError('Failed to send OTP email. Please try again later.', 500));
  }

  res.json({
    success: true,
    message: `OTP sent successfully to ${email}. Please check your email and enter the 6-digit code.`,
    data: {
      email,
      expiresIn: '10 minutes'
    }
  });
}));

// @desc    Verify OTP and reset password
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', sensitiveOperationLimit(5), asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (!email || !otp || !newPassword || !confirmPassword) {
    return next(new AppError('Please provide email, OTP, and new password', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  // Validate new password strength
  if (newPassword.length < 8) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }

  // Check OTP
  const storedOTP = otpStorage.get(email);
  if (!storedOTP) {
    return next(new AppError('OTP expired or invalid. Please request a new one.', 400));
  }

  if (Date.now() > storedOTP.expiry) {
    otpStorage.delete(email);
    return next(new AppError('OTP has expired. Please request a new one.', 400));
  }

  if (storedOTP.otp !== otp) {
    storedOTP.attempts += 1;
    if (storedOTP.attempts >= 3) {
      otpStorage.delete(email);
      return next(new AppError('Too many invalid attempts. Please request a new OTP.', 400));
    }
    return next(new AppError(`Invalid OTP. ${3 - storedOTP.attempts} attempts remaining.`, 400));
  }

  // Find user and update password
  const user = await User.findById(storedOTP.userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Clear OTP from storage
  otpStorage.delete(email);

  res.json({
    success: true,
    message: 'Password reset successfully! You can now login with your new password.',
    data: {
      email: user.email,
      username: user.username
    }
  });
}));

// @desc    Verify JWT token and get current user
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return next(new AppError('No token provided', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
        phone: user.phone,
        signupTime: user.signupTime,
        lastUpdated: user.lastUpdated
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return next(new AppError('Invalid token', 401));
  }
}));

// @desc    Verify user password for sensitive operations
// @route   POST /api/auth/verify-password
// @access  Private
router.post('/verify-password', asyncHandler(async (req, res, next) => {
  const { userId, password } = req.body;
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return next(new AppError('No token provided', 401));
  }

  if (!userId || !password) {
    return next(new AppError('User ID and password are required', 400));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if the token belongs to the same user
    if (decoded.userId !== userId) {
      return next(new AppError('Unauthorized', 401));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return next(new AppError('Invalid password', 401));
    }

    res.json({
      success: true,
      message: 'Password verified successfully'
    });
  } catch (error) {
    console.error('Password verification error:', error);
    return next(new AppError('Password verification failed', 401));
  }
}));

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return next(new AppError('No token provided', 401));
  }

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current password and new password are required', 400));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await User.findByIdAndUpdate(decoded.userId, {
      password: hashedNewPassword,
      lastUpdated: new Date()
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    return next(new AppError('Password change failed', 500));
  }
}));

module.exports = router;
