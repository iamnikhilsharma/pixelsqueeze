import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowTrendingUpIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { StatsCard } from './StatsCard';
import { RecentImages } from './RecentImages';
import { useAuthStore } from '@/store/authStore';
import { formatFileSize, formatNumber, formatBytes, buildApiUrl } from '@/utils/formatters';
import toast from 'react-hot-toast';

interface UsageStats {
  currentMonth: {
    images: number;
    originalSize: number;
    optimizedSize: number;
    bandwidthSaved: number;
    bandwidthSavedPercentage: number;
    successRate: number;
    avgProcessingTime: number;
    avgCompressionRatio: number;
  };
  plan: {
    current: string;
    limits: {
      images: number;
      bandwidth: number;
      quality: string;
      features: string[];
    };
    remaining: {
      images: number;
      bandwidth: number;
    };
    usagePercentage: {
      images: number;
      bandwidth: number;
    };
  };
  recentActivity: Array<{
    _id: string;
    count: number;
    totalSize: number;
    avgProcessingTime: number;
  }>;
  formatBreakdown: Array<{
    format: string;
    count: number;
    percentage: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    count: number;
    size: number;
  }>;
  lastUpdated: string;
}

export default function EnhancedDashboard() {
  const { user, token } = useAuthStore();
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      // Temporarily use mock endpoint for testing
      const response = await fetch(buildApiUrl('api/analytics/mock'), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to fetch usage statistics');
      }
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      setError('Error fetching usage statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchUsageStats}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Try Again
            </button>
            {error === 'Authentication required' || error === 'Authentication failed. Please log in again.' ? (
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 inline-block"
              >
                Sign In
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (!usageStats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Data Available</h2>
          <p className="text-gray-600">Start optimizing images to see your statistics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {usageStats.user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening with your image optimization today.</p>
      </div>

      {/* Plan Usage Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Plan Usage</h2>
          <span className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Images Used</span>
              <span className="text-gray-900 font-medium">
                {usageStats.currentMonth?.imagesProcessed || 0} / {usageStats.planLimits?.monthlyImages || '∞'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(
                    ((usageStats.currentMonth?.imagesProcessed || 0) / (usageStats.planLimits?.monthlyImages || 1)) * 100, 
                    100
                  )}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Bandwidth Used</span>
              <span className="text-gray-900 font-medium">
                {usageStats.currentMonth?.bandwidthUsed || '0 MB'} / {usageStats.planLimits?.monthlyBandwidth || '∞'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(
                    ((usageStats.currentMonth?.bandwidthUsedMB || 0) / (usageStats.planLimits?.monthlyBandwidthMB || 1)) * 100, 
                    100
                  )}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Images Optimized"
          value={usageStats.currentMonth?.imagesProcessed || 0}
          total={usageStats.planLimits?.monthlyImages || 0}
          icon="📷"
          change="+12%"
          changeType="positive"
        />
        <StatsCard
          title="Bandwidth Saved"
          value={usageStats.currentMonth?.bandwidthSaved || '0 MB'}
          icon="💾"
          change="+8%"
          changeType="positive"
        />
        <StatsCard
          title="Avg Processing Time"
          value={usageStats.currentMonth?.averageProcessingTime || '0.0s'}
          icon="⚡"
          change="-15%"
          changeType="positive"
        />
        <StatsCard
          title="Success Rate"
          value={`${usageStats.currentMonth?.successRate || 100}%`}
          icon="✅"
          change="+2%"
          changeType="positive"
        />
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📊</span>
            Performance Metrics
          </h2>
          <button
            onClick={fetchUsageStats}
            className="text-primary-500 hover:text-primary-600 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500 mb-2">
              {usageStats.currentMonth?.compressionRatio || 0}%
            </div>
            <div className="text-gray-600">Average Compression</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-500 mb-2">
              {usageStats.currentMonth?.bandwidthSaved || '0 MB'}
            </div>
            <div className="text-gray-600">Total Bandwidth Saved</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-500 mb-2">
              {usageStats.currentMonth?.imagesProcessed || 0}
            </div>
            <div className="text-gray-600">Images This Month</div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Format Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📅</span>
            Recent Activity (7 Days)
          </h3>
          <div className="space-y-3">
            {usageStats.recentActivity?.slice(0, 5).map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">{activity.date}</div>
                  <div className="text-xs text-gray-500">{activity.imagesProcessed} images processed</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{activity.bandwidthUsed}</div>
                  <div className="text-xs text-gray-500">{activity.avgTime} avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Format Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Format Distribution
          </h3>
          <div className="space-y-3">
            {usageStats.formatBreakdown?.map((format: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">{format.format}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{format.count} images</div>
                  <div className="text-xs text-gray-500">{format.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/images"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
          >
            <span className="text-2xl mr-3">📁</span>
            <div>
              <div className="font-medium text-gray-900">View Images</div>
              <div className="text-sm text-gray-500">See all your optimized images</div>
            </div>
          </Link>
          <Link
            href="/watermark"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-secondary-300 hover:bg-secondary-50 transition-all duration-200"
          >
            <span className="text-2xl mr-3">💧</span>
            <div>
              <div className="font-medium text-gray-900">Add Watermark</div>
              <div className="text-sm text-gray-500">Protect your images</div>
            </div>
          </Link>
          <Link
            href="/thumbnails"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-accent-300 hover:bg-accent-50 transition-all duration-200"
          >
            <span className="text-2xl mr-3">🖼️</span>
            <div>
              <div className="font-medium text-gray-900">Generate Thumbnails</div>
              <div className="text-sm text-gray-500">Create multiple sizes</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
