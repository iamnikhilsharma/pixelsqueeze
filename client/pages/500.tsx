import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import Button from '@/components/Button';
import { motion } from 'framer-motion';

export default function InternalErrorPage() {
  return (
    <MarketingLayout>
      <section className="min-h-[70vh] flex items-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 h-16 w-16 text-2xl font-extrabold mb-4">500</div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Something went wrong</h1>
            <p className="mt-3 text-gray-600">We’re experiencing an unexpected error. Please try again, or return home.</p>
          </motion.div>

          <motion.div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <Button onClick={() => window.location.reload()} variant="primary" size="lg">Retry</Button>
            <Button href="/" variant="outline" size="lg">Back to Home</Button>
          </motion.div>

          <motion.p className="mt-6 text-xs text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>If the issue persists, please contact support.</motion.p>
        </div>
      </section>
    </MarketingLayout>
  );
}
