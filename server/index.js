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
const storageService = require('./services/storageService');
const sentry = require('./services/sentry');

const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

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

// CORS with multi-origin and wildcard support
function buildCorsOrigin() {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:3000';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  const patterns = list.map(item => {
    if (item.includes('*')) {
      const escaped = item.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      return new RegExp(`^${escaped}$`);
    }
    return item;
  });

  return function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = patterns.some(p => (p instanceof RegExp ? p.test(origin) : p === origin));
    logger.info(`CORS check for origin: ${origin}, allowed: ${allowed}`);
    if (allowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  };
}

// Enhanced CORS configuration
const corsOptions = {
  origin: buildCorsOrigin(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle CORS preflight requests explicitly
app.options('*', cors(corsOptions));

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
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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

// Static uploads
app.use('/uploads', storageService.getStaticMiddleware());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/advanced', advancedImageRoutes);
app.use('/api/billing', billingRoutes);

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

app.listen(PORT, () => {
  logger.info(`PixelSqueeze server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Local storage path: ${process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads')}`);
});

process.on('SIGTERM', () => { logger.info('SIGTERM received, shutting down gracefully'); mongoose.connection.close(() => { logger.info('MongoDB connection closed'); process.exit(0); }); });
process.on('SIGINT', () => { logger.info('SIGINT received, shutting down gracefully'); mongoose.connection.close(() => { logger.info('MongoDB connection closed'); process.exit(0); }); });

module.exports = app; 