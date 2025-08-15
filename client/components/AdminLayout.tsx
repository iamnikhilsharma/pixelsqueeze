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
        <AdminSidebar open={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="md:ml-64">
          <AdminHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
