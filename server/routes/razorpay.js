const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');

// Initialize Razorpay only when environment variables are available
let razorpay = null;
let isRazorpayConfigured = false;

try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    isRazorpayConfigured = true;
    console.log('✅ Razorpay payment service configured successfully');
  } else {
    console.warn('⚠️  Razorpay environment variables not configured. Payment features will be disabled.');
    console.warn('   Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
  }
} catch (error) {
  console.error('❌ Error initializing Razorpay:', error.message);
  isRazorpayConfigured = false;
}

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  if (!isRazorpayConfigured) {
    return res.status(503).json({ 
      error: 'Payment service not configured',
      message: 'Please configure Razorpay environment variables to enable payments'
    });
  }

  try {
    const { plan, price, billing, email, name, phone } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!plan || !price || !billing || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Convert price to paise (Razorpay expects amount in paise)
    const amountInPaise = Math.round(price * 100);

    // Create order options
    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${Date.now()}_${userId}`,
      notes: {
        plan: plan,
        billing: billing,
        userId: userId,
        email: email
      }
    };

    // Create Razorpay order
    const order = await razorpay.orders.create(orderOptions);

    // Log order creation
    console.log(`Razorpay order created: ${order.id} for user ${userId}`);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Verify payment signature
router.post('/verify-payment', auth, async (req, res) => {
  if (!isRazorpayConfigured) {
    return res.status(503).json({ 
      error: 'Payment service not configured',
      message: 'Please configure Razorpay environment variables to enable payments'
    });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (signature === razorpay_signature) {
      res.json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// Get payment details
router.get('/payment/:paymentId', auth, async (req, res) => {
  if (!isRazorpayConfigured) {
    return res.status(503).json({ 
      error: 'Payment service not configured',
      message: 'Please configure Razorpay environment variables to enable payments'
    });
  }

  try {
    const { paymentId } = req.params;
    
    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
});

module.exports = router;
