import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { checkAuth, isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    // Only check auth if we have a token but are not authenticated
    if (token && !isAuthenticated) {
      checkAuth();
    }
  }, []); // Only run once on mount

  return <>{children}</>;
}; 