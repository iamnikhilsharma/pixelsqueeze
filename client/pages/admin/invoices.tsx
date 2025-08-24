import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  CreditCardIcon,
  CheckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/AdminLayout';
import AdminGuard from '../../components/AdminGuard';
import AdminTable from '../../components/AdminTable';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  createdAt: string;
  paidAt?: string;
  downloadUrl?: string;
}

const AdminInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data || []);
      } else {
        setError('Failed to fetch invoices');
      }
    } catch (err) {
      setError('Error fetching invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/invoices/${invoice._id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download invoice');
      }
    } catch (err) {
      setError('Error downloading invoice');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckIcon className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <CreditCardIcon className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice',
      render: (value: string, row: Invoice) => (
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">#{value}</div>
            <div className="text-xs text-gray-500">{row.userName}</div>
          </div>
        </div>
      )
    },
    {
      key: 'userEmail',
      label: 'Customer',
      render: (value: string) => (
        <span className="text-sm text-gray-900">{value}</span>
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
      key: 'amount',
      label: 'Amount',
      render: (value: number) => (
        <span className="text-sm font-medium text-gray-900">${value}</span>
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
      key: 'createdAt',
      label: 'Date',
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'paidAt',
      label: 'Paid Date',
      render: (value: string, row: Invoice) => (
        <span className="text-sm text-gray-500">
          {row.status === 'paid' && value 
            ? new Date(value).toLocaleDateString()
            : 'N/A'
          }
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Download PDF',
      onClick: handleDownloadInvoice,
      icon: <ArrowDownTrayIcon className="h-4 w-4" />
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-gray-600">Loading invoices...</div>
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

  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
          <p className="mt-2 text-gray-600">
            View and manage all customer invoices and payments.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
            <div className="text-sm text-gray-600">Total Invoices</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-green-600">{paidInvoices.length}</div>
            <div className="text-sm text-gray-600">Paid Invoices</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-blue-600">${totalRevenue}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-yellow-600">${pendingAmount}</div>
            <div className="text-sm text-gray-600">Pending Amount</div>
          </motion.div>
        </div>

        {/* Invoices Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AdminTable
            columns={columns}
            data={invoices}
            actions={actions}
            emptyMessage="No invoices found"
          />
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminGuard(AdminInvoices);
