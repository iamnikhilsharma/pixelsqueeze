import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MarketingLayout from '../components/MarketingLayout';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  admins: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 403) throw new Error('Not admin');
        return res.json();
      })
      .then(json => setStats(json.data))
      .catch(() => router.replace('/'));
  }, []);

  return (
    <MarketingLayout title="Admin Dashboard - PixelSqueeze">
      <section className="py-20 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          {!stats && <p>Loading...</p>}

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-5xl font-bold text-primary-600 mb-2">{stats.totalUsers}</p>
                <p className="text-gray-600">Total Users</p>
              </div>
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-5xl font-bold text-green-600 mb-2">{stats.activeUsers}</p>
                <p className="text-gray-600">Active Users</p>
              </div>
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-5xl font-bold text-indigo-600 mb-2">{stats.admins}</p>
                <p className="text-gray-600">Admins</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </MarketingLayout>
  );
}
