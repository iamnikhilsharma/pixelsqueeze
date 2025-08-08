const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const imageProcessor = require('./services/imageProcessor');
const stripeService = require('./services/stripeService');
const advancedImageRoutes = require('./routes/advancedImage');
const developerRoutes = require('./routes/developer');
const stripeRoutes = require('./routes/stripe');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// In-memory storage for development
const users = new Map();
const images = new Map();
let userIdCounter = 1;
let imageIdCounter = 1;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/temp', express.static(path.join(__dirname, '../uploads/temp')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    mode: 'development (in-memory)'
  });
});

// Simple authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // For development, accept any token that looks like an API key
  if (token.length >= 20) {
    req.user = { id: 'dev-user', apiKey: token };
    next();
  } else {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (users.has(email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const userId = userIdCounter++;
  const apiKey = `dev_api_key_${userId}_${Date.now()}`;
  
  const user = {
    id: userId,
    email,
    password, // In production, this would be hashed
    firstName,
    lastName,
    apiKey,
    subscription: { plan: 'free', status: 'active' },
    usage: { monthlyImages: 0, monthlyBandwidth: 0 },
    settings: { defaultQuality: 80, preserveMetadata: false, autoOptimize: true },
    isActive: true,
    isAdmin: false,
    emailVerified: true,
    createdAt: new Date()
  };

  users.set(email, user);
  users.set(apiKey, user);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        apiKey: user.apiKey,
        subscription: user.subscription
      },
      token: apiKey
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.get(email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        apiKey: user.apiKey,
        subscription: user.subscription
      },
      token: user.apiKey
    }
  });
});

// Get current user endpoint
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.get(req.user.apiKey);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        apiKey: user.apiKey,
        subscription: user.subscription
      }
    }
  });
});

// API routes
app.get('/api/stats', authenticateToken, (req, res) => {
  const user = users.get(req.user.apiKey);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const planLimits = {
    free: 100,
    starter: 5000,
    pro: 20000,
    enterprise: 100000
  };

  res.json({
    success: true,
    data: {
      monthlyUsage: user.usage.monthlyImages,
      planLimit: planLimits[user.subscription.plan],
      planType: user.subscription.plan,
      remainingImages: planLimits[user.subscription.plan] - user.usage.monthlyImages
    }
  });
});

