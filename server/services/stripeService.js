const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  constructor() {
    this.stripe = stripe;
  }

  // Create a customer in Stripe
  async createCustomer(userData) {
    try {
      const customer = await this.stripe.customers.create({
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        metadata: {
          userId: userData.id,
          plan: userData.subscription?.plan || 'free'
        }
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create a subscription
  async createSubscription(customerId, priceId) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Create a checkout session for one-time payments or subscriptions
  async createCheckoutSession(customerId, priceId, successUrl, cancelUrl, mode = 'subscription') {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          customerId: customerId
        }
      });
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create a billing portal session
  async createBillingPortalSession(customerId, returnUrl) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw error;
    }
  }

  // Get customer details
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
      return subscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId, newPriceId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });
      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Get payment methods for a customer
  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods;
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      throw error;
    }
  }

  // Attach payment method to customer
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      return paymentMethod;
    } catch (error) {
      console.error('Error attaching payment method:', error);
      throw error;
    }
  }

  // Create invoice for usage-based billing
  async createInvoice(customerId, items) {
    try {
      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        collection_method: 'charge_automatically',
        items: items,
      });
      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Handle webhook events
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  // Webhook handlers
  async handleSubscriptionCreated(subscription) {
    console.log('Subscription created:', subscription.id);
    // TODO: Update user subscription in database
  }

  async handleSubscriptionUpdated(subscription) {
    console.log('Subscription updated:', subscription.id);
    // TODO: Update user subscription in database
  }

  async handleSubscriptionDeleted(subscription) {
    console.log('Subscription deleted:', subscription.id);
    // TODO: Update user subscription in database
  }

  async handlePaymentSucceeded(invoice) {
    console.log('Payment succeeded:', invoice.id);
    // TODO: Update user billing status
  }

  async handlePaymentFailed(invoice) {
    console.log('Payment failed:', invoice.id);
    // TODO: Handle failed payment
  }

  // Get pricing plans from Stripe
  async getPricingPlans() {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });
      return prices.data;
    } catch (error) {
      console.error('Error retrieving pricing plans:', error);
      throw error;
    }
  }

  // Create a payment intent for one-time payments
  async createPaymentIntent(amount, currency = 'usd', customerId = null) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }
}

module.exports = new StripeService(); 