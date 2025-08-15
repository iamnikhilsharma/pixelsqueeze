/**
 * Test Helper Utilities for PixelSqueeze
 * Common functions used across different test suites
 */

const jwt = require('jsonwebtoken');

// Test data generators
const testData = {
  // Generate test user with different roles
  users: {
    regular: {
      email: 'user@example.com',
      password: 'password123',
      firstName: 'Regular',
      lastName: 'User',
      isAdmin: false,
      isActive: true
    },
    admin: {
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      isActive: true
    },
    inactive: {
      email: 'inactive@example.com',
      password: 'password123',
      firstName: 'Inactive',
      lastName: 'User',
      isAdmin: false,
      isActive: false
    }
  },

  // Generate test plans
  plans: {
    starter: {
      plan: 'Starter',
      price: 9,
      billing: 'monthly',
      email: 'user@example.com',
      name: 'Test User',
      phone: '1234567890'
    },
    pro: {
      plan: 'Pro',
      price: 29,
      billing: 'monthly',
      email: 'user@example.com',
      name: 'Test User',
      phone: '1234567890'
    },
    enterprise: {
      plan: 'Enterprise',
      price: 99,
      billing: 'annual',
      email: 'user@example.com',
      name: 'Test User',
      phone: '1234567890'
    }
  },

  // Generate test payments
  payments: {
    success: {
      razorpay_payment_id: 'pay_test_success_123',
      razorpay_order_id: 'order_test_123',
      razorpay_signature: 'valid_signature_123'
    },
    failure: {
      razorpay_payment_id: 'pay_test_failure_123',
      razorpay_order_id: 'order_test_123',
      razorpay_signature: 'invalid_signature_123'
    }
  }
};

// Authentication helpers
const authHelpers = {
  // Generate JWT token for testing
  generateToken: (userId = 'test-user-id', isAdmin = false) => {
    const payload = { 
      userId, 
      isAdmin,
      email: 'test@example.com'
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  },

  // Generate admin token
  generateAdminToken: (userId = 'admin-user-id') => {
    return authHelpers.generateToken(userId, true);
  },

  // Generate expired token
  generateExpiredToken: (userId = 'test-user-id') => {
    const payload = { userId, email: 'test@example.com' };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });
  }
};

// Request helpers
const requestHelpers = {
  // Create authenticated request
  authenticatedRequest: (request, token = null) => {
    if (token) {
      return request.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },

  // Create request with specific user role
  userRequest: (request, role = 'regular') => {
    const user = testData.users[role];
    const token = authHelpers.generateToken('user-id', user.isAdmin);
    return requestHelpers.authenticatedRequest(request, token);
  }
};

// Validation helpers
const validationHelpers = {
  // Check if response has required fields
  hasRequiredFields: (response, requiredFields) => {
    requiredFields.forEach(field => {
      expect(response.body).toHaveProperty(field);
    });
  },

  // Check if response has correct error structure
  hasErrorStructure: (response, expectedError = null) => {
    expect(response.body).toHaveProperty('success', false);
    if (expectedError) {
      expect(response.body).toHaveProperty('message', expectedError);
    }
  },

  // Check if response has success structure
  hasSuccessStructure: (response, expectedMessage = null) => {
    expect(response.body).toHaveProperty('success', true);
    if (expectedMessage) {
      expect(response.body).toHaveProperty('message', expectedMessage);
    }
  }
};

// Mock helpers
const mockHelpers = {
  // Mock Razorpay instance
  mockRazorpay: () => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test_123',
        amount: 2900,
        currency: 'INR',
        receipt: 'receipt_123'
      })
    },
    payments: {
      fetch: jest.fn().mockResolvedValue({
        id: 'pay_test_123',
        amount: 2900,
        currency: 'INR',
        status: 'captured'
      })
    }
  }),

  // Mock PDF generation
  mockPDFGeneration: () => ({
    pipe: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis()
  })
};

// Export all helpers
module.exports = {
  testData,
  authHelpers,
  requestHelpers,
  validationHelpers,
  mockHelpers
};
