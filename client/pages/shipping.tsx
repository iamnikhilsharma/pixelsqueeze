import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';

export default function ShippingPage() {
  return (
    <MarketingLayout>
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Shipping Policy</h1>
          <p className="mt-2 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none mt-6">
            <p>PixelSqueeze is a digital service. No physical goods are shipped.</p>
            <h2>Delivery</h2>
            <p>Optimized images are delivered instantly via secure download links within your dashboard and API responses.</p>
            <h2>Support</h2>
            <p>If you have any issues accessing your downloads, please contact support.</p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
