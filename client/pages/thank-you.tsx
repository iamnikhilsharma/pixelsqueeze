import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { CheckIcon, ArrowDownTrayIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

// Import shared pricing configuration
import { getPlanFeatures, getPlanLimits } from '../../shared/pricing.js';

export default function ThankYou() {
  const router = useRouter();
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get plan details from URL params
    const { plan, price, billing } = router.query;
    
    if (plan && price && billing) {
      setPlanDetails({
        plan: plan as string,
        price: Number(price),
        billing: billing as string,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    }
    
    setIsLoading(false);
  }, [router.query]);

  const downloadInvoice = async () => {
    try {
      const response = await fetch('/api/invoice/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan: planDetails?.plan,
          price: planDetails?.price,
          billing: planDetails?.billing,
          date: new Date().toISOString()
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixelsqueeze-invoice-${planDetails?.plan?.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  // Remove the hardcoded functions since we're using shared config
  // const getPlanFeatures = (planName: string) => { ... }
  // const getPlanLimits = (planName: string) => { ... }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!planDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Access</h1>
          <p className="text-gray-600 mb-6">This page is only accessible after a successful purchase.</p>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const planLimits = getPlanLimits(planDetails.plan) as {
    imagesPerMonth?: number;
    storage?: string;
    formats?: string[];
    support?: string;
  } || {};
  const planFeatures = getPlanFeatures(planDetails.plan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              {planDetails.plan}
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your subscription is now active! Here&apos;s everything you need to know about your new plan.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Plan Summary Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold text-primary-600">{planDetails.plan}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Billing</span>
                <span className="font-semibold">{planDetails.billing === 'annual' ? 'Annual' : 'Monthly'}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold">₹{planDetails.price}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Tax (18% GST)</span>
                <span className="font-semibold">₹{(planDetails.price * 0.18).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-lg font-bold text-gray-900">Total Paid</span>
                <span className="text-xl font-bold text-primary-600">₹{(planDetails.price * 1.18).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">Activated on {planDetails.date}</p>
            </div>
          </motion.div>

          {/* Plan Limits Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Limits</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Images per month</span>
                <span className="font-semibold text-primary-600">{planLimits.imagesPerMonth?.toLocaleString() || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Storage</span>
                <span className="font-semibold text-primary-600">{planLimits.storage || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">File formats</span>
                <span className="font-semibold text-primary-600">{Array.isArray(planLimits.formats) ? planLimits.formats.join(', ') : planLimits.formats || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Support level</span>
                <span className="font-semibold text-primary-600">{planLimits.support || 'N/A'}</span>
              </div>
            </div>
          </motion.div>

          {/* Next Steps Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h2>
            
            <div className="space-y-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={downloadInvoice}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download Invoice</span>
              </button>
              
              <button
                onClick={() => router.push('/images')}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Start Optimizing</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Plan Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            What&apos;s Included in Your {planDetails.plan} Plan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start space-x-3"
              >
                <CheckIcon className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Support Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl shadow-xl p-8 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Need Help Getting Started?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Our support team is here to help you make the most of your new plan.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/contact')}
              className="bg-white text-primary-500 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </button>
            
            <button
              onClick={() => router.push('/docs')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-500 transition-colors"
            >
              View Documentation
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
