import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import { Button } from '@/components/Button';

export default function HowItWorksPage() {
  const steps = [
    { title: '1. Sign up', desc: 'Create your free account to get started.' },
    { title: '2. Upload images', desc: 'Use the dashboard or API to upload images.' },
    { title: '3. Optimize & download', desc: 'We compress, convert, and let you securely download.' },
  ];

  return (
    <MarketingLayout>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">How it works</h1>
              <p className="mt-2 text-gray-600">From upload to optimized output in a few clicks.</p>
              <div className="mt-6 space-y-4">
                {steps.map((s) => (
                  <div key={s.title} className="rounded-xl border border-gray-200 p-4 bg-white">
                    <div className="text-primary-700 font-semibold">{s.title}</div>
                    <p className="text-gray-600 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6"><Button href="/register" variant="primary">Get started</Button></div>
            </div>
            <div>
              <img src="/illustrations/hero.svg" alt="Workflow" className="w-full rounded-xl border border-gray-200" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-primary-50/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Automate with the API</h2>
          <p className="mt-2 text-gray-600">Use our REST endpoints and JavaScript SDK to integrate optimization into your CI/CD or app flows.</p>
        </div>
      </section>
    </MarketingLayout>
  );
}
