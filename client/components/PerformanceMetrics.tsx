import React from 'react';
import { motion } from 'framer-motion';
import { 
  CpuChipIcon, 
  ServerIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Metric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface PerformanceMetricsProps {
  metrics: Metric[];
  className?: string;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  metrics,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
      case 'warning':
        return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
      case 'critical':
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
      case 'down':
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
      case 'stable':
        return <div className="h-2 w-2 rounded-full bg-blue-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-white p-6 shadow-lg ${className}`}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
        <p className="text-sm text-gray-600 mt-1">Real-time system metrics and health status</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
              <div className="flex items-center space-x-2">
                {getStatusIcon(metric.status)}
                {getTrendIcon(metric.trend)}
              </div>
            </div>
            
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
              <span className="ml-1 text-sm text-gray-500">{metric.unit}</span>
            </div>
            
            <div className="mt-2">
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(metric.status)}`}>
                {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Health Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ServerIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">System Health</span>
          </div>
          <div className="flex items-center space-x-2">
            {metrics.every(m => m.status === 'good') && (
              <div className="flex items-center text-green-600">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                <span className="text-sm">All Systems Operational</span>
              </div>
            )}
            {metrics.some(m => m.status === 'warning') && (
              <div className="flex items-center text-yellow-600">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">Performance Warning</span>
              </div>
            )}
            {metrics.some(m => m.status === 'critical') && (
              <div className="flex items-center text-red-600">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">Critical Issues Detected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PerformanceMetrics;
