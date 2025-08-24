const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const { authenticateToken } = require('../middleware/auth');

// Get pricing plans
router.get('/pricing', async (req, res) => {
  try {
    const plans = await stripeService.getPricingPlans();
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing plans'
    });
  }
});

// Create checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl, mode = 'subscription' } = req.body;
    const user = req.user;

    // Create or get Stripe customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripeService.getCustomer(user.stripeCustomerId);
    } else {
      customer = await stripeService.createCustomer(user);
      // TODO: Update user with stripeCustomerId in database
    }

    const session = await stripeService.createCheckoutSession(
      customer.id,
      priceId,
      successUrl,
      cancelUrl,
      mode
    );

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

// Create billing portal session
router.post('/create-billing-portal-session', authenticateToken, async (req, res) => {
  try {
    const { returnUrl } = req.body;
    const user = req.user;

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No billing account found'
      });
    }

    const session = await stripeService.createBillingPortalSession(
      user.stripeCustomerId,
      returnUrl
    );

    res.json({
      success: true,
      data: {
        url: session.url
      }
    });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create billing portal session'
    });
  }
});

// Get customer subscription
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        data: {
          subscription: null,
          customer: null
        }
      });
    }

    const customer = await stripeService.getCustomer(user.stripeCustomerId);
    let subscription = null;

    if (customer.subscriptions && customer.subscriptions.data.length > 0) {
      subscription = customer.subscriptions.data[0];
    }

    res.json({
      success: true,
      data: {
        subscription,
        customer
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription'
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const user = req.user;

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No billing account found'
      });
    }

    const subscription = await stripeService.cancelSubscription(subscriptionId);

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

// Reactivate subscription
router.post('/reactivate-subscription', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const user = req.user;

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No billing account found'
      });
    }

    const subscription = await stripeService.reactivateSubscription(subscriptionId);

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate subscription'
    });
  }
});

// Update subscription
router.post('/update-subscription', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId, newPriceId } = req.body;
    const user = req.user;

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No billing account found'
      });
    }

    const subscription = await stripeService.updateSubscription(subscriptionId, newPriceId);

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription'
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
      data: paymentMethods.data
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment methods'
    });
  }
});

// Create payment intent for one-time payments
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    const user = req.user;

    const paymentIntent = await stripeService.createPaymentIntent(
      amount,
      currency,
      user.stripeCustomerId
    );

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    });
  }
});

// Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = require('stripe').webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await stripeService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook handling failed'
    });
  }
});

module.exports = router; 