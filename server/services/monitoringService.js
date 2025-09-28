const Sentry = require('@sentry/node');
const { logger } = require('../utils/logger');
const performance = require('performance-now');
const client = require('prom-client');

class MonitoringService {
  constructor() {
    this.isInitialized = false;
    this.metrics = {};
    this.customMetrics = {};
    this.performanceMetrics = {};
    
    // Initialize Prometheus metrics
    this.initializePrometheusMetrics();
    
    // Initialize Sentry
    this.initializeSentry();
  }

  initializePrometheusMetrics() {
    try {
      // Default metrics
      client.collectDefaultMetrics({
        timeout: 5000,
        gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
        eventLoopMonitoringPrecision: 10,
      });

      // Custom metrics
      this.metrics = {
        // HTTP request metrics
        httpRequestsTotal: new client.Counter({
          name: 'http_requests_total',
          help: 'Total number of HTTP requests',
          labelNames: ['method', 'route', 'status_code']
        }),

        httpRequestDuration: new client.Histogram({
          name: 'http_request_duration_seconds',
          help: 'Duration of HTTP requests in seconds',
          labelNames: ['method', 'route', 'status_code'],
          buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
        }),

        // Image processing metrics
        imageProcessingTotal: new client.Counter({
          name: 'image_processing_total',
          help: 'Total number of images processed',
          labelNames: ['format', 'status']
        }),

        imageProcessingDuration: new client.Histogram({
          name: 'image_processing_duration_seconds',
          help: 'Duration of image processing in seconds',
          labelNames: ['format', 'status'],
          buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
        }),

        imageSizeBytes: new client.Histogram({
          name: 'image_size_bytes',
          help: 'Size of processed images in bytes',
          labelNames: ['format'],
          buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600]
        }),

        // Database metrics
        databaseQueriesTotal: new client.Counter({
          name: 'database_queries_total',
          help: 'Total number of database queries',
          labelNames: ['operation', 'collection', 'status']
        }),

        databaseQueryDuration: new client.Histogram({
          name: 'database_query_duration_seconds',
          help: 'Duration of database queries in seconds',
          labelNames: ['operation', 'collection'],
          buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
        }),

        // Cache metrics
        cacheOperationsTotal: new client.Counter({
          name: 'cache_operations_total',
          help: 'Total number of cache operations',
          labelNames: ['operation', 'namespace', 'status']
        }),

        cacheHitRatio: new client.Gauge({
          name: 'cache_hit_ratio',
          help: 'Cache hit ratio (0-1)'
        }),

        // User metrics
        activeUsers: new client.Gauge({
          name: 'active_users_total',
          help: 'Number of active users'
        }),

        userRegistrationsTotal: new client.Counter({
          name: 'user_registrations_total',
          help: 'Total number of user registrations',
          labelNames: ['source']
        }),

        // Error metrics
        errorsTotal: new client.Counter({
          name: 'errors_total',
          help: 'Total number of errors',
          labelNames: ['type', 'severity', 'component']
        }),

        // Business metrics
        apiUsageTotal: new client.Counter({
          name: 'api_usage_total',
          help: 'Total API usage',
          labelNames: ['endpoint', 'user_type', 'plan']
        }),

        subscriptionMetrics: new client.Gauge({
          name: 'subscriptions_total',
          help: 'Number of active subscriptions',
          labelNames: ['plan', 'status']
        })
      };

      logger.info('Prometheus metrics initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Prometheus metrics:', error);
    }
  }

  initializeSentry() {
    try {
      if (process.env.SENTRY_DSN) {
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app: require('express') }),
            new Sentry.Integrations.Mongo({ useMongoose: true }),
            new Sentry.Integrations.OnUncaughtException(),
            new Sentry.Integrations.OnUnhandledRejection(),
          ],
          beforeSend(event) {
            // Filter out development errors in production
            if (process.env.NODE_ENV === 'production' && event.exception) {
              const error = event.exception.values[0];
              if (error.type === 'ValidationError' || error.type === 'CastError') {
                return null; // Don't send validation errors to Sentry
              }
            }
            return event;
          }
        });

        this.isInitialized = true;
        logger.info('Sentry initialized successfully');
      } else {
        logger.warn('Sentry DSN not provided, error tracking disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize Sentry:', error);
    }
  }

  // HTTP request monitoring
  trackHttpRequest(req, res, next) {
    const startTime = performance();
    const originalSend = res.send;

    res.send = function(data) {
      const duration = (performance() - startTime) / 1000; // Convert to seconds
      const route = req.route ? req.route.path : req.path;
      
      // Track metrics
      if (monitoringService.metrics.httpRequestsTotal) {
        monitoringService.metrics.httpRequestsTotal
          .labels(req.method, route, res.statusCode.toString())
          .inc();
      }

      if (monitoringService.metrics.httpRequestDuration) {
        monitoringService.metrics.httpRequestDuration
          .labels(req.method, route, res.statusCode.toString())
          .observe(duration);
      }

      // Track errors
      if (res.statusCode >= 400) {
        monitoringService.trackError('HTTP_ERROR', {
          method: req.method,
          route: route,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      }

      return originalSend.call(this, data);
    };

    next();
  }

  // Image processing monitoring
  trackImageProcessing(format, status, duration, sizeBytes) {
    try {
      if (this.metrics.imageProcessingTotal) {
        this.metrics.imageProcessingTotal
          .labels(format, status)
          .inc();
      }

      if (this.metrics.imageProcessingDuration) {
        this.metrics.imageProcessingDuration
          .labels(format, status)
          .observe(duration);
      }

      if (this.metrics.imageSizeBytes) {
        this.metrics.imageSizeBytes
          .labels(format)
          .observe(sizeBytes);
      }

      logger.debug(`Image processing tracked: ${format}, ${status}, ${duration}s, ${sizeBytes} bytes`);
    } catch (error) {
      logger.error('Failed to track image processing metrics:', error);
    }
  }

  // Database monitoring
  trackDatabaseQuery(operation, collection, status, duration) {
    try {
      if (this.metrics.databaseQueriesTotal) {
        this.metrics.databaseQueriesTotal
          .labels(operation, collection, status)
          .inc();
      }

      if (this.metrics.databaseQueryDuration) {
        this.metrics.databaseQueryDuration
          .labels(operation, collection)
          .observe(duration);
      }
    } catch (error) {
      logger.error('Failed to track database query metrics:', error);
    }
  }

  // Cache monitoring
  trackCacheOperation(operation, namespace, status) {
    try {
      if (this.metrics.cacheOperationsTotal) {
        this.metrics.cacheOperationsTotal
          .labels(operation, namespace, status)
          .inc();
      }
    } catch (error) {
      logger.error('Failed to track cache operation metrics:', error);
    }
  }

  // Error tracking
  trackError(type, details = {}) {
    try {
      // Track in Prometheus
      if (this.metrics.errorsTotal) {
        this.metrics.errorsTotal
          .labels(type, details.severity || 'error', details.component || 'unknown')
          .inc();
      }

      // Track in Sentry
      if (this.isInitialized) {
        Sentry.withScope((scope) => {
          scope.setTag('error_type', type);
          scope.setContext('error_details', details);
          
          if (details.userId) {
            scope.setUser({ id: details.userId });
          }

          Sentry.captureException(new Error(`${type}: ${details.message || 'Unknown error'}`));
        });
      }

      logger.error(`Error tracked: ${type}`, details);
    } catch (error) {
      logger.error('Failed to track error:', error);
    }
  }

  // User metrics
  trackUserRegistration(source = 'web') {
    try {
      if (this.metrics.userRegistrationsTotal) {
        this.metrics.userRegistrationsTotal
          .labels(source)
          .inc();
      }
    } catch (error) {
      logger.error('Failed to track user registration:', error);
    }
  }

  updateActiveUsers(count) {
    try {
      if (this.metrics.activeUsers) {
        this.metrics.activeUsers.set(count);
      }
    } catch (error) {
      logger.error('Failed to update active users metric:', error);
    }
  }

  // API usage tracking
  trackApiUsage(endpoint, userType, plan) {
    try {
      if (this.metrics.apiUsageTotal) {
        this.metrics.apiUsageTotal
          .labels(endpoint, userType, plan)
          .inc();
      }
    } catch (error) {
      logger.error('Failed to track API usage:', error);
    }
  }

  // Subscription metrics
  updateSubscriptionMetrics(plan, status, count) {
    try {
      if (this.metrics.subscriptionMetrics) {
        this.metrics.subscriptionMetrics
          .labels(plan, status)
          .set(count);
      }
    } catch (error) {
      logger.error('Failed to update subscription metrics:', error);
    }
  }

  // Performance monitoring
  startPerformanceTimer(label) {
    this.performanceMetrics[label] = performance();
  }

  endPerformanceTimer(label) {
    if (this.performanceMetrics[label]) {
      const duration = (performance() - this.performanceMetrics[label]) / 1000;
      delete this.performanceMetrics[label];
      return duration;
    }
    return null;
  }

  // Health check
  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        sentry: this.isInitialized,
        prometheus: !!this.metrics.httpRequestsTotal,
        logger: true
      },
      metrics: {
        totalMetrics: Object.keys(this.metrics).length,
        activeTimers: Object.keys(this.performanceMetrics).length
      }
    };
  }

  // Get metrics for Prometheus scraping
  getMetrics() {
    return client.register.metrics();
  }

  // Custom metric tracking
  setCustomMetric(name, value, labels = {}) {
    try {
      if (!this.customMetrics[name]) {
        this.customMetrics[name] = new client.Gauge({
          name: `custom_${name}`,
          help: `Custom metric: ${name}`,
          labelNames: Object.keys(labels)
        });
      }

      this.customMetrics[name].set(labels, value);
    } catch (error) {
      logger.error(`Failed to set custom metric ${name}:`, error);
    }
  }

  // Business intelligence metrics
  trackBusinessMetric(metricName, value, labels = {}) {
    try {
      const businessMetric = `business_${metricName}`;
      
      if (!this.customMetrics[businessMetric]) {
        this.customMetrics[businessMetric] = new client.Counter({
          name: businessMetric,
          help: `Business metric: ${metricName}`,
          labelNames: Object.keys(labels)
        });
      }

      this.customMetrics[businessMetric].inc(labels, value);
    } catch (error) {
      logger.error(`Failed to track business metric ${metricName}:`, error);
    }
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

module.exports = monitoringService;
