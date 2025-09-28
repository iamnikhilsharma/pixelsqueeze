import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCardIcon, CheckIcon, StarIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import Button from '@/components/Button';
import { formatBytes, formatNumber, buildApiUrl } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import Script from 'next/script';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Perfect for getting started',
    features: [
      '100 images per month',
      'Basic optimization',
      'Standard support',
      'WebP, JPEG, PNG support'
    ],
    limits: {
      images: 100,
      bandwidth: '1GB',
      quality: 'Good'
    },
    popular: false
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    period: 'month',
    description: 'Great for small projects',
    features: [
      '5,000 images per month',
      'Advanced optimization',
      'Priority support',
      'All formats supported',
      'Custom quality settings',
      'API access'
    ],
    limits: {
      images: 5000,
      bandwidth: '10GB',
      quality: 'Excellent'
    },
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'For growing businesses',
    features: [
      '20,000 images per month',
      'Premium optimization',
      '24/7 support',
      'All formats + AVIF',
      'Advanced settings',
      'API access',
      'Bulk processing',
      'Analytics dashboard'
    ],
    limits: {
      images: 20000,
      bandwidth: '50GB',
      quality: 'Premium'
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    period: 'month',
    description: 'For large organizations',
    features: [
      '100,000 images per month',
      'Maximum optimization',
      'Dedicated support',
      'All formats supported',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
      'Advanced analytics'
    ],
    limits: {
      images: 100000,
      bandwidth: '200GB',
      quality: 'Maximum'
    },
    popular: false
  }
];

export default function Billing() {
  const router = useRouter();
  const { user, token, isAuthenticated, checkAuth, hasRehydrated } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const currentPlan = plans.find(plan => plan.id === user?.subscription?.plan) || plans[0];

  useEffect(() => {
    (async () => {
      if (!hasRehydrated) return;
      if (!token) {
        router.replace('/login');
        return;
      }
      await checkAuth();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hasRehydrated]);

  // Handle loading and authentication states
  if (!hasRehydrated) {
    return <div className="min-h-screen"/>;
  }
  
  if (!token) {
    return null;
  }
  
  if (!isAuthenticated) {
    return null;
  }

  const startRazorpay = async (planId: string) => {
    setIsLoading(true);
    try {
      const authData = localStorage.getItem('pixelsqueeze-auth');
      const token = authData ? JSON.parse(authData).state.token : '';
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(buildApiUrl('/api/billing/razorpay/create-order'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Order failed');
      const order = data.data.order;
      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'PixelSqueeze',
        description: `Upgrade to ${planId}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(buildApiUrl('/api/billing/razorpay/verify'), {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, plan: planId })
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) throw new Error(verifyData.error || 'Verification failed');
            toast.success('Payment successful! Plan updated');
          } catch (e: any) {
            toast.error(e.message || 'Verification failed');
          }
        },
        theme: { color: '#22c55e' },
        prefill: { name: `${user?.firstName} ${user?.lastName}`, email: user?.email },
      };
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: any) {
      toast.error(e.message || 'Unable to start payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-gray-600">
            Manage your subscription and billing preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subscription Plans
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Current Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
                    <div className="mt-2 flex items-center space-x-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {currentPlan.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        ${currentPlan.price}/{currentPlan.period}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{currentPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ${currentPlan.price}
                      <span className="text-sm font-normal text-gray-500">/{currentPlan.period}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {user?.subscription?.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button variant="primary" size="sm" onClick={async () => {
                    try {
                      await startRazorpay(selectedPlan || '');
                    } catch (e: any) {
                      toast.error(e.message || 'Unable to start payment');
                    }
                  }}>Pay with Razorpay</Button>
                </div>
              </div>
            </motion.div>

        {/* Usage Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage This Month</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Images Processed</span>
                  <span className="text-sm text-gray-900">
                    {formatNumber(user?.usage?.monthlyImages || 0)} / {formatNumber(currentPlan.limits.images)}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((user?.usage?.monthlyImages || 0) / currentPlan.limits.images * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Bandwidth Used</span>
                  <span className="text-sm text-gray-900">
                    {formatBytes(user?.usage?.monthlyBandwidth || 0)} / {currentPlan.limits.bandwidth}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((user?.usage?.monthlyBandwidth || 0) / (parseInt(currentPlan.limits.bandwidth) * 1024 * 1024 * 1024) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Optimization Quality</span>
                  <span className="text-sm text-gray-900">{currentPlan.limits.quality}</span>
                </div>
                <div className="mt-2 flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="ml-1 text-sm text-gray-600">{currentPlan.limits.quality} quality</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subscription Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative bg-white rounded-lg border-2 p-6 ${
                  plan.popular 
                    ? 'border-blue-500 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="ml-3 text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {plan.id === user?.subscription?.plan ? (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? "primary" : "secondary"}
                      size="lg"
                      className="w-full"
                      onClick={() => startRazorpay(plan.id)}
                      loading={isLoading}
                    >
                      {plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Methods</h2>
            <div className="flex items-center space-x-4">
              <CreditCardIcon className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">No payment method added</p>
                <p className="text-xs text-gray-500">Add a payment method to upgrade your plan</p>
              </div>
              <Button variant="outline" size="sm">
                Add Payment Method
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Billing History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing History</h2>
            <div className="text-center py-8">
              <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No billing history available</p>
              <p className="text-sm text-gray-400 mt-1">Your billing history will appear here</p>
            </div>
          </div>
        </motion.div>
          </>
        )}
      </div>
    </Layout>
  );
} 