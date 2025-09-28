const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../utils/logger');

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    details: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, User: ${req.user?.email || 'anonymous'}`);
    res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      details: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60
    });
  }
};

// Image processing rate limit (more restrictive)
const imageProcessingRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 image processing requests per minute
  message: {
    error: 'Image processing rate limit exceeded',
    code: 'IMAGE_RATE_LIMIT_EXCEEDED',
    details: 'Too many image processing requests, please wait before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Image processing rate limit exceeded for IP: ${req.ip}, User: ${req.user?.email || 'anonymous'}`);
    res.status(429).json({
      error: 'Image processing rate limit exceeded',
      code: 'IMAGE_RATE_LIMIT_EXCEEDED',
      details: 'Too many image processing requests, please wait before trying again.',
      retryAfter: 60
    });
  }
};

// Authentication rate limit (very restrictive)
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per 15 minutes
  message: {
    error: 'Authentication rate limit exceeded',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    details: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Email: ${req.body?.email || 'unknown'}`);
    res.status(429).json({
      error: 'Authentication rate limit exceeded',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      details: 'Too many authentication attempts, please try again later.',
      retryAfter: 15 * 60
    });
  }
};

// API key rate limit (per user)
const apiKeyRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per API key
  keyGenerator: (req) => {
    // Use API key as the key instead of IP
    return req.headers['x-api-key'] || req.ip;
  },
  message: {
    error: 'API rate limit exceeded',
    code: 'API_RATE_LIMIT_EXCEEDED',
    details: 'API rate limit exceeded for this key, please upgrade your plan.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const apiKey = req.headers['x-api-key'] || 'unknown';
    logger.warn(`API rate limit exceeded for key: ${apiKey.substring(0, 8)}...`);
    res.status(429).json({
      error: 'API rate limit exceeded',
      code: 'API_RATE_LIMIT_EXCEEDED',
      details: 'API rate limit exceeded for this key, please upgrade your plan.',
      retryAfter: 60
    });
  }
};

// Slow down middleware (gradually slow down requests)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes, then...
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
});

// Create rate limiters
const generalRateLimit = rateLimit(rateLimitConfig);
const imageProcessingRateLimiter = rateLimit(imageProcessingRateLimit);
const authRateLimiter = rateLimit(authRateLimit);
const apiKeyRateLimiter = rateLimit(apiKeyRateLimit);

// User-based rate limiting (for authenticated users)
const createUserRateLimit = (maxRequests = 200, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip;
    },
    message: {
      error: 'User rate limit exceeded',
      code: 'USER_RATE_LIMIT_EXCEEDED',
      details: 'Rate limit exceeded for this user account.',
      retryAfter: Math.floor(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`User rate limit exceeded for User: ${req.user?.email || 'anonymous'}, IP: ${req.ip}`);
      res.status(429).json({
        error: 'User rate limit exceeded',
        code: 'USER_RATE_LIMIT_EXCEEDED',
        details: 'Rate limit exceeded for this user account.',
        retryAfter: Math.floor(windowMs / 1000)
      });
    }
  });
};

// Pre-create subscription rate limiters
const subscriptionRateLimiters = {
  free: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      error: 'Subscription rate limit exceeded',
      code: 'SUBSCRIPTION_RATE_LIMIT_EXCEEDED',
      details: 'Rate limit exceeded for free plan. Consider upgrading your subscription.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Subscription rate limit exceeded for User: ${req.user?.email || 'anonymous'}, Plan: free`);
      res.status(429).json({
        error: 'Subscription rate limit exceeded',
        code: 'SUBSCRIPTION_RATE_LIMIT_EXCEEDED',
        details: 'Rate limit exceeded for free plan. Consider upgrading your subscription.',
        retryAfter: 15 * 60
      });
    }
  }),
  basic: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      error: 'Subscription rate limit exceeded',
      code: 'SUBSCRIPTION_RATE_LIMIT_EXCEEDED',
      details: 'Rate limit exceeded for basic plan. Consider upgrading your subscription.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Subscription rate limit exceeded for User: ${req.user?.email || 'anonymous'}, Plan: basic`);
      res.status(429).json({
        error: 'Subscription rate limit exceeded',
        code: 'SUBSCRIPTION_RATE_LIMIT_EXCEEDED',
        details: 'Rate limit exceeded for basic plan. Consider upgrading your subscription.',
        retryAfter: 15 * 60
      });
    }
  }),
  pro: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      error: 'Subscription rate limit exceeded',
      code: 'SUBSCRIPTION_RATE_LIMIT_EXCEEDED',
      details: 'Rate limit exceeded for pro plan.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Subscription rate limit exceeded for User: ${req.user?.email || 'anonymous'}, Plan: pro`);
      res.status(429).json({
        error: 'Subscription rate limit exceeded',
        code: 'SUBSCRIPTION_RATE_LIMIT_EXCEEDED',
        details: 'Rate limit exceeded for pro plan.',
        retryAfter: 15 * 60
      });
    }
  }),
  enterprise: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      error: 'Subscription rate limit exceeded',
      code: 'SUBSCRIPTION_RATE_LIMIT_EXCEEDED',
      details: 'Rate limit exceeded for enterprise plan.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Subscription rate limit exceeded for User: ${req.user?.email || 'anonymous'}, Plan: enterprise`);
      res.status(429).json({
        error: 'Subscription rate limit exceeded',
        code: 'SUBSCRIPTION_RATE_LIMIT_EXCEEDED',
        details: 'Rate limit exceeded for enterprise plan.',
        retryAfter: 15 * 60
      });
    }
  })
};

// Middleware to apply subscription-based rate limiting
const subscriptionRateLimit = (req, res, next) => {
  const planType = req.user?.subscription?.plan || 'free';
  const rateLimiter = subscriptionRateLimiters[planType] || subscriptionRateLimiters.free;
  rateLimiter(req, res, next);
};

// Export rate limiters
module.exports = {
  generalRateLimit,
  imageProcessingRateLimiter,
  authRateLimiter,
  apiKeyRateLimiter,
  speedLimiter,
  createUserRateLimit,
  subscriptionRateLimit
};
