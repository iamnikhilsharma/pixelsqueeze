const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const batchProcessor = require('../services/batchProcessor');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Get all active batches for a user
router.get('/batches', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const batches = batchProcessor.getActiveBatches()
      .filter(batch => batch.userId === req.user.id)
      .map(batch => ({
        id: batch.id,
        status: batch.status,
        progress: batch.progress,
        completed: batch.completed,
        failed: batch.failed,
        total: batch.total,
        startTime: batch.startTime,
        endTime: batch.endTime,
        type: batch.type
      }));

    res.json({
      success: true,
      data: {
        batches,
        stats: batchProcessor.getBatchStats()
      }
    });
  } catch (error) {
    logger.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
}));

// Get specific batch status
router.get('/batches/:batchId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = batchProcessor.getBatchStatus(batchId);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Ensure user can only access their own batches
    if (batch.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    logger.error('Error fetching batch status:', error);
    res.status(500).json({ error: 'Failed to fetch batch status' });
  }
}));

// Cancel a batch
router.post('/batches/:batchId/cancel', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = batchProcessor.getBatchStatus(batchId);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Ensure user can only cancel their own batches
    if (batch.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cancelled = batchProcessor.cancelBatch(batchId);
    
    if (cancelled) {
      res.json({
        success: true,
        message: 'Batch cancelled successfully'
      });
    } else {
      res.status(400).json({ error: 'Cannot cancel batch' });
    }
  } catch (error) {
    logger.error('Error cancelling batch:', error);
    res.status(500).json({ error: 'Failed to cancel batch' });
  }
}));

// Retry failed items in a batch
router.post('/batches/:batchId/retry', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { batchId } = req.params;
    const { itemIds } = req.body; // Optional: specific items to retry
    
    const batch = batchProcessor.getBatchStatus(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Ensure user can only retry their own batches
    if (batch.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Reset failed items for retry
    const itemsToRetry = itemIds || 
      batch.items.filter(item => item.status === 'failed').map(item => item.id);

    itemsToRetry.forEach(itemId => {
      const item = batch.items.find(i => i.id === itemId);
      if (item && item.status === 'failed') {
        item.status = 'pending';
        item.attempts = 0;
        item.errors = [];
        item.result = null;
        item.startTime = null;
        item.endTime = null;
      }
    });

    // Update batch status
    batch.status = 'processing';
    batch.failed = Math.max(0, batch.failed - itemsToRetry.length);
    batch.progress = Math.round((batch.completed / batch.total) * 100);

    batchProcessor.activeBatches.set(batchId, batch);

    res.json({
      success: true,
      message: `Retrying ${itemsToRetry.length} items`,
      data: {
        retriedItems: itemsToRetry,
        batchStatus: batch.status
      }
    });
  } catch (error) {
    logger.error('Error retrying batch items:', error);
    res.status(500).json({ error: 'Failed to retry batch items' });
  }
}));

// Get batch processing statistics
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const stats = batchProcessor.getBatchStats();
    
    // Get user-specific stats
    const userBatches = batchProcessor.getActiveBatches()
      .filter(batch => batch.userId === req.user.id);
    
    const userStats = {
      total: userBatches.length,
      processing: userBatches.filter(b => b.status === 'processing').length,
      completed: userBatches.filter(b => b.status === 'completed').length,
      failed: userBatches.filter(b => b.status === 'failed').length,
      cancelled: userBatches.filter(b => b.status === 'cancelled').length,
      timeout: userBatches.filter(b => b.status === 'timeout').length
    };

    res.json({
      success: true,
      data: {
        global: stats,
        user: userStats
      }
    });
  } catch (error) {
    logger.error('Error fetching batch stats:', error);
    res.status(500).json({ error: 'Failed to fetch batch statistics' });
  }
}));

// Clean up old batches
router.post('/cleanup', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { maxAge = 3600000 } = req.body; // Default: 1 hour
    const cleanedCount = batchProcessor.cleanupBatches(maxAge);

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} old batches`,
      data: { cleanedCount }
    });
  } catch (error) {
    logger.error('Error cleaning up batches:', error);
    res.status(500).json({ error: 'Failed to clean up batches' });
  }
}));

// Enhanced batch processing with retry and error handling
router.post('/process', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const {
      type, // 'watermark', 'thumbnail', 'analysis', 'optimization'
      items,
      options = {},
      processorOptions = {}
    } = req.body;

    if (!type || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    // Generate unique batch ID
    const batchId = uuidv4();
    
    // Set up Server-Sent Events for real-time progress
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Create processor function based on type
    const processor = createProcessor(type, processorOptions);
    
    // Add user ID to batch for security
    const batchData = {
      ...items,
      userId: req.user.id,
      type
    };

    // Start batch processing
    const batchPromise = batchProcessor.processBatch(batchId, batchData, processor, {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      timeout: options.timeout || 300000,
      onProgress: (itemId, status, progress) => {
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          batchId,
          itemId,
          status,
          progress
        })}\n\n`);
      },
      onError: (itemId, error) => {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          batchId,
          itemId,
          error: error.message
        })}\n\n`);
      },
      onComplete: (batch, results) => {
        res.write(`data: ${JSON.stringify({
          type: 'completed',
          batchId,
          batch,
          results
        })}\n\n`);
        res.end();
      }
    });

    // Handle batch completion
    batchPromise.catch(error => {
      res.write(`data: ${JSON.stringify({
        type: 'failed',
        batchId,
        error: error.message
      })}\n\n`);
      res.end();
    });

  } catch (error) {
    logger.error('Error starting batch processing:', error);
    res.status(500).json({ error: 'Failed to start batch processing' });
  }
}));

// Helper function to create processor based on type
function createProcessor(type, options) {
  switch (type) {
    case 'watermark':
      return async (item) => {
        // Watermark processing logic
        const { advancedImageProcessor } = require('../services/advancedImageProcessor');
        return await advancedImageProcessor.addWatermark(item.buffer, options);
      };
    
    case 'thumbnail':
      return async (item) => {
        // Thumbnail generation logic
        const { advancedImageProcessor } = require('../services/advancedImageProcessor');
        return await advancedImageProcessor.generateThumbnails(item.buffer, options);
      };
    
    case 'analysis':
      return async (item) => {
        // Image analysis logic
        const { advancedImageProcessor } = require('../services/advancedImageProcessor');
        return await advancedImageProcessor.analyzeImage(item.buffer, options);
      };
    
    case 'optimization':
      return async (item) => {
        // Image optimization logic
        const { advancedImageProcessor } = require('../services/advancedImageProcessor');
        return await advancedImageProcessor.optimizeImage(item.buffer, options);
      };
    
    default:
      throw new Error(`Unknown processor type: ${type}`);
  }
}

module.exports = router;
