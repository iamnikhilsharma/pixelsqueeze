import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import { motion } from 'framer-motion';

export default function PerformancePage() {
  const router = useRouter();
  const { user, token, hasRehydrated, checkAuth } = useAuthStore();

  useEffect(() => {
    if (hasRehydrated && !user) {
      router.push('/login');
    }
  }, [hasRehydrated, user, router]);

  useEffect(() => {
    if (hasRehydrated && user) {
      checkAuth();
    }
  }, [hasRehydrated, user, checkAuth]);

  if (!hasRehydrated) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Layout title="Performance - PixelSqueeze">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <PerformanceDashboard />
      </motion.div>
    </Layout>
  );
}
