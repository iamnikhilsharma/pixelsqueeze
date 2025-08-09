import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';

export default function HowItWorksPage() {
  const steps = [
    { title: '1. Sign up', desc: 'Create your free account to get started.' },
    { title: '2. Upload images', desc: 'Use the dashboard or API to upload images.' },
    { title: '3. Optimize & download', desc: 'We compress, convert, and let you securely download.' },
  ];

  return (
    <MarketingLayout>
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">How it works</h1>
          <div className="mt-10 grid gap-6">
            {steps.map((s) => (
              <div key={s.title} className="rounded-xl border border-gray-200 p-6 bg-white">
                <div className="text-primary-700 font-semibold">{s.title}</div>
                <p className="text-gray-600 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
