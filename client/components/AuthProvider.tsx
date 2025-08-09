import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { checkAuth, token, hasRehydrated } = useAuthStore();
  const didInit = useRef(false);

  useEffect(() => {
    if (!hasRehydrated || didInit.current) return;
    didInit.current = true;

    const initializeAuth = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          await checkAuth();
        } catch {}
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    };

    initializeAuth();
  }, [hasRehydrated, token, checkAuth]);

  return <>{children}</>;
}; 