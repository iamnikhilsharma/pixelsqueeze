const { performance } = require('perf_hooks');
const { EventEmitter } = require('events');
const { logger } = require('../utils/logger');

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0
      },
      processing: {
        totalImages: 0,
        totalSize: 0,
        averageProcessingTime: 0,
        cacheHits: 0,
        cacheMisses: 0
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0,
        uptime: 0
      },
      users: {
        active: 0,
        total: 0,
        newToday: 0
      }
    };
    
    this.requestTimes = [];
    this.processingTimes = [];
    this.errorLog = [];
    this.performanceLog = [];
    this.maxLogSize = 1000;
    
    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    // Monitor system metrics every 30 seconds
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000);

    // Monitor memory usage every minute
    setInterval(() => {
      this.updateMemoryMetrics();
    }, 60000);

    // Clean up old logs every 5 minutes
    setInterval(() => {
      this.cleanupOldLogs();
    }, 300000);

    logger.info('Performance monitoring started');
  }

  /**
   * Track API request
   */
  trackRequest(req, res, next) {
    try {
      const startTime = performance.now();
      const requestId = this.generateRequestId();

      // Add request ID to response headers
      res.setHeader('X-Request-ID', requestId);

      // Track request start
      this.metrics.requests.total++;

      // Override res.end to capture response time
      const originalEnd = res.end;
      const self = this;
      
      res.end = function(chunk, encoding) {
        try {
          const endTime = performance.now();
          const responseTime = endTime - startTime;

          // Track response metrics
          self.trackResponse(req, res, responseTime, requestId);
        } catch (error) {
          // Log error but don't crash the response
          logger.error('Error in performance tracking:', error);
        }

        // Call original end method
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    } catch (error) {
      // Log error but don't crash the request
      logger.error('Error setting up performance tracking:', error);
      next();
    }
  }

  /**
   * Track response metrics
   */
  trackResponse(req, res, responseTime, requestId) {
    try {
      // Update request metrics
      if (res.statusCode >= 200 && res.statusCode < 400) {
        this.metrics.requests.successful++;
      } else {
        this.metrics.requests.failed++;
      }

      // Track response time
      this.requestTimes.push(responseTime);
      if (this.requestTimes.length > 100) {
        this.requestTimes.shift();
      }

      // Calculate average response time
      this.metrics.requests.averageResponseTime = 
        this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;

      // Log performance data
      this.logPerformance({
        type: 'request',
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date()
      });

      // Emit performance event
      this.emit('requestCompleted', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        timestamp: new Date()
      });
    } catch (error) {
      // Log error but don't crash
      logger.error('Error tracking response metrics:', error);
    }
  }

  /**
   * Track image processing
   */
  trackImageProcessing(imageData, processingTime, success = true) {
    this.metrics.processing.totalImages++;
    this.metrics.processing.totalSize += imageData.size || 0;
    
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }

    this.metrics.processing.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;

    this.logPerformance({
      type: 'imageProcessing',
      imageSize: imageData.size,
      format: imageData.format,
      processingTime,
      success,
      timestamp: new Date()
    });
  }

  /**
   * Track cache performance
   */
  trackCacheAccess(hit, key, namespace) {
    if (hit) {
      this.metrics.processing.cacheHits++;
    } else {
      this.metrics.processing.cacheMisses++;
    }

    this.logPerformance({
      type: 'cache',
      hit,
      key,
      namespace,
      timestamp: new Date()
    });
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    };

    this.errorLog.push(errorEntry);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Emit error event
    this.emit('errorOccurred', errorEntry);

    logger.error('Performance monitor tracked error:', errorEntry);
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      this.metrics.system.memoryUsage = memUsage.heapUsed;
      this.metrics.system.uptime = process.uptime();

      // Get CPU usage (simplified)
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        this.metrics.system.cpuUsage = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
      }, 100);

      // Emit system metrics update
      this.emit('systemMetricsUpdated', this.metrics.system);

    } catch (error) {
      logger.error('Error updating system metrics:', error);
    }
  }

  /**
   * Update memory metrics
   */
  updateMemoryMetrics() {
    try {
      const memUsage = process.memoryUsage();
      
      // Log memory usage if it's high
      if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
        logger.warn('High memory usage detected:', {
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        });
      }

      // Emit memory warning if needed
      if (memUsage.heapUsed > 200 * 1024 * 1024) { // 200MB
        this.emit('memoryWarning', {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          timestamp: new Date()
        });
      }

    } catch (error) {
      logger.error('Error updating memory metrics:', error);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.calculateCacheHitRate(),
      averageResponseTimeMs: Math.round(this.metrics.requests.averageResponseTime),
      averageProcessingTimeMs: Math.round(this.metrics.processing.averageProcessingTime),
      errorRate: this.calculateErrorRate(),
      uptime: this.formatUptime(this.metrics.system.uptime)
    };
  }

  /**
   * Get detailed performance report
   */
  getDetailedReport(timeRange = '1h') {
    const now = new Date();
    const timeRangeMs = this.parseTimeRange(timeRange);
    const cutoffTime = new Date(now.getTime() - timeRangeMs);

    const filteredPerformanceLog = this.performanceLog.filter(
      entry => entry.timestamp > cutoffTime
    );

    const filteredErrorLog = this.errorLog.filter(
      entry => entry.timestamp > cutoffTime
    );

    return {
      timeRange,
      period: {
        start: cutoffTime,
        end: now
      },
      requests: this.analyzeRequests(filteredPerformanceLog),
      processing: this.analyzeProcessing(filteredPerformanceLog),
      errors: this.analyzeErrors(filteredErrorLog),
      system: this.metrics.system,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Analyze request patterns
   */
  analyzeRequests(performanceLog) {
    const requests = performanceLog.filter(entry => entry.type === 'request');
    
    const methodStats = {};
    const pathStats = {};
    const statusCodeStats = {};

    requests.forEach(request => {
      // Method statistics
      methodStats[request.method] = (methodStats[request.method] || 0) + 1;
      
      // Path statistics
      pathStats[request.path] = (pathStats[request.path] || 0) + 1;
      
      // Status code statistics
      statusCodeStats[request.statusCode] = (statusCodeStats[request.statusCode] || 0) + 1;
    });

    return {
      total: requests.length,
      methodStats,
      pathStats,
      statusCodeStats,
      averageResponseTime: requests.reduce((sum, r) => sum + r.responseTime, 0) / requests.length || 0
    };
  }

  /**
   * Analyze processing patterns
   */
  analyzeProcessing(performanceLog) {
    const processing = performanceLog.filter(entry => entry.type === 'imageProcessing');
    
    const formatStats = {};
    const sizeRanges = {
      small: 0,    // < 1MB
      medium: 0,   // 1-5MB
      large: 0     // > 5MB
    };

    processing.forEach(entry => {
      // Format statistics
      formatStats[entry.format] = (formatStats[entry.format] || 0) + 1;
      
      // Size range statistics
      const sizeMB = entry.imageSize / 1024 / 1024;
      if (sizeMB < 1) sizeRanges.small++;
      else if (sizeMB < 5) sizeRanges.medium++;
      else sizeRanges.large++;
    });

    return {
      total: processing.length,
      formatStats,
      sizeRanges,
      averageProcessingTime: processing.reduce((sum, p) => sum + p.processingTime, 0) / processing.length || 0,
      successRate: processing.filter(p => p.success).length / processing.length || 0
    };
  }

  /**
   * Analyze error patterns
   */
  analyzeErrors(errorLog) {
    const errorTypes = {};
    const errorFrequency = {};

    errorLog.forEach(error => {
      const errorType = error.message.split(':')[0] || 'Unknown';
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      
      const hour = error.timestamp.getHours();
      errorFrequency[hour] = (errorFrequency[hour] || 0) + 1;
    });

    return {
      total: errorLog.length,
      errorTypes,
      errorFrequency,
      recentErrors: errorLog.slice(-10) // Last 10 errors
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Response time recommendations
    if (this.metrics.requests.averageResponseTime > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'High Response Times',
        description: 'Average response time is above 1 second',
        suggestion: 'Consider implementing caching, database optimization, or code profiling'
      });
    }

    // Memory recommendations
    if (this.metrics.system.memoryUsage > 100 * 1024 * 1024) {
      recommendations.push({
        type: 'system',
        priority: 'medium',
        title: 'High Memory Usage',
        description: 'Memory usage is above 100MB',
        suggestion: 'Check for memory leaks, implement garbage collection, or increase memory limits'
      });
    }

    // Cache recommendations
    const cacheHitRate = this.calculateCacheHitRate();
    if (cacheHitRate < 0.5) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is ${(cacheHitRate * 100).toFixed(1)}%`,
        suggestion: 'Review cache keys, increase TTL, or implement cache warming'
      });
    }

    // Error rate recommendations
    const errorRate = this.calculateErrorRate();
    if (errorRate > 0.1) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'High Error Rate',
        description: `Error rate is ${(errorRate * 100).toFixed(1)}%`,
        suggestion: 'Review error logs, implement better error handling, or add monitoring'
      });
    }

    return recommendations;
  }

  /**
   * Calculate cache hit rate
   */
  calculateCacheHitRate() {
    const total = this.metrics.processing.cacheHits + this.metrics.processing.cacheMisses;
    return total > 0 ? this.metrics.processing.cacheHits / total : 0;
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    const total = this.metrics.requests.successful + this.metrics.requests.failed;
    return total > 0 ? this.metrics.requests.failed / total : 0;
  }

  /**
   * Parse time range string
   */
  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      case 's': return value * 1000;
      default: return 60 * 60 * 1000; // Default to 1 hour
    }
  }

  /**
   * Format uptime
   */
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours}h ${minutes}m ${secs}s`;
  }

  /**
   * Log performance data
   */
  logPerformance(data) {
    this.performanceLog.push(data);
    
    if (this.performanceLog.length > this.maxLogSize) {
      this.performanceLog.shift();
    }
  }

  /**
   * Clean up old logs
   */
  cleanupOldLogs() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    this.performanceLog = this.performanceLog.filter(
      entry => entry.timestamp > oneDayAgo
    );
    
    this.errorLog = this.errorLog.filter(
      entry => entry.timestamp > oneDayAgo
    );
  }

  /**
   * Generate request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    this.metrics = {
      requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
      processing: { totalImages: 0, totalSize: 0, averageProcessingTime: 0, cacheHits: 0, cacheMisses: 0 },
      system: { memoryUsage: 0, cpuUsage: 0, activeConnections: 0, uptime: 0 },
      users: { active: 0, total: 0, newToday: 0 }
    };
    
    this.requestTimes = [];
    this.processingTimes = [];
    this.errorLog = [];
    this.performanceLog = [];
  }
}

module.exports = new PerformanceMonitor();
