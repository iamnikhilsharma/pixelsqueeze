import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';

export default function CancellationRefundsPage() {
  return (
    <MarketingLayout>
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Cancellation & Refunds</h1>
          <p className="mt-2 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none mt-6">
            <h2>Subscriptions</h2>
            <p>Paid plans are billed in advance. You can cancel at any time from the Billing page. Your plan remains active until the end of the current billing period.</p>

            <h2>Refunds</h2>
            <p>If you believe you were charged in error, contact us within 7 days of the charge and we will review your request. Approved refunds are issued back to the original payment method.</p>

            <h2>Trials</h2>
            <p>For free plans and trials, charges are not applied. Upgrades take effect immediately.</p>

            <h2>How to cancel</h2>
            <p>Go to Billing in your dashboard to manage or cancel your subscription. You can also contact support for assistance.</p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
