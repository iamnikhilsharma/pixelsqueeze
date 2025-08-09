import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';

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
          <h1 className="text-3xl font-bold text-gray-900">Features</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">Everything you need to optimize images for fast, beautiful websites and apps.</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 p-6 bg-white">
                <div className="h-9 w-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">✓</div>
                <h3 className="mt-3 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
