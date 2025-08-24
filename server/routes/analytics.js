const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const AnalyticsService = require('../services/analyticsService');
const UserBehaviorService = require('../services/userBehaviorService');

// Initialize services
const analyticsService = new AnalyticsService();
const userBehaviorService = new UserBehaviorService();

// Mock analytics endpoint for development/testing
router.get('/mock', async (req, res) => {
  try {
    const mockData = {
      success: true,
      data: {
        totalImages: 1247,
        totalSavings: "23.4 MB",
        averageCompression: "68%",
        activeUsers: 89,
        recentActivity: [
          { type: "optimization", count: 45, time: "last hour" },
          { type: "uploads", count: 23, time: "last hour" },
          { type: "downloads", count: 67, time: "last hour" }
        ],
        compressionStats: {
          jpeg: { count: 456, savings: "12.3 MB" },
          png: { count: 234, savings: "8.9 MB" },
          webp: { count: 123, savings: "2.2 MB" }
        },
        usageByTime: {
          "00": 12, "01": 8, "02": 5, "03": 3, "04": 7, "05": 15,
          "06": 25, "07": 45, "08": 67, "09": 89, "10": 78, "11": 56,
          "12": 67, "13": 89, "14": 92, "15": 87, "16": 76, "17": 65,
          "18": 54, "19": 43, "20": 32, "21": 28, "22": 21, "23": 18
        }
      }
    };
    
    res.json(mockData);
  } catch (error) {
    console.error('Error serving mock analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve mock analytics data'
    });
  }
});

// Get analytics overview
router.get('/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    const report = await analyticsService.getAnalyticsReport({
      timeRange,
      includeInsights: true,
      includeRealTime: false
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics overview',
      message: error.message
    });
  }
});

// Get user behavior analytics
router.get('/user-behavior', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.query;
    
    let data;
    if (userId) {
      data = await userBehaviorService.getUserBehaviorReport(userId);
    } else {
      data = await userBehaviorService.getAggregateBehaviorReport();
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching user behavior analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user behavior analytics',
      message: error.message
    });
  }
});

// Track notification event
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const { eventType, data } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required'
      });
    }

    const result = await analyticsService.trackNotificationEvent(eventType, {
      ...data,
      userId: req.user.id,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error tracking notification event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      message: error.message
    });
  }
});

// Track user session
router.post('/session/start', authenticateToken, async (req, res) => {
  try {
    const sessionData = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    };

    const result = await userBehaviorService.trackUserSession(req.user.id, sessionData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error starting user session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session',
      message: error.message
    });
  }
});

// Track user activity
router.post('/session/activity', authenticateToken, async (req, res) => {
  try {
    const { activityType, activityData } = req.body;
    
    if (!activityType) {
      return res.status(400).json({
        success: false,
        error: 'Activity type is required'
      });
    }

    const result = await userBehaviorService.trackUserActivity(
      req.user.id,
      activityType,
      activityData
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error tracking user activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track activity',
      message: error.message
    });
  }
});

// End user session
router.post('/session/end', authenticateToken, async (req, res) => {
  try {
    const result = await userBehaviorService.endUserSession(req.user.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error ending user session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
      message: error.message
    });
  }
});

// Export analytics data
router.post('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { format = 'json', timeRange = '7d' } = req.body;
    
    const exportData = await analyticsService.exportAnalyticsData(format, {
      timeRange,
      includeInsights: true,
      includeRealTime: false
    });

    res.setHeader('Content-Type', exportData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.data);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data',
      message: error.message
    });
  }
});

// Get real-time analytics
router.get('/realtime', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const realTimeData = analyticsService.getRealTimeData();
    
    res.json({
      success: true,
      data: realTimeData
    });
  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time data',
      message: error.message
    });
  }
});

// Get analytics insights
router.get('/insights', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const insights = await analyticsService.generateInsights();
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error fetching analytics insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights',
      message: error.message
    });
  }
});

// Get service status
router.get('/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const analyticsStatus = analyticsService.getStatus();
    const behaviorStatus = userBehaviorService.getStatus();
    
    res.json({
      success: true,
      data: {
        analytics: analyticsStatus,
        userBehavior: behaviorStatus,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service status',
      message: error.message
    });
  }
});

// Reset analytics data (admin only)
router.post('/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    analyticsService.resetAnalytics();
    
    res.json({
      success: true,
      message: 'Analytics data reset successfully'
    });
  } catch (error) {
    console.error('Error resetting analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset analytics data',
      message: error.message
    });
  }
});

module.exports = router;
