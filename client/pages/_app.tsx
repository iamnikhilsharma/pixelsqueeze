import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function App({ Component, pageProps, router }: AppProps) {
  const { setRehydrated } = useAuthStore();

  useEffect(() => {
    // Mark rehydration as complete after the component mounts
    setRehydrated();
  }, [setRehydrated]);

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <Component key={router.route} {...pageProps} />
      </AnimatePresence>
      <Toaster position="top-right" />
    </>
  );
} 