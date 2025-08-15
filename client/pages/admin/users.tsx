import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isAdmin: boolean;
  subscription?: { plan: string };
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchUsers = async (p = page) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/users?page=${p}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 403) return router.replace('/admin/login');
    const json = await res.json();
    setUsers(json.data.users);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const toggleActive = async (id: string, active: boolean) => {
    const token = localStorage.getItem('token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/users/${id}/activate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ isActive: !active })
    });
    fetchUsers();
  };

  return (
    <AdminLayout title="Admin – Users">
      <section className="py-20 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Users</h1>

          {loading && <p>Loading...</p>}

          {!loading && (
            <div className="overflow-x-auto bg-white shadow rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.firstName} {u.lastName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.subscription?.plan || 'free'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">{u.isActive ? '✓' : '✗'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">{u.isAdmin ? '✓' : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => toggleActive(u._id, u.isActive)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}