import React from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import Button from '@/components/Button';
import { motion } from 'framer-motion';
import BeforeAfter from '@/components/BeforeAfter';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Enhanced Hero Section */}
      <section className="hero-section">
        {/* Animated background elements */}
        <motion.div
          className="hero-bg-element -top-24 -left-24 h-72 w-72 bg-accent-500/20"
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="hero-bg-element -bottom-24 -right-24 h-72 w-72 bg-primary-500/20"
          animate={{ x: [0, -20, 0], y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <div className="hero-content">
          <motion.div
            className="grid lg:grid-cols-2 gap-16 items-center"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="badge-primary text-sm font-medium mb-6 inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                AI-Powered Image Compression
              </motion.div>
              
              <h1 className="text-hero text-surface-900 leading-tight">
                Optimize images.{' '}
                <span className="gradient-text">Ship faster.</span>
              </h1>
              
              <p className="mt-6 text-xl text-surface-600 max-w-2xl leading-relaxed">
                PixelSqueeze compresses and converts your images without losing quality. Save bandwidth, boost performance, and delight your users with lightning-fast image delivery.
              </p>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <Button href="/register" variant="primary" size="lg">
                  Start Free Trial
                </Button>
                <Button href="/pricing" variant="outline" size="lg">
                  View Pricing
                </Button>
              </div>
              
              <div className="mt-8 flex items-center space-x-4 text-sm text-surface-600">
                <div className="flex -space-x-2">
                  <img className="h-8 w-8 rounded-full ring-2 ring-white shadow-soft" src="/favicon.svg" alt="user" />
                  <img className="h-8 w-8 rounded-full ring-2 ring-white shadow-soft" src="/favicon.svg" alt="user" />
                  <img className="h-8 w-8 rounded-full ring-2 ring-white shadow-soft" src="/favicon.svg" alt="user" />
                </div>
                <span className="font-medium">Trusted by 10,000+ developers</span>
              </div>
            </div>
            
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-mountain rounded-3xl blur-xl opacity-30"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl ring-1 ring-surface-200/50 p-8">
                  <img src="/illustrations/hero.svg" alt="AI Image Compression Preview" className="w-full h-auto" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Before/After Comparison */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-display text-surface-900 mb-4">
              See the difference instantly
            </h2>
            <p className="text-xl text-surface-600 max-w-3xl mx-auto">
              Drag the slider to compare original and optimized images. Maintain quality while reducing size dramatically.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-surface-700 font-medium">High visual fidelity maintained</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-surface-700 font-medium">Up to 80% file size reduction</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-surface-700 font-medium">Best-in-class AI algorithms</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-surface-700 font-medium">Multiple format support</span>
              </div>
            </div>
            
            <div className="relative">
              <BeforeAfter beforeSrc="/illustrations/features.svg" afterSrc="/illustrations/hero.svg" height={400} />
            </div>
          </div>
        </div>
      </section>

      {/* Try Basic Optimization Demo Section */}
      <section className="py-20 bg-gradient-to-br from-green-50/30 via-white to-primary-50/30">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-display text-surface-900 mb-4">
              Try Basic Optimization
            </h2>
            <p className="text-xl text-surface-600 max-w-3xl mx-auto">
              Experience the power of our AI-powered image compression. Upload an image and see the magic happen in real-time!
            </p>
            <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-surface-500">
              <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free • No registration required • 10MB max file size</span>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-soft border border-surface-200/50 p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-surface-900 mb-2">Basic Image Optimization</h3>
                <p className="text-surface-600">Perfect for testing our compression quality</p>
              </div>
              
              <div className="space-y-6">
                <div className="border-2 border-dashed border-surface-300 rounded-2xl p-8 text-center hover:border-primary-400 transition-colors">
                  <svg className="w-16 h-16 text-surface-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-lg font-semibold text-surface-900 mb-2">Drag & Drop Your Image</h4>
                  <p className="text-surface-600 mb-4">or click to browse files</p>
                  <Button href="/register" variant="primary" size="lg">
                    Start Optimizing Now
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="bg-surface-50 rounded-xl p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h5 className="font-semibold text-surface-900 mb-1">AI-Powered</h5>
                    <p className="text-sm text-surface-600">Smart compression algorithms</p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h5 className="font-semibold text-surface-900 mb-1">Fast Processing</h5>
                    <p className="text-sm text-surface-600">Under 2 seconds</p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h5 className="font-semibold text-surface-900 mb-1">Multiple Formats</h5>
                    <p className="text-sm text-surface-600">JPEG, PNG, WebP, AVIF</p>
                  </div>
                </div>
                
                <div className="text-center pt-4">
                  <p className="text-surface-600 mb-4">
                    Want to unlock advanced features like batch processing, API access, and unlimited optimization?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button href="/pricing" variant="outline">
                      View All Plans
                    </Button>
                    <Button href="/register" variant="primary">
                      Start Free Trial
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Grid */}
      <section className="py-20 bg-gradient-surface">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-display text-surface-900 mb-4">
              Built for performance
            </h2>
            <p className="text-xl text-surface-600 max-w-3xl mx-auto">
              Everything you need to optimize images at scale, with enterprise-grade reliability and lightning-fast processing.
            </p>
          </div>
          
          <div className="grid-features">
            {[
              {
                title: "AI-Powered Compression",
                description: "Advanced machine learning algorithms that understand image content and optimize accordingly.",
                icon: (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                )
              },
              {
                title: "Batch Processing",
                description: "Process thousands of images simultaneously with our powerful batch optimization engine.",
                icon: (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                )
              },
              {
                title: "Multiple Formats",
                description: "Support for WebP, AVIF, JPEG, PNG, and more with automatic format selection.",
                icon: (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                )
              },
              {
                title: "API Integration",
                description: "RESTful API with comprehensive documentation for seamless integration.",
                icon: (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )
              },
              {
                title: "Real-time Analytics",
                description: "Track compression ratios, bandwidth savings, and performance metrics.",
                icon: (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                )
              },
              {
                title: "Enterprise Security",
                description: "SOC 2 compliant with enterprise-grade security and privacy controls.",
                icon: (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="feature-card"
              >
                <div className="feature-icon text-primary-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-surface-900 mb-3 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-surface-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="text-display text-white mb-6">
            Ready to optimize your images?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of developers who trust PixelSqueeze for their image optimization needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/register" variant="secondary" size="lg">
              Start Free Trial
            </Button>
            <Button href="/documentation" variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-green-700">
              View Documentation
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
