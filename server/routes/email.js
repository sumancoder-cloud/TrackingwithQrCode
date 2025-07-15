const express = require('express');
const router = express.Router();
const { sendQRCodeEmail, testEmailConfig } = require('../services/emailService');
const { authenticate, authorize } = require('../middleware/auth');
const Device = require('../models/Device');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');

// @desc    Test email configuration
// @route   GET /api/email/test
// @access  Private (Admin/SuperAdmin)
router.get('/test', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  try {
    const isValid = await testEmailConfig();
    
    if (isValid) {
      res.json({
        success: true,
        message: 'Email configuration is valid and ready to send emails'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email configuration test failed. Please check your email settings.'
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email configuration',
      error: error.message
    });
  }
}));

// @desc    Send QR codes via email
// @route   POST /api/email/send-qr-codes
// @access  Private (Admin/SuperAdmin)
router.post('/send-qr-codes', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  try {
    const { userIds, qrCodeIds, customMessage } = req.body;

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one user ID'
      });
    }

    if (!qrCodeIds || !Array.isArray(qrCodeIds) || qrCodeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one QR code ID'
      });
    }

    // Get users from database
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid users found'
      });
    }

    // Get QR codes from database with security filtering
    const qrQuery = { deviceId: { $in: qrCodeIds } };

    // 🔒 SECURITY: Admins can only send QR codes they created, SuperAdmins can send any
    if (req.user.role === 'admin') {
      qrQuery.createdBy = req.user._id;
      console.log(`🔒 Admin ${req.user.username} can only send QR codes they created`);
    } else if (req.user.role === 'superadmin') {
      console.log(`👑 SuperAdmin ${req.user.username} can send any QR codes`);
    }

    const qrCodes = await Device.find(qrQuery);
    if (qrCodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: req.user.role === 'admin'
          ? 'No valid QR codes found that you created. Admins can only send QR codes they generated.'
          : 'No valid QR codes found'
      });
    }

    // Check if QR codes are available (not assigned)
    const assignedQRs = qrCodes.filter(qr => qr.assignedTo);
    if (assignedQRs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some QR codes are already assigned: ${assignedQRs.map(qr => qr.deviceId).join(', ')}`
      });
    }

    const results = [];
    const errors = [];

    // Send emails to each user
    for (const user of users) {
      try {
        // Prepare QR codes data for email
        const qrCodesForEmail = qrCodes.map(qr => ({
          qrId: qr.deviceId,
          deviceCode: qr.deviceId,
          deviceName: qr.name || qr.deviceName,
          purpose: qr.purpose,
          description: qr.description
        }));

        // Send email
        const emailResult = await sendQRCodeEmail(
          user.email,
          `${user.firstName} ${user.lastName}` || user.username,
          qrCodesForEmail,
          `${req.user.firstName} ${req.user.lastName}` || req.user.username
        );

        results.push({
          user: {
            id: user._id,
            name: `${user.firstName} ${user.lastName}` || user.username,
            email: user.email
          },
          emailResult,
          qrCodesCount: qrCodes.length
        });

        console.log(`✅ Email sent to ${user.email} with ${qrCodes.length} QR codes`);

      } catch (emailError) {
        console.error(`❌ Failed to send email to ${user.email}:`, emailError);
        errors.push({
          user: {
            id: user._id,
            name: `${user.firstName} ${user.lastName}` || user.username,
            email: user.email
          },
          error: emailError.message
        });
      }
    }

    // Return results
    res.json({
      success: true,
      message: `Email sending completed. ${results.length} successful, ${errors.length} failed.`,
      results: {
        successful: results,
        failed: errors,
        totalUsers: users.length,
        totalQRCodes: qrCodes.length,
        successCount: results.length,
        errorCount: errors.length
      }
    });

  } catch (error) {
    console.error('Send QR codes email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send QR codes via email',
      error: error.message
    });
  }
}));

// @desc    Send test email
// @route   POST /api/email/send-test
// @access  Private (Admin/SuperAdmin)
router.post('/send-test', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a test email address'
      });
    }

    // Create sample QR codes for testing
    const sampleQRCodes = [
      {
        qrId: 'TEST-QR-001',
        deviceCode: 'TEST-QR-001',
        deviceName: 'Test GPS Device',
        purpose: 'Testing',
        description: 'This is a test QR code for email functionality'
      }
    ];

    // Send test email
    const emailResult = await sendQRCodeEmail(
      testEmail,
      'Test User',
      sampleQRCodes,
      `${req.user.firstName} ${req.user.lastName}` || req.user.username
    );

    res.json({
      success: true,
      message: 'Test email sent successfully',
      emailResult,
      testEmail
    });

  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
}));

// @desc    Download QR code image
// @route   GET /api/email/qr/:qrCodeId
// @access  Public (for email links)
router.get('/qr/:qrCodeId', asyncHandler(async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    // Validate QR code ID
    if (!qrCodeId || qrCodeId.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code ID'
      });
    }

    // Generate QR code image as buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeId, {
      width: 400,
      margin: 3,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      type: 'image/png'
    });

    // Set headers for image download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="QR_Code_${qrCodeId}.png"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    // Send the image
    res.send(qrCodeBuffer);

  } catch (error) {
    console.error('❌ Failed to generate QR code image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code image',
      error: error.message
    });
  }
}));

module.exports = router;
