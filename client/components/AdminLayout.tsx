import React from 'react';
import Head from 'next/head';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function AdminLayout({ title = 'Admin', children }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <div className="flex h-screen">
          <AdminSidebar open={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 flex flex-col md:ml-0">
            <AdminHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <main className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-950">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
