import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';

const AdminAnalytics: NextPage = () => {
  return (
    <>
      <Head>
        <title>Analytics - Admin Panel | PixelSqueeze</title>
        <meta name="description" content="Comprehensive analytics and insights for the notification system" />
      </Head>

      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive analytics dashboard for monitoring notification system performance
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                  Export Data
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Dashboard */}
          <AnalyticsDashboard />

          {/* Additional Analytics Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Behavior Insights */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Behavior Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-900">High Engagement Users</p>
                    <p className="text-xs text-blue-600">Users with 80%+ engagement rate</p>
                  </div>
                  <span className="text-lg font-bold text-blue-900">45%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-900">Active Sessions</p>
                    <p className="text-xs text-green-600">Currently active user sessions</p>
                  </div>
                  <span className="text-lg font-bold text-green-900">1,247</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Preference Changes</p>
                    <p className="text-xs text-yellow-600">Settings modified this week</p>
                  </div>
                  <span className="text-lg font-bold text-yellow-900">89</span>
                </div>
              </div>
            </div>

            {/* System Performance */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Server Response Time</span>
                  <span className="text-sm font-medium text-gray-900">245ms</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">WebSocket Connections</span>
                  <span className="text-sm font-medium text-gray-900">1,892</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database Performance</span>
                  <span className="text-sm font-medium text-gray-900">98.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="p-4 text-center bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 text-sm font-bold">📊</span>
                </div>
                <p className="text-sm font-medium text-blue-900">Generate Report</p>
              </button>
              
              <button className="p-4 text-center bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 text-sm font-bold">📈</span>
                </div>
                <p className="text-sm font-medium text-green-900">View Trends</p>
              </button>
              
              <button className="p-4 text-center bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 text-sm font-bold">👥</span>
                </div>
                <p className="text-sm font-medium text-purple-900">User Segments</p>
              </button>
              
              <button className="p-4 text-center bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-orange-600 text-sm font-bold">⚡</span>
                </div>
                <p className="text-sm font-medium text-orange-900">Real-time Data</p>
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminAnalytics;
