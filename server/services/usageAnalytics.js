const Image = require('../models/Image');
const User = require('../models/User');
const { logger } = require('../utils/logger');

class UsageAnalytics {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get user's current month usage statistics
  async getUserUsageStats(userId, forceRefresh = false) {
    const cacheKey = `user_${userId}_stats`;
    
    // Check cache first
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Get user's subscription plan
      const user = await User.findById(userId).select('subscription.plan usage');
      if (!user) {
        throw new Error('User not found');
      }

      const plan = user.subscription?.plan || 'free';
      const planLimits = this.getPlanLimits(plan);

      // Aggregate usage data for current month
      const usageStats = await Image.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalImages: { $sum: 1 },
            totalOriginalSize: { $sum: '$originalSize' },
            totalOptimizedSize: { $sum: '$optimizedSize' },
            totalProcessingTime: { $sum: '$processingTime' },
            avgCompressionRatio: { $avg: '$compressionRatio' },
            formatBreakdown: { $push: '$optimizedFormat' },
            dailyBreakdown: {
              $push: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: 1,
                size: '$originalSize'
              }
            }
          }
        }
      ]);

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentActivity = await Image.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            totalSize: { $sum: '$originalSize' },
            avgProcessingTime: { $avg: '$processingTime' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Calculate bandwidth savings
      const totalOriginalSize = usageStats[0]?.totalOriginalSize || 0;
      const totalOptimizedSize = usageStats[0]?.totalOptimizedSize || 0;
      const bandwidthSaved = totalOriginalSize - totalOptimizedSize;
      const bandwidthSavedPercentage = totalOriginalSize > 0 ? (bandwidthSaved / totalOriginalSize) * 100 : 0;

      // Calculate success rate
      const totalImages = usageStats[0]?.totalImages || 0;
      const successfulImages = await Image.countDocuments({
        user: userId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: 'completed'
      });
      const successRate = totalImages > 0 ? (successfulImages / totalImages) * 100 : 100;

      // Format breakdown
      const formatBreakdown = this.calculateFormatBreakdown(usageStats[0]?.formatBreakdown || []);

      // Daily breakdown for charts
      const dailyBreakdown = this.calculateDailyBreakdown(usageStats[0]?.dailyBreakdown || []);

      // Calculate remaining quota
      const remainingImages = Math.max(0, planLimits.images - totalImages);
      const remainingBandwidth = Math.max(0, planLimits.bandwidth - (totalOriginalSize / (1024 * 1024 * 1024)));

      // Performance metrics
      const avgProcessingTime = usageStats[0]?.avgProcessingTime || 0;
      const avgCompressionRatio = usageStats[0]?.avgCompressionRatio || 0;

      const stats = {
        currentMonth: {
          images: totalImages,
          originalSize: totalOriginalSize,
          optimizedSize: totalOptimizedSize,
          bandwidthSaved: bandwidthSaved,
          bandwidthSavedPercentage: bandwidthSavedPercentage,
          successRate: successRate,
          avgProcessingTime: avgProcessingTime,
          avgCompressionRatio: avgCompressionRatio
        },
        plan: {
          current: plan,
          limits: planLimits,
          remaining: {
            images: remainingImages,
            bandwidth: remainingBandwidth
          },
          usagePercentage: {
            images: planLimits.images > 0 ? (totalImages / planLimits.images) * 100 : 0,
            bandwidth: planLimits.bandwidth > 0 ? ((totalOriginalSize / (1024 * 1024 * 1024)) / planLimits.bandwidth) * 100 : 0
          }
        },
        recentActivity: recentActivity,
        formatBreakdown: formatBreakdown,
        dailyBreakdown: dailyBreakdown,
        lastUpdated: now
      };

      // Cache the results
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;

    } catch (error) {
      logger.error('Error getting user usage stats:', error);
      throw new Error('Failed to get usage statistics');
    }
  }

  // Get system-wide analytics (admin only)
  async getSystemAnalytics(adminUserId, timeRange = 'month') {
    try {
      // Verify admin user
      const adminUser = await User.findById(adminUserId).select('isAdmin');
      if (!adminUser || !adminUser.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const now = new Date();
      let startDate, endDate;

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      endDate = now;

      // System-wide usage statistics
      const systemStats = await Image.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalImages: { $sum: 1 },
            totalUsers: { $addToSet: '$user' },
            totalOriginalSize: { $sum: '$originalSize' },
            totalOptimizedSize: { $sum: '$optimizedSize' },
            totalProcessingTime: { $sum: '$processingTime' },
            avgCompressionRatio: { $avg: '$compressionRatio' }
          }
        }
      ]);

      // User plan distribution
      const planDistribution = await User.aggregate([
        {
          $group: {
            _id: '$subscription.plan',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Daily system activity
      const dailyActivity = await Image.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            totalSize: { $sum: '$originalSize' },
            avgProcessingTime: { $avg: '$processingTime' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Top users by usage
      const topUsers = await Image.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$user',
            totalImages: { $sum: 1 },
            totalSize: { $sum: '$originalSize' }
          }
        },
        { $sort: { totalImages: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $project: {
            userId: '$_id',
            email: { $arrayElemAt: ['$userInfo.email', 0] },
            firstName: { $arrayElemAt: ['$userInfo.firstName', 0] },
            lastName: { $arrayElemAt: ['$userInfo.lastName', 0] },
            totalImages: 1,
            totalSize: 1
          }
        }
      ]);

      // Format breakdown
      const formatBreakdown = await Image.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$optimizedFormat',
            count: { $sum: 1 },
            totalSize: { $sum: '$optimizedSize' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const stats = systemStats[0] || {};
      const uniqueUsers = stats.totalUsers ? stats.totalUsers.length : 0;

      return {
        timeRange,
        period: {
          start: startDate,
          end: endDate
        },
        overview: {
          totalImages: stats.totalImages || 0,
          totalUsers: uniqueUsers,
          totalOriginalSize: stats.totalOriginalSize || 0,
          totalOptimizedSize: stats.totalOptimizedSize || 0,
          bandwidthSaved: (stats.totalOriginalSize || 0) - (stats.totalOptimizedSize || 0),
          avgCompressionRatio: stats.avgCompressionRatio || 0,
          totalProcessingTime: stats.totalProcessingTime || 0
        },
        planDistribution,
        dailyActivity,
        topUsers,
        formatBreakdown,
        lastUpdated: now
      };

    } catch (error) {
      logger.error('Error getting system analytics:', error);
      throw new Error('Failed to get system analytics');
    }
  }

  // Track image processing event
  async trackImageProcessing(userId, imageData) {
    try {
      // Update user's monthly usage
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'usage.monthlyImages': 1,
          'usage.monthlyBandwidth': imageData.originalSize
        },
        $set: {
          'usage.lastResetDate': new Date()
        }
      });

      // Clear user's stats cache to force refresh
      const cacheKey = `user_${userId}_stats`;
      this.cache.delete(cacheKey);

      logger.info(`Tracked image processing for user ${userId}: ${imageData.originalName}`);
    } catch (error) {
      logger.error('Error tracking image processing:', error);
    }
  }

  // Reset monthly usage (called by cron job)
  async resetMonthlyUsage() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Find users whose usage needs to be reset
      const usersToReset = await User.find({
        $or: [
          { 'usage.lastResetDate': { $lt: startOfMonth } },
          { 'usage.lastResetDate': { $exists: false } }
        ]
      });

      for (const user of usersToReset) {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'usage.monthlyImages': 0,
            'usage.monthlyBandwidth': 0,
            'usage.lastResetDate': now
          }
        });

        // Clear user's stats cache
        const cacheKey = `user_${user._id}_stats`;
        this.cache.delete(cacheKey);
      }

      logger.info(`Reset monthly usage for ${usersToReset.length} users`);
    } catch (error) {
      logger.error('Error resetting monthly usage:', error);
    }
  }

  // Get plan limits
  getPlanLimits(plan) {
    const limits = {
      free: {
        images: 100,
        bandwidth: 1, // GB
        quality: 'Good',
        features: ['Basic optimization', 'WebP support']
      },
      starter: {
        images: 5000,
        bandwidth: 10, // GB
        quality: 'Excellent',
        features: ['Advanced optimization', 'All formats', 'API access']
      },
      pro: {
        images: 20000,
        bandwidth: 50, // GB
        quality: 'Premium',
        features: ['Premium optimization', 'AVIF support', 'Bulk processing', 'Analytics']
      },
      enterprise: {
        images: 100000,
        bandwidth: 200, // GB
        quality: 'Maximum',
        features: ['Maximum optimization', 'Custom integrations', 'White-label', 'SLA']
      }
    };

    return limits[plan] || limits.free;
  }

  // Calculate format breakdown
  calculateFormatBreakdown(formats) {
    const breakdown = {};
    formats.forEach(format => {
      breakdown[format] = (breakdown[format] || 0) + 1;
    });

    return Object.entries(breakdown).map(([format, count]) => ({
      format,
      count,
      percentage: formats.length > 0 ? (count / formats.length) * 100 : 0
    }));
  }

  // Calculate daily breakdown for charts
  calculateDailyBreakdown(dailyData) {
    const breakdown = {};
    dailyData.forEach(day => {
      breakdown[day.date] = {
        count: (breakdown[day.date]?.count || 0) + day.count,
        size: (breakdown[day.date]?.size || 0) + day.size
      };
    });

    return Object.entries(breakdown).map(([date, data]) => ({
      date,
      count: data.count,
      size: data.size
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Clear cache for a specific user
  clearUserCache(userId) {
    const cacheKey = `user_${userId}_stats`;
    this.cache.delete(cacheKey);
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
  }
}

module.exports = new UsageAnalytics();
