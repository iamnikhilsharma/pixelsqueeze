const Redis = require('ioredis');
const { gzip, gunzip } = require('zlib');
const { promisify } = require('util');
const { logger } = require('../utils/logger');

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

class AdvancedCache {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.isRedisAvailable = false;
    this.defaultTTL = 3600; // 1 hour
    this.maxMemorySize = 100 * 1024 * 1024; // 100MB
    this.compressionThreshold = 1024; // 1KB
    
    this.init();
  }

  /**
   * Initialize Redis connection
   */
  async init() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isRedisAvailable = true;
      });

      this.redis.on('error', (error) => {
        logger.warn('Redis connection error, falling back to memory cache:', error.message);
        this.isRedisAvailable = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isRedisAvailable = false;
      });

      // Test connection
      await this.redis.ping();
      
    } catch (error) {
      logger.warn('Redis not available, using memory cache:', error.message);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Set cache value with compression and TTL
   */
  async set(key, value, options = {}) {
    const {
      ttl = this.defaultTTL,
      compress = true,
      namespace = 'default',
      tags = [],
      priority = 'normal'
    } = options;

    try {
      const fullKey = this.buildKey(namespace, key);
      let dataToStore = value;
      let isCompressed = false;

      // Compress data if it's large enough and compression is enabled
      if (compress && typeof value === 'string' && value.length > this.compressionThreshold) {
        try {
          dataToStore = await gzipAsync(value);
          isCompressed = true;
        } catch (error) {
          logger.warn('Compression failed, storing uncompressed:', error.message);
        }
      }

      const cacheEntry = {
        data: dataToStore,
        compressed: isCompressed,
        timestamp: Date.now(),
        ttl: ttl,
        tags: tags,
        priority: priority,
        size: Buffer.byteLength(JSON.stringify(dataToStore))
      };

      if (this.isRedisAvailable) {
        // Store in Redis
        const multi = this.redis.multi();
        
        // Store main data
        multi.setex(fullKey, ttl, JSON.stringify(cacheEntry));
        
        // Store tags for invalidation
        if (tags.length > 0) {
          tags.forEach(tag => {
            const tagKey = `tag:${tag}`;
            multi.sadd(tagKey, fullKey);
            multi.expire(tagKey, ttl + 300); // Tag expires 5 minutes after data
          });
        }

        // Store priority index
        if (priority !== 'normal') {
          const priorityKey = `priority:${priority}`;
          multi.sadd(priorityKey, fullKey);
          multi.expire(priorityKey, ttl + 300);
        }

        await multi.exec();

        // Update memory cache for fast access
        this.memoryCache.set(fullKey, cacheEntry);
        
      } else {
        // Store in memory only
        this.memoryCache.set(fullKey, cacheEntry);
        this.manageMemoryCache();
      }

      logger.debug(`Cache set: ${fullKey} (${isCompressed ? 'compressed' : 'uncompressed'})`);
      return true;

    } catch (error) {
      logger.error('Error setting cache:', error);
      return false;
    }
  }

  /**
   * Get cache value with automatic decompression
   */
  async get(key, options = {}) {
    const { namespace = 'default', decompress = true } = options;
    const fullKey = this.buildKey(namespace, key);

    try {
      let cacheEntry = null;

      // Try memory cache first for speed
      if (this.memoryCache.has(fullKey)) {
        cacheEntry = this.memoryCache.get(fullKey);
      } else if (this.isRedisAvailable) {
        // Try Redis
        const data = await this.redis.get(fullKey);
        if (data) {
          cacheEntry = JSON.parse(data);
          // Update memory cache
          this.memoryCache.set(fullKey, cacheEntry);
        }
      }

      if (!cacheEntry) {
        return null;
      }

      // Check if expired
      if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl * 1000) {
        await this.delete(key, { namespace });
        return null;
      }

      let result = cacheEntry.data;

      // Decompress if needed
      if (decompress && cacheEntry.compressed && Buffer.isBuffer(result)) {
        try {
          result = await gunzipAsync(result);
          result = result.toString();
        } catch (error) {
          logger.error('Decompression failed:', error);
          return null;
        }
      }

      // Update access time for LRU
      cacheEntry.lastAccess = Date.now();
      
      return result;

    } catch (error) {
      logger.error('Error getting cache:', error);
      return null;
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key, options = {}) {
    const { namespace = 'default' } = options;
    const fullKey = this.buildKey(namespace, key);

    try {
      if (this.isRedisAvailable) {
        await this.redis.del(fullKey);
      }
      
      this.memoryCache.delete(fullKey);
      return true;

    } catch (error) {
      logger.error('Error deleting cache:', error);
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags) {
    if (!this.isRedisAvailable) {
      // Memory cache tag invalidation
      for (const [key, entry] of this.memoryCache.entries()) {
        if (tags.some(tag => entry.tags.includes(tag))) {
          this.memoryCache.delete(key);
        }
      }
      return true;
    }

    try {
      const keysToDelete = new Set();

      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await this.redis.smembers(tagKey);
        keys.forEach(key => keysToDelete.add(key));
        await this.redis.del(tagKey);
      }

      // Delete all tagged keys
      if (keysToDelete.size > 0) {
        const multi = this.redis.multi();
        keysToDelete.forEach(key => {
          multi.del(key);
          this.memoryCache.delete(key);
        });
        await multi.exec();
      }

      logger.info(`Invalidated ${keysToDelete.size} cache entries by tags: ${tags.join(', ')}`);
      return true;

    } catch (error) {
      logger.error('Error invalidating cache by tags:', error);
      return false;
    }
  }

  /**
   * Invalidate cache by namespace
   */
  async invalidateByNamespace(namespace) {
    try {
      if (this.isRedisAvailable) {
        const pattern = `namespace:${namespace}:*`;
        const keys = await this.redis.keys(pattern);
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Clear memory cache for this namespace
      for (const [key] of this.memoryCache.entries()) {
        if (key.startsWith(`namespace:${namespace}:`)) {
          this.memoryCache.delete(key);
        }
      }

      logger.info(`Invalidated namespace: ${namespace}`);
      return true;

    } catch (error) {
      logger.error('Error invalidating namespace:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.isRedisAvailable) {
        await this.redis.flushdb();
      }
      
      this.memoryCache.clear();
      logger.info('Cache cleared successfully');
      return true;

    } catch (error) {
      logger.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      let redisStats = {};
      
      if (this.isRedisAvailable) {
        const info = await this.redis.info();
        const keyspace = await this.redis.info('keyspace');
        
        redisStats = {
          connected: true,
          keys: await this.redis.dbsize(),
          memory: info.match(/used_memory_human:(\S+)/)?.[1] || 'unknown',
          keyspace: keyspace.match(/keys=(\d+)/)?.[1] || '0'
        };
      } else {
        redisStats = { connected: false };
      }

      const memoryStats = {
        size: this.memoryCache.size,
        memoryUsage: this.calculateMemoryUsage()
      };

      return {
        redis: redisStats,
        memory: memoryStats,
        compressionThreshold: this.compressionThreshold,
        defaultTTL: this.defaultTTL
      };

    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache(warmData) {
    try {
      const results = [];
      
      for (const item of warmData) {
        const { key, data, options } = item;
        const success = await this.set(key, data, options);
        results.push({ key, success });
      }

      logger.info(`Cache warming completed: ${results.filter(r => r.success).length}/${results.length} successful`);
      return results;

    } catch (error) {
      logger.error('Error warming cache:', error);
      return [];
    }
  }

  /**
   * Batch operations for better performance
   */
  async batchSet(entries) {
    try {
      if (this.isRedisAvailable) {
        const multi = this.redis.multi();
        
        for (const { key, value, options } of entries) {
          const fullKey = this.buildKey(options.namespace || 'default', key);
          const ttl = options.ttl || this.defaultTTL;
          
          let dataToStore = value;
          let isCompressed = false;

          if (options.compress !== false && typeof value === 'string' && value.length > this.compressionThreshold) {
            try {
              dataToStore = await gzipAsync(value);
              isCompressed = true;
            } catch (error) {
              logger.warn(`Compression failed for ${key}:`, error.message);
            }
          }

          const cacheEntry = {
            data: dataToStore,
            compressed: isCompressed,
            timestamp: Date.now(),
            ttl: ttl,
            tags: options.tags || [],
            priority: options.priority || 'normal',
            size: Buffer.byteLength(JSON.stringify(dataToStore))
          };

          multi.setex(fullKey, ttl, JSON.stringify(cacheEntry));
          
          // Update memory cache
          this.memoryCache.set(fullKey, cacheEntry);
        }

        await multi.exec();
        logger.info(`Batch set completed: ${entries.length} entries`);
        
      } else {
        // Memory-only batch set
        for (const { key, value, options } of entries) {
          await this.set(key, value, options);
        }
      }

      return true;

    } catch (error) {
      logger.error('Error in batch set:', error);
      return false;
    }
  }

  /**
   * Build cache key with namespace
   */
  buildKey(namespace, key) {
    return `namespace:${namespace}:${key}`;
  }

  /**
   * Calculate memory usage
   */
  calculateMemoryUsage() {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.size || 0;
    }
    return totalSize;
  }

  /**
   * Manage memory cache size
   */
  manageMemoryCache() {
    if (this.memoryCache.size < 1000) return; // Only manage if we have many entries

    const currentSize = this.calculateMemoryUsage();
    if (currentSize < this.maxMemorySize) return;

    // Remove least recently used entries
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => (a[1].lastAccess || 0) - (b[1].lastAccess || 0));

    let removedSize = 0;
    for (const [key, entry] of entries) {
      if (removedSize >= currentSize - this.maxMemorySize * 0.8) break;
      
      this.memoryCache.delete(key);
      removedSize += entry.size || 0;
    }

    logger.info(`Memory cache cleaned: removed ${removedSize} bytes`);
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (this.isRedisAvailable) {
        await this.redis.ping();
        return { status: 'healthy', redis: 'connected' };
      } else {
        return { status: 'degraded', redis: 'disconnected', memory: 'available' };
      }
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = new AdvancedCache();
