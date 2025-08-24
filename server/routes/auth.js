const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('company').optional().trim()
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const validatePasswordReset = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

const validatePasswordUpdate = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
];

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  validateRegistration,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName, company } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        company
      });

      await user.save();

      // Generate email verification token
      await user.generateEmailVerificationToken();

      // Generate JWT token
      const token = user.generateAuthToken();

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            company: user.company,
            apiKey: user.apiKey,
            subscription: user.subscription,
            usage: user.usage
          },
          token,
          message: 'Registration successful. Please check your email for verification.'
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login',
  validateLogin,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment login attempts
        user.loginAttempts += 1;
        
        // Lock account after 5 failed attempts for 15 minutes
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        
        await user.save();

        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > new Date()) {
        return res.status(423).json({
          error: 'Account is temporarily locked due to too many failed login attempts',
          code: 'ACCOUNT_LOCKED',
          lockUntil: user.lockUntil
        });
      }

      // Reset login attempts and update last login
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = user.generateAuthToken();

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            company: user.company,
            apiKey: user.apiKey,
            subscription: user.subscription,
            usage: user.usage,
            isAdmin: user.isAdmin
          },
          token
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        code: 'LOGIN_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/auth/verify-email
 * Verify email address
 */
router.post('/verify-email',
  asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required',
        code: 'TOKEN_REQUIRED'
      });
    }

    try {
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({
          error: 'Invalid or expired verification token',
          code: 'INVALID_TOKEN'
        });
      }

      user.emailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();

      logger.info(`Email verified for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        error: 'Email verification failed',
        code: 'VERIFICATION_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password',
  validatePasswordReset,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { email } = req.body;

    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate password reset token
      await user.generatePasswordResetToken();

      // Send password reset email (best effort)
      try {
        await sendPasswordResetEmail(user.email, user.passwordResetToken);
      } catch (e) {
        // Do not leak errors; log already handled in service
      }

      logger.info(`Password reset requested for: ${email}`);

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });

    } catch (error) {
      logger.error('Password reset request error:', error);
      res.status(500).json({
        error: 'Password reset request failed',
        code: 'PASSWORD_RESET_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password',
  validatePasswordUpdate,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Reset token is required',
        code: 'TOKEN_REQUIRED'
      });
    }

    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({
          error: 'Invalid or expired reset token',
          code: 'INVALID_TOKEN'
        });
      }

      // Update password
      user.password = password;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      logger.info(`Password reset for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(500).json({
        error: 'Password reset failed',
        code: 'PASSWORD_RESET_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/auth/regenerate-api-key
 * Regenerate API key for authenticated user
 */
router.post('/regenerate-api-key',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = req.user;

    try {
      // Generate new API key
      user.apiKey = crypto.randomBytes(parseInt(process.env.API_KEY_LENGTH) || 16).toString('hex');
      await user.save();

      logger.info(`API key regenerated for user: ${user.email}`);

      res.json({
        success: true,
        data: {
          apiKey: user.apiKey,
          message: 'API key regenerated successfully'
        }
      });

    } catch (error) {
      logger.error('API key regeneration error:', error);
      res.status(500).json({
        error: 'Failed to regenerate API key',
        code: 'API_KEY_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      
      res.json({
        success: true,
        data: {
          user
        }
      });

    } catch (error) {
      logger.error('Profile retrieval error:', error);
      res.status(500).json({
        error: 'Failed to retrieve profile',
        code: 'PROFILE_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile',
  authenticateToken,
  [
    body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
    body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
    body('company').optional().trim()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { firstName, lastName, company } = req.body;

    try {
      const user = await User.findById(req.user._id);
      
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (company !== undefined) user.company = company;

      await user.save();

      logger.info(`Profile updated for user: ${user.email}`);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            company: user.company,
            apiKey: user.apiKey,
            subscription: user.subscription,
            usage: user.usage,
            isAdmin: user.isAdmin
          }
        }
      });

    } catch (error) {
      logger.error('Profile update error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        code: 'PROFILE_UPDATE_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // You could implement a blacklist here if needed
    
    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token
 */
router.post('/refresh-token',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'User not found or inactive',
          code: 'USER_INACTIVE'
        });
      }

      // Generate new token
      const token = user.generateAuthToken();

      res.json({
        success: true,
        data: {
          token
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Failed to refresh token',
        code: 'TOKEN_REFRESH_ERROR',
        details: error.message
      });
    }
  })
);

module.exports = router; 