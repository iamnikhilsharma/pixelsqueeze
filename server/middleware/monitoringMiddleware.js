const monitoringService = require('../services/monitoringService');
const { logger } = require('../utils/logger');

// HTTP request monitoring middleware
const httpMonitoringMiddleware = (req, res, next) => {
  monitoringService.trackHttpRequest(req, res, next);
};

// Database monitoring wrapper
const wrapDatabaseOperation = (operation, collection) => {
  return async (...args) => {
    const startTime = performance.now();
    let status = 'success';
    
    try {
      const result = await operation(...args);
      return result;
    } catch (error) {
      status = 'error';
      monitoringService.trackError('DATABASE_ERROR', {
        operation,
        collection,
        error: error.message,
        component: 'database'
      });
      throw error;
    } finally {
      const duration = (performance.now() - startTime) / 1000;
      monitoringService.trackDatabaseQuery(operation, collection, status, duration);
    }
  };
};

// Image processing monitoring wrapper
const wrapImageProcessing = (processingFunction) => {
  return async (imageBuffer, options = {}) => {
    const startTime = performance.now();
    let status = 'success';
    let format = 'unknown';
    let sizeBytes = 0;
    
    try {
      const result = await processingFunction(imageBuffer, options);
      
      // Extract metrics from result
      if (result && result.format) {
        format = result.format;
      }
      if (result && result.size) {
        sizeBytes = result.size;
      }
      
      return result;
    } catch (error) {
      status = 'error';
      monitoringService.trackError('IMAGE_PROCESSING_ERROR', {
        error: error.message,
        format: options.format || 'unknown',
        component: 'image_processor'
      });
      throw error;
    } finally {
      const duration = (performance.now() - startTime) / 1000;
      monitoringService.trackImageProcessing(format, status, duration, sizeBytes);
    }
  };
};

// Cache monitoring wrapper
const wrapCacheOperation = (cacheOperation) => {
  return async (...args) => {
    const startTime = performance.now();
    let status = 'success';
    let operation = 'unknown';
    let namespace = 'unknown';
    
    try {
      // Extract operation details from args
      if (args.length >= 2) {
        namespace = args[0];
        operation = args[1];
      }
      
      const result = await cacheOperation(...args);
      return result;
    } catch (error) {
      status = 'error';
      monitoringService.trackError('CACHE_ERROR', {
        operation,
        namespace,
        error: error.message,
        component: 'cache'
      });
      throw error;
    } finally {
      monitoringService.trackCacheOperation(operation, namespace, status);
    }
  };
};

// Performance monitoring middleware
const performanceMonitoringMiddleware = (label) => {
  return (req, res, next) => {
    monitoringService.startPerformanceTimer(label);
    
    res.on('finish', () => {
      const duration = monitoringService.endPerformanceTimer(label);
      if (duration) {
        logger.debug(`Performance: ${label} took ${duration.toFixed(3)}s`);
      }
    });
    
    next();
  };
};

// Error tracking middleware
const errorTrackingMiddleware = (error, req, res, next) => {
  // Track the error
  monitoringService.trackError('EXPRESS_ERROR', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    component: 'express'
  });

  // Log the error
  logger.error('Express error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  });

  next(error);
};

// API usage tracking middleware
const apiUsageTrackingMiddleware = (req, res, next) => {
  // Track API usage
  const userType = req.user ? 'authenticated' : 'anonymous';
  const plan = req.user?.subscription?.plan || 'free';
  const endpoint = req.route ? req.route.path : req.path;
  
  monitoringService.trackApiUsage(endpoint, userType, plan);
  
  next();
};

// Business metrics middleware
const businessMetricsMiddleware = (req, res, next) => {
  // Track business metrics based on route
  if (req.path.includes('/api/optimize')) {
    monitoringService.trackBusinessMetric('image_optimization', 1, {
      user_type: req.user ? 'authenticated' : 'anonymous',
      plan: req.user?.subscription?.plan || 'free'
    });
  }
  
  if (req.path.includes('/api/auth/register')) {
    monitoringService.trackBusinessMetric('user_registration', 1, {
      source: 'web'
    });
  }
  
  if (req.path.includes('/api/subscription')) {
    monitoringService.trackBusinessMetric('subscription_action', 1, {
      action: req.method.toLowerCase(),
      plan: req.body?.plan || 'unknown'
    });
  }
  
  next();
};

// Health check endpoint middleware
const healthCheckMiddleware = (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    const healthStatus = monitoringService.getHealthStatus();
    res.json(healthStatus);
    return;
  }
  next();
};

// Metrics endpoint middleware
const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics' || req.path === '/api/metrics') {
    res.set('Content-Type', client.register.contentType);
    res.end(monitoringService.getMetrics());
    return;
  }
  next();
};

// User activity tracking
const trackUserActivity = (req, res, next) => {
  if (req.user) {
    // Track user activity
    monitoringService.setCustomMetric('user_activity', 1, {
      user_id: req.user.id,
      endpoint: req.path,
      method: req.method
    });
  }
  next();
};

// System resource monitoring
const systemResourceMonitoring = () => {
  const os = require('os');
  
  setInterval(() => {
    try {
      // CPU usage
      const cpuUsage = process.cpuUsage();
      monitoringService.setCustomMetric('cpu_usage', cpuUsage.user + cpuUsage.system, {
        type: 'microseconds'
      });
      
      // Memory usage
      const memoryUsage = process.memoryUsage();
      monitoringService.setCustomMetric('memory_usage', memoryUsage.heapUsed, {
        type: 'heap_used'
      });
      
      // System load
      const loadAvg = os.loadavg();
      monitoringService.setCustomMetric('system_load', loadAvg[0], {
        type: '1min'
      });
      
      // Active connections (if available)
      if (process._getActiveHandles) {
        const activeHandles = process._getActiveHandles().length;
        monitoringService.setCustomMetric('active_handles', activeHandles);
      }
      
    } catch (error) {
      logger.error('Failed to collect system resource metrics:', error);
    }
  }, 30000); // Every 30 seconds
};

module.exports = {
  httpMonitoringMiddleware,
  wrapDatabaseOperation,
  wrapImageProcessing,
  wrapCacheOperation,
  performanceMonitoringMiddleware,
  errorTrackingMiddleware,
  apiUsageTrackingMiddleware,
  businessMetricsMiddleware,
  healthCheckMiddleware,
  metricsMiddleware,
  trackUserActivity,
  systemResourceMonitoring
};
