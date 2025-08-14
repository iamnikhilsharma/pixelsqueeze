const { EventEmitter } = require('events');
const { logger } = require('../utils/logger');

class BatchProcessor extends EventEmitter {
  constructor() {
    super();
    this.activeBatches = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.batchTimeout = 300000; // 5 minutes
  }

  /**
   * Process a batch of images with enhanced error handling and retry mechanisms
   */
  async processBatch(batchId, items, processor, options = {}) {
    const {
      maxRetries = this.maxRetries,
      retryDelay = this.retryDelay,
      timeout = this.batchTimeout,
      onProgress,
      onError,
      onComplete
    } = options;

    const batch = {
      id: batchId,
      items: items.map((item, index) => ({
        id: `${batchId}_${index}`,
        data: item,
        status: 'pending',
        attempts: 0,
        errors: [],
        result: null,
        startTime: null,
        endTime: null
      })),
      status: 'processing',
      startTime: new Date(),
      completed: 0,
      failed: 0,
      total: items.length,
      progress: 0
    };

    this.activeBatches.set(batchId, batch);
    this.emit('batchStarted', batch);

    try {
      // Set batch timeout
      const timeoutId = setTimeout(() => {
        this.handleBatchTimeout(batchId);
      }, timeout);

      // Process items with retry logic
      const results = await this.processItemsWithRetry(batch, processor, {
        maxRetries,
        retryDelay,
        onProgress: (itemId, status, progress) => {
          this.updateBatchProgress(batchId, itemId, status, progress);
          if (onProgress) onProgress(itemId, status, progress);
        },
        onError: (itemId, error) => {
          this.handleItemError(batchId, itemId, error);
          if (onError) onError(itemId, error);
        }
      });

      clearTimeout(timeoutId);
      
      // Mark batch as completed
      batch.status = 'completed';
      batch.endTime = new Date();
      batch.progress = 100;
      
      this.activeBatches.set(batchId, batch);
      this.emit('batchCompleted', batch);
      
      if (onComplete) onComplete(batch, results);
      
      return { batch, results };

    } catch (error) {
      logger.error(`Batch ${batchId} failed:`, error);
      batch.status = 'failed';
      batch.endTime = new Date();
      batch.error = error.message;
      
      this.activeBatches.set(batchId, batch);
      this.emit('batchFailed', batch, error);
      
      throw error;
    }
  }

  /**
   * Process items with retry mechanism
   */
  async processItemsWithRetry(batch, processor, options) {
    const { maxRetries, retryDelay, onProgress, onError } = options;
    const results = [];
    const processingQueue = [...batch.items];

    while (processingQueue.length > 0) {
      const item = processingQueue.shift();
      
      try {
        // Update item status
        item.status = 'processing';
        item.startTime = new Date();
        item.attempts++;
        
        this.updateBatchProgress(batch.id, item.id, 'processing', 
          (batch.completed / batch.total) * 100);

        // Process item
        const result = await this.processItemWithTimeout(item, processor);
        
        // Mark as successful
        item.status = 'completed';
        item.endTime = new Date();
        item.result = result;
        batch.completed++;
        
        results.push({ item, result });
        
        this.updateBatchProgress(batch.id, item.id, 'completed', 
          (batch.completed / batch.total) * 100);

      } catch (error) {
        // Handle item failure
        if (item.attempts < maxRetries) {
          // Retry after delay
          item.status = 'retrying';
          item.errors.push({
            attempt: item.attempts,
            error: error.message,
            timestamp: new Date()
          });
          
          logger.warn(`Item ${item.id} failed, retrying (${item.attempts}/${maxRetries}):`, error.message);
          
          // Add back to queue for retry
          setTimeout(() => {
            processingQueue.unshift(item);
          }, retryDelay * item.attempts); // Exponential backoff
          
        } else {
          // Max retries exceeded
          item.status = 'failed';
          item.endTime = new Date();
          item.errors.push({
            attempt: item.attempts,
            error: error.message,
            timestamp: new Date()
          });
          
          batch.failed++;
          logger.error(`Item ${item.id} failed after ${maxRetries} attempts:`, error.message);
          
          if (onError) onError(item.id, error);
        }
      }
    }

    return results;
  }

