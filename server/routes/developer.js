const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

// In-memory storage for API keys and usage tracking
const apiKeys = new Map();
const apiUsage = new Map();

// Generate API key
function generateApiKey() {
  return `pk_${uuidv4().replace(/-/g, '')}`;
}

// API rate limiting based on subscription plan
const createRateLimiter = (plan) => {
  const limits = {
    free: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    starter: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 requests per 15 minutes
    pro: { windowMs: 15 * 60 * 1000, max: 5000 }, // 5000 requests per 15 minutes
    enterprise: { windowMs: 15 * 60 * 1000, max: 20000 } // 20000 requests per 15 minutes
  };
  
  const config = limits[plan] || limits.free;
  
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      error: 'Rate limit exceeded',
      limit: config.max,
      window: config.windowMs / 1000 / 60,
      plan: plan
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.apiKey || req.ip
  });
};

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide your API key in the X-API-Key header or Authorization header'
    });
  }

  const keyData = apiKeys.get(apiKey);
  if (!keyData) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  // Check if API key is active
  if (!keyData.active) {
    return res.status(401).json({
      error: 'API key inactive',
      message: 'This API key has been deactivated'
    });
  }

  req.user = keyData.user;
  req.apiKey = apiKey;
  next();
};

// Track API usage
const trackUsage = (req, res, next) => {
  const apiKey = req.apiKey;
  const endpoint = req.path;
  const method = req.method;
  
  if (apiKey) {
    const usage = apiUsage.get(apiKey) || {
      total: 0,
      endpoints: {},
      lastUsed: new Date(),
      monthly: 0
    };
    
    usage.total++;
    usage.lastUsed = new Date();
    usage.monthly++;
    
    if (!usage.endpoints[endpoint]) {
      usage.endpoints[endpoint] = 0;
    }
    usage.endpoints[endpoint]++;
    
    apiUsage.set(apiKey, usage);
  }
  
  next();
};

// Apply rate limiting based on user's plan
const applyRateLimit = (req, res, next) => {
  const plan = req.user?.subscription?.plan || 'free';
  const limiter = createRateLimiter(plan);
  return limiter(req, res, next);
};

// Developer API Routes

// Get API documentation
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'PixelSqueeze API Documentation',
      version: '1.0.0',
      baseUrl: `${req.protocol}://${req.get('host')}/api`,
      endpoints: {
        authentication: {
          'POST /auth/register': 'Register a new user account',
          'POST /auth/login': 'Login with email and password',
          'GET /auth/me': 'Get current user information'
        },
        images: {
          'POST /optimize': 'Optimize a single image',
          'POST /optimize-url': 'Optimize image from URL',
          'POST /batch-optimize': 'Optimize multiple images',
          'GET /images': 'Get user\'s optimized images',
          'DELETE /images/:id': 'Delete an optimized image'
        },
        advanced: {
          'POST /advanced/batch-optimize': 'Advanced batch processing',
          'POST /advanced/convert-format': 'Convert image format',
          'POST /advanced/add-watermark': 'Add watermark to image',
          'POST /advanced/analyze': 'Analyze image metadata',
          'POST /advanced/thumbnails': 'Generate thumbnails'
        },
        webhooks: {
          'POST /webhooks': 'Configure webhook endpoints',
          'GET /webhooks': 'List webhook configurations',
          'DELETE /webhooks/:id': 'Delete webhook configuration'
        },
        apiKeys: {
          'POST /keys': 'Generate new API key',
          'GET /keys': 'List API keys',
          'DELETE /keys/:id': 'Revoke API key'
        },
        usage: {
          'GET /usage': 'Get API usage statistics',
          'GET /usage/monthly': 'Get monthly usage breakdown'
        }
      },
      authentication: {
        type: 'API Key',
        header: 'X-API-Key',
        description: 'Include your API key in the X-API-Key header'
      },
      rateLimits: {
        free: '100 requests per 15 minutes',
        starter: '1,000 requests per 15 minutes',
        pro: '5,000 requests per 15 minutes',
        enterprise: '20,000 requests per 15 minutes'
      },
      formats: {
        supported: ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'gif'],
        output: ['jpeg', 'png', 'webp', 'avif', 'tiff']
      }
    }
  });
});

