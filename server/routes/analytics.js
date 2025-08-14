const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const usageAnalytics = require('../services/usageAnalytics');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

/**
 * GET /api/analytics/user
 * Get current user's usage statistics
 */
router.get('/user', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const forceRefresh = req.query.refresh === 'true';
    
    logger.info(`Getting usage stats for user ${userId}`);
    
    const stats = await usageAnalytics.getUserUsageStats(userId, forceRefresh);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user analytics',
      details: error.message
    });
  }
}));

/**
 * GET /api/analytics/system
 * Get system-wide analytics (admin only)
 */
router.get('/system', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const adminUserId = req.user._id;
    const timeRange = req.query.range || 'month';
    
    logger.info(`Getting system analytics for admin ${adminUserId}, range: ${timeRange}`);
    
    const stats = await usageAnalytics.getSystemAnalytics(adminUserId, timeRange);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting system analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system analytics',
      details: error.message
    });
  }
}));

/**
 * GET /api/analytics/plans
 * Get plan distribution and limits
 */
router.get('/plans', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's current plan and limits
    const userStats = await usageAnalytics.getUserUsageStats(userId);
    
    res.json({
      success: true,
      data: {
        currentPlan: userStats.plan.current,
        limits: userStats.plan.limits,
        remaining: userStats.plan.remaining,
        usagePercentage: userStats.plan.usagePercentage
      }
    });
  } catch (error) {
    logger.error('Error getting plan analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get plan analytics',
      details: error.message
    });
  }
}));

/**
 * GET /api/analytics/activity
 * Get user's recent activity
 */
router.get('/activity', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 7;
    
    logger.info(`Getting activity for user ${userId}, last ${days} days`);
    
    const userStats = await usageAnalytics.getUserUsageStats(userId);
    
    // Filter recent activity to requested days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredActivity = userStats.recentActivity.filter(activity => 
      new Date(activity._id) >= cutoffDate
    );
    
    res.json({
      success: true,
      data: {
        recentActivity: filteredActivity,
        dailyBreakdown: userStats.dailyBreakdown,
        formatBreakdown: userStats.formatBreakdown
      }
    });
  } catch (error) {
    logger.error('Error getting activity analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity analytics',
      details: error.message
    });
  }
}));

/**
 * POST /api/analytics/track
 * Track an image processing event
 */
router.post('/track', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { originalName, originalSize, optimizedSize, processingTime, format } = req.body;
    
    if (!originalName || !originalSize) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: originalName, originalSize'
      });
    }
    
    logger.info(`Tracking image processing for user ${userId}: ${originalName}`);
    
    await usageAnalytics.trackImageProcessing(userId, {
      originalName,
      originalSize,
      optimizedSize,
      processingTime,
      format
    });
    
    res.json({
      success: true,
      message: 'Image processing tracked successfully'
    });
  } catch (error) {
    logger.error('Error tracking image processing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track image processing',
      details: error.message
    });
  }
}));

/**
 * GET /api/analytics/performance
 * Get performance metrics for the user
 */
router.get('/performance', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    logger.info(`Getting performance metrics for user ${userId}`);
    
    const userStats = await usageAnalytics.getUserUsageStats(userId);
    
    const performanceMetrics = {
      avgProcessingTime: userStats.currentMonth.avgProcessingTime,
      avgCompressionRatio: userStats.currentMonth.avgCompressionRatio,
      successRate: userStats.currentMonth.successRate,
      bandwidthSaved: userStats.currentMonth.bandwidthSaved,
      bandwidthSavedPercentage: userStats.currentMonth.bandwidthSavedPercentage,
      totalImages: userStats.currentMonth.images,
      totalOriginalSize: userStats.currentMonth.originalSize,
      totalOptimizedSize: userStats.currentMonth.optimizedSize
    };
    
    res.json({
      success: true,
      data: performanceMetrics
    });
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics',
      details: error.message
    });
  }
}));

/**
 * GET /api/analytics/usage
 * Get detailed usage breakdown
 */
router.get('/usage', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const timeRange = req.query.range || 'month';
    
    logger.info(`Getting usage breakdown for user ${userId}, range: ${timeRange}`);
    
    const userStats = await usageAnalytics.getUserUsageStats(userId);
    
    const usageBreakdown = {
      currentMonth: userStats.currentMonth,
      plan: userStats.plan,
      recentActivity: userStats.recentActivity,
      formatBreakdown: userStats.formatBreakdown,
      dailyBreakdown: userStats.dailyBreakdown,
      lastUpdated: userStats.lastUpdated
    };
    
    res.json({
      success: true,
      data: usageBreakdown
    });
  } catch (error) {
    logger.error('Error getting usage breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage breakdown',
      details: error.message
    });
  }
}));

/**
 * POST /api/analytics/clear-cache
 * Clear analytics cache for the current user
 */
router.post('/clear-cache', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    logger.info(`Clearing analytics cache for user ${userId}`);
    
    usageAnalytics.clearUserCache(userId);
    
    res.json({
      success: true,
      message: 'Analytics cache cleared successfully'
    });
  } catch (error) {
    logger.error('Error clearing analytics cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear analytics cache',
      details: error.message
    });
  }
}));

module.exports = router;
