import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import { Button } from '@/components/Button';

export default function FeaturesPage() {
  const features = [
    { title: 'Batch optimization', detail: 'Upload multiple images and track progress in real time.' },
    { title: 'Format conversion', detail: 'Convert to WebP/AVIF/PNG/JPEG automatically.' },
    { title: 'Metadata control', detail: 'Preserve or strip EXIF/IPTC/XMP with one click.' },
    { title: 'Watermark & thumbnails', detail: 'Add watermarks and generate responsive thumbs.' },
    { title: 'Secure downloads', detail: 'Private, expiring, and user-scoped downloads.' },
    { title: 'API + SDK', detail: 'Automate via REST and the JavaScript SDK.' },
  ];

  return (
    <MarketingLayout>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Features</h1>
              <p className="mt-2 text-gray-600 max-w-2xl">Everything you need to optimize images for fast, beautiful websites and apps.</p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-4">
                {features.map((f) => (
                  <li key={f.title} className="rounded-xl border border-gray-200 p-4 bg-white">
                    <div className="h-8 w-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">✓</div>
                    <h3 className="mt-2 font-semibold text-gray-900">{f.title}</h3>
                    <p className="text-sm text-gray-600">{f.detail}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-6"><Button href="/register" variant="primary">Start free</Button></div>
            </div>
            <div>
              <img src="/illustrations/features.svg" alt="Features" className="w-full rounded-xl border border-gray-200" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-primary-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">Why PixelSqueeze?</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {[
              { t: 'Speed', d: 'Optimized pipeline for fast processing and delivery.'},
              { t: 'Reliability', d: 'Secure downloads and robust error handling.'},
              { t: 'Developer Experience', d: 'Clean API, docs, and examples.'},
            ].map((i) => (
              <div key={i.t} className="rounded-xl border border-gray-200 p-6 bg-white">
                <div className="h-8 w-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">✓</div>
                <div className="mt-2 font-semibold text-gray-900">{i.t}</div>
                <div className="text-sm text-gray-600">{i.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
