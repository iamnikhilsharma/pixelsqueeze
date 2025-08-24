import React, { useState } from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/MarketingLayout';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { buildApiUrl } from '@/utils/formatters';

export default function DocumentationPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'authentication', name: 'Authentication' },
    { id: 'endpoints', name: 'API Endpoints' },
    { id: 'examples', name: 'Examples' },
    { id: 'sdk', name: 'SDK & Libraries' },
    { id: 'errors', name: 'Error Handling' },
  ];

  return (
    <MarketingLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            API Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Integrate PixelSqueeze into your applications with our comprehensive API. 
            Optimize images, add watermarks, and process batches with simple HTTP requests.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Start</h3>
                    <ol className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full mr-3 mt-0.5">1</span>
                        Get your API key from the <Link href="/settings" className="text-primary-600 hover:text-primary-700 underline">Settings page</Link>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full mr-3 mt-0.5">2</span>
                        Include your API key in the Authorization header
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full mr-3 mt-0.5">3</span>
                        Send POST requests with image files to optimize
                      </li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Base URL</h3>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                      {buildApiUrl('')}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">All API endpoints are relative to this base URL</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Features Overview</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Image Optimization</h3>
                    <p className="text-sm text-gray-600">Compress images while maintaining quality</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Watermarking</h3>
                    <p className="text-sm text-gray-600">Add text and image watermarks</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Batch Processing</h3>
                    <p className="text-sm text-gray-600">Process multiple images at once</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Authentication Tab */}
          {activeTab === 'authentication' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication</h2>
                <p className="text-gray-600 mb-6">
                  All API requests require authentication using an API key. Include your API key in the Authorization header.
                </p>
                
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-6">
                  Authorization: Bearer YOUR_API_KEY
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Security Note</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Keep your API key secure and never expose it in client-side code. Use environment variables for production applications.
                      </p>
                    </div>
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="mt-8 p-6 bg-primary-50 rounded-xl border border-primary-200">
                    <h3 className="text-lg font-semibold text-primary-900 mb-4">Your API Key</h3>
                    <div className="bg-white p-4 rounded-lg border border-primary-200">
                      <code className="text-sm text-gray-800 break-all">
                        {user?.apiKey || 'Generate your API key in Settings → API Settings'}
                      </code>
                    </div>
                    <div className="mt-4">
                      <Link 
                        href="/settings" 
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                      >
                        Manage API Keys
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Endpoints Tab */}
          {activeTab === 'endpoints' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
                
                <div className="space-y-8">
                  {/* Image Optimization */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">POST</span>
                      <code className="ml-4 text-lg font-mono text-gray-800">/api/optimize</code>
                    </div>
                    <p className="text-gray-700 mb-4">Optimize and compress images while maintaining quality</p>
                    
                    <h4 className="font-semibold text-gray-900 mb-3">Parameters</h4>
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parameter</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">image</td>
                            <td className="px-4 py-3 text-sm text-gray-700">file</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Required
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Image file to optimize</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">quality</td>
                            <td className="px-4 py-3 text-sm font-gray-700">integer</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Optional
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Quality level (1-100), default: 80</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">format</td>
                            <td className="px-4 py-3 text-sm font-gray-700">string</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Optional
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Output format (jpeg, png, webp, avif)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Batch Processing */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">POST</span>
                      <code className="ml-4 text-lg font-mono text-gray-800">/api/batch</code>
                    </div>
                    <p className="text-gray-700 mb-4">Process multiple images in a single request</p>
                    
                    <h4 className="font-semibold text-gray-900 mb-3">Parameters</h4>
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parameter</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">images[]</td>
                            <td className="px-4 py-3 text-sm text-gray-700">file[]</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Required
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Array of image files (max 20)</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">preset</td>
                            <td className="px-4 py-3 text-sm text-gray-700">string</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Optional
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Optimization preset (web, print, social)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Watermarking */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">POST</span>
                      <code className="ml-4 text-lg font-mono text-gray-800">/api/advanced/watermark</code>
                    </div>
                    <p className="text-gray-700 mb-4">Add image watermarks to your images</p>
                    
                    <h4 className="font-semibold text-gray-900 mb-3">Parameters</h4>
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parameter</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">image</td>
                            <td className="px-4 py-3 text-sm text-gray-700">file</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Required
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Base image to watermark</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">watermark</td>
                            <td className="px-4 py-3 text-sm text-gray-700">file</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Required
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">PNG watermark image</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">position</td>
                            <td className="px-4 py-3 text-sm text-gray-700">string</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Optional
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Position (top-left, top-right, bottom-left, bottom-right, center)</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">opacity</td>
                            <td className="px-4 py-3 text-sm text-gray-700">float</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Optional
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Opacity (0.1-1.0), default: 0.7</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Text Watermark */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">POST</span>
                      <code className="ml-4 text-lg font-mono text-gray-800">/api/advanced/watermark-text</code>
                    </div>
                    <p className="text-gray-700 mb-4">Add text watermarks to your images</p>
                    
                    <h4 className="font-semibold text-gray-900 mb-3">Parameters</h4>
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parameter</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">image</td>
                            <td className="px-4 py-3 text-sm text-gray-700">file</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Required
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Base image to watermark</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">text</td>
                            <td className="px-4 py-3 text-sm text-gray-700">string</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Required
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Watermark text</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">color</td>
                            <td className="px-4 py-3 text-sm text-gray-700">string</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Optional
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Text color (hex), default: #ffffff</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">fontSize</td>
                            <td className="px-4 py-3 text-sm text-gray-700">integer</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Optional
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Font size in pixels, default: 48</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Examples</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">cURL</h3>
                    <div className="bg-gray-900 rounded-xl p-4">
                      <pre className="text-green-400 text-sm overflow-x-auto">
                        <code>{`# Image Optimization
curl -X POST ${buildApiUrl('api/optimize')} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F "quality=85" \\
  -F "format=webp"

# Batch Processing
curl -X POST ${buildApiUrl('api/batch')} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "images[]=@image1.jpg" \\
  -F "images[]=@image2.png" \\
  -F "preset=web

# Image Watermark
curl -X POST ${buildApiUrl('api/advanced/watermark')} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@base.jpg" \\
  -F "watermark=@logo.png" \\
  -F "position=bottom-right" \\
  -F "opacity=0.8"`}</code>
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">JavaScript</h3>
                    <div className="bg-gray-900 rounded-xl p-4">
                      <pre className="text-green-400 text-sm overflow-x-auto">
                        <code>{`// Image Optimization
const optimizeImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('quality', '85');
  formData.append('format', 'webp');

  const response = await fetch('${buildApiUrl('api/optimize')}', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: formData
  });

  const result = await response.json();
  return result.data;
};

// Batch Processing
const processBatch = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images[]', file);
  });
  formData.append('preset', 'web');

  const response = await fetch('${buildApiUrl('api/batch')}', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: formData
  });

  return await response.json();
};`}</code>
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Python</h3>
                  <div className="bg-gray-900 rounded-xl p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
                      <code>{`import requests

# Image Optimization
def optimize_image(file_path, api_key):
    url = '${buildApiUrl('api/optimize')}'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    with open(file_path, 'rb') as f:
        files = {'image': f}
        data = {'quality': '85', 'format': 'webp'}
        response = requests.post(url, headers=headers, files=files, data=data)
    
    return response.json()

# Usage
result = optimize_image('photo.jpg', 'YOUR_API_KEY')
print(result)`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SDK Tab */}
          {activeTab === 'sdk' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">SDK & Libraries</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Official SDK</h3>
                    <p className="text-gray-600 mb-4">
                      Download our official JavaScript SDK for easy integration
                    </p>
                    <a 
                      href="/sdk/pixelsqueeze.js" 
                      download
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                    >
                      Download SDK
                    </a>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Libraries</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Python</h4>
                          <p className="text-sm text-gray-600">pixelsqueeze-python</p>
                        </div>
                        <span className="text-xs text-gray-500">Coming Soon</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">PHP</h4>
                          <p className="text-sm text-gray-600">pixelsqueeze-php</p>
                        </div>
                        <span className="text-xs text-gray-500">Coming Soon</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">SDK Usage Example</h3>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <pre className="text-sm text-gray-800 overflow-x-auto">
                      <code>{`// Initialize SDK
const pixelsqueeze = new PixelSqueeze('YOUR_API_KEY');

// Optimize image
const result = await pixelsqueeze.optimize(file, {
  quality: 85,
  format: 'webp'
});

// Add watermark
const watermarked = await pixelsqueeze.watermark(image, watermark, {
  position: 'bottom-right',
  opacity: 0.8
});

// Process batch
const batch = await pixelsqueeze.batch(files, {
  preset: 'web'
});`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Handling Tab */}
          {activeTab === 'errors' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Error Handling</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">HTTP Status Codes</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">200</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Success</td>
                            <td className="px-4 py-3 text-sm text-gray-700">-</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">400</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Bad Request</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Check parameters</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">401</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Unauthorized</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Check API key</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">403</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Forbidden</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Check permissions</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">429</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Rate Limited</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Wait and retry</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">500</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Server Error</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Retry later</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Response Format</h3>
                    <div className="bg-gray-900 rounded-xl p-4">
                      <pre className="text-red-400 text-sm overflow-x-auto">
                        <code>{`{
  "success": false,
  "error": "Invalid image format",
  "code": "INVALID_FORMAT",
  "details": {
    "supportedFormats": ["jpeg", "png", "webp", "gif"]
  }
}`}</code>
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Limits</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Rate Limiting</h3>
                          <p className="text-sm text-yellow-700 mt-1">
                            Free tier: 100 requests/hour, Pro: 1000 requests/hour, Enterprise: 10000 requests/hour
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </MarketingLayout>
  );
}
