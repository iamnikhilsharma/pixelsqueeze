import React, { useState } from 'react';
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
                        Get your API key from the <a href="/settings" className="text-primary-600 hover:text-primary-700 underline">Settings page</a>
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

                {isAuthenticated && (
                  <div className="mt-8 p-6 bg-primary-50 rounded-xl border border-primary-200">
                    <h3 className="text-lg font-semibold text-primary-900 mb-4">Your API Key</h3>
                    <div className="bg-white p-4 rounded-lg border border-primary-200">
                      <code className="text-sm text-gray-800 break-all">
                        {user?.apiKey || 'Generate your API key in Settings → API Settings'}
                      </code>
                    </div>
                    <div className="mt-4">
                      <a 
                        href="/settings" 
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                      >
                        Manage API Keys
                      </a>
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
                
                <div className="space-y-6">
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
                            <td className="px-4 py-3 text-sm text-gray-700">integer</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Optional
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">Quality level (1-100), default: 80</td>
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
curl -X POST ${buildApiUrl('/api/optimize')} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F "quality=85" \\
  -F "format=webp"`}</code>
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

  const response = await fetch('${buildApiUrl('/api/optimize')}', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: formData
  });

  const result = await response.json();
  return result.data;
};`}</code>
                      </pre>
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
