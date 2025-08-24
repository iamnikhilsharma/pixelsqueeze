import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  CheckIcon, 
  StarIcon, 
  SparklesIcon, 
  BoltIcon, 
  UserGroupIcon, 
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { getAllPlans, calculateSavings, getPlanFeatures, getPlanLimits } from '../../shared/pricing';

export default function Pricing() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    setIsAnnual(billingCycle === 'annual');
  }, [billingCycle]);

  const plans = getAllPlans();
  const annualSavings = calculateSavings(selectedPlan, true);
  
  // Calculate plan limits map for comparison table
  const planLimitsMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    plans.forEach(p => {
      map[p.id] = getPlanLimits(p.name);
    });
    return map;
  }, [plans]);

  // Table rows definition
  const comparisonRows = [
    {
      feature: 'Images per month',
      key: 'imagesPerMonth',
      format: (v: any) => v ? v.toLocaleString() : '—'
    },
    {
      feature: 'Storage',
      key: 'storage',
      format: (v: any) => v || '—'
    },
    {
      feature: 'Formats',
      key: 'formats',
      format: (v: any) => Array.isArray(v) ? v.join(', ') : (v || '—')
    },
    {
      feature: 'Watermarking',
      key: 'watermarking',
      format: (v: any) => v === true ? '✓' : v === false ? '✗' : v
    },
    {
      feature: 'Analytics',
      key: 'analytics',
      format: (v: any) => v || '—'
    },
    {
      feature: 'API Access',
      key: 'apiAccess',
      format: (v: any) => v ? '✓' : '✗'
    },
    {
      feature: 'Support',
      key: 'support',
      format: (v: any) => v || '—'
    }
  ];

  return (
    <Layout title="Pricing - PixelSqueeze">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Simple,{' '}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Transparent
              </span>{' '}
              Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect plan for your image optimization needs. No hidden fees, no surprises.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-white rounded-full p-1 shadow-lg border border-gray-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                {annualSavings > 0 && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Save {annualSavings}%
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          ></div>
          <div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          ></div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
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

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-primary-600 mb-4">
                    ₹{billingCycle === 'annual' ? plan.price.annual : plan.price.monthly}
                    <span className="text-lg font-normal text-gray-500">
                      /{billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <ul className="text-left space-y-3 mb-8">
                    {getPlanFeatures(plan.id).slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={`/register?plan=${plan.id}&billing=${billingCycle}`}
                    className={`w-full inline-flex justify-center items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Compare Plans
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what&apos;s included in each plan to make the best choice for your needs.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Starter</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Pro</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparisonRows.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                      {['free','starter','pro','enterprise'].map(pid => (
                        <td key={pid} className="px-6 py-4 text-sm text-center text-gray-600">
                          {row.format(planLimitsMap[pid][row.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing and plans.
            </p>
          </div>

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
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users optimizing their images with PixelSqueeze.
          </p>
          <div
            className="space-x-4"
          >
            <Link href="/register" className="bg-white text-primary-500 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-block">
              Start Free Trial
            </Link>
            <Link href="/contact" className="border-2 border-white text-white hover:bg-white hover:text-primary-500 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-block">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
