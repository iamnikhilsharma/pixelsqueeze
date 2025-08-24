import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  KeyIcon,
  ChartBarIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { formatNumber, formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  active: boolean;
  createdAt: string;
  lastUsed: string | null;
  maskedKey: string;
}

interface UsageStats {
  usage: {
    total: number;
    monthly: number;
    lastUsed: string | null;
    endpoints: Record<string, number>;
  };
  limits: {
    plan: string;
    monthly: number;
    rateLimit: number;
    remaining: number;
  };
  percentage: {
    monthly: number;
  };
}

export default function DeveloperDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const authData = localStorage.getItem('pixelsqueeze-auth');
      const token = authData ? JSON.parse(authData).state.token : '';
      
      // Load API keys
      const keysResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/developer/keys`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData.data || []);
      }

      // Load usage stats
      const usageResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/developer/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsageStats(usageData.data);
      }
    } catch (error) {
      console.error('Error loading developer data:', error);
      toast.error('Failed to load developer data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    try {
      const authData = localStorage.getItem('pixelsqueeze-auth');
      const token = authData ? JSON.parse(authData).state.token : '';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/developer/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newKeyName || 'Default API Key'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('API key generated successfully');
        setShowNewKeyModal(false);
        setNewKeyName('');
        loadData();
        
        // Show the new key to the user
        alert(`Your new API key: ${data.data.key}\n\nStore it securely as it won't be shown again!`);
      } else {
        throw new Error('Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const authData = localStorage.getItem('pixelsqueeze-auth');
      const token = authData ? JSON.parse(authData).state.token : '';
      
      const response = await fetch(`/api/developer/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('API key revoked successfully');
        loadData();
      } else {
        throw new Error('Failed to revoke API key');
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CodeBracketIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Developer Dashboard</h1>
          </div>
          <p className="text-gray-600 max-w-3xl">
            Manage your API keys, monitor usage, and access developer resources.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'api-keys', name: 'API Keys', icon: KeyIcon },
              { id: 'documentation', name: 'Documentation', icon: DocumentTextIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Usage Statistics */}
            {usageStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Requests</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(usageStats.usage.total)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <KeyIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Monthly Usage</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(usageStats.usage.monthly)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <DocumentTextIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Usage Limit</p>
                      <p className="text-2xl font-bold text-gray-900">{usageStats.percentage.monthly}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setShowNewKeyModal(true)}
                  variant="primary"
                  className="w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Generate API Key
                </Button>
                
                <Button
                  href="/api/developer/docs"
                  variant="secondary"
                  className="w-full"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  View API Docs
                </Button>
                
                <Button
                  href="/sdk/pixelsqueeze.js"
                  variant="outline"
                  className="w-full"
                >
                  <CodeBracketIcon className="h-4 w-4 mr-2" />
                  Download SDK
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'api-keys' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
              <Button
                onClick={() => setShowNewKeyModal(true)}
                variant="primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Generate New Key
              </Button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No API keys found</p>
                  <p className="text-sm text-gray-400 mt-1">Generate your first API key to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          API Key
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Used
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {apiKeys.map((key) => (
                        <tr key={key.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{key.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <code className="text-sm text-gray-600 font-mono">{key.maskedKey}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(key.maskedKey);
                                  toast.success('Copied to clipboard');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <ClipboardDocumentIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              key.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {key.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(key.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              onClick={() => revokeApiKey(key.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'documentation' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">API Documentation</h2>
              
              <div className="prose max-w-none">
                <h3>Getting Started</h3>
                <p>
                  The PixelSqueeze API allows you to integrate image optimization into your applications.
                  All API requests require authentication using an API key.
                </p>

                <h3>Authentication</h3>
                <p>Include your API key in the request headers:</p>
                <pre className="bg-gray-100 p-4 rounded-lg">
                  <code>
                    X-API-Key: pk_your_api_key_here
                  </code>
                </pre>

                <h3>Rate Limits</h3>
                <ul>
                  <li><strong>Free:</strong> 100 requests per 15 minutes</li>
                  <li><strong>Starter:</strong> 1,000 requests per 15 minutes</li>
                  <li><strong>Pro:</strong> 5,000 requests per 15 minutes</li>
                  <li><strong>Enterprise:</strong> 20,000 requests per 15 minutes</li>
                </ul>

                <h3>JavaScript SDK</h3>
                <p>Use our JavaScript SDK for easy integration:</p>
                <pre className="bg-gray-100 p-4 rounded-lg">
                  <code>
                    {`// Install via CDN
<script src="https://cdn.pixelsqueeze.com/sdk/pixelsqueeze.js"></script>

// Initialize SDK
const sdk = new PixelSqueezeSDK('your_api_key');

// Optimize an image
const result = await sdk.optimizeImage(file, {
  quality: 80,
  format: 'webp'
});`}
                  </code>
                </pre>

                <div className="mt-8">
                  <Button
                    href="/api/developer/docs"
                    variant="primary"
                    className="mr-4"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Full API Documentation
                  </Button>
                  
                  <Button
                    href="/sdk/pixelsqueeze.js"
                    variant="secondary"
                  >
                    <CodeBracketIcon className="h-4 w-4 mr-2" />
                    Download SDK
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* New API Key Modal */}
        {showNewKeyModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New API Key</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="My API Key"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={generateApiKey}
                    variant="primary"
                    className="flex-1"
                  >
                    Generate
                  </Button>
                  <Button
                    onClick={() => setShowNewKeyModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 