# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payment processing for PixelSqueeze SaaS platform.

## 🚀 **Step 1: Create a Stripe Account**

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your business verification
3. Get your API keys from the Stripe Dashboard

## 🔑 **Step 2: Get Your Stripe API Keys**

1. Log into your Stripe Dashboard
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key**
4. For webhooks, you'll also need a **Webhook endpoint secret**

## 📦 **Step 3: Create Products and Prices in Stripe**

### Create Products

1. Go to **Products** in your Stripe Dashboard
2. Create the following products:

#### Free Plan (No product needed - handled in code)
- This is our default plan

#### Starter Plan
- **Name**: PixelSqueeze Starter
- **Description**: Great for small projects
- **Price**: $9/month

#### Pro Plan
- **Name**: PixelSqueeze Pro
- **Description**: For growing businesses
- **Price**: $29/month

#### Enterprise Plan
- **Name**: PixelSqueeze Enterprise
- **Description**: For large organizations
- **Price**: $99/month

### Create Prices

For each product, create a **recurring price**:

1. Click on each product
2. Click **Add price**
3. Set up recurring billing:
   - **Billing model**: Standard pricing
   - **Price**: Set the monthly amount
   - **Billing period**: Monthly
   - **Currency**: USD

4. Copy the **Price ID** for each plan (starts with `price_`)

## 🌐 **Step 4: Set Up Webhooks**

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret**

## ⚙️ **Step 5: Configure Environment Variables**

Create a `.env` file in your project root with these variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (replace with your actual price IDs)
STRIPE_PRICE_STARTER=price_1ABC123DEF456GHI789JKL
STRIPE_PRICE_PRO=price_2DEF456GHI789JKL012MNO
STRIPE_PRICE_ENTERPRISE=price_3GHI789JKL012MNO345PQR

# Frontend Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_STRIPE_PRICE_STARTER=price_1ABC123DEF456GHI789JKL
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_2DEF456GHI789JKL012MNO
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_3GHI789JKL012MNO345PQR
```

## 🧪 **Step 6: Test the Integration**

### Test Mode
1. Use Stripe's test mode (keys start with `sk_test_` and `pk_test_`)
2. Use test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`

### Test the Flow
1. Start your development server
2. Go to the billing page
3. Try upgrading to a paid plan
4. Use a test card to complete the payment
5. Check that the subscription is created in Stripe Dashboard

## 🔄 **Step 7: Handle Webhooks (Production)**

For production, you need to handle webhook events properly:

1. **Update the webhook handlers** in `server/services/stripeService.js`
2. **Connect to your database** to update user subscriptions
3. **Send confirmation emails** to users
4. **Update usage limits** based on subscription

### Example Webhook Handler Update:

```javascript
async handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata.userId;
  const user = await User.findById(userId);
  
  if (user) {
    user.subscription = {
      plan: subscription.items.data[0].price.id,
      status: subscription.status,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    };
    await user.save();
  }
}
```

## 🚀 **Step 8: Go Live**

1. **Switch to live mode** in Stripe Dashboard
2. **Update environment variables** with live keys
3. **Update webhook endpoint** to production URL
4. **Test with real cards** (small amounts first)
5. **Monitor webhook events** in Stripe Dashboard

## 📊 **Step 9: Monitor and Analytics**

### Stripe Dashboard
- Monitor payments, subscriptions, and customer data
- Set up alerts for failed payments
- Track revenue and growth metrics

### Application Analytics
- Track subscription conversions
- Monitor churn rates
- Analyze usage patterns

## 🔒 **Security Best Practices**

1. **Never expose secret keys** in frontend code
2. **Always verify webhook signatures**
3. **Use HTTPS** in production
4. **Implement proper error handling**
5. **Log all payment events** for debugging
6. **Set up fraud detection** rules in Stripe

## 🛠️ **Troubleshooting**

### Common Issues:

1. **Webhook not receiving events**
   - Check endpoint URL is accessible
   - Verify webhook secret is correct
   - Check server logs for errors

2. **Payment fails**
   - Verify card details are correct
   - Check if card supports the currency
   - Ensure sufficient funds

3. **Subscription not updating**
   - Check webhook handlers are working
   - Verify database connection
   - Check user ID mapping

### Debug Mode:
Enable debug logging in your application:

```javascript
// In your server code
console.log('Webhook received:', event.type, event.data.object.id);
```

## 📚 **Additional Resources**

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## 🎯 **Next Steps**

After setting up Stripe:

1. **Implement usage tracking** based on subscription limits
2. **Add subscription management** features
3. **Create billing analytics** dashboard
4. **Set up automated billing** reminders
5. **Implement refund handling**
6. **Add multiple payment methods** support

---

**Need Help?** Check the Stripe documentation or create an issue in the project repository. 