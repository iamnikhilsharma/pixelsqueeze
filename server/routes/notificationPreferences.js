const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const NotificationPreference = require('../models/NotificationPreference');

// Get notification preferences for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ userId: req.user.id });
    
    if (!preferences) {
      preferences = await NotificationPreference.create({ userId: req.user.id });
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences',
      message: error.message
    });
  }
});

// Get notification preferences for a specific user (admin only)
router.get('/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const preferences = await NotificationPreference.findOne({ userId: req.params.userId });
    
    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: 'Notification preferences not found'
      });
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching user notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences',
      message: error.message
    });
  }
});

// Update notification preferences for current user
router.put('/', authenticateToken, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ userId: req.user.id });
    
    if (!preferences) {
      preferences = new NotificationPreference({ userId: req.user.id });
    }

    // Update preferences
    const updatedPreferences = await preferences.updatePreferences(req.body);

    res.json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
      message: error.message
    });
  }
});

// Update notification preferences for a specific user (admin only)
router.put('/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ userId: req.params.userId });
    
    if (!preferences) {
      preferences = new NotificationPreference({ userId: req.params.userId });
    }

    // Update preferences
    const updatedPreferences = await preferences.updatePreferences(req.body);

    res.json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Error updating user notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
      message: error.message
    });
  }
});

// Reset notification preferences to defaults
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ userId: req.user.id });
    
    if (!preferences) {
      preferences = new NotificationPreference({ userId: req.user.id });
    }

    const resetPreferences = await preferences.resetToDefaults();

    res.json({
      success: true,
      data: resetPreferences,
      message: 'Notification preferences reset to defaults'
    });
  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset notification preferences',
      message: error.message
    });
  }
});

// Reset notification preferences for a specific user (admin only)
router.post('/:userId/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ userId: req.params.userId });
    
    if (!preferences) {
      preferences = new NotificationPreference({ userId: req.params.userId });
    }

    const resetPreferences = await preferences.resetToDefaults();

    res.json({
      success: true,
      data: resetPreferences,
      message: 'Notification preferences reset to defaults'
    });
  } catch (error) {
    console.error('Error resetting user notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset notification preferences',
      message: error.message
    });
  }
});

// Get all notification preferences (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { 'userId.name': { $regex: search, $options: 'i' } },
        { 'userId.email': { $regex: search, $options: 'i' } }
      ];
    }

    const [preferences, total] = await Promise.all([
      NotificationPreference.find(query)
        .populate('userId', 'name email')
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .sort({ updatedAt: -1 }),
      NotificationPreference.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: preferences,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching all notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences',
      message: error.message
    });
  }
});

// Get notification preferences summary (admin only)
router.get('/admin/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const summary = await NotificationPreference.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          emailEnabled: {
            $sum: { $cond: ['$email.enabled', 1, 0] }
          },
          inAppEnabled: {
            $sum: { $cond: ['$inApp.enabled', 1, 0] }
          },
          pushEnabled: {
            $sum: { $cond: ['$push.enabled', 1, 0] }
          },
          quietHoursEnabled: {
            $sum: { $cond: ['$quietHours.enabled', 1, 0] }
          },
          customRulesCount: {
            $sum: { $size: '$customRules' }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: summary[0] || {
        totalUsers: 0,
        emailEnabled: 0,
        inAppEnabled: 0,
        pushEnabled: 0,
        quietHoursEnabled: 0,
        customRulesCount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching notification preferences summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences summary',
      message: error.message
    });
  }
});

// Bulk update notification preferences (admin only)
router.post('/admin/bulk-update', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userIds, updates } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0 || !updates) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array and updates object are required'
      });
    }

    const results = [];
    for (const userId of userIds) {
      try {
        let preferences = await NotificationPreference.findOne({ userId });
        
        if (!preferences) {
          preferences = new NotificationPreference({ userId });
        }

        const updatedPreferences = await preferences.updatePreferences(updates);
        results.push({
          userId,
          success: true,
          data: updatedPreferences
        });
      } catch (error) {
        results.push({
          userId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        success: successCount,
        failure: failureCount
      }
    });
  } catch (error) {
    console.error('Error bulk updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update notification preferences',
      message: error.message
    });
  }
});

// Test notification preferences
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { channel = 'email', type = 'info', category = 'system', priority = 'medium' } = req.body;
    
    let preferences = await NotificationPreference.findOne({ userId: req.user.id });
    
    if (!preferences) {
      preferences = new NotificationPreference({ userId: req.user.id });
    }

    const testNotification = {
      type,
      category,
      priority
    };

    const shouldSend = preferences.shouldSendNotification(testNotification, channel);

    res.json({
      success: true,
      data: {
        shouldSend,
        preferences: preferences[channel],
        quietHours: preferences.quietHours,
        customRules: preferences.customRules
      }
    });
  } catch (error) {
    console.error('Error testing notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test notification preferences',
      message: error.message
    });
  }
});

module.exports = router;
