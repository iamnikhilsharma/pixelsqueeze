import React from 'react';
import Link from 'next/link';
import MarketingLayout from '../components/MarketingLayout';
import { 
  LightningIcon, 
  ShieldIcon, 
  CloudIcon, 
  ChartIcon, 
  StarIcon,
  ArrowRightIcon,
  CheckIcon
} from '../components/icons';

export default function Home() {
  return (
    <MarketingLayout title="PixelSqueeze - AI-Powered Image Optimization">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src="/logo.svg" 
                alt="PixelSqueeze" 
                className="h-24 w-auto"
              />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Images with{' '}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Optimization
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional image compression, watermarking, and analysis tools for developers, designers, and businesses. 
              Optimize your images without losing quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-4">
                Get Started Free
              </Link>
              <Link href="/features" className="btn-secondary text-lg px-8 py-4">
                View Features
              </Link>
            </div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Image Optimization
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From basic compression to advanced AI-powered analysis, we've got you covered.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <LightningIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Optimize images in seconds with our high-performance processing engine.</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your images are processed securely and never stored permanently.</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CloudIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cloud-Powered</h3>
              <p className="text-gray-600">Access your optimized images from anywhere with cloud storage.</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">Get detailed insights into your image optimization performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Try Basic Optimization Demo Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Try Basic Optimization
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the power of our image optimization with our free demo. 
              No registration required for basic features.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Basic Plan Features
                </h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                    <span>Up to 10 images per month</span>
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                    <span>Basic compression</span>
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                    <span>Standard formats (JPEG, PNG)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                    <span>Community support</span>
                  </li>
                </ul>
                <Link href="/register" className="btn-primary inline-flex items-center">
                  Get Started Free
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </div>
              
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="w-16 h-16 text-white" />
                </div>
                <p className="text-gray-600">
                  Start optimizing your images today with our free tier!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Optimize Your Images?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers and designers who trust PixelSqueeze for their image optimization needs.
          </p>
          <Link href="/register" className="bg-white text-primary-500 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-flex items-center">
            Start Optimizing Now
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
