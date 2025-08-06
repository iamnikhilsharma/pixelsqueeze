import React from 'react';
import { useAuthStore } from '@/store/authStore';

export const DebugAuth: React.FC = () => {
  const { user, token, isAuthenticated, isLoading } = useAuthStore();

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug:</h3>
      <div>isAuthenticated: {isAuthenticated ? 'true' : 'false'}</div>
      <div>isLoading: {isLoading ? 'true' : 'false'}</div>
      <div>token: {token ? 'present' : 'none'}</div>
      <div>user: {user ? `${user.firstName} ${user.lastName}` : 'none'}</div>
    </div>
  );
}; 