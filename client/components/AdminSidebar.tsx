import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

interface SidebarProps {
  open: boolean;
  toggle: () => void;
}

const navLinks = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Plans', href: '/admin/plans' },
  { name: 'Subscriptions', href: '/admin/subscriptions' },
  { name: 'Invoices', href: '/admin/invoices' }
];

export default function AdminSidebar({ open, toggle }: SidebarProps) {
  const router = useRouter();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white dark:bg-gray-900 shadow-lg transition-transform duration-300 md:translate-x-0 md:static md:shadow-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
        <span className="text-xl font-semibold">Admin</span>
        <button onClick={toggle} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
          ✕
        </button>
      </div>
      <nav className="mt-6">
        {navLinks.map(link => (
          <Link key={link.href} href={link.href} legacyBehavior>
            <a
              className={`block px-6 py-3 text-sm font-medium rounded-r-full transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                router.pathname === link.href
                  ? 'bg-gray-100 dark:bg-gray-800 font-semibold'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {link.name}
            </a>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
