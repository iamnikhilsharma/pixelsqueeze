import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none prose-green mt-6">
            <p>
              We respect your privacy. This Privacy Policy explains how PixelSqueeze collects, uses, and protects your information.
            </p>
            <h2>Information We Collect</h2>
            <ul>
              <li>Account information: name, email, company</li>
              <li>Usage data: optimization counts, bandwidth</li>
              <li>Technical data: device, browser, IP</li>
            </ul>
            <h2>How We Use Information</h2>
            <ul>
              <li>To provide and improve our services</li>
              <li>To secure your account and enforce policies</li>
              <li>To communicate updates and support</li>
            </ul>
            <h2>Data Retention and Security</h2>
            <p>We retain data as long as necessary and apply industry-standard security controls.</p>
            <h2>Your Rights</h2>
            <p>You can request access, correction, or deletion of your personal data by contacting support.</p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
