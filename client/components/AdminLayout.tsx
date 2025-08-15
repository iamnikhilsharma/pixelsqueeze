import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function AdminLayout({ title = 'Admin', children }: Props) {
  const router = useRouter();
  const nav = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Plans', href: '/admin/plans' },
    { name: 'Invoices', href: '/admin/invoices' }
  ];

  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="min-h-screen flex bg-gray-100">
        {/* Mobile hamburger */}
        <button onClick={()=>setOpen(!open)} className="absolute top-4 left-4 md:hidden p-2 bg-white rounded shadow">
          <span className="sr-only">Toggle</span>
          ☰
        </button>

        <aside className={`fixed md:static inset-y-0 left-0 transform ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 w-64 bg-white shadow-lg z-40`}>
          <div className="px-6 py-4 text-2xl font-semibold border-b">Admin</div>
          <nav className="mt-4">
            {nav.map(link => (
              <Link key={link.href} href={link.href} legacyBehavior>
                <a
                  className={`block px-6 py-3 hover:bg-gray-100 ${
                    router.pathname === link.href ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  {link.name}
                </a>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </>
  );
}
