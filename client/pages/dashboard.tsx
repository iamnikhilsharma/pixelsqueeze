import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import { Layout } from '@/components/Layout';
import { StatsCard } from '@/components/StatsCard';
import { RecentImages } from '@/components/RecentImages';
import { Button } from '@/components/Button';
import { buildApiUrl } from '@/utils/formatters';
import { formatBytes, formatNumber } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  ChartBarIcon,
  CogIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'stats' | 'images'>('upload');
  const [retryCount, setRetryCount] = useState(0);

  // Check authentication on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    initAuth();
  }, [checkAuth, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      try {
        const authData = localStorage.getItem('pixelsqueeze-auth');
        const token = authData ? JSON.parse(authData).state.token : '';
        if (!token) throw new Error('No authentication token');
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        const [statsRes, imagesRes] = await Promise.all([
          fetch(buildApiUrl('/api/stats'), { headers }),
          fetch(buildApiUrl('/api/images?limit=5'), { headers })
        ]);

        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        if (!imagesRes.ok) throw new Error('Failed to fetch images');

        const statsData = await statsRes.json();
        const imagesData = await imagesRes.json();
        setStats(statsData.data || {});
        setRecentImages(imagesData.data?.images || []);
        setRetryCount(0);
      } catch (error) {
        console.error(error);
        if (retryCount < 3) {
          setRetryCount(retryCount + 1);
          setTimeout(fetchData, (retryCount + 1) * 1000);
        } else {
          toast.error('Failed to fetch data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, retryCount]);

  // skeleton state
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to access your dashboard
          </h1>
          <Button href="/login" variant="primary">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'upload', name: 'Upload & Optimize', icon: CloudArrowUpIcon },
    { id: 'stats', name: 'Statistics', icon: ChartBarIcon },
    { id: 'images', name: 'Recent Images', icon: PhotoIcon },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-2 text-gray-600">
            Optimize your images and track your usage
          </p>
        </div>

        {/* Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Images This Month"
            value={stats?.usage?.monthlyImages || 0}
            total={stats?.usage?.planLimit || 100}
            unit="images"
            color="primary"
          />
          <StatsCard
            title="Bandwidth Used"
            value={formatBytes(stats?.usage?.monthlyBandwidth || 0)}
            color="secondary"
          />
          <StatsCard
            title="Average Compression"
            value={`${stats?.statistics?.averageCompressionRatio || 0}%`}
            color="success"
          />
        </div>

        {/* Subscription Status */}
        {user?.subscription && (
          <div className="mb-8">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {(user.subscription.plan?.charAt(0).toUpperCase() + user.subscription.plan?.slice(1)) || 'Free'} Plan
                    </h3>
                    <p className="text-sm text-gray-600">
                      Status: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.subscription.status || 'active'}
                      </span>
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="secondary" size="sm">
                      <CreditCardIcon className="w-4 h-4 mr-2" />
                      Manage Billing
                    </Button>
                    <Button variant="ghost" size="sm">
                      <CogIcon className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {formatNumber(stats?.statistics?.totalImages || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Images</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {formatBytes(stats?.statistics?.totalSizeSaved || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Space Saved</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-2xl font-bold text-warning-600">
                      {formatNumber(stats?.statistics?.totalDownloads || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Downloads</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-2xl font-bold text-secondary-600">
                      {stats?.statistics?.averageCompressionRatio || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Avg. Compression</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Detailed Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Usage Overview
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Images Used</span>
                          <span className="font-medium">
                            {stats?.usage?.monthlyImages || 0} / {stats?.usage?.planLimit || 100}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="progress-bar">
                            <div 
                              className="progress-bar-fill"
                              style={{ 
                                width: `${Math.min(100, ((stats?.usage?.monthlyImages || 0) / (stats?.usage?.planLimit || 100)) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bandwidth Used</span>
                          <span className="font-medium">
                            {formatBytes(stats?.usage?.monthlyBandwidth || 0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Remaining Images</span>
                          <span className="font-medium text-success-600">
                            {stats?.usage?.remainingImages || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Performance Metrics
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Images Processed</span>
                        <span className="font-medium">
                          {formatNumber(stats?.statistics?.totalImages || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Space Saved</span>
                        <span className="font-medium text-success-600">
                          {formatBytes(stats?.statistics?.totalSizeSaved || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Compression</span>
                        <span className="font-medium">
                          {stats?.statistics?.averageCompressionRatio || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Downloads</span>
                        <span className="font-medium">
                          {formatNumber(stats?.statistics?.totalDownloads || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-6">
              <RecentImages images={recentImages || []} isLoading={isLoading} />
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
} 