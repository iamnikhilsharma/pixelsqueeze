import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useAuthStore } from '../store/authStore';
import {
  UserIcon,
  LogoutIcon,
  ChevronDownIcon,
  MenuIcon,
  CloseIcon
} from './icons';

interface MarketingLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function MarketingLayout({ children, title = 'PixelSqueeze - AI Image Compression' }: MarketingLayoutProps) {
  const { user, token, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Head>
        <title>{title}</title>
        <meta name="description" content="AI-powered image compression tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img 
                  src="/logo.svg" 
                  alt="PixelSqueeze" 
                  className="h-10 w-auto"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="nav-link">Home</Link>
              <Link href="/features" className="nav-link">Features</Link>
              <Link href="/pricing" className="nav-link">Pricing</Link>
              <Link href="/contact" className="nav-link">Contact</Link>
            </div>

            {/* Right Side - Authentication */}
            <div className="hidden md:flex items-center space-x-4">
              {user && token ? (
                // User is logged in - Show My Account dropdown
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>{user.firstName ? `${user.firstName} ${user.lastName}` : 'My Account'}</span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                      <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg">Dashboard</Link>
                      <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Profile</Link>
                      <Link href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Settings</Link>
                      <div className="border-t border-gray-200">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center"
                        >
                          <LogoutIcon className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // User is not logged in - Show Sign In and Sign Up buttons
                <>
                  <Link href="/login" className="nav-link">Sign In</Link>
                  <Link href="/register" className="btn-primary">Sign Up</Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-primary-500"
              >
                {isMobileMenuOpen ? (
                  <CloseIcon className="w-6 h-6" />
                ) : (
                  <MenuIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-6 space-y-4">
              <Link href="/" className="block text-gray-700 hover:text-primary-500 py-2">Home</Link>
              <Link href="/features" className="block text-gray-700 hover:text-primary-500 py-2">Features</Link>
              <Link href="/pricing" className="block text-gray-700 hover:text-primary-500 py-2">Pricing</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-primary-500 py-2">Contact</Link>
              
              <div className="border-t border-gray-200 pt-4">
                {user && token ? (
                  <>
                    <Link href="/dashboard" className="block text-gray-700 hover:text-primary-500 py-2">Dashboard</Link>
                    <Link href="/profile" className="block text-gray-700 hover:text-primary-500 py-2">Profile</Link>
                    <Link href="/settings" className="block text-gray-700 hover:text-primary-500 py-2">Settings</Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left text-gray-700 hover:text-primary-500 py-2 flex items-center"
                    >
                      <LogoutIcon className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block text-gray-700 hover:text-primary-500 py-2">Sign In</Link>
                    <Link href="/register" className="block text-gray-700 hover:text-primary-500 py-2">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 mt-20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img 
                  src="/logo.svg" 
                  alt="PixelSqueeze" 
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-gray-600 max-w-md">
                Professional image optimization and processing tools for developers, designers, and businesses.
                Transform your images with AI-powered optimization.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-600 hover:text-primary-500">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-600 hover:text-primary-500">Pricing</Link></li>
                <li><Link href="/api-docs" className="text-gray-600 hover:text-primary-500">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-600 hover:text-primary-500">About</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-primary-500">Contact</Link></li>
                <li><Link href="/blog" className="text-gray-600 hover:text-primary-500">Blog</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2024 PixelSqueeze. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
