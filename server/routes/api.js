const express = require('express');
const multer = require('multer');
const axios = require('axios');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const { authenticateToken, checkUsageLimit, checkFileSize, checkFileType } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const imageProcessor = require('../utils/imageProcessor');
const storageService = require('../services/storageService');
const Image = require('../models/Image');
const User = require('../models/User');
const { logger } = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,webp').split(',');
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${fileExtension}`), false);
    }
  }
});

/**
 * POST /api/optimize
 * Upload and optimize a single image
 */
router.post('/optimize', 
  authenticateToken,
  checkUsageLimit,
  upload.single('image'),
  checkFileSize,
  checkFileType,
  asyncHandler(async (req, res) => {
    const { quality = 80, format = 'auto', preserveMetadata = false } = req.body;
    const user = req.user;
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided',
        code: 'NO_FILE'
      });
    }

    try {
      // Process the image
      const result = await imageProcessor.processImage(req.file.buffer, {
        quality: parseInt(quality),
        format,
        preserveMetadata: preserveMetadata === 'true'
      });

      if (!result.success) {
        throw new Error('Image processing failed');
      }

      // Generate unique filename and S3 key
      const filename = imageProcessor.generateFilename(req.file.originalname, result.format);
      const s3Key = storageService.generateKey(filename, result.format, `users/${user._id}`);

      // Upload optimized image to S3
      const contentType = `image/${result.format === 'jpeg' ? 'jpeg' : result.format}`;
      const uploadResult = await storageService.uploadFile(
        result.buffer,
        filename,
        contentType,
        { isPublic: false }
      );

      // Use actual stored key
      const storageKey = uploadResult.key;

      // Generate download URL
      const downloadUrl = await storageService.generateDownloadUrl(storageKey, 24 * 60 * 60); // 24 hours

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + parseInt(process.env.FILE_RETENTION_HOURS || 24) * 60 * 60 * 1000);

      // Save image record to database
      const image = new Image({
        user: user._id,
        originalName: req.file.originalname,
        originalSize: req.file.size,
        originalFormat: req.file.originalname.split('.').pop().toLowerCase(),
        optimizedSize: result.optimizedSize,
        optimizedFormat: result.format,
        compressionRatio: result.compressionRatio,
        quality: parseInt(quality),
        dimensions: result.dimensions,
        storage: {
          originalKey: null,
          optimizedKey: storageKey,
        },
        downloadUrl,
        expiresAt,
        metadata: {
          preserved: preserveMetadata === 'true',
          ...result.metadata
        },
        processingTime: result.processingTime,
        status: 'completed'
      });

      await image.save();

      // Increment user usage
      await user.incrementUsage(req.file.size);

      // Track analytics
      try {
        const analyticsResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5002'}/api/analytics/track`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${req.headers.authorization}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            originalName: req.file.originalname,
            originalSize: req.file.size,
            optimizedSize: result.optimizedSize,
            processingTime: result.processingTime,
            format: result.format
          })
        });
        
        if (!analyticsResponse.ok) {
          logger.warn('Failed to track analytics for image optimization');
        }
      } catch (error) {
        logger.warn('Error tracking analytics:', error);
      }

      res.json({
        success: true,
        data: {
          originalSize: req.file.size,
          optimizedSize: result.optimizedSize,
          compressionRatio: result.compressionRatio,
          downloadUrl,
          expiresAt,
          format: result.format,
          dimensions: result.dimensions,
          processingTime: result.processingTime
        }
      });

    } catch (error) {
      logger.error('Image optimization error:', error);
      res.status(500).json({
        error: 'Image optimization failed',
        code: 'OPTIMIZATION_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/optimize-multiple
 * Upload and optimize multiple images
 */
router.post('/optimize-multiple',
  authenticateToken,
  checkUsageLimit,
  upload.array('images', 10),
  checkFileSize,
  checkFileType,
  asyncHandler(async (req, res) => {
    const { quality = 80, format = 'auto', preserveMetadata = false } = req.body;
    const user = req.user;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No image files provided',
        code: 'NO_FILES'
      });
    }

    // Check if user has enough remaining quota
    if (user.remainingImages < req.files.length) {
      return res.status(429).json({
        error: 'Insufficient quota for batch processing',
        code: 'INSUFFICIENT_QUOTA',
        usage: {
          current: user.usage.monthlyImages,
          limit: user.subscriptionLimits,
          remaining: user.remainingImages,
          requested: req.files.length
        }
      });
    }

    const results = [];
    const processedImages = [];

    try {
      for (const file of req.files) {
        try {
          // Process the image
          const result = await imageProcessor.processImage(file.buffer, {
            quality: parseInt(quality),
            format,
            preserveMetadata: preserveMetadata === 'true'
          });

          if (!result.success) {
            results.push({
              originalName: file.originalname,
              success: false,
              error: 'Processing failed'
            });
            continue;
          }

          // Generate unique filename and S3 key
          const filename = imageProcessor.generateFilename(file.originalname, result.format);
          const s3Key = storageService.generateKey(filename, result.format, `users/${user._id}`);

          // Upload optimized image to S3
          const contentType = `image/${result.format === 'jpeg' ? 'jpeg' : result.format}`;
          const uploadResult = await storageService.uploadFile(
            result.buffer,
            filename,
            contentType,
            { isPublic: false }
          );

          const storageKey = uploadResult.key;

          // Generate download URL
          const downloadUrl = await storageService.generateDownloadUrl(storageKey, 24 * 60 * 60);

          // Calculate expiration time
          const expiresAt = new Date(Date.now() + parseInt(process.env.FILE_RETENTION_HOURS || 24) * 60 * 60 * 1000);

          // Save image record
          const image = new Image({
            user: user._id,
            originalName: file.originalname,
            originalSize: file.size,
            originalFormat: file.originalname.split('.').pop().toLowerCase(),
            optimizedSize: result.optimizedSize,
            optimizedFormat: result.format,
            compressionRatio: result.compressionRatio,
            quality: parseInt(quality),
            dimensions: result.dimensions,
            storage: {
              optimizedKey: storageKey,
            },
            downloadUrl,
            expiresAt,
            metadata: {
              preserved: preserveMetadata === 'true',
              ...result.metadata
            },
            processingTime: result.processingTime,
            status: 'completed'
          });

          await image.save();
          processedImages.push(image);

          results.push({
            originalName: file.originalname,
            success: true,
            originalSize: file.size,
            optimizedSize: result.optimizedSize,
            compressionRatio: result.compressionRatio,
            downloadUrl,
            expiresAt,
            format: result.format,
            dimensions: result.dimensions,
            processingTime: result.processingTime
          });

        } catch (error) {
          results.push({
            originalName: file.originalname,
            success: false,
            error: error.message
          });
        }
      }

      // Increment user usage for all processed images
      const totalOriginalSize = req.files.reduce((sum, file) => sum + file.size, 0);
      await user.incrementUsage(totalOriginalSize);

      res.json({
        success: true,
        data: {
          totalFiles: req.files.length,
          processedFiles: results.filter(r => r.success).length,
          failedFiles: results.filter(r => !r.success).length,
          results
        }
      });

    } catch (error) {
      logger.error('Batch optimization error:', error);
      res.status(500).json({
        error: 'Batch optimization failed',
        code: 'BATCH_OPTIMIZATION_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/optimize-url
 * Optimize image from URL
 */
router.post('/optimize-url',
  authenticateToken,
  checkUsageLimit,
  asyncHandler(async (req, res) => {
    const { imageUrl, quality = 80, format = 'auto', preserveMetadata = false } = req.body;
    const user = req.user;

    if (!imageUrl) {
      return res.status(400).json({
        error: 'Image URL is required',
        code: 'NO_URL'
      });
    }

    try {
      // Download image from URL
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds timeout
        maxContentLength: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
      });

      const imageBuffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'];
      
      // Validate content type
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('Invalid image content type');
      }

      // Process the image
      const result = await imageProcessor.processImage(imageBuffer, {
        quality: parseInt(quality),
        format,
        preserveMetadata: preserveMetadata === 'true'
      });

      if (!result.success) {
        throw new Error('Image processing failed');
      }

      // Generate unique filename and S3 key
      const filename = imageProcessor.generateFilename('url-image', result.format);
      const s3Key = storageService.generateKey(filename, result.format, `users/${user._id}`);

      // Upload optimized image to S3
      const uploadContentType = `image/${result.format === 'jpeg' ? 'jpeg' : result.format}`;
      const uploadResult = await storageService.uploadFile(
        result.buffer,
        filename,
        uploadContentType,
        { isPublic: false }
      );

      const storageKey = uploadResult.key;

      // Generate download URL
      const downloadUrl = await storageService.generateDownloadUrl(storageKey, 24 * 60 * 60);

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + parseInt(process.env.FILE_RETENTION_HOURS || 24) * 60 * 60 * 1000);

      // Save image record
      const image = new Image({
        user: user._id,
        originalName: 'url-image',
        originalSize: imageBuffer.length,
        originalFormat: contentType.split('/')[1],
        optimizedSize: result.optimizedSize,
        optimizedFormat: result.format,
        compressionRatio: result.compressionRatio,
        quality: parseInt(quality),
        dimensions: result.dimensions,
        storage: {
          optimizedKey: storageKey,
        },
        downloadUrl,
        expiresAt,
        metadata: {
          preserved: preserveMetadata === 'true',
          ...result.metadata
        },
        processingTime: result.processingTime,
        status: 'completed'
      });

      await image.save();

      // Increment user usage
      await user.incrementUsage(imageBuffer.length);

      res.json({
        success: true,
        data: {
          originalSize: imageBuffer.length,
          optimizedSize: result.optimizedSize,
          compressionRatio: result.compressionRatio,
          downloadUrl,
          expiresAt,
          format: result.format,
          dimensions: result.dimensions,
          processingTime: result.processingTime
        }
      });

    } catch (error) {
      logger.error('URL optimization error:', error);
      res.status(500).json({
        error: 'URL optimization failed',
        code: 'URL_OPTIMIZATION_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * GET /api/stats
 * Get user's usage statistics
 */
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = req.user || {};
    const { period = 'month' } = req.query;

    try {
      let startDate, endDate;
      const now = new Date();

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
      }

      // Get image statistics
      const imageStats = await Image.getUserStats(user._id, startDate, endDate);
      const stats = imageStats[0] || {
        totalImages: 0,
        totalOriginalSize: 0,
        totalOptimizedSize: 0,
        totalSizeSaved: 0,
        averageCompressionRatio: 0,
        totalDownloads: 0
      };

      const usage = user.usage || { monthlyImages: 0, monthlyBandwidth: 0, lastResetDate: null };
      const subscription = user.subscription || { plan: 'free', status: 'active', currentPeriodStart: null, currentPeriodEnd: null };
      const planLimit = user.subscriptionLimits || 100;
      const remainingImages = user.remainingImages || Math.max(0, planLimit - (usage.monthlyImages || 0));

      res.json({
        success: true,
        data: {
          usage: {
            monthlyImages: usage.monthlyImages || 0,
            monthlyBandwidth: usage.monthlyBandwidth || 0,
            planLimit: planLimit,
            remainingImages: remainingImages,
            lastResetDate: usage.lastResetDate || null
          },
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd
          },
          statistics: {
            period,
            startDate,
            endDate,
            totalImages: stats.totalImages,
            totalOriginalSize: stats.totalOriginalSize,
            totalOptimizedSize: stats.totalOptimizedSize,
            totalSizeSaved: stats.totalSizeSaved,
            averageCompressionRatio: Math.round(stats.averageCompressionRatio || 0),
            totalDownloads: stats.totalDownloads
          }
        }
      });

    } catch (error) {
      logger.error('Stats retrieval error:', error);
      res.status(500).json({
        error: 'Failed to retrieve statistics',
        code: 'STATS_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * GET /api/images
 * Get user's processed images
 */
router.get('/images',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { page = 1, limit = 20, status } = req.query;

    try {
      const query = { user: user._id };
      if (status) {
        query.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const images = await Image.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-storage');

      const total = await Image.countDocuments(query);

      res.json({
        success: true,
        data: {
          images: images.map(img => ({
            _id: img._id,
            originalName: img.originalName,
            originalSize: img.originalSize,
            optimizedSize: img.optimizedSize,
            compressionRatio: img.compressionRatio,
            format: img.optimizedFormat || img.format,
            dimensions: img.dimensions,
            createdAt: img.createdAt,
            expiresAt: img.expiresAt,
            downloadUrl: img.downloadUrl,
            status: img.status
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Images retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve images', code: 'IMAGES_ERROR', details: error.message });
    }
  })
);

/**
 * DELETE /api/images/:id
 * Delete a user's image (local storage)
 */
router.delete('/images/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    try {
      const image = await Image.findOne({ _id: id, user: user._id });
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Delete file from local storage if we have a key
      if (image.storage?.optimizedKey) {
        await storageService.deleteFile(image.storage.optimizedKey);
      }

      await image.deleteOne();

      res.json({ success: true });
    } catch (error) {
      logger.error('Delete image error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  })
);

/**
 * GET /api/download/:imageId (secured)
 * Streams the optimized file if owned by the current user
 */
router.get('/download/:imageId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { imageId } = req.params;
    const user = req.user;

    try {
      const image = await Image.findOne({ _id: imageId, user: user._id });
      if (!image) return res.status(404).json({ error: 'Image not found' });
      if (image.isExpired) return res.status(410).json({ error: 'Image expired' });

      const key = image.storage?.optimizedKey;
      if (!key) return res.status(404).json({ error: 'File key missing' });

      // Try multiple candidate paths for backward compatibility
      const candidates = [];
      const baseKey = path.basename(key);
      candidates.push(storageService.getOptimizedFilePath(baseKey));
      candidates.push(path.join(storageService.baseDir, baseKey));
      candidates.push(storageService.getOptimizedFilePath(key));
      candidates.push(path.join(storageService.baseDir, key));

      let filePath = null;
      for (const candidate of candidates) {
        try {
          await fs.promises.access(candidate);
          filePath = candidate;
          break;
        } catch {}
      }

      if (!filePath) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.setHeader('Content-Type', `image/${image.optimizedFormat}`);
      res.setHeader('Content-Disposition', `attachment; filename="optimized_${image.originalName}"`);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);

      await image.incrementDownload();
    } catch (error) {
      logger.error('Secure download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  })
);

/**
 * POST /api/images/:id/extend-expiry
 * Extend expiry for an image by given hours (default 24)
 */
router.post('/images/:id/extend-expiry',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { hours = 24 } = req.body || {};

    try {
      const image = await Image.findOne({ _id: id, user: req.user._id });
      if (!image) return res.status(404).json({ error: 'Image not found' });

      await image.extendExpiration(parseInt(hours) || 24);
      res.json({ success: true, data: { expiresAt: image.expiresAt } });
    } catch (error) {
      logger.error('Extend expiry error:', error);
      res.status(500).json({ error: 'Failed to extend expiry' });
    }
  })
);

/**
 * POST /api/images/extend-expiry
 * Bulk extend expiry for a list of image IDs (default +24h)
 */
router.post('/images/extend-expiry',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { imageIds = [], hours = 24 } = req.body || {};
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: 'imageIds array is required' });
    }

    try {
      const images = await Image.find({ _id: { $in: imageIds }, user: req.user._id });
      const extended = [];
      for (const img of images) {
        await img.extendExpiration(parseInt(hours) || 24);
        extended.push({ id: img._id, expiresAt: img.expiresAt });
      }
      return res.json({ success: true, data: { extended } });
    } catch (error) {
      logger.error('Bulk extend expiry error:', error);
      res.status(500).json({ error: 'Failed to extend expiry' });
    }
  })
);

/**
 * POST /api/download-batch
 * Download multiple images as ZIP
 */
router.post('/download-batch',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { imageIds } = req.body;
    const user = req.user;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: 'Image IDs array is required', code: 'NO_IMAGE_IDS' });
    }

    if (imageIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 images allowed per batch download', code: 'TOO_MANY_IMAGES' });
    }

    try {
      const images = await Image.find({
        _id: { $in: imageIds },
        user: user._id,
        status: 'completed'
      });

      // Filter out expired or missing files
      const validImages = [];
      for (const img of images) {
        if (img.isExpired) continue;
        const filename = img.storage?.optimizedKey;
        if (!filename) continue;
        const filePath = storageService.getOptimizedFilePath(filename);
        try {
          await fs.promises.access(filePath);
          validImages.push({ img, filePath });
        } catch {
          logger.warn(`Batch zip: file missing ${filePath}`);
        }
      }

      if (validImages.length === 0) {
        return res.status(404).json({ error: 'No valid images to download' });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="images.zip"');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err) => {
        logger.error('Archiver error:', err);
        res.status(500).end();
      });
      archive.pipe(res);

      for (const { img, filePath } of validImages) {
        const entryName = `optimized_${path.parse(img.originalName).name}.${img.optimizedFormat || 'jpg'}`;
        archive.append(fs.createReadStream(filePath), { name: entryName });
        await img.incrementDownload();
      }

      archive.finalize();
    } catch (error) {
      logger.error('Batch download error:', error);
      res.status(500).json({ error: 'Failed to create ZIP' });
    }
  })
);

module.exports = router; 