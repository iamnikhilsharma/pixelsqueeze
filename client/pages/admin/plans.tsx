import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/AdminLayout';
import AdminGuard from '../../components/AdminGuard';
import AdminTable from '../../components/AdminTable';
import { getAllPlans } from '../../../shared/pricing';

interface Plan {
  id: string;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  limits: {
    imagesPerMonth: number;
    storage: string;
    formats: string[];
    support: string;
  };
  popular?: boolean;
}

const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ monthly: number; annual: number }>({ monthly: 0, annual: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    const allPlans = getAllPlans();
    setPlans(allPlans);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan.id);
    setEditValues({
      monthly: plan.price.monthly,
      annual: plan.price.annual
    });
  };

  const handleSave = async (planId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planId,
          prices: editValues
        })
      });

      if (response.ok) {
        // Update local state
        setPlans(plans.map(p => 
          p.id === planId 
            ? { ...p, price: editValues }
            : p
        ));
        setEditingPlan(null);
      }
    } catch (err) {
      setError('Failed to update plan');
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
  };

  const columns = [
    {
      key: 'name',
      label: 'Plan',
      render: (value: string, row: Plan) => (
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <CreditCardIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            {row.popular && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                Popular
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Monthly Price',
      render: (value: any, row: Plan) => (
        editingPlan === row.id ? (
          <input
            type="number"
            value={editValues.monthly}
            onChange={(e) => setEditValues({ ...editValues, monthly: parseFloat(e.target.value) || 0 })}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
            min="0"
            step="0.01"
          />
        ) : (
          <span className="text-sm font-medium text-gray-900">${row.price.monthly}</span>
        )
      )
    },
    {
      key: 'annualPrice',
      label: 'Annual Price',
      render: (value: any, row: Plan) => (
        editingPlan === row.id ? (
          <input
            type="number"
            value={editValues.annual}
            onChange={(e) => setEditValues({ ...editValues, annual: parseFloat(e.target.value) || 0 })}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
            min="0"
            step="0.01"
          />
        ) : (
          <span className="text-sm font-medium text-gray-900">${row.price.annual}</span>
        )
      )
    },
    {
      key: 'features',
      label: 'Key Features',
      render: (value: any, row: Plan) => (
        <div className="space-y-1">
          {row.features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              {feature}
            </div>
          ))}
          {row.features.length > 3 && (
            <div className="text-xs text-gray-500">+{row.features.length - 3} more</div>
          )}
        </div>
      )
    },
    {
      key: 'limits',
      label: 'Limits',
      render: (value: any, row: Plan) => (
        <div className="text-sm text-gray-600">
          <div>{row.limits.imagesPerMonth} images/month</div>
          <div>{row.limits.storage} storage</div>
        </div>
      )
    }
  ];

  const actions = [
    {
      label: 'Edit Prices',
      onClick: handleEdit,
      icon: <PencilIcon className="h-4 w-4" />
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
          <p className="mt-2 text-gray-600">
            Manage pricing plans and subscription tiers.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-gray-900">{plans.length}</div>
            <div className="text-sm text-gray-600">Total Plans</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-green-600">
              ${Math.min(...plans.map(p => p.price.monthly).filter(p => p > 0))}
            </div>
            <div className="text-sm text-gray-600">Starting Price</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-blue-600">
              {plans.filter(p => p.popular).length}
            </div>
            <div className="text-sm text-gray-600">Featured Plans</div>
          </motion.div>
        </div>

        {/* Plans Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AdminTable
            columns={columns}
            data={plans}
            actions={actions}
            emptyMessage="No plans found"
          />
        </motion.div>

        {/* Edit Actions */}
        {editingPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-end space-x-3 rounded-lg bg-blue-50 p-4"
          >
            <span className="text-sm text-blue-800">
              Editing {plans.find(p => p.id === editingPlan)?.name} plan
            </span>
            <button
              onClick={() => handleSave(editingPlan)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGuard(AdminPlans);
