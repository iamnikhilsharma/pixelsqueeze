import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  CpuChipIcon,
  ServerIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import Button from './Button';

interface MonitoringDashboardProps {
  className?: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    sentry: boolean;
    prometheus: boolean;
    logger: boolean;
  };
  metrics: {
    totalMetrics: number;
    activeTimers: number;
  };
}

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  system_load: number;
  active_handles: number;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ className = '' }) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error('Failed to fetch health status');
      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const text = await response.text();
      
      // Parse Prometheus metrics format
      const metrics: SystemMetrics = {
        cpu_usage: 0,
        memory_usage: 0,
        system_load: 0,
        active_handles: 0
      };

      const lines = text.split('\n');
      lines.forEach(line => {
        if (line.startsWith('custom_cpu_usage')) {
          const match = line.match(/custom_cpu_usage.*?(\d+\.?\d*)/);
          if (match) metrics.cpu_usage = parseFloat(match[1]);
        }
        if (line.startsWith('custom_memory_usage')) {
          const match = line.match(/custom_memory_usage.*?(\d+\.?\d*)/);
          if (match) metrics.memory_usage = parseFloat(match[1]);
        }
        if (line.startsWith('custom_system_load')) {
          const match = line.match(/custom_system_load.*?(\d+\.?\d*)/);
          if (match) metrics.system_load = parseFloat(match[1]);
        }
        if (line.startsWith('custom_active_handles')) {
          const match = line.match(/custom_active_handles.*?(\d+\.?\d*)/);
          if (match) metrics.active_handles = parseFloat(match[1]);
        }
      });

      setSystemMetrics(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system metrics');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    await Promise.all([
      fetchHealthStatus(),
      fetchSystemMetrics()
    ]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMicroseconds = (microseconds: number) => {
    return (microseconds / 1000000).toFixed(2) + 's';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getServiceStatusIcon = (status: boolean) => {
    return status ? (
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    ) : (
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
    );
  };

  if (loading && !healthStatus) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">System Monitoring</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-100 text-green-700' : ''}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Health Status */}
      {healthStatus && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthStatus.status)}`}>
                  {healthStatus.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date(healthStatus.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Sentry</span>
                  {getServiceStatusIcon(healthStatus.services.sentry)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Prometheus</span>
                  {getServiceStatusIcon(healthStatus.services.prometheus)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Logger</span>
                  {getServiceStatusIcon(healthStatus.services.logger)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Metrics */}
      {systemMetrics && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">System Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CpuChipIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
              </div>
              <div className="text-lg font-semibold text-blue-900">
                {formatMicroseconds(systemMetrics.cpu_usage)}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <ServerIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              </div>
              <div className="text-lg font-semibold text-green-900">
                {formatBytes(systemMetrics.memory_usage)}
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">System Load</span>
              </div>
              <div className="text-lg font-semibold text-yellow-900">
                {systemMetrics.system_load.toFixed(2)}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <EyeIcon className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Active Handles</span>
              </div>
              <div className="text-lg font-semibold text-purple-900">
                {systemMetrics.active_handles}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Summary */}
      {healthStatus && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Metrics Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Metrics</div>
              <div className="text-lg font-semibold text-gray-900">
                {healthStatus.metrics.totalMetrics}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Active Timers</div>
              <div className="text-lg font-semibold text-gray-900">
                {healthStatus.metrics.activeTimers}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MonitoringDashboard;
