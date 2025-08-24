import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';

export default function TermsPage() {
  return (
    <MarketingLayout>
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="mt-2 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none prose-green mt-6">
            <h2>1. Acceptance of Terms</h2>
            <p>By creating an account or using PixelSqueeze, you agree to these Terms.</p>
            <h2>2. Use of Service</h2>
            <ul>
              <li>You must not misuse the service or attempt to disrupt it.</li>
              <li>You are responsible for content you upload.</li>
            </ul>
            <h2>3. Accounts</h2>
            <p>Maintain the confidentiality of your credentials. You are responsible for activities under your account.</p>
            <h2>4. Billing</h2>
            <p>Paid plans are billed per subscription terms. Taxes may apply. See Billing page for details.</p>
            <h2>5. Termination</h2>
            <p>We may suspend or terminate accounts for violations. You may cancel at any time.</p>
            <h2>6. Limitation of Liability</h2>
            <p>PixelSqueeze is provided &quot;as is&quot;. To the fullest extent permitted by law, we are not liable for indirect damages.</p>
            <h2>7. Changes</h2>
            <p>We may update these Terms. Continued use signifies acceptance of changes.</p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
