const { body, param, query, validationResult } = require('express-validator');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

class SecurityService {
  constructor() {
    this.saltRounds = 12;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    this.allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    this.maxFilesPerRequest = 10;
  }

  // Input validation middleware
  validateInput(validationRules) {
    return [
      ...validationRules,
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          logger.warn('Input validation failed:', {
            errors: errors.array(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id
          });
          
          return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array().map(err => ({
              field: err.path,
              message: err.msg,
              value: err.value
            }))
          });
        }
        next();
      }
    ];
  }

  // File upload validation
  validateFileUpload(req, res, next) {
    try {
      const files = req.files || [];
      
      // Check file count
      if (files.length > this.maxFilesPerRequest) {
        return res.status(400).json({
          error: 'Too many files',
          code: 'TOO_MANY_FILES',
          details: `Maximum ${this.maxFilesPerRequest} files allowed per request`
        });
      }

      // Validate each file
      for (const file of files) {
        // Check file size
        if (file.size > this.maxFileSize) {
          return res.status(400).json({
            error: 'File too large',
            code: 'FILE_TOO_LARGE',
            details: `File ${file.originalname} exceeds maximum size of ${this.maxFileSize / (1024 * 1024)}MB`
          });
        }

        // Check file type
        if (!this.allowedImageTypes.includes(file.mimetype)) {
          return res.status(400).json({
            error: 'Invalid file type',
            code: 'INVALID_FILE_TYPE',
            details: `File ${file.originalname} has invalid type. Allowed types: ${this.allowedImageTypes.join(', ')}`
          });
        }

        // Check file extension
        const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        if (!this.allowedImageExtensions.includes(fileExtension)) {
          return res.status(400).json({
            error: 'Invalid file extension',
            code: 'INVALID_FILE_EXTENSION',
            details: `File ${file.originalname} has invalid extension. Allowed extensions: ${this.allowedImageExtensions.join(', ')}`
          });
        }

        // Check for malicious file names
        if (this.isMaliciousFileName(file.originalname)) {
          return res.status(400).json({
            error: 'Suspicious file name',
            code: 'SUSPICIOUS_FILE_NAME',
            details: 'File name contains potentially malicious characters'
          });
        }
      }

      next();
    } catch (error) {
      logger.error('File upload validation error:', error);
      res.status(500).json({
        error: 'File validation failed',
        code: 'VALIDATION_ERROR',
        details: 'Internal server error during file validation'
      });
    }
  }

  // Check for malicious file names
  isMaliciousFileName(filename) {
    const maliciousPatterns = [
      /\.\./,           // Directory traversal
      /[<>:"|?*]/,      // Invalid characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved names
      /\.(exe|bat|cmd|scr|pif|com)$/i, // Executable extensions
      /javascript:/i,    // JavaScript protocol
      /data:/i,         // Data URI
      /vbscript:/i      // VBScript protocol
    ];

    return maliciousPatterns.some(pattern => pattern.test(filename));
  }

  // Password validation
  validatePassword(password) {
    const minLength = 8;
    const maxLength = 128;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (password.length > maxLength) {
      errors.push(`Password must be no more than ${maxLength} characters long`);
    }

    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }

    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Hash password
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      logger.error('Password hashing error:', error);
      throw new Error('Password hashing failed');
    }
  }

  // Compare password
  async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Password comparison error:', error);
      throw new Error('Password comparison failed');
    }
  }

  // Sanitize input
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
      .trim();
  }

  // Validate email
  validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Validate URL
  validateUrl(url) {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // SQL injection prevention
  preventSQLInjection(input) {
    if (typeof input !== 'string') return input;
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/)/g,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi
    ];

    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized.trim();
  }

  // XSS prevention
  preventXSS(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Rate limiting for sensitive operations
  createSecurityRateLimit(windowMs = 15 * 60 * 1000, max = 5) {
    const attempts = new Map();
    
    return (req, res, next) => {
      const key = req.ip;
      const now = Date.now();
      
      if (!attempts.has(key)) {
        attempts.set(key, { count: 1, resetTime: now + windowMs });
        return next();
      }
      
      const attempt = attempts.get(key);
      
      if (now > attempt.resetTime) {
        attempts.set(key, { count: 1, resetTime: now + windowMs });
        return next();
      }
      
      if (attempt.count >= max) {
        logger.warn('Security rate limit exceeded:', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          userId: req.user?.id
        });
        
        return res.status(429).json({
          error: 'Too many attempts',
          code: 'RATE_LIMIT_EXCEEDED',
          details: 'Please try again later',
          retryAfter: Math.ceil((attempt.resetTime - now) / 1000)
        });
      }
      
      attempt.count++;
      next();
    };
  }

  // Request signing validation
  validateRequestSignature(req, res, next) {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    
    if (!signature || !timestamp) {
      return res.status(401).json({
        error: 'Missing signature',
        code: 'MISSING_SIGNATURE',
        details: 'Request signature is required'
      });
    }
    
    // Check timestamp (prevent replay attacks)
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    const timeDiff = Math.abs(now - requestTime);
    
    if (timeDiff > 300000) { // 5 minutes
      return res.status(401).json({
        error: 'Request expired',
        code: 'REQUEST_EXPIRED',
        details: 'Request timestamp is too old'
      });
    }
    
    // TODO: Implement actual signature validation
    // This would require a shared secret and HMAC validation
    
    next();
  }

  // CORS configuration
  getCORSConfig() {
    return {
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001',
          process.env.FRONTEND_URL,
          process.env.ADMIN_URL
        ].filter(Boolean);
        
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn('CORS blocked origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Signature', 'X-Timestamp'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
    };
  }

  // Security headers configuration
  getSecurityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    });
  }

  // Log security events
  logSecurityEvent(event, details) {
    logger.warn('Security event:', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}

// Create singleton instance
const securityService = new SecurityService();

// Common validation rules
const commonValidationRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
  name: body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
    
  userId: param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
    
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
};

module.exports = {
  securityService,
  commonValidationRules,
  validateInput: securityService.validateInput.bind(securityService),
  validateFileUpload: securityService.validateFileUpload.bind(securityService),
  validatePassword: securityService.validatePassword.bind(securityService),
  hashPassword: securityService.hashPassword.bind(securityService),
  comparePassword: securityService.comparePassword.bind(securityService),
  sanitizeInput: securityService.sanitizeInput.bind(securityService),
  preventSQLInjection: securityService.preventSQLInjection.bind(securityService),
  preventXSS: securityService.preventXSS.bind(securityService),
  createSecurityRateLimit: securityService.createSecurityRateLimit.bind(securityService),
  validateRequestSignature: securityService.validateRequestSignature.bind(securityService),
  getCORSConfig: securityService.getCORSConfig.bind(securityService),
  getSecurityHeaders: securityService.getSecurityHeaders.bind(securityService),
  logSecurityEvent: securityService.logSecurityEvent.bind(securityService)
};
