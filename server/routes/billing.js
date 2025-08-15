const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const { authenticateToken } = require('../middleware/auth');
const razorpayService = require('../services/razorpayService');

// Get subscription plans
router.get('/plans', authenticateToken, async (req, res) => {
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
        price: 999,
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
        price: 3699,
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
        price: 10000,
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
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { planType, paymentMethodId } = req.body;
    const user = req.user;

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
      
      // Update user with Stripe customer ID (in real app, save to database)
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

// Update subscription
router.put('/subscription/:subscriptionId', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { planType } = req.body;

    const priceId = stripeService.getPriceId(planType);
    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan type'
      });
    }

    const subscription = await stripeService.updateSubscription(subscriptionId, priceId);

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        planType
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update subscription'
    });
  }
});

// Cancel subscription
router.delete('/subscription/:subscriptionId', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { cancelAtPeriodEnd = true } = req.body;

    const subscription = await stripeService.cancelSubscription(subscriptionId, cancelAtPeriodEnd);

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel subscription'
    });
  }
});

// Reactivate subscription
router.post('/subscription/:subscriptionId/reactivate', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await stripeService.reactivateSubscription(subscriptionId);

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reactivate subscription'
    });
  }
});

// Get subscription details
router.get('/subscription/:subscriptionId', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await stripeService.getSubscription(subscriptionId);

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get subscription'
    });
  }
});

// Create setup intent for payment methods
router.post('/setup-intent', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

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

// Get payment methods
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

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

// Attach payment method
router.post('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const user = req.user;

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No Stripe customer found'
      });
    }

    const paymentMethod = await stripeService.attachPaymentMethod(paymentMethodId, user.stripeCustomerId);

    res.json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error('Error attaching payment method:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to attach payment method'
    });
  }
});

// Detach payment method
router.delete('/payment-methods/:paymentMethodId', authenticateToken, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    const paymentMethod = await stripeService.detachPaymentMethod(paymentMethodId);

    res.json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error('Error detaching payment method:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to detach payment method'
    });
  }
});

// Get invoices
router.get('/invoices', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { limit = 10 } = req.query;

    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        data: []
      });
    }

    const invoices = await stripeService.getCustomerInvoices(user.stripeCustomerId, parseInt(limit));

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get invoices'
    });
  }
});

// Get invoice details
router.get('/invoices/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await stripeService.getInvoice(invoiceId);

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error getting invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get invoice'
    });
  }
});

// Create refund
router.post('/refunds', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    const refund = await stripeService.createRefund(paymentIntentId, amount, reason);

    res.json({
      success: true,
      data: refund
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create refund'
    });
  }
});

// Get customer details
router.get('/customer', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

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

// Create Razorpay order
router.post('/razorpay/create-order', authenticateToken, async (req, res) => {
  try {
    const { plan = 'starter' } = req.body || {};
    const planAmountMap = { starter: 900, pro: 2900, enterprise: 9900 }; // INR (in rupees)
    const amountInPaise = (planAmountMap[plan] || 900) * 100;

    const order = await razorpayService.createOrder(amountInPaise, 'INR', `user_${req.user._id}_${plan}`);
    res.json({ success: true, data: { order } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Failed to create order' });
  }
});

// Verify Razorpay payment
router.post('/razorpay/verify', authenticateToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    const ok = razorpayService.verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!ok) return res.status(400).json({ success: false, error: 'Invalid signature' });

    // TODO: mark subscription active for user; simple stub
    req.user.subscription.plan = plan || req.user.subscription.plan;
    req.user.subscription.status = 'active';
    await req.user.save();

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Verification failed' });
  }
});

module.exports = router; 