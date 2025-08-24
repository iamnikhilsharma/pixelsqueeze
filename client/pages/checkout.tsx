import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  CheckIcon, 
  CreditCardIcon, 
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { getAllPlans, getPlanFeatures, getPlanLimits } from '../../shared/pricing';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CheckoutForm = ({ plan, price, billing, onSuccess }: any) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    // Get user info from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setEmail(userData.email || '');
        setName(`${userData.firstName || ''} ${userData.lastName || ''}`.trim());
        setPhone(userData.phone || '');
      } catch (error) {
        setError('Error parsing user data');
      }
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    setIsProcessing(true);
    setError('');

    try {
      // Create order on your backend
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan,
          price,
          billing,
          email,
          name,
          phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount, // Amount in paise
        currency: data.currency,
        name: 'PixelSqueeze',
        description: `${plan} Plan - ${billing === 'annual' ? 'Annual' : 'Monthly'} Billing`,
        order_id: data.orderId,
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: '#6366f1'
        },
        handler: function (response: any) {
          // Payment successful
          onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="+91 98765 43210"
            required
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
      >
        {isProcessing ? 'Processing...' : `Pay ₹${price} Now`}
      </button>

      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <ShieldCheckIcon className="w-4 h-4" />
        <span>Your payment is secure and encrypted</span>
      </div>
    </form>
  );
};

export default function Checkout() {
  const router = useRouter();
  const [plan, setPlan] = useState('');
  const [price, setPrice] = useState(0);
  const [billing, setBilling] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login?redirect=checkout');
      return;
    }

    setIsLoggedIn(true);

    // Get plan details from URL params
    const { plan: urlPlan, price: urlPrice, billing: urlBilling } = router.query;
    if (urlPlan && urlPrice && urlBilling) {
      setPlan(urlPlan as string);
      setPrice(Number(urlPrice));
      setBilling(urlBilling as string);
    } else {
      router.push('/pricing');
    }
  }, [router.query]);

  const handlePaymentSuccess = async (paymentResponse: any) => {
    // Update user subscription on backend
    try {
      await fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan,
          billing,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpaySignature: paymentResponse.razorpay_signature
        })
      });
    } catch (error) {
      setError('Error updating subscription');
    }

    // Redirect to thank you page with plan details
    router.push(`/thank-you?plan=${plan}&price=${price}&billing=${billing}`);
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Your Purchase
          </h1>
          <p className="text-xl text-gray-600">
            You&apos;re just one step away from upgrading to the {plan} plan
          </p>
          <p className="text-sm text-gray-600 mb-4">
            You&apos;ll be redirected to Stripe to complete your payment securely.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <div>
                  <h3 className="font-semibold text-gray-900">{plan} Plan</h3>
                  <p className="text-sm text-gray-600">{billing === 'annual' ? 'Annual Billing' : 'Monthly Billing'}</p>
                </div>
                <span className="text-2xl font-bold text-primary-600">₹{price}</span>
              </div>
              
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{price}</span>
              </div>
              
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-gray-600">Tax (18% GST)</span>
                <span className="font-semibold">₹{(price * 0.18).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-6">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-primary-600">₹{(price * 1.18).toFixed(2)}</span>
              </div>
            </div>

            {/* Plan Features */}
            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 mb-4">What&apos;s included:</h3>
              <ul className="space-y-2">
                {plan === 'Starter' && (
                  <>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      Up to 5,000 images per month
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      Advanced compression
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      API access
                    </li>
                  </>
                )}
                {plan === 'Pro' && (
                  <>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      Up to 20,000 images per month
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      AI-powered optimization
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      Full analytics dashboard
                    </li>
                  </>
                )}
                {plan === 'Enterprise' && (
                  <>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      Up to 100,000 images per month
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      White-label options
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      Dedicated support
                    </li>
                  </>
                )}
              </ul>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>
            
            <CheckoutForm 
              plan={plan}
              price={price}
              billing={billing}
              onSuccess={handlePaymentSuccess}
            />

            {/* Security Badges */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>SSL Secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCardIcon className="w-4 h-4" />
                  <span>PCI Compliant</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