  /**
   * Process individual item with timeout protection
   */
  async processItemWithTimeout(item, processor) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Processing timeout'));
      }, 60000); // 1 minute timeout per item

      try {
        processor(item.data)
          .then(result => {
            clearTimeout(timeoutId);
            resolve(result);
          })
          .catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Update batch progress
   */
  updateBatchProgress(batchId, itemId, status, progress) {
    const batch = this.activeBatches.get(batchId);
    if (!batch) return;

    const item = batch.items.find(i => i.id === itemId);
    if (item) {
      item.status = status;
    }

    batch.progress = Math.round((batch.completed / batch.total) * 100);
    this.activeBatches.set(batchId, batch);
    
    this.emit('progress', { batchId, itemId, status, progress: batch.progress });
  }

  /**
   * Handle item error
   */
  handleItemError(batchId, itemId, error) {
    const batch = this.activeBatches.get(batchId);
    if (!batch) return;

    const item = batch.items.find(i => i.id === itemId);
    if (item) {
      item.errors.push({
        attempt: item.attempts,
        error: error.message,
        timestamp: new Date()
      });
    }

    this.activeBatches.set(batchId, batch);
  }

  /**
   * Handle batch timeout
   */
  handleBatchTimeout(batchId) {
    const batch = this.activeBatches.get(batchId);
    if (!batch || batch.status !== 'processing') return;

    logger.warn(`Batch ${batchId} timed out`);
    batch.status = 'timeout';
    batch.endTime = new Date();
    
    // Mark remaining items as timed out
    batch.items.forEach(item => {
      if (item.status === 'pending' || item.status === 'processing') {
        item.status = 'timeout';
        item.endTime = new Date();
        item.errors.push({
          attempt: item.attempts,
          error: 'Processing timeout',
          timestamp: new Date()
        });
      }
    });

    this.activeBatches.set(batchId, batch);
    this.emit('batchTimeout', batch);
  }

  /**
   * Get batch status
   */
  getBatchStatus(batchId) {
    return this.activeBatches.get(batchId);
  }

  /**
   * Get all active batches
   */
  getActiveBatches() {
    return Array.from(this.activeBatches.values());
  }

  /**
   * Cancel batch
   */
  cancelBatch(batchId) {
    const batch = this.activeBatches.get(batchId);
    if (!batch || batch.status !== 'processing') return false;

    batch.status = 'cancelled';
    batch.endTime = new Date();
    
    // Mark remaining items as cancelled
    batch.items.forEach(item => {
      if (item.status === 'pending' || item.status === 'processing') {
        item.status = 'cancelled';
        item.endTime = new Date();
      }
    });

    this.activeBatches.set(batchId, batch);
    this.emit('batchCancelled', batch);
    
    return true;
  }

  /**
   * Clean up completed batches
   */
  cleanupBatches(maxAge = 3600000) { // 1 hour default
    const now = new Date();
    const toRemove = [];

    for (const [batchId, batch] of this.activeBatches.entries()) {
      if (batch.status === 'completed' || batch.status === 'failed' || batch.status === 'cancelled') {
        if (batch.endTime && (now - batch.endTime) > maxAge) {
          toRemove.push(batchId);
        }
      }
    }

    toRemove.forEach(batchId => {
      this.activeBatches.delete(batchId);
    });

    return toRemove.length;
  }

  /**
   * Get batch statistics
   */
  getBatchStats() {
    const stats = {
      total: this.activeBatches.size,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      timeout: 0
    };

    for (const batch of this.activeBatches.values()) {
      stats[batch.status]++;
    }

    return stats;
  }
}

module.exports = new BatchProcessor();
