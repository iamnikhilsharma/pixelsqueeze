import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BellIcon, 
  EnvelopeIcon,
  CogIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/AdminLayout';
import AdminGuard from '../../components/AdminGuard';
import NotificationCenter from '../../components/NotificationCenter';
import EmailNotificationSettings from '../../components/EmailNotificationSettings';

const AdminNotifications: React.FC = () => {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'templates'>('overview');

  const notificationStats = [
    {
      title: 'Total Notifications',
      value: '1,247',
      change: { value: 12, isPositive: true, period: 'this week' },
      icon: <BellIcon className="h-6 w-6" />,
      color: 'primary' as const
    },
    {
      title: 'Unread',
      value: '23',
      change: { value: -5, isPositive: false, period: 'this week' },
      icon: <EnvelopeIcon className="h-6 w-6" />,
      color: 'warning' as const
    },
    {
      title: 'Email Sent',
      value: '892',
      change: { value: 8, isPositive: true, period: 'this week' },
      icon: <EnvelopeIcon className="h-6 w-6" />,
      color: 'success' as const
    },
    {
      title: 'System Alerts',
      value: '15',
      change: { value: 0, isPositive: true, period: 'this week' },
      icon: <CogIcon className="h-6 w-6" />,
      color: 'info' as const
    }
  ];

  const recentNotifications = [
    {
      id: '1',
      type: 'success' as const,
      title: 'New User Registration',
      message: 'User john.doe@example.com has successfully registered',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'System Maintenance',
      message: 'Scheduled maintenance completed successfully',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      read: true
    },
    {
      id: '3',
      type: 'warning' as const,
      title: 'High Memory Usage',
      message: 'Server memory usage is at 85%',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false
    },
    {
      id: '4',
      type: 'error' as const,
      title: 'Payment Failed',
      message: 'Payment processing failed for subscription #12345',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      read: true
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
      case 'warning':
        return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
      case 'error':
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
      case 'info':
        return <div className="h-2 w-2 rounded-full bg-blue-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-2 text-gray-600">
                Manage system notifications, email settings, and user alerts.
              </p>
            </div>
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <BellIcon className="h-5 w-5 mr-2" />
              View All Notifications
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {notificationStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl bg-white p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  
                  <div className="mt-2 flex items-center">
                    <span
                      className={`inline-flex items-center text-sm font-medium ${
                        stat.change.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change.isPositive ? '↗' : '↘'} {Math.abs(stat.change.value)}%
                    </span>
                    <span className="ml-1 text-sm text-gray-500">vs {stat.change.period}</span>
                  </div>
                </div>
                
                <div className={`ml-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 text-${stat.color}-600`}>
                  {stat.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'settings', label: 'Settings', icon: CogIcon },
              { key: 'templates', label: 'Templates', icon: EnvelopeIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent Notifications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-white p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
                  <button
                    onClick={() => setIsNotificationCenterOpen(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-3">
                  {recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-lg border-l-4 ${getNotificationColor(notification.type)} p-3`}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {notification.timestamp.toLocaleTimeString()}
                              </span>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Notification Preferences Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl bg-white p-6 shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <CogIcon className="h-5 w-5 text-gray-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Notification Preferences</p>
                        <p className="text-xs text-gray-500">Configure email and in-app notifications</p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('templates')}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Email Templates</p>
                        <p className="text-xs text-gray-500">Manage notification email templates</p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsNotificationCenterOpen(true)}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <BellIcon className="h-5 w-5 text-gray-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">View All Notifications</p>
                        <p className="text-xs text-gray-500">Browse complete notification history</p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'settings' && (
            <EmailNotificationSettings />
          )}

          {activeTab === 'templates' && (
            <EmailNotificationSettings />
          )}
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </AdminLayout>
  );
};

export default AdminGuard(AdminNotifications);
