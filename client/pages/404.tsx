import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import Button from '@/components/Button';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <MarketingLayout>
      <section className="min-h-[70vh] flex items-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center justify-center rounded-full bg-primary-100 text-primary-700 h-16 w-16 text-2xl font-extrabold mb-4">404</div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Page not found</h1>
            <p className="mt-3 text-gray-600">The page you’re looking for doesn’t exist. It might have been moved or deleted.</p>
          </motion.div>

          <motion.div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <Button href="/" variant="primary" size="lg">Back to Home</Button>
            <Button href="/features" variant="outline" size="lg">Explore Features</Button>
          </motion.div>

          <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.6 }}>
            <img src="/illustrations/hero.svg" alt="Not found" className="mx-auto w-full max-w-xl rounded-xl border border-gray-200" />
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
