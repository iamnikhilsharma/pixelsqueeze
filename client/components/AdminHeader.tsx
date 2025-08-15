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
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-md shadow md:ml-64 dark:bg-gray-900/80">
      <button onClick={toggleSidebar} className="p-2 text-gray-600 rounded md:hidden hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
        ☰
      </button>
      <h1 className="text-lg font-semibold">Admin Panel</h1>
      {user && (
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-700 dark:text-gray-300">{user.email}</span>
          <button onClick={logout} className="text-sm text-primary-600 hover:underline">
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
