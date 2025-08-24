import React from 'react';
import { useRouter } from 'next/router';

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function AdminHeader({ toggleSidebar }: HeaderProps) {
  const router = useRouter();
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:bg-gray-900/95 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 text-gray-600 rounded-lg md:hidden hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Admin Panel</h1>
      </div>
      {user && (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">{user.email}</span>
          <button 
            onClick={logout} 
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
