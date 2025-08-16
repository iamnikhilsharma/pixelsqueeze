import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  UsersIcon, 
  CreditCardIcon, 
  DocumentTextIcon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface AdminSidebarProps {
  open: boolean;
  toggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, toggle }) => {
  const router = useRouter();
  
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Plans', href: '/admin/plans', icon: CreditCardIcon },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCardIcon },
    { name: 'Invoices', href: '/admin/invoices', icon: DocumentTextIcon },
    { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out ${
      open ? 'translate-x-0' : '-translate-x-full'
    } md:translate-x-0 md:static md:shadow-none`}>
      <div className="flex h-16 items-center justify-center border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4 bg-white">
        {navigation.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => toggle()}
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;
