import React from 'react';
import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  ChartBarIcon, 
  CreditCardIcon, 
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/AdminLayout';
import AdminGuard from '../../components/AdminGuard';
import AdminChart from '../../components/AdminChart';
import AnalyticsWidget from '../../components/AnalyticsWidget';

import ApiHealthCheck from '../../components/ApiHealthCheck';
import ConfigurationCheck from '../../components/ConfigurationCheck';
import useAdminMetrics from '../../hooks/useAdminMetrics';

const AdminDashboard: React.FC = () => {
  const { metrics, isLoading, isError: error } = useAdminMetrics();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-lg bg-red-50 p-4">
          <div className="text-red-800">Error loading dashboard data</div>
        </div>
      </AdminLayout>
    );
  }

  const stats = metrics?.stats || {};
  const dailyOptimizations = metrics?.dailyOptimizations || [];
  const planBreakdown = metrics?.planBreakdown || {};



  // Prepare chart data
  const planChartData = {
    labels: Object.keys(planBreakdown),
    datasets: [
      {
        label: 'Plan Distribution',
        data: Object.values(planBreakdown) as number[],
        backgroundColor: [
          '#3B82F6', // blue-500
          '#10B981', // emerald-500
          '#F59E0B', // amber-500
          '#EF4444', // red-500
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const dailyChartData = {
    labels: dailyOptimizations.map((_: any, index: number) => `Day ${index + 1}`),
    datasets: [
      {
        label: 'Daily Optimizations',
        data: dailyOptimizations,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: [12000, 15000, 18000, 22000, 25000, 28000],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10B981',
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Users',
        data: [150, 220, 180, 300, 280, 350],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3B82F6',
        borderWidth: 2,
        fill: false,
      },
      {
        label: 'Active Users',
        data: [1200, 1350, 1280, 1500, 1450, 1600],
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: '#8B5CF6',
        borderWidth: 2,
        fill: false,
      }
    ],
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-2">
                  Here&apos;s what&apos;s happening with your application today.
                </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AnalyticsWidget
            title="Total Users"
            value={stats.totalUsers || 0}
            change={{
              value: 12,
              isPositive: true,
              period: 'last month'
            }}
            trend={{
              data: [1200, 1350, 1280, 1500, 1450, 1600],
              period: '6 months'
            }}
            icon={<UsersIcon className="h-6 w-6" />}
            color="primary"
          />
          
          <AnalyticsWidget
            title="Active Subscriptions"
            value={stats.activeSubscriptions || 0}
            change={{
              value: 8,
              isPositive: true,
              period: 'last month'
            }}
            trend={{
              data: [450, 480, 520, 580, 620, 680],
              period: '6 months'
            }}
            icon={<CreditCardIcon className="h-6 w-6" />}
            color="success"
          />
          
          <AnalyticsWidget
            title="Total Optimizations"
            value={stats.totalImagesOptimized || 0}
            change={{
              value: 23,
              isPositive: true,
              period: 'last week'
            }}
            trend={{
              data: [12000, 13500, 12800, 15000, 14500, 16000],
              period: '6 months'
            }}
            icon={<ChartBarIcon className="h-6 w-6" />}
            color="info"
          />
          
          <AnalyticsWidget
            title="Revenue This Month"
            value={`$${stats.monthlyRevenue || 0}`}
            change={{
              value: 15,
              isPositive: true,
              period: 'last month'
            }}
            trend={{
              data: [12000, 15000, 18000, 22000, 25000, 28000],
              period: '6 months'
            }}
            icon={<DocumentTextIcon className="h-6 w-6" />}
            color="warning"
          />
        </div>

        {/* Advanced Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Plan Distribution Chart */}
          <AdminChart
            type="doughnut"
            data={planChartData}
            title="Plan Distribution"
            subtitle="Current subscription plan breakdown"
            height={300}
          />

          {/* Daily Optimizations Chart */}
          <AdminChart
            type="line"
            data={dailyChartData}
            title="Daily Optimizations (7 Days)"
            subtitle="Image optimization trends"
            height={300}
          />
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue Trend */}
          <AdminChart
            type="bar"
            data={revenueChartData}
            title="Revenue Trend"
            subtitle="Monthly revenue growth"
            height={300}
          />

          {/* User Growth */}
          <AdminChart
            type="line"
            data={userGrowthData}
            title="User Growth"
            subtitle="New vs Active users over time"
            height={300}
          />
        </div>



        {/* Configuration Check */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ConfigurationCheck />
        </motion.div>

        {/* API Health Check */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <ApiHealthCheck />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              View All Users
            </button>
            <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
              Manage Plans
            </button>
            <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors">
              View Reports
            </button>
            <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors">
              System Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminGuard(AdminDashboard);
