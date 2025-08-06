const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to authenticate API keys
const authenticateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const apiKey = authHeader && authHeader.split(' ')[1]; // Bearer API_KEY

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'API_KEY_MISSING'
      });
    }

    const user = await User.findByApiKey(apiKey);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'API_KEY_INVALID'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('API key verification error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to require admin privileges
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// Middleware to check subscription status
const checkSubscription = (req, res, next) => {
  const user = req.user;
  
  if (user.subscription.status !== 'active') {
    return res.status(403).json({
      error: 'Active subscription required',
      code: 'SUBSCRIPTION_INACTIVE',
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status
      }
    });
  }
  
  next();
};

// Middleware to check usage limits
const checkUsageLimit = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Check if user can process more images
    if (!user.canProcessImage()) {
      return res.status(429).json({
        error: 'Monthly usage limit exceeded',
        code: 'USAGE_LIMIT_EXCEEDED',
        usage: {
          current: user.usage.monthlyImages,
          limit: user.subscriptionLimits,
          remaining: user.remainingImages
        }
      });
    }
    
    next();
  } catch (error) {
    logger.error('Usage limit check error:', error);
    return res.status(500).json({
      error: 'Usage verification error',
      code: 'USAGE_CHECK_ERROR'
    });
  }
};

// Middleware to check file size limits
const checkFileSize = (req, res, next) => {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
  
  if (req.file && req.file.size > maxSize) {
    return res.status(413).json({
      error: 'File too large',
      code: 'FILE_TOO_LARGE',
      maxSize: maxSize,
      actualSize: req.file.size
    });
  }
  
  next();
};

// Middleware to check allowed file types
const checkFileType = (req, res, next) => {
  const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,webp').split(',');
  
  if (req.file) {
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return res.status(400).json({
        error: 'File type not allowed',
        code: 'FILE_TYPE_NOT_ALLOWED',
        allowedTypes: allowedTypes,
        providedType: fileExtension
      });
    }
  }
  
  next();
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  authenticateApiKey,
  requireAdmin,
  checkSubscription,
  checkUsageLimit,
  checkFileSize,
  checkFileType,
  optionalAuth
}; 