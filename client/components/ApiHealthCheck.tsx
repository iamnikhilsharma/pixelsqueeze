import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { buildApiUrl } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';

interface ApiHealthCheckProps {
  className?: string;
}

interface HealthStatus {
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'checking';
  responseTime?: number;
  error?: string;
}

const ApiHealthCheck: React.FC<ApiHealthCheckProps> = ({ className = '' }) => {
  const { token } = useAuthStore();
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Use mix of public and authenticated endpoints for comprehensive health check
  const endpoints = [
    '/health', // Basic health endpoint (no auth required)
    '/api/test', // API test endpoint (no auth required)
    '/api/cors-test', // CORS test endpoint (no auth required)
    ...(token ? ['/admin/users', '/admin/stats'] : []) // Only check admin endpoints if authenticated
  ];

  const checkEndpoint = async (endpoint: string): Promise<HealthStatus> => {
    const startTime = Date.now();
    try {
      // Build headers with authentication if available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header for protected endpoints
      if (token && (endpoint.includes('/admin') || endpoint.includes('/notifications'))) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(buildApiUrl(endpoint), {
        method: 'GET',
        headers,
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          endpoint,
          status: 'healthy',
          responseTime
        };
      } else {
        return {
          endpoint,
          status: 'unhealthy',
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        endpoint,
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  };

  const checkAllEndpoints = async () => {
    setIsChecking(true);
    setHealthStatus(endpoints.map(endpoint => ({ endpoint, status: 'checking' })));

    const results = await Promise.all(
      endpoints.map(endpoint => checkEndpoint(endpoint))
    );

    setHealthStatus(results);
    setIsChecking(false);
  };

  useEffect(() => {
    checkAllEndpoints();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'unhealthy':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 animate-pulse" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'unhealthy':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'checking':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">API Health Status</h3>
        <button
          onClick={checkAllEndpoints}
          disabled={isChecking}
          className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Refresh'}
        </button>
      </div>
      
      <div className="space-y-2">
        {healthStatus.map((status, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-md border ${getStatusColor(status.status)}`}
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(status.status)}
              <span className="text-sm font-medium">{status.endpoint}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              {status.responseTime && (
                <span className="text-gray-600">{status.responseTime}ms</span>
              )}
              {status.error && (
                <span className="text-red-600">{status.error}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Last checked: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default ApiHealthCheck;
