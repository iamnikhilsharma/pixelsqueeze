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
  SettingsIcon
} from './icons';
import { Dropdown, DropdownItem, DropdownDivider } from './Dropdown';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'PixelSqueeze - AI Image Compression' }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
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
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  {/* Main Tools Dropdown */}
                  <Dropdown 
                    trigger={<span>Tools</span>}
                    width="lg"
                  >
                    <DropdownItem href="/dashboard" icon={<DashboardIcon className="w-4 h-4" />}>
                      Dashboard
                    </DropdownItem>
                    <DropdownItem href="/images" icon={<ImagesIcon className="w-4 h-4" />}>
                      My Images
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem href="/watermark" icon={<WatermarkIcon className="w-4 h-4" />}>
                      Watermark Tool
                    </DropdownItem>
                    <DropdownItem href="/thumbnails" icon={<ThumbnailIcon className="w-4 h-4" />}>
                      Thumbnail Generator
                    </DropdownItem>
                    <DropdownItem href="/image-analysis" icon={<AnalysisIcon className="w-4 h-4" />}>
                      Image Analysis
                    </DropdownItem>
                    <DropdownItem href="/performance" icon={<PerformanceIcon className="w-4 h-4" />}>
                      Performance
                    </DropdownItem>
                  </Dropdown>

                  {/* Advanced Tools Dropdown */}
                  <Dropdown 
                    trigger={<span>Advanced</span>}
                    width="md"
                  >
                    <DropdownItem href="/advanced-tools" icon={<AdvancedToolsIcon className="w-4 h-4" />}>
                      All Tools
                    </DropdownItem>
                    <DropdownItem href="/settings" icon={<SettingsIcon className="w-4 h-4" />}>
                      Settings
                    </DropdownItem>
                  </Dropdown>

                  {/* User Dropdown */}
                  <Dropdown 
                    trigger={<span className="flex items-center space-x-2"><UserIcon className="w-5 h-5" /><span>{user.email}</span></span>}
                    align="right"
                    width="md"
                  >
                    <DropdownItem href="/dashboard" icon={<DashboardIcon className="w-4 h-4" />}>
                      Dashboard
                    </DropdownItem>
                    <DropdownItem href="/settings" icon={<SettingsIcon className="w-4 h-4" />}>
                      Account Settings
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem onClick={handleLogout} icon={<LogoutIcon className="w-4 h-4" />}>
                      Sign Out
                    </DropdownItem>
                  </Dropdown>
                </>
              ) : (
                <>
                  <Link href="/login" className="nav-link">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-gray-900 p-2"
              >
                {mobileMenuOpen ? (
                  <CloseIcon className="w-6 h-6" />
                ) : (
                  <MenuIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-200">
                    Welcome, {user.email}
                  </div>
                  
                  <Link href="/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <DashboardIcon className="w-5 h-5" />
                    Dashboard
                  </Link>
                  
                  <Link href="/images" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <ImagesIcon className="w-5 h-5" />
                    My Images
                  </Link>
                  
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tools
                  </div>
                  
                  <Link href="/watermark" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <WatermarkIcon className="w-5 h-5" />
                    Watermark
                  </Link>
                  
                  <Link href="/thumbnails" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <ThumbnailIcon className="w-5 h-5" />
                    Thumbnails
                  </Link>
                  
                  <Link href="/image-analysis" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <AnalysisIcon className="w-5 h-5" />
                    Analysis
                  </Link>
                  
                  <Link href="/performance" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <PerformanceIcon className="w-5 h-5" />
                    Performance
                  </Link>
                  
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account
                  </div>
                  
                  <Link href="/settings" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
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
                  <Link href="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/register" className="mobile-nav-link bg-blue-600 text-white hover:bg-blue-700" onClick={() => setMobileMenuOpen(false)}>
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