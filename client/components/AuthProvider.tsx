import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { setRehydrated } = useAuthStore();

  useEffect(() => {
    // Mark rehydration as complete after component mounts
    setRehydrated();
  }, [setRehydrated]);

  return <>{children}</>;
} 