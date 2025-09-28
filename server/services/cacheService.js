const Redis = require('ioredis');
const { logger } = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour default TTL
    this.retryDelay = 5000; // 5 seconds retry delay
    this.maxRetries = 3;
    
    this.connect();
  }

  connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: this.retryDelay,
        maxRetriesPerRequest: this.maxRetries,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryDelayOnClusterDown: 300,
        enableReadyCheck: false,
        maxLoadingTimeout: 10000,
      };

      this.redis = new Redis(redisConfig);

      this.redis.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.redis.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.redis.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Connect to Redis
      this.redis.connect().catch((error) => {
        logger.error('Failed to connect to Redis:', error);
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('Redis initialization error:', error);
      this.isConnected = false;
    }
  }

  // Check if Redis is available
  isAvailable() {
    return this.isConnected && this.redis;
  }

  // Generate cache key with namespace
  generateKey(namespace, key) {
    return `pixelsqueeze:${namespace}:${key}`;
  }

  // Set cache with TTL
  async set(namespace, key, value, ttl = this.defaultTTL) {
    if (!this.isAvailable()) {
      logger.warn('Redis not available, skipping cache set');
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const serializedValue = JSON.stringify(value);
      
      await this.redis.setex(cacheKey, ttl, serializedValue);
      logger.debug(`Cache set: ${cacheKey} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  // Get cache value
  async get(namespace, key) {
    if (!this.isAvailable()) {
      logger.warn('Redis not available, skipping cache get');
      return null;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const value = await this.redis.get(cacheKey);
      
      if (value === null) {
        logger.debug(`Cache miss: ${cacheKey}`);
        return null;
      }

      const parsedValue = JSON.parse(value);
      logger.debug(`Cache hit: ${cacheKey}`);
      return parsedValue;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache key
  async delete(namespace, key) {
    if (!this.isAvailable()) {
      logger.warn('Redis not available, skipping cache delete');
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const result = await this.redis.del(cacheKey);
      logger.debug(`Cache delete: ${cacheKey}`);
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  // Delete multiple keys with pattern
  async deletePattern(namespace, pattern) {
    if (!this.isAvailable()) {
      logger.warn('Redis not available, skipping cache delete pattern');
      return false;
    }

    try {
      const searchPattern = this.generateKey(namespace, pattern);
      const keys = await this.redis.keys(searchPattern);
      
      if (keys.length === 0) {
        return true;
      }

      const result = await this.redis.del(...keys);
      logger.debug(`Cache delete pattern: ${searchPattern} (${result} keys deleted)`);
      return result > 0;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Check if key exists
  async exists(namespace, key) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const result = await this.redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  // Get TTL of key
  async getTTL(namespace, key) {
    if (!this.isAvailable()) {
      return -1;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const ttl = await this.redis.ttl(cacheKey);
      return ttl;
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  // Increment counter
  async increment(namespace, key, value = 1, ttl = this.defaultTTL) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const result = await this.redis.incrby(cacheKey, value);
      
      // Set TTL if this is a new key
      if (result === value) {
        await this.redis.expire(cacheKey, ttl);
      }
      
      return result;
    } catch (error) {
      logger.error('Cache increment error:', error);
      return null;
    }
  }

  // Set hash field
  async hset(namespace, key, field, value, ttl = this.defaultTTL) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const serializedValue = JSON.stringify(value);
      
      await this.redis.hset(cacheKey, field, serializedValue);
      await this.redis.expire(cacheKey, ttl);
      
      logger.debug(`Cache hset: ${cacheKey}.${field}`);
      return true;
    } catch (error) {
      logger.error('Cache hset error:', error);
      return false;
    }
  }

  // Get hash field
  async hget(namespace, key, field) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const value = await this.redis.hget(cacheKey, field);
      
      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache hget error:', error);
      return null;
    }
  }

  // Get all hash fields
  async hgetall(namespace, key) {
    if (!this.isAvailable()) {
      return {};
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const hash = await this.redis.hgetall(cacheKey);
      
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      
      return result;
    } catch (error) {
      logger.error('Cache hgetall error:', error);
      return {};
    }
  }

  // Cache with fallback function
  async getOrSet(namespace, key, fallbackFn, ttl = this.defaultTTL) {
    // Try to get from cache first
    const cachedValue = await this.get(namespace, key);
    if (cachedValue !== null) {
      return cachedValue;
    }

    // Execute fallback function
    try {
      const value = await fallbackFn();
      
      // Cache the result
      await this.set(namespace, key, value, ttl);
      
      return value;
    } catch (error) {
      logger.error('Cache getOrSet fallback error:', error);
      throw error;
    }
  }

  // Clear all cache
  async clear() {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const keys = await this.redis.keys('pixelsqueeze:*');
      if (keys.length === 0) {
        return true;
      }

      const result = await this.redis.del(...keys);
      logger.info(`Cache cleared: ${result} keys deleted`);
      return result > 0;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  // Get cache statistics
  async getStats() {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        isConnected: this.isConnected
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  // Graceful shutdown
  async disconnect() {
    if (this.redis) {
      try {
        await this.redis.quit();
        logger.info('Redis client disconnected gracefully');
      } catch (error) {
        logger.error('Redis disconnect error:', error);
      }
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  await cacheService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cacheService.disconnect();
  process.exit(0);
});

module.exports = cacheService;
