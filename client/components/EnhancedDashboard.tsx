import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { StatsCard } from './StatsCard';
import { RecentImages } from './RecentImages';
import { useAuthStore } from '@/store/authStore';
import { buildApiUrl } from '@/utils/formatters';
import { formatBytes, formatNumber } from '@/utils/formatters';
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

const EnhancedDashboard: React.FC = () => {
  const { user, token } = useAuthStore();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchUsageStats = useCallback(async (forceRefresh = false) => {
    try {
      const response = await fetch(
        `${buildApiUrl('')}/api/analytics/user${forceRefresh ? '?refresh=true' : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch usage statistics');
      }

      const data = await response.json();
      setUsageStats(data.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsageStats();
  }, [fetchUsageStats]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    fetchUsageStats(true);
  }, [fetchUsageStats]);

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-gray-600 bg-gray-100';
      case 'starter': return 'text-blue-600 bg-blue-100';
      case 'pro': return 'text-purple-600 bg-purple-100';
      case 'enterprise': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 70) return 'text-green-600';
    if (percentage < 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUsageBarColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!usageStats) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
        <p className="text-gray-600 mb-4">There was an error loading your usage statistics.</p>
        <button
          onClick={handleRefresh}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header with Plan Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-xl text-neutral-600">
              Here's what's happening with your image optimization today.
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(usageStats.plan.current)}`}>
              {usageStats.plan.current.charAt(0).toUpperCase() + usageStats.plan.current.slice(1)} Plan
            </span>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {new Date(usageStats.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Plan Usage Bars */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Images Used</span>
              <span className={`text-sm font-medium ${getUsageColor(usageStats.plan.usagePercentage.images)}`}>
                {usageStats.currentMonth.images} / {usageStats.plan.limits.images}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getUsageBarColor(usageStats.plan.usagePercentage.images)}`}
                style={{ width: `${Math.min(usageStats.plan.usagePercentage.images, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Bandwidth Used</span>
              <span className={`text-sm font-medium ${getUsageColor(usageStats.plan.usagePercentage.bandwidth)}`}>
                {formatBytes(usageStats.currentMonth.originalSize)} / {usageStats.plan.limits.bandwidth}GB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getUsageBarColor(usageStats.plan.usagePercentage.bandwidth)}`}
                style={{ width: `${Math.min(usageStats.plan.usagePercentage.bandwidth, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatsCard
          title="Images Optimized"
          value={formatNumber(usageStats.currentMonth.images)}
          change={`${usageStats.plan.remaining.images} remaining`}
          changeType="neutral"
          icon="🖼️"
        />
        <StatsCard
          title="Bandwidth Saved"
          value={formatBytes(usageStats.currentMonth.bandwidthSaved)}
          change={`${usageStats.currentMonth.bandwidthSavedPercentage.toFixed(1)}% reduction`}
          changeType="positive"
          icon="💾"
        />
        <StatsCard
          title="Avg Processing Time"
          value={`${(usageStats.currentMonth.avgProcessingTime / 1000).toFixed(1)}s`}
          change={`${usageStats.currentMonth.avgCompressionRatio.toFixed(1)}% compression`}
          changeType="positive"
          icon="⚡"
        />
        <StatsCard
          title="Success Rate"
          value={`${usageStats.currentMonth.successRate.toFixed(1)}%`}
          change="This month"
          changeType="positive"
          icon="✅"
        />
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900 flex items-center">
            <ChartBarIcon className="w-6 h-6 mr-2 text-primary-600" />
            Performance Metrics
          </h2>
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <CogIcon className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 mb-2">
              {usageStats.currentMonth.avgCompressionRatio.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Average Compression</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {formatBytes(usageStats.currentMonth.bandwidthSaved)}
            </div>
            <div className="text-sm text-gray-600">Total Bandwidth Saved</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {usageStats.currentMonth.images}
            </div>
            <div className="text-sm text-gray-600">Images This Month</div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity & Format Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid lg:grid-cols-2 gap-6"
      >
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-primary-600" />
            Recent Activity (7 Days)
          </h3>
          
          {usageStats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {usageStats.recentActivity.slice(0, 7).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <PhotoIcon className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(activity._id).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.count} images processed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatBytes(activity.totalSize)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(activity.avgProcessingTime / 1000).toFixed(1)}s avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PhotoIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>

        {/* Format Breakdown */}
        <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-primary-600" />
            Format Distribution
          </h3>
          
          {usageStats.formatBreakdown.length > 0 ? (
            <div className="space-y-3">
              {usageStats.formatBreakdown.map((format, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    <span className="text-sm font-medium text-gray-900 uppercase">
                      {format.format}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {format.count} images
                    </p>
                    <p className="text-xs text-gray-500">
                      {format.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No format data available</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-8"
      >
        <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
            <PhotoIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Optimize Images</h3>
            <p className="text-primary-700 text-sm mb-4">
              Upload and optimize your images with AI-powered compression
            </p>
            <button className="btn-primary w-full">
              Start Optimizing
            </button>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <ChartBarIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">View Analytics</h3>
            <p className="text-green-700 text-sm mb-4">
              Detailed insights into your optimization performance
            </p>
            <button className="btn-secondary w-full">
              View Details
            </button>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <CogIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Advanced Tools</h3>
            <p className="text-purple-700 text-sm mb-4">
              Access watermarking, thumbnails, and batch processing
            </p>
            <button className="btn-secondary w-full">
              Explore Tools
            </button>
          </div>
        </div>
      </motion.div>

      {/* Recent Images */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <RecentImages />
      </motion.div>
    </div>
  );
};

export default EnhancedDashboard;
