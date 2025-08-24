import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import ImageAnalyzer from '@/components/ImageAnalyzer';
import { motion } from 'framer-motion';

export default function ImageAnalysisPage() {
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
            <p className="mt-4 text-neutral-600">Loading image analysis tool...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Image Analysis - PixelSqueeze">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ImageAnalyzer />
      </motion.div>
    </Layout>
  );
}
