const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

// Get all notifications for admin
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      category,
      priority,
      read,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      adminOnly: true,
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      category,
      priority,
      read: read !== undefined ? read === 'true' : undefined,
      search,
      dateRange: startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate)
      } : undefined,
      sortBy,
      sortOrder
    };

    const [notifications, stats] = await Promise.all([
      Notification.getNotifications(options),
      Notification.getStats(undefined, true)
    ]);

    res.json({
      success: true,
      data: notifications,
      stats: stats[0] || {
        total: 0,
        byType: {},
        byCategory: {},
        byPriority: {}
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Notification.countDocuments({ adminOnly: true })
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

// Get notifications for current user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      category,
      priority,
      read,
      search
    } = req.query;

    const options = {
      userId: req.user.id,
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      category,
      priority,
      read: read !== undefined ? read === 'true' : undefined,
      search
    };

    const [notifications, stats] = await Promise.all([
      Notification.getNotifications(options),
      Notification.getStats(req.user.id, false)
    ]);

    res.json({
      success: true,
      data: notifications,
      stats: stats[0] || {
        total: 0,
        byType: {},
        byCategory: {},
        byPriority: {}
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Notification.countDocuments({
          $or: [
            { userId: req.user.id },
            { adminOnly: false }
          ]
        })
      }
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

// Get notification by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('userId', 'name email');

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check if user can access this notification
    if (notification.userId && notification.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification',
      message: error.message
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check if user can access this notification
    if (notification.userId && notification.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const { adminOnly = false } = req.body;
    
    if (adminOnly && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const result = await Notification.markAllAsRead(
      adminOnly ? undefined : req.user.id,
      adminOnly
    );

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
      message: error.message
    });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check if user can delete this notification
    if (notification.userId && notification.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: error.message
    });
  }
});

// Create notification (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      type,
      title,
      message,
      category,
      priority = 'medium',
      userId,
      adminOnly = false,
      actionUrl,
      metadata,
      expiresAt
    } = req.body;

    // Validate required fields
    if (!type || !title || !message || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const notificationData = {
      type,
      title,
      message,
      category,
      priority,
      adminOnly,
      actionUrl,
      metadata,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    };

    let notification;
    if (userId) {
      notification = await Notification.createUserNotification(userId, notificationData);
    } else {
      notification = await Notification.createSystemNotification(notificationData);
    }

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
      message: error.message
    });
  }
});

// Create bulk notifications (admin only)
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { notifications } = req.body;

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Notifications array is required'
      });
    }

    // Validate each notification
    for (const notification of notifications) {
      if (!notification.type || !notification.title || !notification.message || !notification.category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields in notification'
        });
      }
    }

    const createdNotifications = await Notification.createBulkNotifications(notifications);

    res.status(201).json({
      success: true,
      data: createdNotifications,
      count: createdNotifications.length
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notifications',
      message: error.message
    });
  }
});

// Get notification statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { adminOnly = false } = req.query;
    
    if (adminOnly && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = await Notification.getStats(
      adminOnly ? undefined : req.user.id,
      adminOnly
    );

    res.json({
      success: true,
      data: stats[0] || {
        total: 0,
        byType: {},
        byCategory: {},
        byPriority: {}
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics',
      message: error.message
    });
  }
});

// Export notifications
router.post('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      format = 'csv',
      dateRange,
      includeFilters,
      notifications: notificationIds
    } = req.body;

    let notifications;
    if (notificationIds && Array.isArray(notificationIds)) {
      notifications = await Notification.find({
        _id: { $in: notificationIds }
      }).populate('userId', 'name email');
    } else {
      const options = {
        adminOnly: true,
        dateRange: dateRange ? {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        } : undefined
      };
      notifications = await Notification.getNotifications(options);
    }

    // Convert to export format
    let exportData;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'csv':
        exportData = convertToCSV(notifications);
        contentType = 'text/csv';
        filename = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'json':
        exportData = JSON.stringify(notifications, null, 2);
        contentType = 'application/json';
        filename = `notifications-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'pdf':
        // PDF generation would require additional libraries like puppeteer or jsPDF
        return res.status(400).json({
          success: false,
          error: 'PDF export not yet implemented'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported export format'
        });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export notifications',
      message: error.message
    });
  }
});

// Helper function to convert notifications to CSV
function convertToCSV(notifications) {
  const headers = [
    'ID',
    'Type',
    'Title',
    'Message',
    'Category',
    'Priority',
    'Read',
    'User ID',
    'Admin Only',
    'Created At',
    'Updated At'
  ];

  const rows = notifications.map(notification => [
    notification._id,
    notification.type,
    `"${notification.title.replace(/"/g, '""')}"`,
    `"${notification.message.replace(/"/g, '""')}"`,
    notification.category,
    notification.priority,
    notification.read,
    notification.userId?._id || '',
    notification.adminOnly,
    notification.createdAt,
    notification.updatedAt
  ]);

  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
}

module.exports = router;
