import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import { Button } from '@/components/Button';

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Optimize images. <span className="text-primary-600">Ship faster.</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600 max-w-xl">
                PixelSqueeze compresses and converts your images without losing quality. Save bandwidth, boost performance, and delight your users.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/register" variant="primary" size="lg">Start free</Button>
                <Button href="/pricing" variant="outline" size="lg">See pricing</Button>
              </div>
              <div className="mt-6 flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex -space-x-2">
                  <img className="h-8 w-8 rounded-full ring-2 ring-white" src="/favicon.svg" alt="user" />
                  <img className="h-8 w-8 rounded-full ring-2 ring-white" src="/favicon.svg" alt="user" />
                  <img className="h-8 w-8 rounded-full ring-2 ring-white" src="/favicon.svg" alt="user" />
                </div>
                <span>Trusted by developers and teams</span>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl shadow-strong ring-1 ring-black/5 bg-white p-4">
                <img src="/logo.svg" alt="Preview" className="w-full" />
              </div>
              <div className="absolute -z-10 -top-10 -right-10 h-40 w-40 bg-primary-200 rounded-full blur-3xl opacity-70"/>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Blazing fast', desc: 'Sharp + Imagemin pipeline tuned for speed and quality.' },
              { title: 'Developer-first', desc: 'Clean REST API, SDK, and web dashboard.' },
              { title: 'Secure by default', desc: 'Private downloads, JWT auth, and rate limiting.' }
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 p-6 bg-white shadow-soft">
                <div className="h-10 w-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">✓</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Ready to squeeze your images?</h2>
          <p className="mt-2 text-gray-600">Start free and optimize your first 100 images today.</p>
          <div className="mt-6">
            <Button href="/register" variant="primary" size="lg">Create account</Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
