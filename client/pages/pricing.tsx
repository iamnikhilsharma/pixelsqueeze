import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import { Button } from '@/components/Button';

export default function PricingPage() {
  const plans = [
    { id: 'free', name: 'Free', price: 0, features: ['100 images/mo', 'Basic optimization'] },
    { id: 'starter', name: 'Starter', price: 9, features: ['5,000 images/mo', 'Advanced optimization', 'API access'] },
    { id: 'pro', name: 'Pro', price: 29, features: ['20,000 images/mo', 'Premium optimization', 'Bulk processing'] },
  ];

  return (
    <MarketingLayout>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">Simple pricing</h1>
          <p className="mt-2 text-gray-600 text-center">Start free. Upgrade when you need more.</p>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.id} className={`rounded-2xl border p-6 bg-white ${p.id==='pro' ? 'border-primary-300 shadow-strong' : 'border-gray-200 shadow-soft'}`}>
                <div className="text-sm font-medium text-primary-700">{p.name}</div>
                <div className="mt-2 text-4xl font-extrabold text-gray-900">${p.price}<span className="text-base font-normal text-gray-500">/mo</span></div>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  {p.features.map((f) => (<li key={f}>✓ {f}</li>))}
                </ul>
                <div className="mt-6">
                  <Button href="/register" variant={p.id==='pro' ? 'primary' : 'secondary'} className="w-full">Get started</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
