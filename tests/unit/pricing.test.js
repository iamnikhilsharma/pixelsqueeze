const pricing = require('../../shared/pricing.js');

describe('Shared Pricing Configuration - Unit Tests', () => {
  describe('Plan Data Structure', () => {
    test('should have all required plans', () => {
      const plans = pricing.getAllPlans();
      
      expect(plans).toHaveLength(4);
      expect(plans.map(p => p.name)).toEqual(['Free', 'Starter', 'Pro', 'Enterprise']);
    });

    test('each plan should have required properties', () => {
      const plans = pricing.getAllPlans();
      
      plans.forEach(plan => {
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('price');
        expect(plan).toHaveProperty('price.monthly');
        expect(plan).toHaveProperty('price.annual');
        expect(plan).toHaveProperty('features');
        expect(plan).toHaveProperty('limits');
        expect(plan).toHaveProperty('cta');
        expect(plan).toHaveProperty('popular');
        expect(plan).toHaveProperty('color');
      });
    });
  });

  describe('getPlanById Function', () => {
    test('should return plan by ID', () => {
      const starterPlan = pricing.getPlanById('starter');
      
      expect(starterPlan).toBeDefined();
      expect(starterPlan.name).toBe('Starter');
      expect(starterPlan.price.monthly).toBe(9);
      expect(starterPlan.price.annual).toBe(90);
    });

    test('should return null for invalid ID', () => {
      const invalidPlan = pricing.getPlanById('invalid');
      
      expect(invalidPlan).toBeNull();
    });
  });

  describe('getPlanByName Function', () => {
    test('should return plan by name', () => {
      const proPlan = pricing.getPlanByName('Pro');
      
      expect(proPlan).toBeDefined();
      expect(proPlan.id).toBe('pro');
      expect(proPlan.price.monthly).toBe(29);
      expect(proPlan.price.annual).toBe(290);
    });

    test('should return null for invalid name', () => {
      const invalidPlan = pricing.getPlanByName('Invalid Plan');
      
      expect(invalidPlan).toBeNull();
    });
  });

  describe('getPlanFeatures Function', () => {
    test('should return features for Starter plan', () => {
      const features = pricing.getPlanFeatures('Starter');
      
      expect(Array.isArray(features)).toBe(true);
      expect(features).toContain('Up to 5,000 images per month');
      expect(features).toContain('Advanced compression');
      expect(features).toContain('API access');
    });

    test('should return features for Pro plan', () => {
      const features = pricing.getPlanFeatures('Pro');
      
      expect(Array.isArray(features)).toBe(true);
      expect(features).toContain('Up to 20,000 images per month');
      expect(features).toContain('AI-powered optimization');
      expect(features).toContain('Batch processing');
    });

    test('should return empty array for invalid plan', () => {
      const features = pricing.getPlanFeatures('Invalid Plan');
      
      expect(Array.isArray(features)).toBe(true);
      expect(features).toHaveLength(0);
    });
  });

  describe('getPlanLimits Function', () => {
    test('should return limits for Starter plan', () => {
      const limits = pricing.getPlanLimits('Starter');
      
      expect(limits).toHaveProperty('imagesPerMonth', 5000);
      expect(limits).toHaveProperty('storage', '10GB');
      expect(limits).toHaveProperty('formats');
      expect(limits).toHaveProperty('support', 'Priority');
      expect(limits).toHaveProperty('watermarking', true);
      expect(limits).toHaveProperty('analytics', 'Basic');
      expect(limits).toHaveProperty('apiAccess', true);
      expect(limits).toHaveProperty('batchProcessing', false);
    });

    test('should return limits for Enterprise plan', () => {
      const limits = pricing.getPlanLimits('Enterprise');
      
      expect(limits).toHaveProperty('imagesPerMonth', 100000);
      expect(limits).toHaveProperty('storage', 'Unlimited');
      expect(limits).toHaveProperty('support', '24/7 Phone');
      expect(limits).toHaveProperty('batchProcessing', true);
    });

    test('should return empty object for invalid plan', () => {
      const limits = pricing.getPlanLimits('Invalid Plan');
      
      expect(limits).toEqual({});
    });
  });

  describe('calculateSavings Function', () => {
    test('should calculate annual savings for Starter plan', () => {
      const savings = pricing.calculateSavings('starter', true);
      
      // Monthly: 9 * 12 = 108, Annual: 90, Savings: (108-90)/108 * 100 = 16.67% ≈ 17%
      expect(savings).toBe(17);
    });

    test('should calculate annual savings for Pro plan', () => {
      const savings = pricing.calculateSavings('pro', true);
      
      // Monthly: 29 * 12 = 348, Annual: 290, Savings: (348-290)/348 * 100 = 16.67% ≈ 17%
      expect(savings).toBe(17);
    });

    test('should return 0 for monthly billing', () => {
      const savings = pricing.calculateSavings('starter', false);
      
      expect(savings).toBe(0);
    });

    test('should return 0 for free plan', () => {
      const savings = pricing.calculateSavings('free', true);
      
      expect(savings).toBe(0);
    });
  });

  describe('getPrice Function', () => {
    test('should return monthly price', () => {
      const price = pricing.getPrice('starter', false);
      
      expect(price).toBe(9);
    });

    test('should return annual price', () => {
      const price = pricing.getPrice('pro', true);
      
      expect(price).toBe(290);
    });

    test('should return 0 for invalid plan', () => {
      const price = pricing.getPrice('invalid', true);
      
      expect(price).toBe(0);
    });
  });

  describe('Plan Pricing Validation', () => {
    test('Free plan should be free', () => {
      const freePlan = pricing.getPlanById('free');
      
      expect(freePlan.price.monthly).toBe(0);
      expect(freePlan.price.annual).toBe(0);
    });

    test('Paid plans should have positive prices', () => {
      const paidPlans = ['starter', 'pro', 'enterprise'];
      
      paidPlans.forEach(planId => {
        const plan = pricing.getPlanById(planId);
        expect(plan.price.monthly).toBeGreaterThan(0);
        expect(plan.price.annual).toBeGreaterThan(0);
      });
    });

    test('Annual prices should be less than monthly * 12', () => {
      const paidPlans = ['starter', 'pro', 'enterprise'];
      
      paidPlans.forEach(planId => {
        const plan = pricing.getPlanById(planId);
        const monthlyTotal = plan.price.monthly * 12;
        expect(plan.price.annual).toBeLessThan(monthlyTotal);
      });
    });

    test('All plans should have unique IDs', () => {
      const plans = pricing.getAllPlans();
      const ids = plans.map(p => p.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids).toHaveLength(uniqueIds.length);
    });

    test('All plans should have unique names', () => {
      const plans = pricing.getAllPlans();
      const names = plans.map(p => p.name);
      const uniqueNames = [...new Set(names)];
      
      expect(names).toHaveLength(uniqueNames.length);
    });

    test('Plan features should be non-empty arrays', () => {
      const plans = pricing.getAllPlans();
      
      plans.forEach(plan => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    test('Plan limits should have required properties', () => {
      const plans = pricing.getAllPlans();
      
      plans.forEach(plan => {
        expect(plan.limits).toHaveProperty('imagesPerMonth');
        expect(plan.limits).toHaveProperty('storage');
        expect(plan.limits).toHaveProperty('formats');
        expect(plan.limits).toHaveProperty('support');
        expect(plan.limits).toHaveProperty('watermarking');
        expect(plan.limits).toHaveProperty('analytics');
        expect(plan.limits).toHaveProperty('apiAccess');
        expect(plan.limits).toHaveProperty('batchProcessing');
      });
    });

    test('Plan colors should be valid Tailwind classes', () => {
      const plans = pricing.getAllPlans();
      
      plans.forEach(plan => {
        expect(plan.color).toMatch(/^from-.*to-.*$/);
        expect(plan.color).toContain('from-');
        expect(plan.color).toContain('to-');
      });
    });

    test('Popular flag should be boolean', () => {
      const plans = pricing.getAllPlans();
      
      plans.forEach(plan => {
        expect(typeof plan.popular).toBe('boolean');
      });
    });

    test('CTA text should be non-empty strings', () => {
      const plans = pricing.getAllPlans();
      
      plans.forEach(plan => {
        expect(typeof plan.cta).toBe('string');
        expect(plan.cta.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null input gracefully', () => {
      expect(pricing.getPlanById(null)).toBeNull();
      expect(pricing.getPlanByName(null)).toBeNull();
      expect(pricing.getPlanFeatures(null)).toEqual([]);
      expect(pricing.getPlanLimits(null)).toEqual({});
      expect(pricing.calculateSavings(null, true)).toBe(0);
      expect(pricing.getPrice(null, true)).toBe(0);
    });

    test('should handle undefined input gracefully', () => {
      expect(pricing.getPlanById(undefined)).toBeNull();
      expect(pricing.getPlanByName(undefined)).toBeNull();
      expect(pricing.getPlanFeatures(undefined)).toEqual([]);
      expect(pricing.getPlanLimits(undefined)).toEqual({});
      expect(pricing.calculateSavings(undefined, true)).toBe(0);
      expect(pricing.getPrice(undefined, true)).toBe(0);
    });

    test('should handle empty string input gracefully', () => {
      expect(pricing.getPlanById('')).toBeNull();
      expect(pricing.getPlanByName('')).toBeNull();
      expect(pricing.getPlanFeatures('')).toEqual([]);
      expect(pricing.getPlanLimits('')).toEqual({});
      expect(pricing.calculateSavings('', true)).toBe(0);
      expect(pricing.getPrice('', true)).toBe(0);
    });

    test('should handle case-sensitive plan names', () => {
      expect(pricing.getPlanByName('starter')).toBeNull();
      expect(pricing.getPlanByName('STARTER')).toBeNull();
      expect(pricing.getPlanByName('Starter')).toBeDefined();
    });

    test('should handle case-sensitive plan IDs', () => {
      expect(pricing.getPlanById('STARTER')).toBeNull();
      expect(pricing.getPlanById('Starter')).toBeNull();
      expect(pricing.getPlanById('starter')).toBeDefined();
    });
  });

  describe('Business Logic Validation', () => {
    test('Starter plan should be marked as popular', () => {
      const starterPlan = pricing.getPlanById('starter');
      expect(starterPlan.popular).toBe(true);
    });

    test('Only one plan should be marked as popular', () => {
      const plans = pricing.getAllPlans();
      const popularPlans = plans.filter(p => p.popular);
      
      expect(popularPlans).toHaveLength(1);
      expect(popularPlans[0].name).toBe('Starter');
    });

    test('Enterprise plan should have unlimited storage', () => {
      const enterprisePlan = pricing.getPlanById('enterprise');
      expect(enterprisePlan.limits.storage).toBe('Unlimited');
    });

    test('Free plan should have limited features', () => {
      const freePlan = pricing.getPlanById('free');
      expect(freePlan.limits.watermarking).toBe(false);
      expect(freePlan.limits.apiAccess).toBe(false);
      expect(freePlan.limits.batchProcessing).toBe(false);
    });

    test('Paid plans should have enhanced features', () => {
      const paidPlans = ['starter', 'pro', 'enterprise'];
      
      paidPlans.forEach(planId => {
        const plan = pricing.getPlanById(planId);
        expect(plan.limits.watermarking).toBeTruthy(); // Can be true or string like "Advanced"
        expect(plan.limits.apiAccess).toBe(true);
      });
    });

    test('Pro and Enterprise plans should have batch processing', () => {
      const advancedPlans = ['pro', 'enterprise'];
      
      advancedPlans.forEach(planId => {
        const plan = pricing.getPlanById(planId);
        expect(plan.limits.batchProcessing).toBe(true);
      });
    });

    test('Enterprise plan should have 24/7 phone support', () => {
      const enterprisePlan = pricing.getPlanById('enterprise');
      expect(enterprisePlan.limits.support).toBe('24/7 Phone');
    });

    test('Other plans should have priority support', () => {
      const otherPlans = ['starter', 'pro'];
      
      otherPlans.forEach(planId => {
        const plan = pricing.getPlanById(planId);
        expect(plan.limits.support).toBe('Priority');
      });
    });
  });
});
