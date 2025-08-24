import React from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { 
  CheckIcon, 
  BoltIcon, 
  GlobeAltIcon, 
  UserGroupIcon, 
  SparklesIcon,
  ShieldCheckIcon,
  CloudIcon,
  ChartBarIcon,
  CameraIcon,
  PaintBrushIcon,
  CodeBracketIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

export default function Features() {
  const features = [
    {
      icon: <BoltIcon className="w-8 h-8" />,
      title: "Lightning Fast Processing",
      description: "Optimize images in seconds with our high-performance engine",
      benefits: ["Sub-second processing", "Batch optimization", "Real-time preview"]
    },
    {
      icon: <ShieldCheckIcon className="w-8 h-8" />,
      title: "Enterprise Security",
      description: "Bank-level security with end-to-end encryption",
      benefits: ["256-bit encryption", "GDPR compliant", "SOC 2 certified"]
    },
    {
      icon: <CloudIcon className="w-8 h-8" />,
      title: "Cloud-Native Architecture",
      description: "Built for scale with global CDN distribution",
      benefits: ["99.9% uptime", "Global edge locations", "Auto-scaling"]
    },
    {
      icon: <ChartBarIcon className="w-8 h-8" />,
      title: "Advanced Analytics",
      description: "Deep insights into your optimization performance",
      benefits: ["Real-time metrics", "Custom reports", "Performance tracking"]
    }
  ];

  const advancedFeatures = [
    {
      icon: <CameraIcon className="w-8 h-8" />,
      title: "AI-Powered Analysis",
      description: "Intelligent image analysis and optimization recommendations",
      color: "from-primary-500 to-primary-600"
    },
    {
      icon: <PaintBrushIcon className="w-8 h-8" />,
      title: "Smart Watermarking",
      description: "Professional watermarking with AI positioning",
      color: "from-secondary-500 to-secondary-600"
    },
    {
      icon: <CodeBracketIcon className="w-8 h-8" />,
      title: "Developer API",
      description: "RESTful API with comprehensive documentation",
      color: "from-accent-500 to-accent-600"
    },
    {
      icon: <LockClosedIcon className="w-8 h-8" />,
      title: "Batch Processing",
      description: "Process thousands of images simultaneously",
      color: "from-light-500 to-light-600"
    }
  ];

  return (
    <Layout title="Features - PixelSqueeze">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Powerful Features for{' '}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Modern Teams
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the comprehensive toolkit that makes PixelSqueeze the go-to solution for image optimization.
            </p>
          </div>
        </div>

        {/* Background Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Core Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to optimize images at scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mb-6 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-gray-700">
                      <CheckIcon className="w-5 h-5 text-primary-500 mr-3" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-20 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Advanced Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Take your image optimization to the next level
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advancedFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4 text-white`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Leveraging cutting-edge tools and frameworks for optimal performance
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "WebAssembly", description: "Near-native performance" },
              { name: "AI/ML", description: "Intelligent optimization" },
              { name: "Cloud Native", description: "Scalable infrastructure" },
              { name: "Real-time", description: "Instant processing" }
            ].map((tech, index) => (
              <div
                key={index}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tech.name}</h3>
                <p className="text-gray-600 text-sm">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Start optimizing your images today with our powerful feature set.
          </p>
          <div
            className="space-x-4"
          >
            <Link href="/register" className="bg-white text-primary-500 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-block">
              Get Started Free
            </Link>
            <Link href="/pricing" className="border-2 border-white text-white hover:bg-white hover:text-primary-500 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-block">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
