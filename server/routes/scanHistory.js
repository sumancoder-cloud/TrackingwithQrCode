const express = require('express');
const router = express.Router();
const ScanHistory = require('../models/ScanHistory');

// Save scan history
router.post('/save', async (req, res) => {
  try {
    console.log('📝 Saving scan history:', req.body);
    
    const scanHistoryData = new ScanHistory(req.body);
    const savedScanHistory = await scanHistoryData.save();
    
    console.log('✅ Scan history saved successfully:', savedScanHistory._id);
    
    res.json({
      success: true,
      message: 'Scan history saved successfully',
      scanHistory: savedScanHistory
    });
  } catch (error) {
    console.error('❌ Error saving scan history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save scan history',
      error: error.message
    });
  }
});

// Get scan history for a user
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log('📜 Getting scan history for user:', username);
    
    const scanHistory = await ScanHistory.find({ scannedBy: username })
      .sort({ scannedAt: -1 }) // Most recent first
      .limit(100); // Limit to last 100 scans
    
    console.log('✅ Found scan history:', scanHistory.length, 'entries');
    
    res.json({
      success: true,
      scanHistory: scanHistory
    });
  } catch (error) {
    console.error('❌ Error getting scan history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scan history',
      error: error.message
    });
  }
});

// Get scan history for a specific device
router.get('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    console.log('📜 Getting scan history for device:', deviceId);
    
    const scanHistory = await ScanHistory.find({ deviceId: deviceId })
      .sort({ scannedAt: -1 });
    
    console.log('✅ Found device scan history:', scanHistory.length, 'entries');
    
    res.json({
      success: true,
      scanHistory: scanHistory
    });
  } catch (error) {
    console.error('❌ Error getting device scan history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device scan history',
      error: error.message
    });
  }
});

// Delete scan history entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting scan history:', id);
    
    const deletedScanHistory = await ScanHistory.findByIdAndDelete(id);
    
    if (!deletedScanHistory) {
      return res.status(404).json({
        success: false,
        message: 'Scan history not found'
      });
    }
    
    console.log('✅ Scan history deleted successfully');
    
    res.json({
      success: true,
      message: 'Scan history deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting scan history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scan history',
      error: error.message
    });
  }
});

module.exports = router;
