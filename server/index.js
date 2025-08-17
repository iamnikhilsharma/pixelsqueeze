const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

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
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
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

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => { logger.info('Connected to MongoDB'); })
.catch((error) => { 
  logger.error('MongoDB connection error:', error); 
  logger.warn('Server will continue without database connection. Some features may not work.');
  // Don't exit the process - allow CORS and basic functionality to work
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
      '/api/performance/*',
      '/api/advanced/*',
      '/api/batch-processing/*',
      '/api/preferences/*'
    ]
  });
});

// Static uploads
app.use('/uploads', storageService.getStaticMiddleware());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/plans', adminPlansRoutes);
app.use('/api/advanced', advancedImageRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/batch-processing', batchProcessingRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionsRoutes);
app.use('/api/admin/invoices', adminInvoicesRoutes);
app.use('/api/admin/metrics', adminMetricsRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notification-preferences', notificationPreferenceRoutes);

// Sentry error handler (before our error handler)
if (sentry.errorHandler) {
  app.use(sentry.errorHandler);
}

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

// Start server
server.listen(PORT, () => {
  logger.info(`PixelSqueeze server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Local storage path: ${process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads')}`);
  if (websocketService) {
    logger.info('WebSocket service is running');
  }
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

module.exports = app; 