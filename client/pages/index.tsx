import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MarketingLayout from '../components/MarketingLayout';
import { useAuthStore } from '../store/authStore';
import { buildApiUrl } from '../utils/formatters';
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
  const { user, token } = useAuthStore();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setError(null);
    
    // Validate file count
    if (files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Only JPEG, PNG, and WebP are supported.`);
      return;
    }

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 10MB per file.`);
      return;
    }

    setUploadedFiles(files);
  };

  const processImages = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const processedResults = [];
      
      // Process images one by one for better UX
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        try {
          if (user && token) {
            // Authenticated users: call real API
            const formData = new FormData();
            formData.append('image', file);
            formData.append('quality', '80');
            formData.append('format', 'auto');
            formData.append('preserveMetadata', 'false');

            const response = await fetch(buildApiUrl('optimize'), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });

            if (response.ok) {
              const data = await response.json();
              processedResults.push({
                name: file.name,
                originalSize: file.size,
                optimizedSize: data.data.optimizedSize,
                compression: Math.round(data.data.compressionRatio),
                format: data.data.format.toUpperCase(),
                processingTime: data.data.processingTime,
                downloadUrl: data.data.downloadUrl,
                id: `opt_${Date.now()}_${i}`,
                expiresAt: data.data.expiresAt
              });
            } else {
              // Fallback to demo data if API fails
              processedResults.push(createDemoResult(file, i));
            }
          } else {
            // Guest users: use demo data with realistic processing simulation
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700)); // 0.3-1s delay
            processedResults.push(createDemoResult(file, i));
          }
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          processedResults.push(createDemoResult(file, i, true));
        }
      }
      
      setResults(processedResults);
      setIsProcessing(false);
      
      // Increment usage count for logged-in users
      if (user && token) {
        setUsageCount(prev => prev + uploadedFiles.length);
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process images. Please try again.');
      setIsProcessing(false);
    }
  };

  // Helper function for demo/fallback results
  const createDemoResult = (file: File, index: number, hasError = false) => {
    const compressionRatio = hasError ? 0 : 0.6 + Math.random() * 0.3; // 60-90% of original
    return {
      name: file.name,
      originalSize: file.size,
      optimizedSize: hasError ? file.size : Math.floor(file.size * compressionRatio),
      compression: hasError ? 0 : Math.floor((1 - compressionRatio) * 100),
      format: file.name.toLowerCase().endsWith('.webp') ? 'WEBP' : 
              file.name.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG',
      processingTime: Math.floor(Math.random() * 2000) + 500, // 0.5-2.5s
      id: `demo_${Date.now()}_${index}`,
      isDemo: !hasError,
      hasError
    };
  };

  const downloadOptimizedImage = (result: any) => {
    if (!user || !token) {
      setError('Please log in to download optimized images');
      return;
    }

    // If this is a real optimized image with download URL
    if (result.downloadUrl && !result.isDemo) {
      try {
        // Create download link for real optimized image
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = `optimized_${result.name}`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      } catch (error) {
        console.error('Download error:', error);
        setError('Failed to download image. Please try again.');
        return;
      }
    }

    // Fallback: Create a demo optimized image blob
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a simple placeholder image
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#6b7280';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Demo Optimized Image', 400, 280);
      ctx.fillText(`${result.compression}% compression`, 400, 320);
      ctx.font = '16px Arial';
      ctx.fillText(`Original: ${(result.originalSize / 1024).toFixed(1)} KB`, 400, 360);
      ctx.fillText(`Optimized: ${(result.optimizedSize / 1024).toFixed(1)} KB`, 400, 380);
    }

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `demo_optimized_${result.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  const clearResults = () => {
    setResults([]);
    setUploadedFiles([]);
    setError(null);
  };

  return (
    <MarketingLayout title="PixelSqueeze - AI-Powered Image Optimization">
      {/* Hero Section with Interactive Demo */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
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
                Maximum 10 images • Supports JPEG, PNG, WebP
              </p>
              {!user || !token ? (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Demo mode: You can optimize images but cannot download them. Sign up for full access!
                </p>
              ) : null}
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-red-600 text-sm">!</span>
                  </div>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Usage Counter for Logged-in Users */}
            {user && token && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChartIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 text-sm font-medium">Images Optimized This Session:</span>
                  </div>
                  <span className="text-blue-900 text-lg font-bold">{usageCount}</span>
                </div>
              </motion.div>
            )}

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
                        <div className="flex items-center space-x-1">
                          {result.isDemo && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                              DEMO
                            </span>
                          )}
                          {result.hasError && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              ERROR
                            </span>
                          )}
                          <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                            {result.format}
                          </span>
                        </div>
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
            
                      {/* Download Button for Logged-in Users */}
                      {user && token && (
                        <button
                          onClick={() => downloadOptimizedImage(result)}
                          className="w-full mt-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
                        >
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Download
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                <div className="text-center mt-6 space-y-3">
                  {user && token ? (
                    <p className="text-sm text-gray-600">
                      💡 You can download all optimized images. Your usage count: {usageCount} images
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600">
                      🔮 Demo mode: Results are simulated. Sign up to use real optimization!
                    </p>
                  )}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={clearResults}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Clear Results
                    </button>
                    {!user || !token ? (
                      <Link href="/register" className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center">
                        <StarIcon className="w-4 h-4 mr-2" />
                        Sign Up to Download
                      </Link>
                    ) : null}
                </div>
              </div>
            </motion.div>
            )}
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
              From basic compression to advanced AI-powered analysis, we&apos;ve got you covered.
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
