import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/AdminLayout';
import AdminGuard from '../../components/AdminGuard';
import AdminTable from '../../components/AdminTable';

interface Subscription {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: string;
  status: 'active' | 'cancelled' | 'paused' | 'expired';
  startDate: string;
  endDate?: string;
  amount: number;
  billingCycle: 'monthly' | 'annual';
  nextBillingDate?: string;
}

const AdminSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.data || []);
      } else {
        setError('Failed to fetch subscriptions');
      }
    } catch (err) {
      setError('Error fetching subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscription: Subscription) => {
    if (!confirm(`Are you sure you want to cancel ${subscription.userName}'s subscription?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/subscriptions/${subscription._id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setSubscriptions(subscriptions.map(s => 
          s._id === subscription._id ? { ...s, status: 'cancelled' } : s
        ));
      }
    } catch (err) {
      setError('Failed to update subscription');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <PauseIcon className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'userName',
      label: 'Customer',
      render: (value: string, row: Subscription) => (
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <CreditCardIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.userEmail}</div>
          </div>
        </div>
      )
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (value: string) => (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(value)}`}>
          {getStatusIcon(value)}
          <span className="ml-1 capitalize">{value}</span>
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number, row: Subscription) => (
        <div className="text-sm text-gray-900">
          <div className="font-medium">${value}</div>
          <div className="text-xs text-gray-500 capitalize">{row.billingCycle}</div>
        </div>
      )
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'nextBillingDate',
      label: 'Next Billing',
      render: (value: string, row: Subscription) => (
        <span className="text-sm text-gray-500">
          {row.status === 'active' && value 
            ? new Date(value).toLocaleDateString()
            : row.status === 'cancelled' ? 'N/A' : 'N/A'
          }
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Cancel Subscription',
      onClick: handleCancelSubscription,
      className: 'text-red-600 hover:text-red-700',
      icon: <XCircleIcon className="h-4 w-4" />
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-gray-600">Loading subscriptions...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-lg bg-red-50 p-4">
          <div className="text-red-800">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const totalRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage user subscriptions and billing.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-gray-900">{subscriptions.length}</div>
            <div className="text-sm text-gray-600">Total Subscriptions</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-green-600">{activeSubscriptions.length}</div>
            <div className="text-sm text-gray-600">Active Subscriptions</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-blue-600">${totalRevenue}</div>
            <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-yellow-600">
              {subscriptions.filter(s => s.status === 'cancelled').length}
            </div>
            <div className="text-sm text-gray-600">Cancelled This Month</div>
          </motion.div>
        </div>

        {/* Subscriptions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AdminTable
            columns={columns}
            data={subscriptions}
            actions={actions}
            emptyMessage="No subscriptions found"
          />
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminGuard(AdminSubscriptions);
