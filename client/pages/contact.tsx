import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import { Button } from '@/components/Button';

export default function ContactPage() {
  return (
    <MarketingLayout>
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
          <p className="mt-2 text-gray-600">Have questions? We’d love to hear from you.</p>

          <form className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input className="mt-1 w-full border rounded px-3 py-2" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" className="mt-1 w-full border rounded px-3 py-2" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea className="mt-1 w-full border rounded px-3 py-2" rows={5} placeholder="How can we help?" />
            </div>
            <Button type="button" variant="primary">Send message</Button>
            <p className="text-xs text-gray-500">We typically respond within 1-2 business days.</p>
          </form>
        </div>
      </section>
    </MarketingLayout>
  );
}
