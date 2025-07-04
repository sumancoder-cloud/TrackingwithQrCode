import React, { useCallback } from 'react';
import QRCode from 'qrcode';

/**
 * Enhanced QR Code Generator Component
 * Generates professional QR codes with customizable styling
 */
const EnhancedQRGenerator = {
  
  /**
   * Generate a professional QR code with enhanced styling
   * @param {string} text - Text to encode in QR code
   * @param {object} options - Customization options
   * @returns {Promise<string>} - Base64 data URL of the QR code
   */
  generateProfessionalQR: async (text, options = {}) => {
    const defaultOptions = {
      // High resolution for crisp display
      width: 512,
      
      // Adequate quiet zone for clear positioning squares
      margin: 4,
      
      // Pure black and white for maximum contrast
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      
      // High error correction (30% recovery capability)
      errorCorrectionLevel: 'H',
      
      // PNG format for best quality
      type: 'image/png',
      quality: 1.0,
      
      // Enhanced rendering options
      rendererOpts: {
        quality: 1.0
      },
      
      // High scale factor for sharp edges
      scale: 8
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      console.log('🔄 Generating professional QR code...');
      const qrCodeDataURL = await QRCode.toDataURL(text, finalOptions);
      console.log('✅ Professional QR code generated successfully');
      return qrCodeDataURL;
    } catch (error) {
      console.error('❌ Error generating professional QR code:', error);
      throw error;
    }
  },

  /**
   * Generate QR code with custom styling to match specific format
   * @param {string} text - Text to encode
   * @param {string} style - Style preset ('professional', 'compact', 'large')
   * @returns {Promise<string>} - Base64 data URL
   */
  generateStyledQR: async (text, style = 'professional') => {
    const stylePresets = {
      professional: {
        width: 512,
        margin: 4,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#FFFFFF' },
        scale: 8
      },
      compact: {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#FFFFFF' },
        scale: 4
      },
      large: {
        width: 1024,
        margin: 6,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#FFFFFF' },
        scale: 12
      },
      // Custom style matching the sample QR code format
      sample_format: {
        width: 400,
        margin: 3,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#FFFFFF' },
        scale: 6,
        type: 'image/png',
        quality: 1.0,
        rendererOpts: {
          quality: 1.0
        }
      }
    };

    const options = stylePresets[style] || stylePresets.professional;
    return await EnhancedQRGenerator.generateProfessionalQR(text, options);
  },

  /**
   * Generate QR code with exact format matching the provided sample
   * @param {string} text - Text to encode
   * @returns {Promise<string>} - Base64 data URL
   */
  generateSampleFormatQR: async (text) => {
    const sampleFormatOptions = {
      // Optimized for clear positioning squares and professional appearance
      width: 400,
      margin: 3,
      color: {
        dark: '#000000',    // Pure black modules
        light: '#FFFFFF'    // Pure white background
      },
      errorCorrectionLevel: 'H',  // High error correction for reliability
      type: 'image/png',
      quality: 1.0,
      rendererOpts: {
        quality: 1.0
      },
      scale: 6  // Good balance between size and clarity
    };

    try {
      console.log('🔄 Generating QR code with sample format...');
      const qrCodeDataURL = await QRCode.toDataURL(text, sampleFormatOptions);
      console.log('✅ Sample format QR code generated successfully');
      return qrCodeDataURL;
    } catch (error) {
      console.error('❌ Error generating sample format QR code:', error);
      throw error;
    }
  },

  /**
   * Validate QR code data before generation
   * @param {string} text - Text to validate
   * @returns {boolean} - Whether the text is valid for QR generation
   */
  validateQRData: (text) => {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    // Check length (QR codes have limits)
    if (text.length > 4296) {
      console.warn('⚠️ Text too long for QR code generation');
      return false;
    }
    
    return true;
  },

  /**
   * Get QR code information
   * @param {string} text - Text to analyze
   * @returns {object} - QR code information
   */
  getQRInfo: (text) => {
    return {
      length: text.length,
      estimatedSize: Math.ceil(text.length / 100) * 100,
      recommendedErrorCorrection: text.length > 1000 ? 'H' : 'M',
      isValid: EnhancedQRGenerator.validateQRData(text)
    };
  }
};

export default EnhancedQRGenerator;
