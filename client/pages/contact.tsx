import React, { useState } from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import Button from '@/components/Button';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactMethods = [
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
      ),
      title: 'Email Support',
      description: 'Get help with technical issues',
      contact: 'support@pixelsqueeze.com',
      action: 'mailto:support@pixelsqueeze.com'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Live Chat',
      description: 'Chat with our support team',
      contact: 'Available 24/7',
      action: '#'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Documentation',
      description: 'Browse our comprehensive guides',
      contact: 'Learn more',
      action: '/documentation'
    }
  ];

  const subjects = [
    'General Inquiry',
    'Technical Support',
    'Billing Question',
    'Feature Request',
    'Partnership',
    'Other'
  ];

  if (submitted) {
    return (
      <MarketingLayout title="Message Sent - PixelSqueeze">
        <section className="py-20">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8"
            >
              <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
            <h1 className="text-4xl font-bold text-surface-900 mb-4">Message Sent Successfully!</h1>
            <p className="text-xl text-surface-600 mb-8">Thank you for reaching out. We&apos;ll get back to you within 1-2 business days.</p>
            <Button href="/" variant="primary">Back to Home</Button>
          </div>
        </section>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout title="Contact Us - PixelSqueeze">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-green-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-surface-900 mb-6">
              Let&apos;s{' '}
              <span className="gradient-text">Connect</span>
            </h1>
            <p className="text-xl text-surface-600 max-w-3xl mx-auto leading-relaxed">
              Have questions about PixelSqueeze? Need help with image optimization? 
              Want to discuss enterprise solutions? We&apos;re here to help you succeed.
            </p>
          </motion.div>

          {/* Contact Methods Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-soft border border-surface-200/50 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-6 group-hover:bg-primary-200 transition-colors">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-surface-900 mb-3">{method.title}</h3>
                  <p className="text-surface-600 mb-4">{method.description}</p>
                  <div className="text-primary-600 font-medium">{method.contact}</div>
                  <Button 
                    href={method.action} 
                    variant="outline" 
                    className="mt-4 w-full"
                  >
                    {method.title === 'Documentation' ? 'Browse Docs' : 'Get Started'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-surface-900 mb-4">Send us a Message</h2>
            <p className="text-lg text-surface-600">
              Fill out the form below and we&apos;ll get back to you as soon as possible.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-surface-50 to-primary-50/30 rounded-3xl p-8 shadow-soft border border-surface-200/50"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="input-field w-full"
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="input-field w-full resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-surface-500">
                  We typically respond within 1-2 business days
                </p>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-green-50/30 via-white to-primary-50/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-surface-600">
              Quick answers to common questions about PixelSqueeze
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: 'How fast is your image optimization?',
                a: 'Our AI-powered optimization typically processes images in under 2 seconds, with batch processing handling thousands of images simultaneously.'
              },
              {
                q: 'What image formats do you support?',
                a: 'We support all major formats including JPEG, PNG, WebP, AVIF, and more. Our system automatically selects the best format for optimal compression.'
              },
              {
                q: 'Is there a limit on image size?',
                a: 'Free users can upload images up to 10MB, while paid plans support images up to 50MB. Contact us for enterprise solutions with larger file support.'
              },
              {
                q: 'Do you offer API access?',
                a: 'Yes! Starter and Pro plans include RESTful API access with comprehensive documentation and SDKs for popular programming languages.'
              }
            ].map((faq, index) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-soft border border-surface-200/50 hover:shadow-card-hover transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-surface-900 mb-3">{faq.q}</h3>
                <p className="text-surface-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
