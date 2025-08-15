/**
 * Shared Pricing Configuration for PixelSqueeze
 * This file contains all pricing plans, features, and limits
 * Used by both frontend and backend to ensure consistency
 */

const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect for getting started',
    features: [
      'Up to 100 images per month',
      'Basic compression',
      'Standard formats (JPEG, PNG)',
      'Community support',
      '2MB max file size',
      'Basic optimization'
    ],
    limits: {
      imagesPerMonth: 100,
      storage: '2MB max',
      formats: ['JPEG', 'PNG'],
      support: 'Community',
      watermarking: false,
      analytics: 'Basic',
      apiAccess: false,
      batchProcessing: false
    },
    cta: 'Get Started Free',
    popular: false,
    color: 'from-gray-500 to-gray-600'
  },
  
  starter: {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 9, annual: 90 },
    description: 'Great for small projects',
    features: [
      'Up to 5,000 images per month',
      'Advanced compression',
      'All formats (WebP, AVIF)',
      'Priority support',
      '10GB storage',
      'Watermarking',
      'Thumbnail generation',
      'Basic analytics',
      'API access'
    ],
    limits: {
      imagesPerMonth: 5000,
      storage: '10GB',
      formats: ['JPEG', 'PNG', 'WebP', 'AVIF'],
      support: 'Priority',
      watermarking: true,
      analytics: 'Basic',
      apiAccess: true,
      batchProcessing: false
    },
    cta: 'Start Starter Trial',
    popular: true,
    color: 'from-primary-500 to-secondary-500'
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 29, annual: 290 },
    description: 'For growing businesses',
    features: [
      'Up to 20,000 images per month',
      'AI-powered optimization',
      'All formats + Custom',
      'Priority support',
      '25GB storage',
      'Advanced watermarking',
      'Batch processing',
      'Full analytics dashboard',
      'API access',
      'Custom integrations'
    ],
    limits: {
      imagesPerMonth: 20000,
      storage: '25GB',
      formats: ['JPEG', 'PNG', 'WebP', 'AVIF', 'Custom'],
      support: 'Priority',
      watermarking: 'Advanced',
      analytics: 'Full dashboard',
      apiAccess: true,
      batchProcessing: true
    },
    cta: 'Start Pro Trial',
    popular: false,
    color: 'from-accent-500 to-light-500'
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 99, annual: 990 },
    description: 'For large organizations',
    features: [
      'Up to 100,000 images per month',
      'AI-powered optimization',
      'Custom formats',
      '24/7 phone support',
      'Unlimited storage',
      'Advanced watermarking',
      'Batch processing',
      'Full analytics dashboard',
      'API access',
      'Custom integrations',
      'White-label options',
      'Dedicated support'
    ],
    limits: {
      imagesPerMonth: 100000,
      storage: 'Unlimited',
      formats: ['JPEG', 'PNG', 'WebP', 'AVIF', 'Custom'],
      support: '24/7 Phone',
      watermarking: 'Advanced',
      analytics: 'Full dashboard',
      apiAccess: true,
      batchProcessing: true
    },
    cta: 'Contact Sales',
    popular: false,
    color: 'from-purple-500 to-indigo-500'
  }
};

// Helper functions
const getPlanById = (planId) => PRICING_PLANS[planId] || null;

const getPlanByName = (planName) => {
  return Object.values(PRICING_PLANS).find(plan => plan.name === planName) || null;
};

const getAllPlans = () => Object.values(PRICING_PLANS);

const getPlanFeatures = (planName) => {
  const plan = getPlanByName(planName);
  return plan ? plan.features : [];
};

const getPlanLimits = (planName) => {
  const plan = getPlanByName(planName);
  return plan ? plan.limits : {};
};

const calculateSavings = (planId, isAnnual) => {
  const plan = getPlanById(planId);
  if (!plan || plan.price.monthly === 0 || !isAnnual) return 0;
  
  return Math.round((plan.price.monthly * 12 - plan.price.annual) / (plan.price.monthly * 12) * 100);
};

const getPrice = (planId, isAnnual) => {
  const plan = getPlanById(planId);
  if (!plan) return 0;
  
  return isAnnual ? plan.price.annual : plan.price.monthly;
};

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS (Node.js)
  module.exports = {
    PRICING_PLANS,
    getPlanById,
    getPlanByName,
    getAllPlans,
    getPlanFeatures,
    getPlanLimits,
    calculateSavings,
    getPrice
  };
} else {
  // ES modules (Browser)
  window.PixelSqueezePricing = {
    PRICING_PLANS,
    getPlanById,
    getPlanByName,
    getAllPlans,
    getPlanFeatures,
    getPlanLimits,
    calculateSavings,
    getPrice
  };
}
