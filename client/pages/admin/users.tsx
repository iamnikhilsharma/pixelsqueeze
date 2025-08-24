import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  XCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/AdminLayout';
import AdminGuard from '../../components/AdminGuard';
import AdminTable from '../../components/AdminTable';
import { buildApiUrl } from '../../utils/formatters';

interface User {
  _id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(buildApiUrl('/admin/users'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && Array.isArray(data.data.users)) {
          setUsers(data.data.users);
        } else {
          setError('Invalid data format received');
        }
      } else if (response.status === 502) {
        setError('Backend service unavailable. Please check if the server is running.');
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(`Failed to fetch users (${response.status})`);
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Error fetching users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/admin/users/${user._id}`), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ isAdmin: !user.isAdmin })
      });
      
      if (response.ok) {
        setUsers(users.map(u => 
          u._id === user._id ? { ...u, isAdmin: !u.isAdmin } : u
        ));
      }
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/admin/users/${user._id}/deactivate`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setUsers(users.map(u => 
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        ));
      }
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/admin/users/${user._id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setUsers(users.filter(u => u._id !== user._id));
      }
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (value: string, row: User) => (
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <UserIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'isAdmin',
      label: 'Role',
      render: (value: boolean) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          value 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? (
            <>
              <ShieldCheckIcon className="mr-1 h-3 w-3" />
              Admin
            </>
          ) : 'User'}
        </span>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : 'Never'}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Toggle Admin',
      onClick: handleToggleAdmin,
      icon: <ShieldCheckIcon className="h-4 w-4" />
    },
    {
      label: 'Toggle Status',
      onClick: handleToggleActive,
      icon: <XCircleIcon className="h-4 w-4" />
    },
    {
      label: 'Delete User',
      onClick: handleDeleteUser,
      className: 'text-red-600 hover:text-red-700',
      icon: <TrashIcon className="h-4 w-4" />
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">
              Manage user accounts, roles, and permissions.
            </p>
          </div>
          
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <div className="text-lg text-gray-600">Loading users...</div>
              <div className="text-sm text-gray-500 mt-2">This may take a moment</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">
              Manage user accounts, roles, and permissions.
            </p>
          </div>
          
          <div className="rounded-lg bg-red-50 border border-red-200 p-6">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-400 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchUsers();
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage user accounts, roles, and permissions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Users</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.isAdmin).length}
            </div>
            <div className="text-sm text-gray-600">Administrators</div>
          </motion.div>
        </div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AdminTable
            columns={columns}
            data={users}
            actions={actions}
            emptyMessage="No users found"
          />
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminGuard(AdminUsers);