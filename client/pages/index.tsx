import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingLayout from '../components/MarketingLayout';
import {
  LightningIcon,
  ShieldIcon,
  CloudIcon,
  ChartIcon,
  StarIcon,
  ArrowRightIcon,
  CheckIcon,
  UploadIcon,
  DownloadIcon,
  SparklesIcon,
  ZapIcon,
  GlobeIcon,
  UsersIcon,
  RocketIcon
} from '../components/icons';

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }
    setUploadedFiles(files);
  };

  const processImages = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      const mockResults = uploadedFiles.map((file, index) => ({
        name: file.name,
        originalSize: Math.floor(Math.random() * 5000) + 1000,
        optimizedSize: Math.floor(Math.random() * 2000) + 500,
        compression: Math.floor(Math.random() * 40) + 60,
        format: ['JPEG', 'PNG', 'WEBP'][Math.floor(Math.random() * 3)]
      }));
      setResults(mockResults);
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <MarketingLayout title="PixelSqueeze - AI-Powered Image Optimization">
      {/* Hero Section with Interactive Demo */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex justify-center mb-8"
            >
              <img 
                src="/logo.svg" 
                alt="PixelSqueeze" 
                className="h-24 w-auto"
              />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Transform Your Images with{' '}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Optimization
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Professional image compression, watermarking, and analysis tools for developers, designers, and businesses.
              Optimize your images without losing quality.
            </motion.p>
          </div>

          {/* Interactive Image Optimization Demo */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-5xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🚀 Try Our Image Optimizer
              </h2>
              <p className="text-gray-600 text-lg">
                Upload up to 10 images and see the magic happen in real-time!
              </p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-primary-200 rounded-2xl p-8 text-center mb-8 hover:border-primary-300 transition-colors">
              <UploadIcon className="w-16 h-16 text-primary-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-4">
                Drag & drop images here or click to browse
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold cursor-pointer transition-colors inline-block"
              >
                Choose Images
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Maximum 10 images • Supports JPEG, PNG, WEBP
              </p>
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Selected Images ({uploadedFiles.length}/10)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-lg p-4 flex items-center space-x-3"
                    >
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-primary-600 font-semibold text-sm">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="text-center mt-6">
                  <button
                    onClick={processImages}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <ZapIcon className="w-5 h-5 mr-2" />
                        Optimize Images
                      </div>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  🎉 Optimization Complete!
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {result.name}
                        </span>
                        <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                          {result.format}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Original:</span>
                          <span className="font-medium">{(result.originalSize / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Optimized:</span>
                          <span className="font-medium text-primary-600">{(result.optimizedSize / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Saved:</span>
                          <span className="font-medium text-green-600">
                            {result.compression}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="text-center mt-6">
                  <Link href="/register" className="bg-white text-primary-600 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold transition-colors inline-flex items-center">
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Get Full Access
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          ></motion.div>
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          ></motion.div>
          <motion.div 
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 3, 0]
            }}
            transition={{ 
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
            className="absolute top-40 left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          ></motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Image Optimization
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From basic compression to advanced AI-powered analysis, we've got you covered.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LightningIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Optimize images in seconds with our high-performance processing engine.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-secondary-50 to-secondary-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your images are processed securely and never stored permanently.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CloudIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cloud-Powered</h3>
              <p className="text-gray-600">Access your optimized images from anywhere with cloud storage.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-light-50 to-light-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-light-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">Get detailed insights into your image optimization performance.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Thousands Worldwide
            </h2>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Join the community of developers, designers, and businesses optimizing their images.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-white mb-2">10M+</div>
              <div className="text-primary-100">Images Optimized</div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-primary-100">Happy Users</div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-primary-100">Uptime</div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-primary-100">Support</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, fast, and powerful image optimization in just three steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center relative"
            >
              <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Images</h3>
              <p className="text-gray-600">Drag & drop your images or select them from your device. Support for JPEG, PNG, and WEBP formats.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center relative"
            >
              <div className="w-20 h-20 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Processing</h3>
              <p className="text-gray-600">Our advanced AI algorithms analyze and optimize your images while maintaining quality.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center relative"
            >
              <div className="w-20 h-20 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Download Results</h3>
              <p className="text-gray-600">Get your optimized images instantly. Download individually or as a batch.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Try Basic Optimization Demo Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Try Basic Optimization
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the power of our image optimization with our free demo.
              No registration required for basic features.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Basic Plan Features
                </h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-primary-500 mr-3" />
                    <span>Up to 10 images per month</span>
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-primary-500 mr-3" />
                    <span>Basic compression</span>
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-primary-500 mr-3" />
                    <span>Standard formats (JPEG, PNG)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-primary-500 mr-3" />
                    <span>Community support</span>
                  </li>
                </ul>
                <Link href="/register" className="btn-primary inline-flex items-center">
                  Get Started Free
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="w-16 h-16 text-white" />
                </div>
                <p className="text-gray-600">
                  Start optimizing your images today with our free tier!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Ready to Optimize Your Images?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of developers and designers who trust PixelSqueeze for their image optimization needs.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link href="/register" className="bg-white text-primary-500 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-flex items-center">
              Start Optimizing Now
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