// Real image optimization endpoint
app.post('/api/optimize', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const user = users.get(req.user.apiKey);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check usage limits
    const planLimits = {
      free: 100,
      starter: 5000,
      pro: 20000,
      enterprise: 100000
    };

    if (user.usage.monthlyImages >= planLimits[user.subscription.plan]) {
      return res.status(429).json({ error: 'Monthly usage limit exceeded' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get optimization options from request
    const quality = parseInt(req.body.quality) || 80;
    const format = req.body.format || 'auto';
    const width = req.body.width ? parseInt(req.body.width) : undefined;
    const height = req.body.height ? parseInt(req.body.height) : undefined;

    // Process the image using the image processor
    const optimizationOptions = {
      quality,
      format,
      width,
      height,
      preserveMetadata: false
    };

    const result = await imageProcessor.optimizeImage(req.file, optimizationOptions);

    // Move the optimized file to the uploads directory for serving
    const optimizedFileName = `optimized_${result.id}.${result.format}`;
    const optimizedFilePath = path.join(__dirname, '../uploads', optimizedFileName);
    
    // Copy the optimized file from temp to uploads directory
    const tempFilePath = path.join(process.env.TEMP_UPLOAD_DIR || './uploads/temp', `${result.id}.${result.format}`);
    
    try {
      fs.copyFileSync(tempFilePath, optimizedFilePath);
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    } catch (copyError) {
      console.error('Error copying optimized file:', copyError);
      // If copy fails, try to use the temp file directly
      const tempFileName = `${result.id}.${result.format}`;
      result.downloadUrl = `/uploads/temp/${tempFileName}`;
    }

    // Update user usage
    user.usage.monthlyImages += 1;
    user.usage.monthlyBandwidth += result.originalSize;

    const imageData = {
      id: result.id,
      userId: user.id,
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      compressionRatio: result.compressionRatio,
      downloadUrl: `/uploads/${optimizedFileName}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date()
    };

    images.set(result.id, imageData);

    res.json({
      success: true,
      data: imageData
    });

  } catch (error) {
    console.error('Image optimization error:', error);
    res.status(500).json({ 
      error: 'Failed to optimize image',
      details: error.message 
    });
  }
});

// Batch download endpoint
app.post('/api/download-batch', authenticateToken, (req, res) => {
  const { imageIds } = req.body;
  const user = users.get(req.user.apiKey);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!imageIds || !Array.isArray(imageIds)) {
    return res.status(400).json({ error: 'Image IDs array is required' });
  }

  try {
    // For now, just return a success response
    // In a real implementation, you would create a ZIP file with all the images
    res.json({
      success: true,
      message: 'Download started',
      imageCount: imageIds.length
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to create download' });
  }
});

// Stripe routes
app.use('/api/stripe', stripeRoutes);

// Advanced image processing routes
app.use('/api/advanced', advancedImageRoutes);

// Developer API routes
app.use('/api/developer', developerRoutes);

// Billing routes
app.get('/api/billing/plans', authenticateToken, async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'month',
        description: 'Perfect for getting started',
        features: [
          '100 images per month',
          'Basic optimization',
          'Standard support',
          'WebP, JPEG, PNG support'
        ],
        limits: {
          images: 100,
          bandwidth: '1GB',
          quality: 'Good'
        },
        popular: false
      },
      {
        id: 'starter',
        name: 'Starter',
        price: 9,
        period: 'month',
        description: 'Great for small projects',
        features: [
          '5,000 images per month',
          'Advanced optimization',
          'Priority support',
          'All formats supported',
          'Custom quality settings',
          'API access'
        ],
        limits: {
          images: 5000,
          bandwidth: '10GB',
          quality: 'Excellent'
        },
        popular: false,
        stripePriceId: stripeService.getPriceId('starter')
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29,
        period: 'month',
        description: 'For growing businesses',
        features: [
          '20,000 images per month',
          'Premium optimization',
          '24/7 support',
          'All formats + AVIF',
          'Advanced settings',
          'API access',
          'Bulk processing',
          'Analytics dashboard'
        ],
        limits: {
          images: 20000,
          bandwidth: '50GB',
          quality: 'Premium'
        },
        popular: true,
        stripePriceId: stripeService.getPriceId('pro')
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99,
        period: 'month',
        description: 'For large organizations',
        features: [
          '100,000 images per month',
          'Maximum optimization',
          'Dedicated support',
          'All formats supported',
          'Custom integrations',
          'White-label options',
          'SLA guarantee',
          'Advanced analytics'
        ],
        limits: {
          images: 100000,
          bandwidth: '200GB',
          quality: 'Maximum'
        },
        popular: false,
        stripePriceId: stripeService.getPriceId('enterprise')
      }
    ];

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription plans'
    });
  }
});

// Create subscription
app.post('/api/billing/subscribe', authenticateToken, async (req, res) => {
  try {
    const { planType, paymentMethodId } = req.body;
    const user = users.get(req.user.apiKey);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!planType || planType === 'free') {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan type'
      });
    }

    const priceId = stripeService.getPriceId(planType);
    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan type'
      });
    }

    // Create or get Stripe customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripeService.getCustomer(user.stripeCustomerId);
    } else {
      customer = await stripeService.createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`,
        { userId: user.id }
      );
      
      // Update user with Stripe customer ID
      user.stripeCustomerId = customer.id;
    }

    // Create subscription
    const subscription = await stripeService.createSubscription(
      customer.id,
      priceId,
      paymentMethodId
    );

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subscription'
    });
  }
});

// Get customer details
app.get('/api/billing/customer', authenticateToken, async (req, res) => {
  try {
    const user = users.get(req.user.apiKey);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        data: null
      });
    }

    const customer = await stripeService.getCustomer(user.stripeCustomerId);

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get customer'
    });
  }
});

// Get payment methods
app.get('/api/billing/payment-methods', authenticateToken, async (req, res) => {
  try {
    const user = users.get(req.user.apiKey);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        data: []
      });
    }

    const paymentMethods = await stripeService.getPaymentMethods(user.stripeCustomerId);

    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment methods'
    });
  }
});

// Create setup intent
app.post('/api/billing/setup-intent', authenticateToken, async (req, res) => {
  try {
    const user = users.get(req.user.apiKey);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No Stripe customer found'
      });
    }

    const setupIntent = await stripeService.createSetupIntent(user.stripeCustomerId);

    res.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret
      }
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create setup intent'
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PixelSqueeze development server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
  console.log(`💾 Storage: In-memory (development mode)`);
});

module.exports = app; 