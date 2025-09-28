const securityService = require('../services/securityService');
const { logger } = require('../utils/logger');

// Security middleware factory
const createSecurityMiddleware = () => {
  return {
    // Input sanitization middleware
    sanitizeInput: (req, res, next) => {
      try {
        // Sanitize body parameters
        if (req.body) {
          for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
              req.body[key] = securityService.sanitizeInput(req.body[key]);
            }
          }
        }

        // Sanitize query parameters
        if (req.query) {
          for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
              req.query[key] = securityService.sanitizeInput(req.query[key]);
            }
          }
        }

        // Sanitize URL parameters
        if (req.params) {
          for (const key in req.params) {
            if (typeof req.params[key] === 'string') {
              req.params[key] = securityService.sanitizeInput(req.params[key]);
            }
          }
        }

        next();
      } catch (error) {
        logger.error('Input sanitization error:', error);
        next();
      }
    },

    // XSS protection middleware
    preventXSS: (req, res, next) => {
      try {
        // Prevent XSS in body
        if (req.body) {
          for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
              req.body[key] = securityService.preventXSS(req.body[key]);
            }
          }
        }

        // Prevent XSS in query
        if (req.query) {
          for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
              req.query[key] = securityService.preventXSS(req.query[key]);
            }
          }
        }

        next();
      } catch (error) {
        logger.error('XSS prevention error:', error);
        next();
      }
    },

    // SQL injection prevention middleware
    preventSQLInjection: (req, res, next) => {
      try {
        // Prevent SQL injection in body
        if (req.body) {
          for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
              req.body[key] = securityService.preventSQLInjection(req.body[key]);
            }
          }
        }

        // Prevent SQL injection in query
        if (req.query) {
          for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
              req.query[key] = securityService.preventSQLInjection(req.query[key]);
            }
          }
        }

        next();
      } catch (error) {
        logger.error('SQL injection prevention error:', error);
        next();
      }
    },

    // Request size limiting middleware
    limitRequestSize: (maxSize = 10 * 1024 * 1024) => { // 10MB default
      return (req, res, next) => {
        const contentLength = parseInt(req.get('content-length') || '0');
        
        if (contentLength > maxSize) {
          securityService.logSecurityEvent('REQUEST_SIZE_EXCEEDED', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            contentLength,
            maxSize,
            endpoint: req.path,
            userId: req.user?.id
          });
          
          return res.status(413).json({
            error: 'Request too large',
            code: 'REQUEST_TOO_LARGE',
            details: `Request size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
          });
        }
        
        next();
      };
    },

    // File upload security middleware
    secureFileUpload: (req, res, next) => {
      try {
        // Check if files are present
        if (!req.files || req.files.length === 0) {
          return next();
        }

        // Validate file upload
        securityService.validateFileUpload(req, res, next);
      } catch (error) {
        logger.error('File upload security error:', error);
        res.status(500).json({
          error: 'File upload security check failed',
          code: 'SECURITY_ERROR',
          details: 'Internal server error during security validation'
        });
      }
    },

    // Authentication security middleware
    secureAuthentication: (req, res, next) => {
      try {
        // Check for suspicious patterns in authentication requests
        const userAgent = req.get('User-Agent') || '';
        const suspiciousPatterns = [
          /bot/i,
          /crawler/i,
          /spider/i,
          /scraper/i,
          /curl/i,
          /wget/i,
          /python/i,
          /java/i,
          /php/i
        ];

        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
        
        if (isSuspicious && req.path.includes('/auth/')) {
          securityService.logSecurityEvent('SUSPICIOUS_AUTH_ATTEMPT', {
            ip: req.ip,
            userAgent,
            endpoint: req.path,
            body: req.body
          });
        }

        next();
      } catch (error) {
        logger.error('Authentication security error:', error);
        next();
      }
    },

    // API key validation middleware
    validateApiKey: (req, res, next) => {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return res.status(401).json({
          error: 'API key required',
          code: 'API_KEY_REQUIRED',
          details: 'Please provide a valid API key in the X-API-Key header'
        });
      }

      // Basic API key format validation
      if (apiKey.length < 32 || apiKey.length > 128) {
        securityService.logSecurityEvent('INVALID_API_KEY_FORMAT', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          apiKeyLength: apiKey.length,
          endpoint: req.path
        });
        
        return res.status(401).json({
          error: 'Invalid API key format',
          code: 'INVALID_API_KEY',
          details: 'API key format is invalid'
        });
      }

      // TODO: Implement actual API key validation against database
      // This would check if the API key exists and is active
      
      next();
    },

    // Request signature validation middleware
    validateSignature: (req, res, next) => {
      // Only validate signatures for sensitive endpoints
      const sensitiveEndpoints = ['/api/admin', '/api/billing', '/api/subscription'];
      const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
      
      if (isSensitive) {
        return securityService.validateRequestSignature(req, res, next);
      }
      
      next();
    },

    // Security headers middleware
    securityHeaders: securityService.getSecurityHeaders(),

    // CORS middleware
    cors: securityService.getCORSConfig(),

    // Rate limiting for sensitive operations
    sensitiveOperationRateLimit: securityService.createSecurityRateLimit(15 * 60 * 1000, 3), // 3 attempts per 15 minutes

    // Password validation middleware
    validatePasswordStrength: (req, res, next) => {
      const password = req.body.password;
      
      if (password) {
        const validation = securityService.validatePassword(password);
        
        if (!validation.isValid) {
          return res.status(400).json({
            error: 'Password does not meet security requirements',
            code: 'WEAK_PASSWORD',
            details: validation.errors
          });
        }
      }
      
      next();
    },

    // Email validation middleware
    validateEmailFormat: (req, res, next) => {
      const email = req.body.email;
      
      if (email && !securityService.validateEmail(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          code: 'INVALID_EMAIL',
          details: 'Please provide a valid email address'
        });
      }
      
      next();
    },

    // URL validation middleware
    validateUrlFormat: (req, res, next) => {
      const url = req.body.url || req.query.url;
      
      if (url && !securityService.validateUrl(url)) {
        return res.status(400).json({
          error: 'Invalid URL format',
          code: 'INVALID_URL',
          details: 'Please provide a valid URL'
        });
      }
      
      next();
    },

    // Security logging middleware
    logSecurityEvents: (req, res, next) => {
      // Log suspicious requests
      const suspiciousPatterns = [
        /\.\./,           // Directory traversal
        /<script/i,       // XSS attempts
        /union\s+select/i, // SQL injection
        /javascript:/i,   // JavaScript protocol
        /eval\(/i,       // Code injection
        /exec\(/i        // Command injection
      ];

      const requestString = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params,
        url: req.url
      });

      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));
      
      if (isSuspicious) {
        securityService.logSecurityEvent('SUSPICIOUS_REQUEST', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method,
          suspiciousContent: requestString,
          userId: req.user?.id
        });
      }

      next();
    },

    // Error handling middleware for security
    securityErrorHandler: (error, req, res, next) => {
      // Log security-related errors
      if (error.code === 'VALIDATION_ERROR' || error.code === 'SECURITY_ERROR') {
        securityService.logSecurityEvent('SECURITY_ERROR', {
          error: error.message,
          code: error.code,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          userId: req.user?.id
        });
      }

      next(error);
    }
  };
};

// Create middleware instance
const securityMiddleware = createSecurityMiddleware();

module.exports = securityMiddleware;
