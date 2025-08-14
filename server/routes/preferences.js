const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const userPreferences = require('../services/userPreferences');
const { logger } = require('../utils/logger');

// Get user preferences
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const preferences = await userPreferences.getUserPreferences(req.user.id);
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error getting user preferences:', error);
    res.status(500).json({ error: 'Failed to get user preferences' });
  }
}));

// Update user preferences
router.put('/', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid updates data' });
    }

    const updatedPreferences = await userPreferences.updateUserPreferences(req.user.id, updates);
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedPreferences
    });
  } catch (error) {
    logger.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
}));

// Save watermark template
router.post('/watermark/templates', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const template = req.body;
    
    if (!template.name) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    const savedTemplate = await userPreferences.saveWatermarkTemplate(req.user.id, template);
    
    res.json({
      success: true,
      message: 'Watermark template saved successfully',
      data: savedTemplate
    });
  } catch (error) {
    logger.error('Error saving watermark template:', error);
    res.status(500).json({ error: 'Failed to save watermark template' });
  }
}));

// Get saved watermark templates
router.get('/watermark/templates', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const templates = await userPreferences.getSavedItems(req.user.id, 'watermark');
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error getting watermark templates:', error);
    res.status(500).json({ error: 'Failed to get watermark templates' });
  }
}));

// Delete watermark template
router.delete('/watermark/templates/:templateId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const result = await userPreferences.deleteSavedItem(req.user.id, 'watermark', templateId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error deleting watermark template:', error);
    res.status(500).json({ error: 'Failed to delete watermark template' });
  }
}));

// Save thumbnail preset
router.post('/thumbnail/presets', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const preset = req.body;
    
    if (!preset.name) {
      return res.status(400).json({ error: 'Preset name is required' });
    }

    const savedPreset = await userPreferences.saveThumbnailPreset(req.user.id, preset);
    
    res.json({
      success: true,
      message: 'Thumbnail preset saved successfully',
      data: savedPreset
    });
  } catch (error) {
    logger.error('Error saving thumbnail preset:', error);
    res.status(500).json({ error: 'Failed to save thumbnail preset' });
  }
}));

// Get saved thumbnail presets
router.get('/thumbnail/presets', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const presets = await userPreferences.getSavedItems(req.user.id, 'thumbnail');
    
    res.json({
      success: true,
      data: presets
    });
  } catch (error) {
    logger.error('Error getting thumbnail presets:', error);
    res.status(500).json({ error: 'Failed to get thumbnail presets' });
  }
}));

// Delete thumbnail preset
router.delete('/thumbnail/presets/:presetId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { presetId } = req.params;
    
    const result = await userPreferences.deleteSavedItem(req.user.id, 'thumbnail', presetId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error deleting thumbnail preset:', error);
    res.status(500).json({ error: 'Failed to delete thumbnail preset' });
  }
}));

// Save analysis profile
router.post('/analysis/profiles', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const profile = req.body;
    
    if (!profile.name) {
      return res.status(400).json({ error: 'Profile name is required' });
    }

    const savedProfile = await userPreferences.saveAnalysisProfile(req.user.id, profile);
    
    res.json({
      success: true,
      message: 'Analysis profile saved successfully',
      data: savedProfile
    });
  } catch (error) {
    logger.error('Error saving analysis profile:', error);
    res.status(500).json({ error: 'Failed to save analysis profile' });
  }
}));

// Get saved analysis profiles
router.get('/analysis/profiles', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const profiles = await userPreferences.getSavedItems(req.user.id, 'analysis');
    
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    logger.error('Error getting analysis profiles:', error);
    res.status(500).json({ error: 'Failed to get analysis profiles' });
  }
}));

// Delete analysis profile
router.delete('/analysis/profiles/:profileId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const result = await userPreferences.deleteSavedItem(req.user.id, 'analysis', profileId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error deleting analysis profile:', error);
    res.status(500).json({ error: 'Failed to delete analysis profile' });
  }
}));

