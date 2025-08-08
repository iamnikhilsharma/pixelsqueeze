import React, { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { checkAuth, token } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // Ensure axios has Authorization set on mount
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Always check auth if we have a token
        // This handles cases where the persisted state might be incomplete
        try {
          await checkAuth();
        } catch (error) {
          console.error('Auth check failed:', error);
          // If checkAuth fails, it will clear the auth state automatically
        }
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    };

    initializeAuth();
  }, [token, checkAuth]);

  return <>{children}</>;
}; 