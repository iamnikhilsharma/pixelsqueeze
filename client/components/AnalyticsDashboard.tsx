import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  UserGroupIcon,
  BellIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'users' | 'performance'>('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  const mockData = {
    summary: {
      totalNotifications: 15420,
      totalUsers: 2847,
      activeUsers: 1893,
      deliveryRate: 98.5,
      openRate: 34.2,
      clickRate: 12.8
    },
    trends: {
      daily: {
        'Mon': 245, 'Tue': 312, 'Wed': 289, 'Thu': 356,
        'Fri': 298, 'Sat': 187, 'Sun': 156
      }
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: ChartBarIcon },
    { key: 'trends', label: 'Trends', icon: ArrowTrendingUpIcon },
    { key: 'users', label: 'Users', icon: UserGroupIcon },
    { key: 'performance', label: 'Performance', icon: BellIcon }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 p-4 rounded-lg border border-blue-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Notifications</p>
                    <p className="text-2xl font-bold text-blue-900">{mockData.summary.totalNotifications.toLocaleString()}</p>
                  </div>
                  <BellIcon className="h-8 w-8 text-blue-400" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-green-50 p-4 rounded-lg border border-green-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Active Users</p>
                    <p className="text-2xl font-bold text-green-900">{mockData.summary.activeUsers.toLocaleString()}</p>
                  </div>
                  <UserGroupIcon className="h-8 w-8 text-green-400" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-purple-50 p-4 rounded-lg border border-purple-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Delivery Rate</p>
                    <p className="text-2xl font-bold text-purple-900">{mockData.summary.deliveryRate}%</p>
                  </div>
                  <ArrowTrendingUpIcon className="h-8 w-8 text-purple-400" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-orange-50 p-4 rounded-lg border border-orange-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Open Rate</p>
                    <p className="text-2xl font-bold text-orange-900">{mockData.summary.openRate}%</p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-orange-400" />
                </div>
              </motion.div>
            </div>

            {/* Simple Chart */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Daily Trends</h4>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(mockData.trends.daily).map(([day, count]) => (
                  <div key={day} className="text-center">
                    <div className="bg-blue-100 rounded p-2 mb-1">
                      <div 
                        className="bg-blue-500 rounded-t"
                        style={{ height: `${(count / 400) * 100}px` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600">{day}</p>
                    <p className="text-xs font-medium">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="text-center py-12">
            <ArrowTrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Trend analysis charts will be displayed here</p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">User behavior analytics will be displayed here</p>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="text-center py-12">
            <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Performance metrics will be displayed here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
