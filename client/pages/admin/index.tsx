import React from 'react';
import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  ChartBarIcon, 
  CreditCardIcon, 
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import AdminLayout from '../../components/AdminLayout';
import AdminGuard from '../../components/AdminGuard';
import AdminCard from '../../components/AdminCard';
import useAdminMetrics from '../../hooks/useAdminMetrics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
        data: Object.values(planBreakdown),
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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's what's happening with your application.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AdminCard
            title="Total Users"
            value={stats.totalUsers || 0}
            change={{
              value: 12,
              isPositive: true,
              period: 'last month'
            }}
            icon={<UsersIcon className="h-6 w-6" />}
            color="primary"
          />
          
          <AdminCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions || 0}
            change={{
              value: 8,
              isPositive: true,
              period: 'last month'
            }}
            icon={<CreditCardIcon className="h-6 w-6" />}
            color="success"
          />
          
          <AdminCard
            title="Total Optimizations"
            value={stats.totalImagesOptimized || 0}
            change={{
              value: 23,
              isPositive: true,
              period: 'last week'
            }}
            icon={<ChartBarIcon className="h-6 w-6" />}
            color="info"
          />
          
          <AdminCard
            title="Revenue This Month"
            value={`$${stats.monthlyRevenue || 0}`}
            change={{
              value: 15,
              isPositive: true,
              period: 'last month'
            }}
            icon={<DocumentTextIcon className="h-6 w-6" />}
            color="warning"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Plan Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white p-6 shadow-lg"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Plan Distribution</h3>
            <div className="h-64">
              <Doughnut data={planChartData} options={doughnutOptions} />
            </div>
          </motion.div>

          {/* Daily Optimizations Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-white p-6 shadow-lg"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Daily Optimizations (7 Days)</h3>
            <div className="h-64">
              <Line data={dailyChartData} options={chartOptions} />
            </div>
          </motion.div>
        </div>

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
