const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhooks
 */
router.post('/stripe',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;
        
        case 'customer.subscription.trial_will_end':
          await handleTrialWillEnd(event.data.object);
          break;
        
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  })
);

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  try {
    const user = await User.findOne({
      'subscription.stripeCustomerId': subscription.customer
    });

    if (!user) {
      logger.error(`User not found for customer: ${subscription.customer}`);
      return;
    }

    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    
    user.subscription = {
      plan,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    };

    await user.save();
    
    logger.info(`Subscription created for user: ${user.email}, plan: ${plan}`);
  } catch (error) {
    logger.error('Error handling subscription created:', error);
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    const user = await User.findOne({
      'subscription.stripeSubscriptionId': subscription.id
    });

    if (!user) {
      logger.error(`User not found for subscription: ${subscription.id}`);
      return;
    }

    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    
    user.subscription = {
      ...user.subscription,
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    };

    await user.save();
    
    logger.info(`Subscription updated for user: ${user.email}, plan: ${plan}`);
  } catch (error) {
    logger.error('Error handling subscription updated:', error);
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    const user = await User.findOne({
      'subscription.stripeSubscriptionId': subscription.id
    });

    if (!user) {
      logger.error(`User not found for subscription: ${subscription.id}`);
      return;
    }

    user.subscription = {
      plan: 'free',
      status: 'canceled',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    };

    await user.save();
    
    logger.info(`Subscription canceled for user: ${user.email}`);
  } catch (error) {
    logger.error('Error handling subscription deleted:', error);
  }
}

/**
 * Handle payment succeeded
 */
async function handlePaymentSucceeded(invoice) {
  try {
    const user = await User.findOne({
      'subscription.stripeCustomerId': invoice.customer
    });

    if (!user) {
      logger.error(`User not found for customer: ${invoice.customer}`);
      return;
    }

    // Reset monthly usage on successful payment
    await user.resetMonthlyUsage();
    
    logger.info(`Payment succeeded for user: ${user.email}, invoice: ${invoice.id}`);
  } catch (error) {
    logger.error('Error handling payment succeeded:', error);
  }
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice) {
  try {
    const user = await User.findOne({
      'subscription.stripeCustomerId': invoice.customer
    });

    if (!user) {
      logger.error(`User not found for customer: ${invoice.customer}`);
      return;
    }

    user.subscription.status = 'past_due';
    await user.save();
    
    logger.info(`Payment failed for user: ${user.email}, invoice: ${invoice.id}`);
  } catch (error) {
    logger.error('Error handling payment failed:', error);
  }
}

/**
 * Handle trial will end
 */
async function handleTrialWillEnd(subscription) {
  try {
    const user = await User.findOne({
      'subscription.stripeSubscriptionId': subscription.id
    });

    if (!user) {
      logger.error(`User not found for subscription: ${subscription.id}`);
      return;
    }

    // TODO: Send email notification about trial ending
    logger.info(`Trial ending soon for user: ${user.email}`);
  } catch (error) {
    logger.error('Error handling trial will end:', error);
  }
}

/**
 * Get plan from Stripe price ID
 */
function getPlanFromPriceId(priceId) {
  // Map your Stripe price IDs to plan names
  const planMap = {
    'price_starter': 'starter',
    'price_pro': 'pro',
    'price_enterprise': 'enterprise'
  };
  
  return planMap[priceId] || 'free';
}

/**
 * POST /api/webhooks/create-checkout-session
 * Create Stripe checkout session
 */
router.post('/create-checkout-session',
  asyncHandler(async (req, res) => {
    const { priceId, successUrl, cancelUrl } = req.body;
    const user = req.user;

    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${process.env.CORS_ORIGIN}/dashboard?success=true`,
        cancel_url: cancelUrl || `${process.env.CORS_ORIGIN}/pricing?canceled=true`,
        metadata: {
          userId: user._id.toString()
        }
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url
        }
      });

    } catch (error) {
      logger.error('Error creating checkout session:', error);
      res.status(500).json({
        error: 'Failed to create checkout session',
        code: 'CHECKOUT_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * POST /api/webhooks/create-portal-session
 * Create Stripe customer portal session
 */
router.post('/create-portal-session',
  asyncHandler(async (req, res) => {
    const { returnUrl } = req.body;
    const user = req.user;

    if (!user.subscription.stripeCustomerId) {
      return res.status(400).json({
        error: 'No active subscription found',
        code: 'NO_SUBSCRIPTION'
      });
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: user.subscription.stripeCustomerId,
        return_url: returnUrl || `${process.env.CORS_ORIGIN}/dashboard`
      });

      res.json({
        success: true,
        data: {
          url: session.url
        }
      });

    } catch (error) {
      logger.error('Error creating portal session:', error);
      res.status(500).json({
        error: 'Failed to create portal session',
        code: 'PORTAL_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * GET /api/webhooks/subscription-plans
 * Get available subscription plans
 */
router.get('/subscription-plans',
  asyncHandler(async (req, res) => {
    try {
      const plans = [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          priceId: null,
          features: [
            '100 images per month',
            'Max 2MB per image',
            'Basic optimization',
            'Email support'
          ],
          limits: {
            images: 100,
            maxFileSize: 2 * 1024 * 1024
          }
        },
        {
          id: 'starter',
          name: 'Starter',
          price: 10,
          priceId: 'price_starter',
          features: [
            '5,000 images per month',
            'Max 10MB per image',
            'Advanced optimization',
            'Priority support',
            'API access'
          ],
          limits: {
            images: 5000,
            maxFileSize: 10 * 1024 * 1024
          }
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 40,
          priceId: 'price_pro',
          features: [
            '20,000 images per month',
            'Max 20MB per image',
            'Premium optimization',
            'Priority support',
            'API access',
            'Bulk processing',
            'Custom formats'
          ],
          limits: {
            images: 20000,
            maxFileSize: 20 * 1024 * 1024
          }
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: null,
          priceId: 'price_enterprise',
          features: [
            'Unlimited images',
            'Custom file sizes',
            'Premium optimization',
            'Dedicated support',
            'API access',
            'Bulk processing',
            'Custom formats',
            'White-label options'
          ],
          limits: {
            images: -1, // Unlimited
            maxFileSize: -1 // Custom
          }
        }
      ];

      res.json({
        success: true,
        data: {
          plans
        }
      });

    } catch (error) {
      logger.error('Error fetching subscription plans:', error);
      res.status(500).json({
        error: 'Failed to fetch subscription plans',
        code: 'PLANS_ERROR',
        details: error.message
      });
    }
  })
);

module.exports = router;