// Save optimization profile
router.post('/optimization/profiles', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const profile = req.body;
    
    if (!profile.name) {
      return res.status(400).json({ error: 'Profile name is required' });
    }

    const savedProfile = await userPreferences.saveOptimizationProfile(req.user.id, profile);
    
    res.json({
      success: true,
      message: 'Optimization profile saved successfully',
      data: savedProfile
    });
  } catch (error) {
    logger.error('Error saving optimization profile:', error);
    res.status(500).json({ error: 'Failed to save optimization profile' });
  }
}));

// Get saved optimization profiles
router.get('/optimization/profiles', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const profiles = await userPreferences.getSavedItems(req.user.id, 'optimization');
    
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    logger.error('Error getting optimization profiles:', error);
    res.status(500).json({ error: 'Failed to get optimization profiles' });
  }
}));

// Delete optimization profile
router.delete('/optimization/profiles/:profileId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const result = await userPreferences.deleteSavedItem(req.user.id, 'optimization', profileId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error deleting optimization profile:', error);
    res.status(500).json({ error: 'Failed to delete optimization profile' });
  }
}));

// Update dashboard preferences
router.put('/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { dashboard } = req.body;
    
    if (!dashboard || typeof dashboard !== 'object') {
      return res.status(400).json({ error: 'Invalid dashboard preferences' });
    }

    const updatedPreferences = await userPreferences.updateUserPreferences(req.user.id, { dashboard });
    
    res.json({
      success: true,
      message: 'Dashboard preferences updated successfully',
      data: updatedPreferences.dashboard
    });
  } catch (error) {
    logger.error('Error updating dashboard preferences:', error);
    res.status(500).json({ error: 'Failed to update dashboard preferences' });
  }
}));

// Update notification preferences
router.put('/notifications', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { notifications } = req.body;
    
    if (!notifications || typeof notifications !== 'object') {
      return res.status(400).json({ error: 'Invalid notification preferences' });
    }

    const updatedPreferences = await userPreferences.updateUserPreferences(req.user.id, { notifications });
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: updatedPreferences.notifications
    });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
}));

// Update theme preferences
router.put('/theme', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!theme || typeof theme !== 'object') {
      return res.status(400).json({ error: 'Invalid theme preferences' });
    }

    const updatedPreferences = await userPreferences.updateUserPreferences(req.user.id, { theme });
    
    res.json({
      success: true,
      message: 'Theme preferences updated successfully',
      data: updatedPreferences.theme
    });
  } catch (error) {
    logger.error('Error updating theme preferences:', error);
    res.status(500).json({ error: 'Failed to update theme preferences' });
  }
}));

// Reset user preferences to defaults
router.post('/reset', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const resetPreferences = await userPreferences.resetUserPreferences(req.user.id);
    
    res.json({
      success: true,
      message: 'Preferences reset to defaults successfully',
      data: resetPreferences
    });
  } catch (error) {
    logger.error('Error resetting user preferences:', error);
    res.status(500).json({ error: 'Failed to reset user preferences' });
  }
}));

// Export user preferences
router.get('/export', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const exportData = await userPreferences.exportUserPreferences(req.user.id);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="preferences-${Date.now()}.json"`);
    
    res.json(exportData);
  } catch (error) {
    logger.error('Error exporting user preferences:', error);
    res.status(500).json({ error: 'Failed to export user preferences' });
  }
}));

// Import user preferences
router.post('/import', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const importData = req.body;
    
    if (!importData || !importData.preferences) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    const result = await userPreferences.importUserPreferences(req.user.id, importData);
    
    res.json({
      success: true,
      message: result.message,
      data: result.preferences
    });
  } catch (error) {
    logger.error('Error importing user preferences:', error);
    res.status(500).json({ error: 'Failed to import user preferences' });
  }
}));

module.exports = router;
