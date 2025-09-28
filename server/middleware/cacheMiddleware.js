const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

// Cache middleware factory
const createCacheMiddleware = (namespace, ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if Redis is not available
    if (!cacheService.isAvailable()) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) : generateDefaultKey(req);
      
      // Try to get from cache
      const cachedData = await cacheService.get(namespace, cacheKey);
      
      if (cachedData !== null) {
        logger.debug(`Cache hit for ${namespace}:${cacheKey}`);
        
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': `${namespace}:${cacheKey}`,
          'X-Cache-TTL': ttl
        });
        
        return res.json(cachedData);
      }

      // Cache miss - continue to route handler
      logger.debug(`Cache miss for ${namespace}:${cacheKey}`);
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache the response data
        cacheService.set(namespace, cacheKey, data, ttl).catch(error => {
          logger.error('Failed to cache response:', error);
        });
        
        // Add cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': `${namespace}:${cacheKey}`,
          'X-Cache-TTL': ttl
        });
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Default cache key generator
const generateDefaultKey = (req) => {
  const userId = req.user?.id || 'anonymous';
  const queryString = req.url.split('?')[1] || '';
  return `${userId}:${req.path}:${queryString}`;
};

// User-specific cache key generator
const generateUserKey = (req) => {
  const userId = req.user?.id || 'anonymous';
  const queryString = req.url.split('?')[1] || '';
  return `${userId}:${req.path}:${queryString}`;
};

// API key-specific cache key generator
const generateApiKeyCacheKey = (req) => {
  const apiKey = req.headers['x-api-key'] || 'no-key';
  const queryString = req.url.split('?')[1] || '';
  return `${apiKey}:${req.path}:${queryString}`;
};

// Image-specific cache key generator
const generateImageCacheKey = (req) => {
  const userId = req.user?.id || 'anonymous';
  const imageId = req.params.id || req.query.id || '';
  return `${userId}:image:${imageId}`;
};

// Cache invalidation middleware
const createCacheInvalidationMiddleware = (namespace, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip for GET requests
    if (req.method === 'GET') {
      return next();
    }

    try {
      // Generate cache key to invalidate
      const cacheKey = keyGenerator ? keyGenerator(req) : generateDefaultKey(req);
      
      // Delete specific key
      await cacheService.delete(namespace, cacheKey);
      
      // Also invalidate related keys (e.g., user's image list when an image is updated)
      if (namespace === 'images' && req.user?.id) {
        await cacheService.deletePattern(namespace, `${req.user.id}:*`);
      }
      
      logger.debug(`Cache invalidated for ${namespace}:${cacheKey}`);
      
      next();
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      next();
    }
  };
};

// Cache warming middleware
const createCacheWarmingMiddleware = (namespace, warmingFunction, ttl = 3600) => {
  return async (req, res, next) => {
    try {
      const cacheKey = generateDefaultKey(req);
      
      // Check if cache exists
      const exists = await cacheService.exists(namespace, cacheKey);
      
      if (!exists) {
        // Warm the cache
        const data = await warmingFunction(req);
        if (data) {
          await cacheService.set(namespace, cacheKey, data, ttl);
          logger.debug(`Cache warmed for ${namespace}:${cacheKey}`);
        }
      }
      
      next();
    } catch (error) {
      logger.error('Cache warming error:', error);
      next();
    }
  };
};

// Cache statistics middleware
const cacheStatsMiddleware = async (req, res, next) => {
  try {
    const stats = await cacheService.getStats();
    
    res.json({
      cache: {
        available: cacheService.isAvailable(),
        connected: cacheService.isConnected,
        stats: stats
      }
    });
  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({
      error: 'Failed to get cache statistics',
      details: error.message
    });
  }
};

// Cache health check middleware
const cacheHealthMiddleware = async (req, res, next) => {
  try {
    const isAvailable = cacheService.isAvailable();
    
    if (isAvailable) {
      // Test cache operations
      const testKey = 'health-check';
      const testValue = { timestamp: Date.now() };
      
      await cacheService.set('health', testKey, testValue, 60);
      const retrievedValue = await cacheService.get('health', testKey);
      await cacheService.delete('health', testKey);
      
      if (retrievedValue && retrievedValue.timestamp === testValue.timestamp) {
        res.json({
          status: 'healthy',
          cache: 'operational',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          cache: 'failed_test',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.status(503).json({
        status: 'unhealthy',
        cache: 'unavailable',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Cache health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      cache: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  createCacheMiddleware,
  createCacheInvalidationMiddleware,
  createCacheWarmingMiddleware,
  cacheStatsMiddleware,
  cacheHealthMiddleware,
  generateDefaultKey,
  generateUserKey,
  generateApiKeyCacheKey,
  generateImageCacheKey
};
