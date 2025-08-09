import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import { Button } from '@/components/Button';
import { motion } from 'framer-motion';
import BeforeAfter from '@/components/BeforeAfter';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        {/* Animated background shapes */}
        <motion.div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-200 blur-3xl opacity-50"
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary-200 blur-3xl opacity-50"
          animate={{ x: [0, -20, 0], y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <motion.div
            className="grid lg:grid-cols-2 gap-12 items-center"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
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
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              <div className="rounded-2xl shadow-strong ring-1 ring-black/5 bg-white p-4">
                <img src="/illustrations/hero.svg" alt="Preview" className="w-full" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Before/After comparison */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">See the difference instantly</h2>
              <p className="mt-2 text-gray-600">Drag the slider to compare original and optimized images. Maintain quality while reducing size.</p>
              <ul className="mt-6 space-y-2 text-gray-700 text-sm">
                <li>✓ High visual fidelity</li>
                <li>✓ Smaller files for faster loads</li>
                <li>✓ Best-in-class codecs and tuning</li>
              </ul>
            </div>
            <BeforeAfter beforeSrc="/illustrations/features.svg" afterSrc="/illustrations/hero.svg" height={320} />
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid lg:grid-cols-2 gap-10 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Built for performance</h2>
              <p className="mt-2 text-gray-600">Sharp + Imagemin pipeline, optimized for quality and speed. Batch processing, format conversion, and secure downloads out of the box.</p>
              <ul className="mt-6 space-y-3 text-gray-700">
                {['Batch optimize up to 20 images','Convert to WebP/AVIF/PNG/JPEG','Preserve or strip metadata','Watermark and thumbnails','Private, expiring downloads'].map((item, i) => (
                  <motion.li
                    key={item}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.05 * i }}
                  >
                    ✓ {item}
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6"><Button href="/features" variant="secondary">Explore features</Button></div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <img src="/illustrations/features.svg" alt="Features" className="w-full rounded-xl border border-gray-200" />
            </motion.div>
          </motion.div>
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
            ].map((s, i) => (
              <motion.div
                key={s.title}
                className="rounded-xl border border-gray-200 p-6 bg-white text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.08 * i }}
              >
                <div className="mx-auto h-10 w-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">✓</div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-gray-600">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Frequently asked questions</h2>
          <motion.div
            className="mt-8 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {[
              { q: 'Do you store my original images?', a: 'We only store optimized outputs temporarily for secure download. Originals are not stored.'},
              { q: 'Can I use the API?', a: 'Yes. Authenticate with your API key and use our REST endpoints or SDK.'},
              { q: 'Is there a free plan?', a: 'Yes, start free with 100 images/month. Upgrade anytime.'},
            ].map((f, i) => (
              <motion.div key={f.q} className="p-6" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.05 * i }}>
                <div className="font-medium text-gray-900">{f.q}</div>
                <div className="mt-1 text-gray-600 text-sm">{f.a}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 className="text-3xl font-bold text-gray-900" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>Ready to squeeze your images?</motion.h2>
          <motion.p className="mt-2 text-gray-600" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>Start free and optimize your first 100 images today.</motion.p>
          <motion.div className="mt-6" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}>
            <Button href="/register" variant="primary" size="lg">Create account</Button>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