// Generate API key
router.post('/keys', authenticateToken, async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const apiKey = generateApiKey();
    
    const keyData = {
      id: uuidv4(),
      name: name || 'Default API Key',
      key: apiKey,
      userId: req.user.id,
      user: req.user,
      permissions: permissions || ['read', 'write'],
      active: true,
      createdAt: new Date(),
      lastUsed: null
    };
    
    apiKeys.set(apiKey, keyData);
    
    res.json({
      success: true,
      data: {
        id: keyData.id,
        name: keyData.name,
        key: apiKey, // Only show once
        permissions: keyData.permissions,
        createdAt: keyData.createdAt
      },
      message: 'API key generated successfully. Store it securely as it won\'t be shown again.'
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
});

// List API keys
router.get('/keys', authenticateToken, async (req, res) => {
  try {
    const userKeys = Array.from(apiKeys.values())
      .filter(key => key.userId === req.user.id)
      .map(key => ({
        id: key.id,
        name: key.name,
        permissions: key.permissions,
        active: key.active,
        createdAt: key.createdAt,
        lastUsed: key.lastUsed,
        maskedKey: `pk_${key.key.substring(3, 7)}...${key.key.substring(key.key.length - 4)}`
      }));
    
    res.json({
      success: true,
      data: userKeys
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list API keys'
    });
  }
});

// Revoke API key
router.delete('/keys/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const keyToDelete = Array.from(apiKeys.values())
      .find(key => key.id === id && key.userId === req.user.id);
    
    if (!keyToDelete) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }
    
    apiKeys.delete(keyToDelete.key);
    apiUsage.delete(keyToDelete.key);
    
    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

// Get API usage statistics
router.get('/usage', authenticateApiKey, trackUsage, async (req, res) => {
  try {
    const usage = apiUsage.get(req.apiKey) || {
      total: 0,
      endpoints: {},
      lastUsed: null,
      monthly: 0
    };
    
    const plan = req.user?.subscription?.plan || 'free';
    const limits = {
      free: { monthly: 1000, rate: 100 },
      starter: { monthly: 10000, rate: 1000 },
      pro: { monthly: 50000, rate: 5000 },
      enterprise: { monthly: 200000, rate: 20000 }
    };
    
    const planLimits = limits[plan] || limits.free;
    
    res.json({
      success: true,
      data: {
        usage: {
          total: usage.total,
          monthly: usage.monthly,
          lastUsed: usage.lastUsed,
          endpoints: usage.endpoints
        },
        limits: {
          plan: plan,
          monthly: planLimits.monthly,
          rateLimit: planLimits.rate,
          remaining: Math.max(0, planLimits.monthly - usage.monthly)
        },
        percentage: {
          monthly: Math.round((usage.monthly / planLimits.monthly) * 100)
        }
      }
    });
  } catch (error) {
    console.error('Error getting usage statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage statistics'
    });
  }
});

// Get monthly usage breakdown
router.get('/usage/monthly', authenticateApiKey, async (req, res) => {
  try {
    const usage = apiUsage.get(req.apiKey) || {
      total: 0,
      endpoints: {},
      lastUsed: null,
      monthly: 0
    };
    
    // Simulate monthly breakdown (in real app, this would come from database)
    const monthlyBreakdown = {
      current: usage.monthly,
      previous: Math.floor(usage.monthly * 0.8),
      trend: 'up',
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requests: Math.floor(Math.random() * 50) + 10
      }))
    };
    
    res.json({
      success: true,
      data: monthlyBreakdown
    });
  } catch (error) {
    console.error('Error getting monthly usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monthly usage'
    });
  }
});

// Webhook management
const webhooks = new Map();

// Create webhook
router.post('/webhooks', authenticateApiKey, async (req, res) => {
  try {
    const { url, events, secret } = req.body;
    
    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: 'URL and events array are required'
      });
    }
    
    const webhookId = uuidv4();
    const webhookData = {
      id: webhookId,
      userId: req.user.id,
      url: url,
      events: events,
      secret: secret || uuidv4(),
      active: true,
      createdAt: new Date(),
      lastTriggered: null,
      failureCount: 0
    };
    
    webhooks.set(webhookId, webhookData);
    
    res.json({
      success: true,
      data: {
        id: webhookId,
        url: url,
        events: events,
        active: true,
        createdAt: webhookData.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook'
    });
  }
});

// List webhooks
router.get('/webhooks', authenticateApiKey, async (req, res) => {
  try {
    const userWebhooks = Array.from(webhooks.values())
      .filter(webhook => webhook.userId === req.user.id)
      .map(webhook => ({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt,
        lastTriggered: webhook.lastTriggered,
        failureCount: webhook.failureCount
      }));
    
    res.json({
      success: true,
      data: userWebhooks
    });
  } catch (error) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list webhooks'
    });
  }
});

// Delete webhook
router.delete('/webhooks/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    
    const webhookToDelete = Array.from(webhooks.values())
      .find(webhook => webhook.id === id && webhook.userId === req.user.id);
    
    if (!webhookToDelete) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }
    
    webhooks.delete(id);
    
    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete webhook'
    });
  }
});

// Test webhook
router.post('/webhooks/:id/test', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    
    const webhook = Array.from(webhooks.values())
      .find(w => w.id === id && w.userId === req.user.id);
    
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }
    
    // Send test webhook
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from PixelSqueeze API'
      }
    };
    
    // In a real implementation, you would send this to the webhook URL
    console.log(`Test webhook sent to ${webhook.url}:`, testPayload);
    
    res.json({
      success: true,
      message: 'Test webhook sent successfully',
      payload: testPayload
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test webhook'
    });
  }
});

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Apply rate limiting to all API routes
router.use(applyRateLimit);

module.exports = router; 