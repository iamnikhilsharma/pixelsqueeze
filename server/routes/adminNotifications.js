const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

// Get admin notification statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [notificationStats, preferenceStats] = await Promise.all([
      Notification.getStats(undefined, true),
      NotificationPreference.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            emailEnabled: { $sum: { $cond: ['$email.enabled', 1, 0] } },
            inAppEnabled: { $sum: { $cond: ['$inApp.enabled', 1, 0] } },
            pushEnabled: { $sum: { $cond: ['$push.enabled', 1, 0] } },
            quietHoursEnabled: { $sum: { $cond: ['$quietHours.enabled', 1, 0] } }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        notifications: notificationStats[0] || {
          total: 0,
          byType: {},
          byCategory: {},
          byPriority: {}
        },
        preferences: preferenceStats[0] || {
          totalUsers: 0,
          emailEnabled: 0,
          inAppEnabled: 0,
          pushEnabled: 0,
          quietHoursEnabled: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics',
      message: error.message
    });
  }
});

// Get notification preferences for all users
router.get('/preferences', authenticateToken, requireAdmin, async (req, res) => {
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
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences',
      message: error.message
    });
  }
});

// Get notification preferences summary
router.get('/preferences/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const summary = await NotificationPreference.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          emailEnabled: { $sum: { $cond: ['$email.enabled', 1, 0] } },
          inAppEnabled: { $sum: { $cond: ['$inApp.enabled', 1, 0] } },
          pushEnabled: { $sum: { $cond: ['$push.enabled', 1, 0] } },
          quietHoursEnabled: { $sum: { $cond: ['$quietHours.enabled', 1, 0] } },
          customRulesCount: { $sum: { $size: '$customRules' } }
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

// Bulk update notification preferences
router.post('/preferences/bulk-update', authenticateToken, requireAdmin, async (req, res) => {
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

// Get notification templates
router.get('/templates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // This would typically come from a database, but for now we'll return static templates
    const templates = [
      {
        id: 'welcome',
        name: 'Welcome Notification',
        subject: 'Welcome to PixelSqueeze!',
        body: 'Welcome {{userName}}! We\'re excited to have you on board.',
        variables: ['userName'],
        isActive: true
      },
      {
        id: 'subscription_upgrade',
        name: 'Subscription Upgrade',
        subject: 'Your subscription has been upgraded',
        body: 'Congratulations! Your subscription has been upgraded to {{planName}}.',
        variables: ['planName'],
        isActive: true
      },
      {
        id: 'system_maintenance',
        name: 'System Maintenance',
        subject: 'Scheduled Maintenance Notice',
        body: 'We will be performing scheduled maintenance on {{date}} from {{startTime}} to {{endTime}}.',
        variables: ['date', 'startTime', 'endTime'],
        isActive: true
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification templates',
      message: error.message
    });
  }
});

// Update notification template
router.put('/templates/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body, variables, isActive } = req.body;

    // In a real implementation, this would update a database
    // For now, we'll just return success
    res.json({
      success: true,
      data: {
        id,
        name,
        subject,
        body,
        variables,
        isActive
      },
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification template',
      message: error.message
    });
  }
});

// Toggle notification template
router.put('/templates/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, this would toggle the template in a database
    // For now, we'll just return success
    res.json({
      success: true,
      data: { id, isActive: true },
      message: 'Template toggled successfully'
    });
  } catch (error) {
    console.error('Error toggling notification template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle notification template',
      message: error.message
    });
  }
});

// Get notification schedules
router.get('/schedules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // This would typically come from a database, but for now we'll return static schedules
    const schedules = [
      {
        id: 'daily_summary',
        name: 'Daily Summary Report',
        frequency: 'daily',
        time: '09:00',
        format: 'csv',
        email: 'admin@example.com',
        isActive: true
      },
      {
        id: 'weekly_analytics',
        name: 'Weekly Analytics Report',
        frequency: 'weekly',
        time: '08:00',
        format: 'pdf',
        email: 'analytics@example.com',
        isActive: true
      }
    ];

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching notification schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification schedules',
      message: error.message
    });
  }
});

// Create notification schedule
router.post('/schedules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, frequency, time, format, email } = req.body;

    if (!name || !frequency || !time || !format || !email) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // In a real implementation, this would create a schedule in a database
    // For now, we'll just return success
    const newSchedule = {
      id: `schedule_${Date.now()}`,
      name,
      frequency,
      time,
      format,
      email,
      isActive: true
    };

    res.status(201).json({
      success: true,
      data: newSchedule
    });
  } catch (error) {
    console.error('Error creating notification schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification schedule',
      message: error.message
    });
  }
});

// Toggle notification schedule
router.put('/schedules/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, this would toggle the schedule in a database
    // For now, we'll just return success
    res.json({
      success: true,
      data: { id, isActive: true },
      message: 'Schedule toggled successfully'
    });
  } catch (error) {
    console.error('Error toggling notification schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle notification schedule',
      message: error.message
    });
  }
});

// Delete notification schedule
router.delete('/schedules/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, this would delete the schedule from a database
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification schedule',
      message: error.message
    });
  }
});

module.exports = router;
