import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <Component key={router.route} {...pageProps} />
      </AnimatePresence>
      <Toaster position="top-right" />
    </>
  );
} 