const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const { logger } = require('../utils/logger');

// Redis client for distributed rate limiting
let redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  redis.on('error', (err) => {
    logger.warn('Redis connection failed, falling back to memory-based rate limiting:', err.message);
    redis = null;
  });
} catch (error) {
  logger.warn('Redis not available, using memory-based rate limiting');
  redis = null;
}

// In-memory store fallback
const memoryStore = new Map();

// Plan-based rate limits
const PLAN_LIMITS = {
  free: {
    requestsPerMinute: 30,
    requestsPerHour: 100,
    requestsPerDay: 1000,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxBatchSize: 5
  },
  starter: {
    requestsPerMinute: 60,
    requestsPerHour: 300,
    requestsPerDay: 5000,
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxBatchSize: 15
  },
  pro: {
    requestsPerMinute: 120,
    requestsPerHour: 1000,
    requestsPerDay: 25000,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxBatchSize: 50
  },
  enterprise: {
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    requestsPerDay: 100000,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxBatchSize: 100
  }
};

// Default limits for unauthenticated users
const DEFAULT_LIMITS = {
  requestsPerMinute: 10,
  requestsPerHour: 50,
  requestsPerDay: 500,
  maxFileSize: 2 * 1024 * 1024, // 2MB
  maxBatchSize: 3
};

/**
 * Get user's plan limits
 */
