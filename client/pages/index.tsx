import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import { Button } from '@/components/Button';

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
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
                <img src="/illustrations/hero.svg" alt="Preview" className="w-full" />
              </div>
              <div className="absolute -z-10 -top-10 -right-10 h-40 w-40 bg-primary-200 rounded-full blur-3xl opacity-70"/>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>Works great with your favorite stack</p>
          <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-6 opacity-70">
            {["Next.js","Express","MongoDB","Stripe","Vercel","Render"].map(n => (
              <div key={n} className="text-sm">{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Built for performance</h2>
              <p className="mt-2 text-gray-600">Sharp + Imagemin pipeline, optimized for quality and speed. Batch processing, format conversion, and secure downloads out of the box.</p>
              <ul className="mt-6 space-y-3 text-gray-700">
                <li>✓ Batch optimize up to 20 images</li>
                <li>✓ Convert to WebP/AVIF/PNG/JPEG</li>
                <li>✓ Preserve or strip metadata</li>
                <li>✓ Watermark and thumbnails</li>
                <li>✓ Private, expiring downloads</li>
              </ul>
              <div className="mt-6"><Button href="/features" variant="secondary">Explore features</Button></div>
            </div>
            <div>
              <img src="/illustrations/features.svg" alt="Features" className="w-full rounded-xl border border-gray-200" />
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 bg-primary-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">How it works</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { title: 'Sign up', desc: 'Create your account in seconds.' },
              { title: 'Upload', desc: 'Use the dashboard or API to upload.' },
              { title: 'Optimize', desc: 'Download optimized images securely.' },
            ].map((s) => (
              <div key={s.title} className="rounded-xl border border-gray-200 p-6 bg-white text-center">
                <div className="mx-auto h-10 w-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">✓</div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Frequently asked questions</h2>
          <div className="mt-8 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
            {[
              { q: 'Do you store my original images?', a: 'We only store optimized outputs temporarily for secure download. Originals are not stored.'},
              { q: 'Can I use the API?', a: 'Yes. Authenticate with your API key and use our REST endpoints or SDK.'},
              { q: 'Is there a free plan?', a: 'Yes, start free with 100 images/month. Upgrade anytime.'},
            ].map((f) => (
              <div key={f.q} className="p-6">
                <div className="font-medium text-gray-900">{f.q}</div>
                <div className="mt-1 text-gray-600 text-sm">{f.a}</div>
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
