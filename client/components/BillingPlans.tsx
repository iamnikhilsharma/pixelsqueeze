import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CheckIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your-publishable-key');

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  limits: {
    images: number;
    bandwidth: string;
    quality: string;
  };
  popular: boolean;
  stripePriceId?: string;
}

interface BillingPlansProps {
  onPlanChange?: (plan: Plan) => void;
}

const BillingPlans: React.FC<BillingPlansProps> = ({ onPlanChange }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/billing/plans`, {
        headers: {
          'Authorization': `Bearer ${user?.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.data);
      } else {
        toast.error('Failed to load plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    if (plan.id === 'free') {
      // Handle free plan selection
      toast.success('Free plan selected');
      onPlanChange?.(plan);
    } else {
      setShowPaymentForm(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Start optimizing your images with our powerful compression technology. 
          Choose the plan that fits your needs and scale as you grow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan?.id === plan.id}
            onSelect={() => handlePlanSelect(plan)}
            currentPlan={user?.subscription?.plan}
          />
        ))}
      </div>

      {showPaymentForm && selectedPlan && (
        <PaymentForm
          plan={selectedPlan}
          onSuccess={(plan) => {
            setShowPaymentForm(false);
            setSelectedPlan(null);
            onPlanChange?.(plan);
            toast.success(`Successfully subscribed to ${plan.name} plan!`);
          }}
          onCancel={() => {
            setShowPaymentForm(false);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
};

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onSelect: () => void;
  currentPlan?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isSelected, onSelect, currentPlan }) => {
  const isCurrentPlan = currentPlan === plan.id;
  const isFreePlan = plan.id === 'free';

  return (
    <div className={`relative rounded-lg border-2 p-6 transition-all duration-200 ${
      isSelected 
        ? 'border-indigo-600 bg-indigo-50' 
        : isCurrentPlan 
          ? 'border-green-600 bg-green-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white">
            <StarIcon className="w-3 h-3 mr-1" />
            Most Popular
          </span>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
            Current Plan
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
          <span className="text-gray-600">/{plan.period}</span>
        </div>
        <p className="text-gray-600 mb-6">{plan.description}</p>
      </div>

      <div className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center">
            <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Images:</span>
            <span className="font-medium">{plan.limits.images.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Bandwidth:</span>
            <span className="font-medium">{plan.limits.bandwidth}</span>
          </div>
          <div className="flex justify-between">
            <span>Quality:</span>
            <span className="font-medium">{plan.limits.quality}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onSelect}
        disabled={isCurrentPlan}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : isSelected
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {isCurrentPlan ? 'Current Plan' : isFreePlan ? 'Get Started' : 'Choose Plan'}
      </button>
    </div>
  );
};

interface PaymentFormProps {
  plan: Plan;
  onSuccess: (plan: Plan) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ plan, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create subscription
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/billing/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: plan.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // In a real implementation, you would handle the payment with Stripe
        // For now, we'll simulate success
        setTimeout(() => {
          onSuccess(plan);
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError('Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Subscribe to {plan.name}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{plan.name} Plan</span>
              <span className="font-semibold">${plan.price}/{plan.period}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="border border-gray-300 rounded-md p-3">
              <p className="text-sm text-gray-600">
                Payment integration coming soon. This is a demo.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Processing...' : 'Subscribe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillingPlans; 