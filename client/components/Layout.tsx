import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { 
  MenuIcon, 
  CloseIcon, 
  UserIcon, 
  LogoutIcon,
  DashboardIcon,
  ImagesIcon,
  AdvancedToolsIcon,
  WatermarkIcon,
  ThumbnailIcon,
  AnalysisIcon,
  PerformanceIcon,
  SettingsIcon,
  ChevronDownIcon
} from './icons';
import { Dropdown, DropdownItem, DropdownDivider } from './Dropdown';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'PixelSqueeze - AI Image Compression' }: LayoutProps) {
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
        <meta name="description" content="Professional image optimization and processing tools for developers, designers, and businesses." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Navigation */}
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
              
              {/* Tools Dropdown */}
              <div className="relative group">
                <button className="nav-link flex items-center">
                  Tools
                  <ChevronDownIcon className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link href="/images" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg">Image Optimization</Link>
                  <Link href="/watermark" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Watermarking</Link>
                  <Link href="/thumbnails" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Thumbnails</Link>
                  <Link href="/image-analysis" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Image Analysis</Link>
                </div>
              </div>

              {/* Advanced Dropdown */}
              <div className="relative group">
                <button className="nav-link flex items-center">
                  Advanced
                  <ChevronDownIcon className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link href="/advanced-tools" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg">Advanced Tools</Link>
                  <Link href="/performance" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Performance Dashboard</Link>
                  <Link href="/api-docs" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">API Documentation</Link>
                </div>
              </div>

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
                className="text-gray-700 hover:text-gray-900 p-2"
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
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-200">
                    Welcome, {user.email}
                  </div>
                  
                  <Link href="/dashboard" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <DashboardIcon className="w-5 h-5" />
                    Dashboard
                  </Link>
                  
                  <Link href="/images" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <ImagesIcon className="w-5 h-5" />
                    My Images
                  </Link>
                  
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tools
                  </div>
                  
                  <Link href="/watermark" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <WatermarkIcon className="w-5 h-5" />
                    Watermark
                  </Link>
                  
                  <Link href="/thumbnails" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <ThumbnailIcon className="w-5 h-5" />
                    Thumbnails
                  </Link>
                  
                  <Link href="/image-analysis" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <AnalysisIcon className="w-5 h-5" />
                    Analysis
                  </Link>
                  
                  <Link href="/performance" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <PerformanceIcon className="w-5 h-5" />
                    Performance
                  </Link>
                  
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account
                  </div>
                  
                  <Link href="/settings" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <SettingsIcon className="w-5 h-5" />
                    Settings
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="mobile-nav-link w-full text-left"
                  >
                    <LogoutIcon className="w-5 h-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/register" className="mobile-nav-link bg-blue-600 text-white hover:bg-blue-700" onClick={() => setIsMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
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
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link></li>
                <li><Link href="/api" className="text-gray-600 hover:text-gray-900">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link></li>
                <li><Link href="/docs" className="text-gray-600 hover:text-gray-900">Documentation</Link></li>
                <li><Link href="/help" className="text-gray-600 hover:text-gray-900">Help Center</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-400 text-sm text-center">
              © 2024 PixelSqueeze. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 