import React from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  Square3Stack3DIcon, 
  EyeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import Link from 'next/link';

export default function AdvancedTools() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">Please sign in to access advanced tools.</p>
            <Link href="/login" className="btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const tools = [
    {
      id: 'watermarking',
      name: 'Watermarking System',
      description: 'Add professional watermarks to your images with customizable text, logos, and positioning.',
      status: 'available',
      icon: <DocumentTextIcon className="w-8 h-8" />,
      features: [
        'Text and logo watermarks',
        'Custom positioning and opacity',
        'Batch processing support',
        'Multiple output formats'
      ],
      href: '/watermark'
    },
    {
      id: 'thumbnail-generation',
      name: 'Thumbnail Generation',
      description: 'Generate multiple thumbnail sizes and formats for responsive web design and social media.',
      status: 'available',
      icon: <Square3Stack3DIcon className="w-8 h-8" />,
      features: [
        'Multiple preset sizes',
        'Custom dimensions',
        'Batch processing',
        'ZIP download option'
      ],
      href: '/thumbnails'
    },
    {
      id: 'image-analysis',
      name: 'Image Analysis',
      description: 'Get detailed insights about your images including color analysis, metadata, and quality assessment.',
      status: 'available',
      icon: <EyeIcon className="w-8 h-8" />,
      features: [
        'Color palette analysis',
        'Metadata extraction',
        'Quality assessment',
        'Optimization recommendations'
      ],
      href: '/image-analysis'
    }
  ];

  return (
    <Layout title="Advanced Tools - PixelSqueeze">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/logo.svg" 
              alt="PixelSqueeze" 
              className="h-16 w-auto mr-4"
            />
            <h1 className="text-4xl font-bold text-gray-900">Advanced Tools</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional-grade image processing tools for developers, designers, and businesses. 
            Transform your workflow with our advanced features.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <div key={tool.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-8">
                {/* Tool Header */}
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center mr-4">
                    <div className="text-primary-500">
                      {tool.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{tool.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tool.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tool.status === 'available' ? 'Available' : 'Coming Soon'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {tool.description}
                </p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Features</h4>
                  <ul className="space-y-2">
                    {tool.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                {tool.status === 'available' ? (
                  <Link
                    href={tool.href}
                    className="w-full btn-primary inline-flex items-center justify-center"
                  >
                    Open {tool.name}
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need More Power?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Upgrade to our Pro or Enterprise plans to unlock unlimited processing, 
              advanced analytics, API access, and priority support.
            </p>
            <Link href="/pricing" className="btn-secondary inline-flex items-center">
              View Pricing Plans
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 