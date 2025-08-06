const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const imageProcessor = require('./services/imageProcessor');
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
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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