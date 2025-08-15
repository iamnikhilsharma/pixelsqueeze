// Jest setup file for PixelSqueeze tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.RAZORPAY_KEY_ID = 'rzp_test_test_key';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/pixelsqueeze_test';

// Global test utilities
global.testUtils = {
  // Generate test JWT token
  generateTestToken: (userId = 'test-user-id') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  },
  
  // Create test user data
  createTestUser: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User',
    ...overrides
  }),
  
  // Create test plan data
  createTestPlan: (overrides = {}) => ({
    plan: 'Starter',
    price: 9,
    billing: 'monthly',
    email: 'test@example.com',
    name: 'Test User',
    phone: '1234567890',
    ...overrides
  }),
  
  // Mock Razorpay response
  mockRazorpayResponse: () => ({
    razorpay_payment_id: 'pay_test_payment_id',
    razorpay_order_id: 'order_test_order_id',
    razorpay_signature: 'test_signature'
  })
};

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// Setup test database connection (if needed)
beforeAll(async () => {
  // Add any global setup here
});

// Cleanup after all tests
afterAll(async () => {
  // Add any global cleanup here
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
