const express = require('express');
const { body, validationResult } = require('express-validator');

const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');
const Image = require('../models/Image');
const storageService = require('../services/storageService');
const { logger } = require('../utils/logger');

const router = express.Router();

// Combined middleware
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - basic KPI stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const admins = await User.countDocuments({ isAdmin: true });

    const activeSubs = await User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': { $ne: 'free' } });

    const planAgg = await User.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]);
    const planBreakdown = planAgg.reduce((acc, cur)=>{ acc[cur._id||'unknown'] = cur.count; return acc;}, {});

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        admins,
        activeSubscriptions: activeSubs,
        planBreakdown
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users - list users (basic)
router.get('/users', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  try {
    const users = await User.find()
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments();
    return res.json({ success: true, data: { users, total } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard',
  asyncHandler(async (req, res) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // User statistics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: startOfMonth }
      });
      const newUsersThisWeek = await User.countDocuments({
        createdAt: { $gte: startOfWeek }
      });

      // Subscription statistics
      const subscriptionStats = await User.aggregate([
        {
          $group: {
            _id: '$subscription.plan',
            count: { $sum: 1 },
            activeCount: {
              $sum: {
                $cond: [
                  { $eq: ['$subscription.status', 'active'] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      // Image processing statistics
      const imageStats = await Image.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalImages: { $sum: 1 },
            totalOriginalSize: { $sum: '$originalSize' },
            totalOptimizedSize: { $sum: '$optimizedSize' },
            totalSizeSaved: { $sum: { $subtract: ['$originalSize', '$optimizedSize'] } },
            averageCompressionRatio: { $avg: '$compressionRatio' },
            totalDownloads: { $sum: '$downloadCount' }
          }
        }
      ]);

      // Daily processing stats for the last 30 days
      const dailyStats = await Image.getDailyStats(
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        now
      );

      // Storage statistics
      const storageStats = await storageService.getBucketStats();

      const stats = imageStats[0] || {
        totalImages: 0,
        totalOriginalSize: 0,
        totalOptimizedSize: 0,
        totalSizeSaved: 0,
        averageCompressionRatio: 0,
        totalDownloads: 0
      };

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
            newThisMonth: newUsersThisMonth,
            newThisWeek: newUsersThisWeek
          },
          subscriptions: subscriptionStats,
          images: {
            ...stats,
            averageCompressionRatio: Math.round(stats.averageCompressionRatio || 0)
          },
          dailyStats,
          storage: storageStats
        }
      });

    } catch (error) {
      logger.error('Admin dashboard error:', error);
      res.status(500).json({
        error: 'Failed to retrieve dashboard statistics',
        code: 'DASHBOARD_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * GET /api/admin/users/:userId
 * Get specific user details
 */
router.get('/users/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Get user's image statistics
      const imageStats = await Image.getUserStats(userId);
      const stats = imageStats[0] || {
        totalImages: 0,
        totalOriginalSize: 0,
        totalOptimizedSize: 0,
        totalSizeSaved: 0,
        averageCompressionRatio: 0,
        totalDownloads: 0
      };

      res.json({
        success: true,
        data: {
          user,
          statistics: {
            ...stats,
            averageCompressionRatio: Math.round(stats.averageCompressionRatio || 0)
          }
        }
      });

    } catch (error) {
      logger.error('Admin user details error:', error);
      res.status(500).json({
        error: 'Failed to retrieve user details',
        code: 'USER_DETAILS_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * PUT /api/admin/users/:userId
 * Update user (admin)
 */
router.put('/users/:userId',
  [
    body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
    body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
    body('company').optional().trim(),
    body('isActive').optional().isBoolean(),
    body('isAdmin').optional().isBoolean(),
    body('subscription.plan').optional().isIn(['free', 'starter', 'pro', 'enterprise']),
    body('subscription.status').optional().isIn(['active', 'canceled', 'past_due', 'unpaid'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { firstName, lastName, company, isActive, isAdmin, subscription } = req.body;

    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Update fields
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (company !== undefined) user.company = company;
      if (isActive !== undefined) user.isActive = isActive;
      if (isAdmin !== undefined) user.isAdmin = isAdmin;
      
      if (subscription) {
        if (subscription.plan !== undefined) user.subscription.plan = subscription.plan;
        if (subscription.status !== undefined) user.subscription.status = subscription.status;
      }

      await user.save();

      logger.info(`Admin updated user: ${user.email}`);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            company: user.company,
            isActive: user.isActive,
            isAdmin: user.isAdmin,
            subscription: user.subscription,
            usage: user.usage
          }
        }
      });

    } catch (error) {
      logger.error('Admin user update error:', error);
      res.status(500).json({
        error: 'Failed to update user',
        code: 'USER_UPDATE_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * DELETE /api/admin/users/:userId
 * Delete user (admin)
 */
router.delete('/users/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Delete user's images from storage
      const userImages = await Image.find({ user: userId });
      const imageKeys = userImages
        .map(img => img.storage.optimizedKey)
        .filter(key => key);

      if (imageKeys.length > 0) {
        await storageService.deleteMultipleFiles(imageKeys);
      }

      // Delete user's images from database
      await Image.deleteMany({ user: userId });

      // Delete user
      await User.findByIdAndDelete(userId);

      logger.info(`Admin deleted user: ${user.email}`);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      logger.error('Admin user deletion error:', error);
      res.status(500).json({
        error: 'Failed to delete user',
        code: 'USER_DELETION_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/admin/users/:userId/reset-usage
 * Reset user's monthly usage
 */
router.post('/users/:userId/reset-usage',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      await user.resetMonthlyUsage();

      logger.info(`Admin reset usage for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Usage reset successfully',
        data: {
          usage: user.usage
        }
      });

    } catch (error) {
      logger.error('Admin usage reset error:', error);
      res.status(500).json({
        error: 'Failed to reset usage',
        code: 'USAGE_RESET_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * GET /api/admin/images
 * Get all images with pagination
 */
router.get('/images',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, userId, status } = req.query;

    try {
      const query = {};

      if (userId) {
        query.user = userId;
      }

      if (status) {
        query.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const images = await Image.find(query)
        .populate('user', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Image.countDocuments(query);

      res.json({
        success: true,
        data: {
          images,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Admin images retrieval error:', error);
      res.status(500).json({
        error: 'Failed to retrieve images',
        code: 'IMAGES_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * DELETE /api/admin/images/:imageId
 * Delete specific image
 */
router.delete('/images/:imageId',
  asyncHandler(async (req, res) => {
    const { imageId } = req.params;

    try {
      const image = await Image.findById(imageId);
      
      if (!image) {
        return res.status(404).json({
          error: 'Image not found',
          code: 'IMAGE_NOT_FOUND'
        });
      }

      // Delete from storage
      if (image.storage.optimizedKey) {
        await storageService.deleteFile(image.storage.optimizedKey);
      }

      // Delete from database
      await Image.findByIdAndDelete(imageId);

      logger.info(`Admin deleted image: ${image.originalName}`);

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });

    } catch (error) {
      logger.error('Admin image deletion error:', error);
      res.status(500).json({
        error: 'Failed to delete image',
        code: 'IMAGE_DELETION_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/admin/cleanup
 * Clean up expired files
 */
router.post('/cleanup',
  asyncHandler(async (req, res) => {
    try {
      // Find expired images
      const expiredImages = await Image.findExpired();
      
      if (expiredImages.length === 0) {
        return res.json({
          success: true,
          message: 'No expired files found',
          data: {
            deletedFiles: 0,
            deletedImages: 0
          }
        });
      }

      // Delete from storage
      const imageKeys = expiredImages
        .map(img => img.storage.optimizedKey)
        .filter(key => key);

      let storageResult = { deleted: 0 };
      if (imageKeys.length > 0) {
        storageResult = await storageService.deleteMultipleFiles(imageKeys);
      }

      // Delete from database
      await Image.deleteMany({ _id: { $in: expiredImages.map(img => img._id) } });

      logger.info(`Admin cleanup: deleted ${expiredImages.length} expired images`);

      res.json({
        success: true,
        message: 'Cleanup completed successfully',
        data: {
          deletedFiles: storageResult.deleted,
          deletedImages: expiredImages.length
        }
      });

    } catch (error) {
      logger.error('Admin cleanup error:', error);
      res.status(500).json({
        error: 'Cleanup failed',
        code: 'CLEANUP_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * GET /api/admin/system-info
 * Get system information
 */
router.get('/system-info',
  asyncHandler(async (req, res) => {
    try {
      const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external
        },
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: {
          connection: 'connected' // You could add more detailed DB info here
        },
        storage: await storageService.testConnection()
      };

      res.json({
        success: true,
        data: systemInfo
      });

    } catch (error) {
      logger.error('System info error:', error);
      res.status(500).json({
        error: 'Failed to retrieve system information',
        code: 'SYSTEM_INFO_ERROR',
        details: error.message
      });
    }
  })
);

// Helper: sanitize update fields
const ALLOWED_UPDATE_FIELDS = ['firstName','lastName','company','isAdmin','isActive','subscription.plan'];

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    return res.json({ success:true, data:user });
  } catch(err){
    return res.status(500).json({ success:false, message:'Failed to fetch user'});
  }
});

// PATCH /api/admin/users/:id  (update allowed fields)
router.patch('/users/:id', async (req, res)=>{
  try {
    const updates = {};
    ALLOWED_UPDATE_FIELDS.forEach(f=>{
      if (req.body.hasOwnProperty(f)) updates[f]=req.body[f];
    });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new:true }).select('-password');
    if(!user) return res.status(404).json({ success:false, message:'User not found'});
    return res.json({ success:true, data:user });
  }catch(err){
    return res.status(500).json({ success:false, message:'Failed to update user'});
  }
});

// PATCH /api/admin/users/:id/deactivate  body { isActive: boolean }
router.patch('/users/:id/activate', async (req,res)=>{
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id,{ isActive: !!isActive },{ new:true }).select('-password');
    if(!user) return res.status(404).json({ success:false, message:'User not found'});
    return res.json({ success:true, data:user });
  }catch(err){
    return res.status(500).json({ success:false, message:'Failed to change status'});
  }
});

// DELETE /api/admin/users/:id  (permanent delete)
router.delete('/users/:id', async (req,res)=>{
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if(!result) return res.status(404).json({ success:false, message:'User not found'});
    return res.json({ success:true, message:'User deleted'});
  }catch(err){
    return res.status(500).json({ success:false, message:'Failed to delete user'});
  }
});

module.exports = router; 