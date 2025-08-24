import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Stripe utility functions
export const stripeUtils = {
  // Get Stripe instance
  async getStripe() {
    return await stripePromise;
  },

  // Create checkout session
  async createCheckoutSession(priceId, successUrl, cancelUrl, mode = 'subscription') {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pixelsqueeze-auth') ? JSON.parse(localStorage.getItem('pixelsqueeze-auth')).state.token : ''}`
        },
        body: JSON.stringify({
          priceId,
          successUrl,
          cancelUrl,
          mode
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  // Redirect to checkout
  async redirectToCheckout(priceId, successUrl, cancelUrl, mode = 'subscription') {
    try {
      const stripe = await this.getStripe();
      const { sessionId } = await this.createCheckoutSession(priceId, successUrl, cancelUrl, mode);
      
      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw error;
    }
  },

  // Create billing portal session
  async createBillingPortalSession(returnUrl) {
    try {
      const response = await fetch('/api/stripe/create-billing-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pixelsqueeze-auth') ? JSON.parse(localStorage.getItem('pixelsqueeze-auth')).state.token : ''}`
        },
        body: JSON.stringify({
          returnUrl
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create billing portal session');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw error;
    }
  },

  // Redirect to billing portal
  async redirectToBillingPortal(returnUrl) {
    try {
      const { url } = await this.createBillingPortalSession(returnUrl);
      window.location.href = url;
    } catch (error) {
      console.error('Error redirecting to billing portal:', error);
      throw error;
    }
  },

  // Get subscription details
  async getSubscription() {
    try {
      const response = await fetch('/api/stripe/subscription', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pixelsqueeze-auth') ? JSON.parse(localStorage.getItem('pixelsqueeze-auth')).state.token : ''}`
        }
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subscription');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pixelsqueeze-auth') ? JSON.parse(localStorage.getItem('pixelsqueeze-auth')).state.token : ''}`
        },
        body: JSON.stringify({
          subscriptionId
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      return data.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  // Reactivate subscription
  async reactivateSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/stripe/reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pixelsqueeze-auth') ? JSON.parse(localStorage.getItem('pixelsqueeze-auth')).state.token : ''}`
        },
        body: JSON.stringify({
          subscriptionId
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to reactivate subscription');
      }

      return data.data;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  },

  // Update subscription
  async updateSubscription(subscriptionId, newPriceId) {
    try {
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pixelsqueeze-auth') ? JSON.parse(localStorage.getItem('pixelsqueeze-auth')).state.token : ''}`
        },
        body: JSON.stringify({
          subscriptionId,
          newPriceId
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update subscription');
      }

      return data.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  },

  // Get payment methods
  async getPaymentMethods() {
    try {
      const response = await fetch('/api/stripe/payment-methods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pixelsqueeze-auth') ? JSON.parse(localStorage.getItem('pixelsqueeze-auth')).state.token : ''}`
        }
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch payment methods');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  // Create payment intent
  async createPaymentIntent(amount, currency = 'usd') {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pixelsqueeze-auth') ? JSON.parse(localStorage.getItem('pixelsqueeze-auth')).state.token : ''}`
        },
        body: JSON.stringify({
          amount,
          currency
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  // Format amount for display
  formatAmount(amount, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  },

  // Convert amount to cents
  toCents(amount) {
    return Math.round(amount * 100);
  },

  // Convert cents to dollars
  toDollars(cents) {
    return cents / 100;
  }
};

export default stripeUtils; 