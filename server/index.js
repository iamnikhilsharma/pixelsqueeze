const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import comprehensive rate limiting middleware
const {
  generalRateLimit,
  imageProcessingRateLimiter,
  authRateLimiter,
  apiKeyRateLimiter,
  speedLimiter,
  subscriptionRateLimit
} = require('./middleware/rateLimiter');

// Import caching middleware
const {
  createCacheMiddleware,
  createCacheInvalidationMiddleware,
  cacheStatsMiddleware,
  cacheHealthMiddleware,
  generateUserKey,
  generateImageCacheKey
} = require('./middleware/cacheMiddleware');

// Import cache service
const cacheService = require('./services/cacheService');

// Import monitoring service
const monitoringService = require('./services/monitoringService');
const {
  httpMonitoringMiddleware,
  errorTrackingMiddleware,
  apiUsageTrackingMiddleware,
  businessMetricsMiddleware,
  healthCheckMiddleware,
  metricsMiddleware,
  trackUserActivity,
  systemResourceMonitoring
} = require('./middleware/monitoringMiddleware');

// Import security service
const securityService = require('./services/securityService');
const securityMiddleware = require('./middleware/securityMiddleware');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');
const advancedImageRoutes = require('./routes/advancedImage');
const billingRoutes = require('./routes/billing');
const analyticsRoutes = require('./routes/analytics');
const batchProcessingRoutes = require('./routes/batchProcessing');
const preferencesRoutes = require('./routes/preferences');
const razorpayRoutes = require('./routes/razorpay');
const subscriptionRoutes = require('./routes/subscription');
const invoiceRoutes = require('./routes/invoice');
const adminAuthRoutes = require('./routes/adminAuth');
const storageService = require('./services/storageService');
const sentry = require('./services/sentry');
const adminPlansRoutes = require('./routes/adminPlans');
const adminSubscriptionsRoutes = require('./routes/adminSubscriptions');
const adminInvoicesRoutes = require('./routes/adminInvoices');
const adminMetricsRoutes = require('./routes/adminMetrics');
const adminNotificationRoutes = require('./routes/adminNotifications');
const notificationRoutes = require('./routes/notifications');
const notificationPreferenceRoutes = require('./routes/notificationPreferences');

const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();
// Force port to avoid conflicts, but allow override via environment
const PORT = process.env.PORT === '5000' ? 5002 : (process.env.PORT || 5002);

// Create HTTP server for WebSocket support
const server = require('http').createServer(app);

// Trust proxy
app.set('trust proxy', 1);

// Sentry request handler (if configured)
if (sentry.requestHandler) {
  app.use(sentry.requestHandler);
}

// Security middleware
// Security headers
app.use(securityService.getSecurityHeaders());

// CORS configuration
app.use(cors(securityService.getCORSConfig()));

// Handle CORS preflight requests explicitly
app.options('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://pixelsqueeze-rho.vercel.app',
    'https://pixelsqueeze.vercel.app',
    'https://pixelsqueeze.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply comprehensive rate limiting middleware
app.use(speedLimiter); // Slow down requests gradually
app.use(generalRateLimit); // General rate limiting for all requests

// Apply monitoring middleware
app.use(httpMonitoringMiddleware); // HTTP request monitoring
app.use(apiUsageTrackingMiddleware); // API usage tracking
app.use(businessMetricsMiddleware); // Business metrics tracking
app.use(trackUserActivity); // User activity tracking
app.use(healthCheckMiddleware); // Health check endpoint
app.use(metricsMiddleware); // Metrics endpoint

// Apply security middleware
app.use(securityMiddleware.sanitizeInput); // Input sanitization
app.use(securityMiddleware.preventXSS); // XSS prevention
app.use(securityMiddleware.preventSQLInjection); // SQL injection prevention
app.use(securityMiddleware.logSecurityEvents); // Security event logging
app.use(securityMiddleware.limitRequestSize()); // Request size limiting

// Database connection with improved configuration
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Maintain a minimum of 5 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
};

mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
.then(() => { 
  logger.info('Connected to MongoDB successfully'); 
  logger.info(`MongoDB connection state: ${mongoose.connection.readyState}`);
})
.catch((error) => { 
  logger.error('MongoDB connection error:', error); 
  logger.warn('Server will continue without database connection. Some features may not work.');
  // Don't exit the process - allow CORS and basic functionality to work
});

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  try {
    if (websocketService) {
      websocketService.shutdown();
    }
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  try {
    if (websocketService) {
      websocketService.shutdown();
    }
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
  process.exit(0);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime(), environment: process.env.NODE_ENV });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  logger.info(`CORS test request from origin: ${req.headers.origin}`);
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    corsEnabled: true
  });
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    routes: [
      '/api/auth/*',
      '/api/analytics/*',
      '/api/advanced/*',
      '/api/batch-processing/*',
      '/api/preferences/*'
    ]
  });
});

// Static uploads
app.use('/uploads', storageService.getStaticMiddleware());

// Routes
// API Routes with specific rate limiting, caching, and security
app.use('/api/auth', authRateLimiter, securityMiddleware.secureAuthentication, securityMiddleware.validatePasswordStrength, securityMiddleware.validateEmailFormat, authRoutes); // Strict rate limiting + security for auth
app.use('/api', subscriptionRateLimit, createCacheMiddleware('api', 300, generateUserKey), apiRoutes); // Subscription-based rate limiting + caching
app.use('/api/webhooks', webhookRoutes); // No rate limiting for webhooks
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', securityMiddleware.validateSignature, adminRoutes);
app.use('/api/admin/plans', adminPlansRoutes);
app.use('/api/advanced', imageProcessingRateLimiter, createCacheMiddleware('advanced', 600, generateUserKey), securityMiddleware.secureFileUpload, advancedImageRoutes); // Image processing + caching + file security
app.use('/api/billing', securityMiddleware.sensitiveOperationRateLimit, billingRoutes);
app.use('/api/analytics', createCacheMiddleware('analytics', 300, generateUserKey), analyticsRoutes); // Analytics caching
app.use('/api/batch-processing', imageProcessingRateLimiter, securityMiddleware.secureFileUpload, batchProcessingRoutes); // Image processing + file security
app.use('/api/preferences', preferencesRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/subscription', securityMiddleware.sensitiveOperationRateLimit, subscriptionRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionsRoutes);
app.use('/api/admin/invoices', adminInvoicesRoutes);
app.use('/api/admin/metrics', adminMetricsRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/notifications', createCacheMiddleware('notifications', 180, generateUserKey), notificationRoutes); // Notifications caching
app.use('/api/notification-preferences', notificationPreferenceRoutes);

// Cache management endpoints
app.get('/api/cache/stats', cacheStatsMiddleware);
app.get('/api/cache/health', cacheHealthMiddleware);
app.post('/api/cache/clear', async (req, res) => {
  try {
    const result = await cacheService.clear();
    res.json({
      success: result,
      message: result ? 'Cache cleared successfully' : 'Failed to clear cache'
    });
  } catch (error) {
    logger.error('Cache clear error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

// Sentry error handler (before our error handler)
if (sentry.errorHandler) {
  app.use(sentry.errorHandler);
}

// Custom error tracking middleware
app.use(errorTrackingMiddleware);

// Security error handler
app.use(securityMiddleware.securityErrorHandler);

// Error handling
app.use(errorHandler);

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Initialize WebSocket service
let websocketService;
try {
  const WebSocketService = require('./services/websocketService');
  websocketService = new WebSocketService(server);
  logger.info('WebSocket service initialized successfully');
} catch (error) {
  logger.warn('WebSocket service not available:', error.message);
}

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  // Shutdown WebSocket service
  if (websocketService) {
    logger.info('Shutting down WebSocket service...');
    websocketService.shutdown();
    logger.info('WebSocket service shutdown complete');
  }
  
  // Shutdown cache service
  logger.info('Shutting down cache service...');
  await cacheService.disconnect();
  logger.info('Cache service shutdown complete');
  
  // Close database connection
  logger.info('Closing database connection...');
  await mongoose.connection.close();
  logger.info('Database connection closed');
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
  logger.info(`PixelSqueeze server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Local storage path: ${process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads')}`);
  if (websocketService) {
    logger.info('WebSocket service is running');
  }
  logger.info(`Cache service: ${cacheService.isAvailable() ? 'available' : 'unavailable'}`);
  logger.info(`Monitoring service: ${monitoringService.isInitialized ? 'initialized' : 'not initialized'}`);
  logger.info(`Security service: initialized`);
  
  // Start system resource monitoring
  systemResourceMonitoring();
  logger.info('System resource monitoring started');
});

module.exports = app; 