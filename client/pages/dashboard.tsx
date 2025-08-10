import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { StatsCard } from '@/components/StatsCard';
import { RecentImages } from '@/components/RecentImages';

export default function Dashboard() {
  const router = useRouter();
  const { user, token, hasRehydrated, checkAuth } = useAuthStore();

  useEffect(() => {
    (async () => {
      if (!hasRehydrated) return;
      if (!token) { router.replace('/login'); return; }
      await checkAuth();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hasRehydrated]);

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard - PixelSqueeze">
      <div className="space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Here's what's happening with your image optimization today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatsCard
            title="Images Optimized"
            value="1,247"
            change="+12%"
            changeType="positive"
            icon="🖼️"
          />
          <StatsCard
            title="Bandwidth Saved"
            value="2.4 GB"
            change="+18%"
            changeType="positive"
            icon="💾"
          />
          <StatsCard
            title="Processing Time"
            value="1.2s"
            change="-8%"
            changeType="positive"
            icon="⚡"
          />
          <StatsCard
            title="Success Rate"
            value="99.8%"
            change="+0.2%"
            changeType="positive"
            icon="✅"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-8"
        >
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-mountain rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Upload Images</h3>
              <p className="text-sm text-neutral-600">Optimize single or batch images</p>
            </div>
            
            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Advanced Tools</h3>
              <p className="text-sm text-neutral-600">Access professional features</p>
            </div>
            
            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">View Analytics</h3>
              <p className="text-sm text-neutral-600">Track performance metrics</p>
            </div>
          </div>
        </motion.div>

        {/* Recent Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <RecentImages />
        </motion.div>

        {/* Performance Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-mountain rounded-2xl p-8 text-white"
        >
          <h2 className="text-2xl font-semibold mb-4">
            Performance Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Top Optimization</h3>
              <p className="text-white/90">
                Your PNG images are being optimized by an average of 78% while maintaining visual quality.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Recommendation</h3>
              <p className="text-white/90">
                Consider converting more images to WebP format for additional 15-20% size reduction.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
} 