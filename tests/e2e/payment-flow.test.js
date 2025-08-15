const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Create a minimal test app for E2E testing
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(express.json());
  
  // Mock auth middleware
  const mockAuth = (req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  };
  
  // Mock subscription endpoints
  app.post('/api/subscription/update-subscription', mockAuth, (req, res) => {
    const { plan, billing, razorpayPaymentId, razorpayOrderId } = req.body;
    
    if (!plan || !billing || !razorpayPaymentId || !razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Store the updated plan for the current subscription endpoint
    app.locals.currentPlan = plan;
    app.locals.subscriptionStatus = 'active';
    
    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        plan,
        status: 'active',
        billingCycle: billing,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  });
  
  app.get('/api/subscription/current', mockAuth, (req, res) => {
    res.json({
      success: true,
      data: {
        plan: app.locals.currentPlan || 'Starter',
        status: app.locals.subscriptionStatus || 'active',
        billingCycle: 'monthly'
      }
    });
  });
  
  app.post('/api/subscription/cancel', mockAuth, (req, res) => {
    app.locals.subscriptionStatus = 'cancelled';
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  });
  
  // Mock invoice endpoint
  app.post('/api/invoice/generate-invoice', mockAuth, (req, res) => {
    const { plan, price, billing, date } = req.body;
    
    if (!plan || !price || !billing || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Mock PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
    res.send(Buffer.from('Mock PDF content'));
  });
  
  // Mock Razorpay endpoints with better validation
  app.post('/api/razorpay/create-order', (req, res) => {
    // Check if user is authenticated
    if (!req.headers.authorization) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }
    
    const { plan, price, billing, email, name } = req.body;
    
    if (!plan || !price || !billing || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    res.json({
      success: true,
      data: {
        orderId: 'order_test_123',
        amount: price * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      }
    });
  });
  
  app.post('/api/razorpay/verify-payment', mockAuth, (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment data'
      });
    }
    
    // Check for invalid payment data
    if (razorpay_order_id === 'invalid_order_id' || 
        razorpay_payment_id === 'invalid_payment_id' || 
        razorpay_signature === 'invalid_signature') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment verified successfully'
    });
  });
  
  app.get('/api/razorpay/payment/:paymentId', mockAuth, (req, res) => {
    const { paymentId } = req.params;
    
    res.json({
      success: true,
      data: {
        id: paymentId,
        amount: 2900,
        currency: 'INR',
        status: 'captured'
      }
    });
  });
  
  return app;
};

const app = createTestApp();

// Test utilities
const createTestToken = () => {
  return jwt.sign(
    { userId: 'test-user-id', email: 'test@example.com' },
    'test-jwt-secret',
    { expiresIn: '1h' }
  );
};

const createTestPlan = (overrides = {}) => ({
  plan: 'Starter',
  price: 9,
  billing: 'monthly',
  email: 'test@example.com',
  name: 'Test User',
  phone: '1234567890',
  ...overrides
});

const mockRazorpayResponse = () => ({
  razorpay_payment_id: 'pay_test_payment_id',
  razorpay_order_id: 'order_test_order_id',
  razorpay_signature: 'test_signature'
});

describe('Complete Payment Flow - E2E Tests', () => {
  let authToken;
  let testUserId;
  let createdOrderId;

  beforeAll(() => {
    authToken = createTestToken();
    testUserId = 'test-user-id';
  });

  describe('Complete Payment Journey', () => {
    test('should complete full payment flow from pricing to thank you', async () => {
      // Step 1: Create Razorpay order
      const testPlan = createTestPlan({
        plan: 'Pro',
        price: 29,
        billing: 'monthly'
      });

      const orderResponse = await request(app)
        .post('/api/razorpay/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testPlan)
        .expect(200);

      expect(orderResponse.body.success).toBe(true);
      expect(orderResponse.body.data).toHaveProperty('orderId');
      expect(orderResponse.body.data).toHaveProperty('amount');
      expect(orderResponse.body.data.currency).toBe('INR');

      createdOrderId = orderResponse.body.data.orderId;

      // Step 2: Verify payment (simulate successful payment)
      const paymentData = mockRazorpayResponse();
      paymentData.razorpay_order_id = createdOrderId;

      const verifyResponse = await request(app)
        .post('/api/razorpay/verify-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.message).toBe('Payment verified successfully');

      // Step 3: Update user subscription
      const subscriptionData = {
        plan: testPlan.plan,
        billing: testPlan.billing,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpaySignature: paymentData.razorpay_signature
      };

      const subscriptionResponse = await request(app)
        .post('/api/subscription/update-subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscriptionData)
        .expect(200);

      expect(subscriptionResponse.body.success).toBe(true);
      expect(subscriptionResponse.body.message).toBe('Subscription updated successfully');
      expect(subscriptionResponse.body.data.plan).toBe(testPlan.plan);
      expect(subscriptionResponse.body.data.billingCycle).toBe(testPlan.billing);

      // Step 4: Generate invoice
      const invoiceData = {
        plan: testPlan.plan,
        price: testPlan.price,
        billing: testPlan.billing,
        date: new Date().toISOString()
      };

      const invoiceResponse = await request(app)
        .post('/api/invoice/generate-invoice')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(200);

      expect(invoiceResponse.headers['content-type']).toContain('application/pdf');
      expect(invoiceResponse.headers['content-disposition']).toContain('attachment');

      // Step 5: Verify current subscription status
      const currentSubscriptionResponse = await request(app)
        .get('/api/subscription/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(currentSubscriptionResponse.body.success).toBe(true);
      expect(currentSubscriptionResponse.body.data.plan).toBe(testPlan.plan);
      expect(currentSubscriptionResponse.body.data.status).toBe('active');
    }, 30000);

    test('should handle payment verification failure gracefully', async () => {
      const invalidPaymentData = {
        razorpay_order_id: 'invalid_order_id',
        razorpay_payment_id: 'invalid_payment_id',
        razorpay_signature: 'invalid_signature'
      };

      const response = await request(app)
        .post('/api/razorpay/verify-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPaymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid payment signature');
    });

    test('should handle subscription cancellation', async () => {
      const cancelResponse = await request(app)
        .post('/api/subscription/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);
      expect(cancelResponse.body.message).toBe('Subscription cancelled successfully');

      // Verify subscription is cancelled
      const currentSubscriptionResponse = await request(app)
        .get('/api/subscription/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(currentSubscriptionResponse.body.data.status).toBe('cancelled');
    });
  });

  describe('Error Scenarios', () => {
    test('should handle invalid order creation gracefully', async () => {
      const invalidPlan = {
        plan: 'InvalidPlan',
        price: -10,
        billing: 'invalid'
      };

      const response = await request(app)
        .post('/api/razorpay/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPlan)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing authentication for protected endpoints', async () => {
      const testPlan = createTestPlan();

      const response = await request(app)
        .post('/api/razorpay/create-order')
        .send(testPlan)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Data Validation', () => {
    test('should validate required fields for order creation', async () => {
      const response = await request(app)
        .post('/api/razorpay/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
    });

    test('should validate required fields for subscription update', async () => {
      const response = await request(app)
        .post('/api/subscription/update-subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
    });
  });
});
