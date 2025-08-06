const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');

// Stripe webhook handler
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripeService.validateWebhookSignature(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
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
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'invoice.payment_action_required':
        await handlePaymentActionRequired(event.data.object);
        break;
      
      case 'customer.created':
        await handleCustomerCreated(event.data.object);
        break;
      
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object);
        break;
      
      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object);
        break;
      
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object);
        break;
      
      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object);
        break;
      
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(event.data.object);
        break;
      
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook event handlers
async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  // Update user subscription status in database
  // In a real app, you would:
  // 1. Find user by customer ID
  // 2. Update subscription details
  // 3. Send welcome email
  // 4. Update usage limits
  
  const customerId = subscription.customer;
  const status = subscription.status;
  const planType = getPlanTypeFromPriceId(subscription.items.data[0].price.id);
  
  console.log(`Customer ${customerId} subscribed to ${planType} plan with status: ${status}`);
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const customerId = subscription.customer;
  const status = subscription.status;
  const planType = getPlanTypeFromPriceId(subscription.items.data[0].price.id);
  
  // Update user subscription in database
  console.log(`Customer ${customerId} subscription updated to ${planType} plan with status: ${status}`);
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const customerId = subscription.customer;
  
  // Downgrade user to free plan
  // Update user subscription status in database
  console.log(`Customer ${customerId} subscription cancelled, downgrading to free plan`);
}

async function handleTrialWillEnd(subscription) {
  console.log('Trial will end:', subscription.id);
  
  const customerId = subscription.customer;
  
  // Send trial ending notification
  // In a real app, send email notification
  console.log(`Customer ${customerId} trial ending soon`);
}

async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  const customerId = invoice.customer;
  const amount = stripeService.toDollars(invoice.amount_paid);
  
  // Update payment status in database
  // Send payment confirmation email
  console.log(`Customer ${customerId} payment succeeded: $${amount}`);
}

async function handlePaymentFailed(invoice) {
  console.log('Payment failed:', invoice.id);
  
  const customerId = invoice.customer;
  const amount = stripeService.toDollars(invoice.amount_due);
  
  // Update payment status in database
  // Send payment failure notification
  // Consider downgrading subscription
  console.log(`Customer ${customerId} payment failed: $${amount}`);
}

async function handlePaymentActionRequired(invoice) {
  console.log('Payment action required:', invoice.id);
  
  const customerId = invoice.customer;
  
  // Send payment action required notification
  // In a real app, send email with payment link
  console.log(`Customer ${customerId} payment action required`);
}

async function handleCustomerCreated(customer) {
  console.log('Customer created:', customer.id);
  
  // Store customer information in database
  // Link customer to user account
  console.log(`New customer created: ${customer.email}`);
}

async function handleCustomerUpdated(customer) {
  console.log('Customer updated:', customer.id);
  
  // Update customer information in database
  console.log(`Customer updated: ${customer.email}`);
}

async function handleCustomerDeleted(customer) {
  console.log('Customer deleted:', customer.id);
  
  // Handle customer deletion
  // In a real app, you might want to anonymize data instead of deleting
  console.log(`Customer deleted: ${customer.email}`);
}

async function handlePaymentMethodAttached(paymentMethod) {
  console.log('Payment method attached:', paymentMethod.id);
  
  const customerId = paymentMethod.customer;
  
  // Update payment method in database
  console.log(`Payment method attached for customer: ${customerId}`);
}

async function handlePaymentMethodDetached(paymentMethod) {
  console.log('Payment method detached:', paymentMethod.id);
  
  const customerId = paymentMethod.customer;
  
  // Remove payment method from database
  console.log(`Payment method detached for customer: ${customerId}`);
}

async function handleChargeSucceeded(charge) {
  console.log('Charge succeeded:', charge.id);
  
  const customerId = charge.customer;
  const amount = stripeService.toDollars(charge.amount);
  
  // Record successful charge in database
  console.log(`Charge succeeded for customer ${customerId}: $${amount}`);
}

async function handleChargeFailed(charge) {
  console.log('Charge failed:', charge.id);
  
  const customerId = charge.customer;
  const amount = stripeService.toDollars(charge.amount);
  
  // Record failed charge in database
  console.log(`Charge failed for customer ${customerId}: $${amount}`);
}

async function handleChargeRefunded(charge) {
  console.log('Charge refunded:', charge.id);
  
  const customerId = charge.customer;
  const amount = stripeService.toDollars(charge.amount_refunded);
  
  // Record refund in database
  console.log(`Charge refunded for customer ${customerId}: $${amount}`);
}

// Helper function to get plan type from Stripe price ID
function getPlanTypeFromPriceId(priceId) {
  const priceMap = {
    [process.env.STRIPE_PRICE_STARTER]: 'starter',
    [process.env.STRIPE_PRICE_PRO]: 'pro',
    [process.env.STRIPE_PRICE_ENTERPRISE]: 'enterprise'
  };
  
  return priceMap[priceId] || 'free';
}

// Health check endpoint for webhook
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;