import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/AdminGuard';
import dynamic from 'next/dynamic';
import useAdminMetrics from '../../hooks/useAdminMetrics';
import { Line } from 'react-chartjs-2';
// @ts-ignore – runtime import only
const Doughnut = dynamic(()=>import('react-chartjs-2').then((m:any)=>m.Doughnut),{ ssr:false });
// @ts-ignore
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

interface Stats {
  totalUsers: number;
  activeUsers: number;
  admins: number;
  activeSubscriptions: number;
  planBreakdown: Record<string, number>;
}

function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData,setChartData]=useState<any>(null);
  const { metrics } = useAdminMetrics();
  const lineChart = metrics ? {
    labels: ['-6','-5','-4','-3','-2','-1','Today'],
    datasets:[{ data: metrics.dailyOptimizations, fill:true, backgroundColor:'rgba(99,102,241,0.2)', borderColor:'#6366f1' }]
  }:null;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 403) throw new Error('Not admin');
        return res.json();
      })
      .then(json => {
        setStats(json.data);
        const pb = json.data.planBreakdown || {};
        setChartData({
          labels: Object.keys(pb),
          datasets:[{ data:Object.values(pb), backgroundColor:['#6366f1','#3b82f6','#10b981','#f59e0b'] }]
        });
      })
      .catch(() => router.replace('/admin/login'));
  }, []);

  return (
    <AdminLayout title="Admin Dashboard - PixelSqueeze">
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
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-5xl font-bold text-secondary-600 mb-2">{stats.activeSubscriptions}</p>
                <p className="text-gray-600">Active Subs</p>
              </div>
            </div>
          )}
          {lineChart && (
            <div className="mt-10 bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
              {/* @ts-ignore */}
              <Line data={lineChart} />
            </div>
          )}
          {chartData && (
            <div className="mt-12 max-w-sm mx-auto">
              {/* @ts-ignore */}
              <Doughnut data={chartData} />
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}

export default withAdminAuth(AdminDashboard);
