import React from 'react';
import { InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { buildApiUrl } from '../utils/formatters';

interface ConfigurationCheckProps {
  className?: string;
}

const ConfigurationCheck: React.FC<ConfigurationCheckProps> = ({ className = '' }) => {
  const config = {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development'
  };

  const testUrl = buildApiUrl('/admin/users');
  
  const getConfigStatus = () => {
    if (config.isProduction && !config.hasApiUrl) {
      return {
        status: 'error',
        title: 'Production Configuration Issue',
        message: 'NEXT_PUBLIC_API_URL is not set in production',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      };
    }
    
    if (config.isProduction && config.hasApiUrl) {
      return {
        status: 'success',
        title: 'Production Configuration OK',
        message: 'Backend URL is properly configured',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      };
    }
    
    if (config.isDevelopment) {
      return {
        status: 'info',
        title: 'Development Mode',
        message: 'Using localhost backend',
        icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      };
    }
    
    return {
      status: 'warning',
      title: 'Unknown Configuration',
      message: 'Configuration status unclear',
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    };
  };

  const configStatus = getConfigStatus();

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Configuration Status</h3>
        <p className="text-sm text-gray-600">Current deployment and API configuration</p>
      </div>
      
      <div className="space-y-4">
        {/* Configuration Status */}
        <div className={`flex items-center p-3 rounded-md border ${
          configStatus.status === 'error' ? 'border-red-200 bg-red-50' :
          configStatus.status === 'success' ? 'border-green-200 bg-green-50' :
          configStatus.status === 'info' ? 'border-blue-200 bg-blue-50' :
          'border-yellow-200 bg-yellow-50'
        }`}>
          {configStatus.icon}
          <div className="ml-3">
            <h4 className="text-sm font-medium text-gray-900">{configStatus.title}</h4>
            <p className="text-sm text-gray-600">{configStatus.message}</p>
          </div>
        </div>
        
        {/* Configuration Details */}
        <div className="bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Environment:</span>
              <span className="font-mono">{config.nodeEnv || 'undefined'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">API URL Set:</span>
              <span className="font-mono">{config.hasApiUrl ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Production Mode:</span>
              <span className="font-mono">{config.isProduction ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Development Mode:</span>
              <span className="font-mono">{config.isDevelopment ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
        
        {/* Test URL */}
        <div className="bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Test API URL</h4>
          <div className="text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Endpoint:</span>
              <span className="font-mono">/admin/users</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Full URL:</span>
              <span className="font-mono text-xs break-all">{testUrl}</span>
            </div>
          </div>
        </div>
        
        {/* Configuration Instructions */}
        {config.isProduction && !config.hasApiUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How to Fix</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p>1. Set <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> in your Vercel environment variables</p>
              <p>2. Point it to your deployed backend (e.g., Render, Heroku)</p>
              <p>3. Redeploy your frontend</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationCheck;
