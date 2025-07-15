const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

// Email configuration
const emailConfig = {
  // Gmail configuration (you can change this to any email provider)
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Add your email
    pass: process.env.EMAIL_PASS || 'your-app-password'     // Add your app password
  }
};

// Create transporter
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport(emailConfig);
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    throw error;
  }
};

// Send QR code email
const sendQRCodeEmail = async (recipientEmail, recipientName, qrCodes, senderName = 'GPS Tracker Admin') => {
  try {
    const transporter = createTransporter();

    // Generate QR codes list with download links (no attachments needed)
    const qrCodesList = qrCodes.map((qr, index) => {
      const qrCodeId = qr.qrId || qr.deviceCode;
      const downloadUrl = `http://localhost:5001/api/email/qr/${qrCodeId}`;

      return `
        <div style="margin: 20px 0; padding: 20px; border: 2px solid #4a148c; border-radius: 10px; background-color: #f9f9f9; text-align: center;">
          <h4 style="color: #4a148c; margin: 0 0 15px 0;">📱 QR Code: ${qrCodeId}</h4>

          <div style="margin: 15px 0; padding: 15px; background-color: #fff; border-radius: 8px; border: 2px dashed #4a148c;">
            <p style="margin: 0 0 10px 0; color: #4a148c; font-weight: bold; font-size: 16px;">📥 Download Your QR Code</p>
            <a href="${downloadUrl}"
               style="display: inline-block; padding: 12px 25px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin: 10px 0;"
               download="QR_Code_${qrCodeId}.png">
              📱 Download QR Code (PNG)
            </a>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
              Click the button above to download the QR code image to your device
            </p>
          </div>

          <div style="margin: 15px 0; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>Device:</strong> ${qr.deviceName || qr.purpose || 'GPS Device'}</p>
            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${qr.purpose || 'General Use'}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${qr.description || 'No description'}</p>
          </div>

          <div style="margin: 15px 0; padding: 10px; background-color: #e8f4fd; border-radius: 5px;">
            <strong>🔗 QR Code ID:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px; font-size: 14px;">${qrCodeId}</code>
          </div>

          <div style="margin: 15px 0; padding: 10px; background-color: #d4edda; border-radius: 5px;">
            <p style="margin: 0; color: #155724; font-weight: bold;">📱 How to Use:</p>
            <p style="margin: 5px 0; color: #155724; font-size: 14px;">
              1. Click "Download QR Code" button above<br>
              2. Save the PNG image to your device<br>
              3. Open GPS Tracker app → "My Devices" → "Upload QR"<br>
              4. Select the downloaded image and register your device
            </p>
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>GPS Tracker - QR Code Assignment</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
        <h1 style="margin: 0; font-size: 28px;">📍 GPS Tracker System</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">QR Code Assignment Notification</p>
      </div>

      <div style="margin-bottom: 25px;">
        <h2 style="color: #4a148c; border-bottom: 2px solid #4a148c; padding-bottom: 10px;">Hello ${recipientName}! 👋</h2>
        <p style="font-size: 16px; margin: 15px 0;">
          You have been assigned <strong>${qrCodes.length}</strong> QR code${qrCodes.length > 1 ? 's' : ''} for GPS tracking.
          Each QR code includes a <strong>downloadable image</strong> that you can scan with your device camera.
        </p>
        <div style="margin: 15px 0; padding: 15px; background-color: #e8f5e8; border-left: 4px solid #28a745; border-radius: 5px;">
          <p style="margin: 0; color: #155724; font-weight: bold;">📱 Two Ways to Use Your QR Codes:</p>
          <p style="margin: 5px 0; color: #155724;">
            <strong>Method 1:</strong> Download the QR code images below and scan them with your camera<br>
            <strong>Method 2:</strong> Use manual entry with the QR Code ID in the GPS Tracker app
          </p>
        </div>
      </div>

      <div style="margin: 25px 0;">
        <h3 style="color: #4a148c; margin-bottom: 15px;">📋 Your Assigned QR Code${qrCodes.length > 1 ? 's' : ''}:</h3>
        ${qrCodesList}
      </div>

      <div style="margin: 25px 0; padding: 20px; background-color: #f0f8ff; border-left: 4px solid #4a148c; border-radius: 5px;">
        <h3 style="color: #4a148c; margin-top: 0;">📱 How to Register Your QR Codes:</h3>

        <div style="margin: 15px 0;">
          <h4 style="color: #4a148c; margin: 10px 0;">📥 Method 1: Download & Upload QR Code (Recommended)</h4>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Click the "Download QR Code" button</strong> above to save the PNG image</li>
            <li><strong>Login</strong> to the GPS Tracker system</li>
            <li>Go to <strong>"My Devices"</strong> section</li>
            <li>Click <strong>"Upload QR"</strong> and select your downloaded QR code image</li>
            <li>Complete the registration process</li>
            <li>Start tracking your device!</li>
          </ol>
        </div>

        <div style="margin: 15px 0;">
          <h4 style="color: #4a148c; margin: 10px 0;">⌨️ Method 2: Manual Entry</h4>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Login</strong> to the GPS Tracker system</li>
            <li>Go to <strong>"My Devices"</strong> section</li>
            <li>Click <strong>"Manual Entry"</strong></li>
            <li>Enter the QR Code ID provided above</li>
            <li>Complete the registration process</li>
            <li>Start tracking your device!</li>
          </ol>
        </div>
      </div>

      <div style="margin: 25px 0; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
        <h4 style="color: #856404; margin-top: 0;">⚠️ Important Notes:</h4>
        <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
          <li>Each QR code can only be registered once</li>
          <li>Keep your QR codes secure and private</li>
          <li>Contact admin if you face any issues</li>
          <li>QR codes are case-sensitive</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <p style="margin: 0; color: #6c757d;">
          📧 This email was sent by <strong>${senderName}</strong><br>
          🕒 Date: ${new Date().toLocaleString()}<br>
          🌐 GPS Tracker System
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; padding: 15px; border-top: 1px solid #ddd;">
        <p style="margin: 0; color: #888; font-size: 12px;">
          This is an automated message from GPS Tracker System. Please do not reply to this email.
        </p>
      </div>

    </body>
    </html>
    `;

    const textContent = `
GPS Tracker - QR Code Assignment

Hello ${recipientName}!

You have been assigned ${qrCodes.length} QR code${qrCodes.length > 1 ? 's' : ''} for GPS tracking.
Each QR code includes a direct download link for a PNG image that you can scan with your device camera.

Your QR Code${qrCodes.length > 1 ? 's' : ''}:
${qrCodes.map(qr => `
- QR Code: ${qr.qrId || qr.deviceCode}
  Device: ${qr.deviceName || qr.purpose || 'GPS Device'}
  Purpose: ${qr.purpose || 'General Use'}
  Description: ${qr.description || 'No description'}
  Download Link: http://localhost:5001/api/email/qr/${qr.qrId || qr.deviceCode}
`).join('')}

How to Register (Method 1 - Recommended):
1. Click the download link above or use the download button in the email
2. Save the QR code JPG image to your device
3. Login to the GPS Tracker system
4. Go to "My Devices" section
5. Click "Upload QR" and select your downloaded QR code image
6. Complete the registration process
7. Start tracking your device!

How to Register (Method 2 - Manual Entry):
1. Login to the GPS Tracker system
2. Go to "My Devices" section
3. Click "Manual Entry"
4. Enter the QR Code ID provided above
5. Complete the registration process
6. Start tracking your device!

Important Notes:
- Each QR code can only be registered once
- Keep your QR codes secure and private
- Contact admin if you face any issues
- QR codes are case-sensitive

This email was sent by ${senderName}
Date: ${new Date().toLocaleString()}
GPS Tracker System
    `;

    const mailOptions = {
      from: `"GPS Tracker System" <${emailConfig.auth.user}>`,
      to: recipientEmail,
      subject: `📍 GPS Tracker - QR Code Assignment (${qrCodes.length} code${qrCodes.length > 1 ? 's' : ''})`,
      text: textContent,
      html: htmlContent
    };

    console.log('📧 Sending email to:', recipientEmail);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      recipient: recipientEmail,
      qrCodesCount: qrCodes.length
    };

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    return false;
  }
};

module.exports = {
  sendQRCodeEmail,
  testEmailConfig
};
