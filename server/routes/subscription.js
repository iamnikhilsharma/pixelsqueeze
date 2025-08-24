const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const User = require('../models/User');

// Update user subscription after successful payment
router.post('/update-subscription', auth, async (req, res) => {
  try {
    const { plan, billing, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!plan || !billing || !razorpayPaymentId || !razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate subscription end date
    const now = new Date();
    const subscriptionEnd = billing === 'annual' 
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Update user subscription
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        subscription: {
          plan: plan,
          status: 'active',
          billingCycle: billing,
          razorpayPaymentId: razorpayPaymentId,
          razorpayOrderId: razorpayOrderId,
          currentPeriodStart: now,
          currentPeriodEnd: subscriptionEnd,
          updatedAt: now
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log subscription update
    console.log(`Subscription updated for user ${userId}: ${plan} plan (${billing})`);

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        plan: updatedUser.subscription.plan,
        status: updatedUser.subscription.status,
        billingCycle: updatedUser.subscription.billingCycle,
        currentPeriodEnd: updatedUser.subscription.currentPeriodEnd
      }
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message
    });
  }
});

// Get current subscription details
router.get('/current', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('subscription');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.subscription || { plan: 'Free', status: 'inactive' }
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message
    });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': new Date()
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`Subscription cancelled for user ${userId}`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

// Upgrade/downgrade subscription
router.post('/change-plan', auth, async (req, res) => {
  try {
    const { newPlan, newBilling } = req.body;
    const userId = req.user.id;

    if (!newPlan || !newBilling) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate new subscription end date
    const now = new Date();
    const subscriptionEnd = newBilling === 'annual' 
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        'subscription.plan': newPlan,
        'subscription.billingCycle': newBilling,
        'subscription.currentPeriodStart': now,
        'subscription.currentPeriodEnd': subscriptionEnd,
        'subscription.updatedAt': now
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`Plan changed for user ${userId}: ${newPlan} (${newBilling})`);

    res.json({
      success: true,
      message: 'Plan changed successfully',
      data: {
        plan: updatedUser.subscription.plan,
        billingCycle: updatedUser.subscription.billingCycle,
        currentPeriodEnd: updatedUser.subscription.currentPeriodEnd
      }
    });

  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change plan',
      error: error.message
    });
  }
});

module.exports = router;