function getUserLimits(user) {
  if (!user || !user.plan) {
    return DEFAULT_LIMITS;
  }
  
  const plan = user.plan.toLowerCase();
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Create a rate limiter with Redis or memory fallback
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100,
    message = 'Too many requests, please try again later.',
    standardHeaders = true,
    legacyHeaders = false,
    store = null
  } = options;

  // Use Redis if available, otherwise use memory
  const limiterStore = store || (redis ? createRedisStore() : createMemoryStore());

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders,
    legacyHeaders,
    store: limiterStore,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${req.ip} - ${req.method} ${req.path}`);
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
}

/**
 * Create Redis store for rate limiting
 */
function createRedisStore() {
  return {
    incr: async (key) => {
      try {
        const multi = redis.multi();
        multi.incr(key);
        multi.expire(key, 60); // 1 minute TTL
        
        const results = await multi.exec();
        return {
          totalHits: results[0][1],
          resetTime: new Date(Date.now() + 60000)
        };
      } catch (error) {
        logger.error('Redis rate limiting error:', error);
        throw error;
      }
    },
    decrement: async (key) => {
      try {
        await redis.decr(key);
      } catch (error) {
        logger.error('Redis decrement error:', error);
      }
    },
    resetKey: async (key) => {
      try {
        await redis.del(key);
      } catch (error) {
        logger.error('Redis reset key error:', error);
      }
    }
  };
}

/**
 * Create memory store for rate limiting
 */
function createMemoryStore() {
  return {
    incr: async (key) => {
      const now = Date.now();
      const windowMs = 60 * 1000;
      
      if (!memoryStore.has(key)) {
        memoryStore.set(key, { hits: 0, resetTime: now + windowMs });
      }
      
      const record = memoryStore.get(key);
      
      if (now > record.resetTime) {
        record.hits = 1;
        record.resetTime = now + windowMs;
      } else {
        record.hits++;
      }
      
      return {
        totalHits: record.hits,
        resetTime: new Date(record.resetTime)
      };
    },
    decrement: async (key) => {
      if (memoryStore.has(key)) {
        const record = memoryStore.get(key);
        record.hits = Math.max(0, record.hits - 1);
      }
    },
    resetKey: async (key) => {
      memoryStore.delete(key);
    }
  };
}

/**
 * Dynamic rate limiter based on user plan
 */
function dynamicRateLimiter(req, res, next) {
  const user = req.user;
  const limits = getUserLimits(user);
  
  // Create a unique key for this user
  const key = user ? `user:${user.id}:${req.path}` : `ip:${req.ip}:${req.path}`;
  
  // Check if user has exceeded their limits
  const currentUsage = getUserCurrentUsage(user, req.path);
  
  if (currentUsage.requestsPerMinute >= limits.requestsPerMinute) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests per minute for your plan',
      retryAfter: 60,
      limits: limits
    });
  }
  
  if (currentUsage.requestsPerHour >= limits.requestsPerHour) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests per hour for your plan',
      retryAfter: 3600,
      limits: limits
    });
  }
  
  if (currentUsage.requestsPerDay >= limits.requestsPerDay) {
    return res.status(429).json({
      error: 'Daily limit exceeded',
      message: 'Daily request limit reached for your plan',
      retryAfter: 86400,
      limits: limits
    });
  }
  
  // Increment usage counters
  incrementUserUsage(user, req.path);
  
  next();
}

/**
 * Get current usage for a user
 */
function getUserCurrentUsage(user, path) {
  const key = user ? `usage:${user.id}:${path}` : `usage:ip:${path}`;
  
  if (redis) {
    // Redis implementation would go here
    return { requestsPerMinute: 0, requestsPerHour: 0, requestsPerDay: 0 };
  } else {
    // Memory implementation
    const now = Date.now();
    const usage = memoryStore.get(key) || {
      minute: { count: 0, resetTime: now + 60000 },
      hour: { count: 0, resetTime: now + 3600000 },
      day: { count: 0, resetTime: now + 86400000 }
    };
    
    return {
      requestsPerMinute: usage.minute.count,
      requestsPerHour: usage.hour.count,
      requestsPerDay: usage.day.count
    };
  }
}

/**
 * Increment usage counters for a user
 */
function incrementUserUsage(user, path) {
  const key = user ? `usage:${user.id}:${path}` : `usage:ip:${path}`;
  
  if (redis) {
    // Redis implementation would go here
    // This would use Redis pipelines for atomic increments
  } else {
    // Memory implementation
    const now = Date.now();
    const usage = memoryStore.get(key) || {
      minute: { count: 0, resetTime: now + 60000 },
      hour: { count: 0, resetTime: now + 3600000 },
      day: { count: 0, resetTime: now + 86400000 }
    };
    
    // Reset counters if time window has passed
    if (now > usage.minute.resetTime) {
      usage.minute = { count: 1, resetTime: now + 60000 };
    } else {
      usage.minute.count++;
    }
    
    if (now > usage.hour.resetTime) {
      usage.hour = { count: 1, resetTime: now + 3600000 };
    } else {
      usage.hour.count++;
    }
    
    if (now > usage.day.resetTime) {
      usage.day = { count: 1, resetTime: now + 86400000 };
    } else {
      usage.day.count++;
    }
    
    memoryStore.set(key, usage);
  }
}

/**
 * File size validation middleware
 */
function validateFileSize(req, res, next) {
  const user = req.user;
  const limits = getUserLimits(user);
  
  if (req.files) {
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > limits.maxFileSize) {
      return res.status(413).json({
        error: 'File too large',
        message: `Total file size exceeds limit of ${formatBytes(limits.maxFileSize)} for your plan`,
        maxSize: limits.maxFileSize,
        currentSize: totalSize
      });
    }
  }
  
  if (req.file && req.file.size > limits.maxFileSize) {
    return res.status(413).json({
      error: 'File too large',
      message: `File size exceeds limit of ${formatBytes(limits.maxFileSize)} for your plan`,
      maxSize: limits.maxFileSize,
      currentSize: req.file.size
    });
  }
  
  next();
}

/**
 * Batch size validation middleware
 */
function validateBatchSize(req, res, next) {
  const user = req.user;
  const limits = getUserLimits(user);
  
  if (req.files && req.files.length > limits.maxBatchSize) {
    return res.status(413).json({
      error: 'Batch too large',
      message: `Batch size exceeds limit of ${limits.maxBatchSize} files for your plan`,
      maxBatchSize: limits.maxBatchSize,
      currentBatchSize: req.files.length
    });
  }
  
  next();
}

/**
 * Utility function to format bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Clean up expired usage records
 */
function cleanupExpiredUsage() {
  const now = Date.now();
  
  for (const [key, usage] of memoryStore.entries()) {
    if (key.startsWith('usage:')) {
      if (now > usage.day.resetTime) {
        memoryStore.delete(key);
      }
    }
  }
}

// Clean up expired usage every hour
setInterval(cleanupExpiredUsage, 3600000);

module.exports = {
  createRateLimiter,
  dynamicRateLimiter,
  validateFileSize,
  validateBatchSize,
  getUserLimits,
  PLAN_LIMITS,
  DEFAULT_LIMITS
};
