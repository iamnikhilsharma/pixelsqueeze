import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MarketingLayout from '../components/MarketingLayout';
import {
  CheckIcon,
  StarIcon,
  SparklesIcon,
  ZapIcon,
  UsersIcon,
  GlobeIcon
} from '../components/icons';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, annual: 0 },
      description: "Perfect for getting started",
      features: [
        "Up to 10 images per month",
        "Basic compression",
        "Standard formats (JPEG, PNG)",
        "Community support",
        "1GB storage"
      ],
      cta: "Get Started Free",
      popular: false,
      color: "from-gray-500 to-gray-600"
    },
    {
      name: "Pro",
      price: { monthly: 19, annual: 190 },
      description: "For professionals and small teams",
      features: [
        "Up to 1,000 images per month",
        "Advanced compression",
        "All formats (WebP, AVIF)",
        "Priority support",
        "10GB storage",
        "Watermarking",
        "Thumbnail generation",
        "Basic analytics"
      ],
      cta: "Start Pro Trial",
      popular: true,
      color: "from-primary-500 to-secondary-500"
    },
    {
      name: "Enterprise",
      price: { monthly: 99, annual: 990 },
      description: "For large teams and businesses",
      features: [
        "Unlimited images",
        "AI-powered optimization",
        "Custom formats",
        "24/7 phone support",
        "Unlimited storage",
        "Advanced watermarking",
        "Batch processing",
        "Full analytics dashboard",
        "API access",
        "Custom integrations",
        "White-label options"
      ],
      cta: "Contact Sales",
      popular: false,
      color: "from-accent-500 to-light-500"
    }
  ];

  const savings = plans.map(plan => ({
    ...plan,
    savings: isAnnual ? Math.round((plan.price.monthly * 12 - plan.price.annual) / (plan.price.monthly * 12) * 100) : 0
  }));

  return (
    <MarketingLayout title="Pricing - PixelSqueeze">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Simple, Transparent{' '}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your needs. All plans include our core optimization features.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center items-center space-x-4 mb-12"
          >
            <span className={`text-lg ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <motion.span
                layout
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                  isAnnual ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
              {isAnnual && (
                <span className="ml-2 inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Save up to 20%
                </span>
              )}
            </span>
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          ></motion.div>
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          ></motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {savings.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular 
                    ? 'ring-2 ring-primary-500 shadow-2xl scale-105' 
                    : 'border border-gray-200 shadow-lg'
                } bg-white hover:shadow-xl transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="text-gray-500 ml-2">
                        /{isAnnual ? 'year' : 'month'}
                      </span>
                    )}
                  </div>

                  {plan.savings > 0 && (
                    <div className="text-green-600 text-sm font-medium">
                      Save {plan.savings}% with annual billing
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckIcon className="w-5 h-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 transform hover:scale-105'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Compare Plans
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what's included in each plan to make the best choice for your needs.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Pro</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { feature: "Images per month", free: "10", pro: "1,000", enterprise: "Unlimited" },
                    { feature: "Storage", free: "1GB", pro: "10GB", enterprise: "Unlimited" },
                    { feature: "Formats", free: "JPEG, PNG", pro: "All formats", enterprise: "All + Custom" },
                    { feature: "Watermarking", free: "✗", pro: "✓", enterprise: "Advanced" },
                    { feature: "Analytics", free: "Basic", pro: "Standard", enterprise: "Full dashboard" },
                    { feature: "API Access", free: "✗", pro: "✗", enterprise: "✓" },
                    { feature: "Support", free: "Community", pro: "Priority", enterprise: "24/7 Phone" }
                  ].map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{row.free}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{row.pro}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing and plans.
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                question: "Can I change my plan at any time?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                question: "Is there a free trial?",
                answer: "Yes, all paid plans come with a 14-day free trial. No credit card required to start."
              },
              {
                question: "What happens if I exceed my monthly limit?",
                answer: "You'll receive a notification when you're close to your limit. You can upgrade your plan or wait until next month."
              },
              {
                question: "Do you offer refunds?",
                answer: "We offer a 30-day money-back guarantee for all paid plans."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of users optimizing their images with PixelSqueeze.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-x-4"
          >
            <a href="/register" className="bg-white text-primary-500 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-block">
              Start Free Trial
            </a>
            <a href="/contact" className="border-2 border-white text-white hover:bg-white hover:text-primary-500 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-block">
              Contact Sales
            </a>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
