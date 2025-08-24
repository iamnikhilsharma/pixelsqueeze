import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  ServerIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import Button from './Button';
import { useAuthStore } from '@/store/authStore';
import { buildApiUrl } from '@/utils/formatters';
import toast from 'react-hot-toast';

interface PerformanceMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  processing: {
    totalImages: number;
    totalSize: number;
    averageProcessingTime: number;
    cacheHits: number;
    cacheMisses: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    uptime: number;
  };
  cacheHitRate: number;
  averageResponseTimeMs: number;
  averageProcessingTimeMs: number;
  errorRate: number;
  uptime: string;
}

interface CacheStats {
  redis: {
    connected: boolean;
    keys: number;
    memory: string;
  };
  memory: {
    size: number;
    memoryUsage: number;
  };
}

interface PerformanceRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestion: string;
}

const PerformanceDashboard: React.FC = () => {
  const { token } = useAuthStore();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('api/performance/metrics'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }, [token]);

  const fetchCacheStats = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('api/performance/cache/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCacheStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    }
  }, [token]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('api/performance/recommendations'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, [token]);

  const clearCache = async (namespace?: string) => {
    try {
      const response = await fetch(buildApiUrl('api/performance/cache/clear'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ namespace })
      });

      if (response.ok) {
        toast.success(namespace ? `Cache cleared for ${namespace}` : 'All cache cleared');
        fetchCacheStats();
      }
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchMetrics(),
        fetchCacheStats(),
        fetchRecommendations()
      ]);
      setLoading(false);
    };

    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, fetchCacheStats, fetchRecommendations, autoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'medium': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'low': return <CheckCircleIcon className="w-5 h-5" />;
      default: return <CheckCircleIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Monitor system performance and optimization opportunities</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'primary' : 'secondary'}
            size="sm"
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Request Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.requests.total || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">
              {metrics?.requests.successful || 0} successful
            </span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-red-600 font-medium">
              {metrics?.requests.failed || 0} failed
            </span>
          </div>
        </motion.div>

        {/* Response Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.averageResponseTimeMs || 0}ms
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              {metrics?.averageResponseTimeMs && metrics.averageResponseTimeMs > 1000 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-red-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-green-500 mr-1" />
              )}
              <span className={metrics?.averageResponseTimeMs && metrics.averageResponseTimeMs > 1000 ? 'text-red-600' : 'text-green-600'}>
                {metrics?.averageResponseTimeMs && metrics.averageResponseTimeMs > 1000 ? 'High' : 'Good'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Cache Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ServerIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.cacheHitRate ? `${(metrics.cacheHitRate * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(metrics?.cacheHitRate || 0) * 100}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* System Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CpuChipIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.system.memoryUsage ? `${Math.round(metrics.system.memoryUsage / 1024 / 1024)}MB` : '0MB'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Uptime: {metrics?.uptime || '0h 0m 0s'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cache Statistics</h3>
            <div className="flex space-x-2">
              <Button
                onClick={() => clearCache()}
                variant="secondary"
                size="sm"
              >
                Clear All Cache
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Redis Status</p>
              <p className={`text-lg font-semibold ${cacheStats.redis.connected ? 'text-green-600' : 'text-red-600'}`}>
                {cacheStats.redis.connected ? 'Connected' : 'Disconnected'}
              </p>
              {cacheStats.redis.connected && (
                <p className="text-sm text-gray-500">{cacheStats.redis.keys} keys</p>
              )}
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Memory Cache</p>
              <p className="text-lg font-semibold text-gray-900">{cacheStats.memory.size} entries</p>
              <p className="text-sm text-gray-500">
                {Math.round(cacheStats.memory.memoryUsage / 1024)}KB
              </p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Cache Hits</p>
              <p className="text-lg font-semibold text-green-600">{metrics?.processing.cacheHits || 0}</p>
              <p className="text-sm text-gray-500">
                vs {metrics?.processing.cacheMisses || 0} misses
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Optimization Recommendations ({recommendations.length})
          </h3>
          
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getPriorityIcon(rec.priority)}
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium">{rec.title}</h4>
                    <p className="text-sm mt-1">{rec.description}</p>
                    <p className="text-sm mt-2 font-medium">Suggestion: {rec.suggestion}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Processing Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Processing Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Images</p>
            <p className="text-2xl font-bold text-blue-600">{metrics?.processing.totalImages || 0}</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Avg Processing Time</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics?.averageProcessingTimeMs || 0}ms
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Size Processed</p>
            <p className="text-2xl font-bold text-purple-600">
              {metrics?.processing.totalSize ? `${Math.round(metrics.processing.totalSize / 1024 / 1024)}MB` : '0MB'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PerformanceDashboard;
