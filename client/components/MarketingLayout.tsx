import React from 'react';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  CogIcon,
  PhotoIcon,
  WrenchScrewdriverIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const { user, token, isAuthenticated, isLoading, hasRehydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center space-x-2">
              <img src="/icon.svg" alt="PixelSqueeze" className="h-8 w-8" />
              <span className="font-extrabold text-xl text-gray-900">Pixel<span className="text-primary-600">Squeeze</span></span>
            </a>
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <img src="/icon.svg" alt="PixelSqueeze" className="h-8 w-8" />
            <span className="font-extrabold text-xl text-gray-900">Pixel<span className="text-primary-600">Squeeze</span></span>
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {!isAuthenticated ? (
              <>
                <a href="/features" className="text-gray-600 hover:text-gray-900">Features</a>
                <a href="/how-it-works" className="text-gray-600 hover:text-gray-900">How it works</a>
                <a href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
                <a href="/login" className="text-gray-600 hover:text-gray-900">Log in</a>
                <Button href="/register" variant="primary" size="sm">Get started</Button>
              </>
            ) : (
              <>
                <a href="/features" className="text-gray-600 hover:text-gray-900">Features</a>
                <a href="/how-it-works" className="text-gray-600 hover:text-gray-900">How it works</a>
                <a href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
                
                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="font-medium">{user?.firstName || 'User'}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      
                      <a href="/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                        <PhotoIcon className="w-4 h-4 mr-3" />
                        Dashboard
                      </a>
                      
                      <a href="/images" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                        <PhotoIcon className="w-4 h-4 mr-3" />
                        My Images
                      </a>
                      
                      <a href="/advanced-tools" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                        <WrenchScrewdriverIcon className="w-4 h-4 mr-3" />
                        Advanced Tools
                      </a>
                      
                      <a href="/billing" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                        <CogIcon className="w-4 h-4 mr-3" />
                        Billing
                      </a>
                      
                      <a href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                        <CogIcon className="w-4 h-4 mr-3" />
                        Settings
                      </a>
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button 
                          onClick={() => {
                            localStorage.removeItem('pixelsqueeze-auth');
                            window.location.href = '/';
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-6 space-y-4">
              <a href="/features" className="block text-gray-600 hover:text-gray-900 py-2">Features</a>
              <a href="/how-it-works" className="block text-gray-600 hover:text-gray-900 py-2">How it works</a>
              <a href="/pricing" className="block text-gray-600 hover:text-gray-900 py-2">Pricing</a>
              
              {!isAuthenticated ? (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <a href="/login" className="block text-gray-600 hover:text-gray-900 py-2">Log in</a>
                  <Button href="/register" variant="primary" className="w-full">Get started</Button>
                </div>
              ) : (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="px-2 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  
                  <a href="/dashboard" className="flex items-center text-gray-700 hover:text-gray-900 py-2">
                    <PhotoIcon className="w-4 h-4 mr-3" />
                    Dashboard
                  </a>
                  
                  <a href="/images" className="flex items-center text-gray-700 hover:text-gray-900 py-2">
                    <PhotoIcon className="w-4 h-4 mr-3" />
                    My Images
                  </a>
                  
                  <a href="/advanced-tools" className="flex items-center text-gray-700 hover:text-gray-900 py-2">
                    <WrenchScrewdriverIcon className="w-4 h-4 mr-3" />
                    Advanced Tools
                  </a>
                  
                  <a href="/billing" className="flex items-center text-gray-700 hover:text-gray-900 py-2">
                    <CogIcon className="w-4 h-4 mr-3" />
                    Billing
                  </a>
                  
                  <a href="/settings" className="flex items-center text-gray-700 hover:text-gray-900 py-2">
                    <CogIcon className="w-4 h-4 mr-3" />
                    Settings
                  </a>
                  
                  <button 
                    onClick={() => {
                      localStorage.removeItem('pixelsqueeze-auth');
                      window.location.href = '/';
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full text-red-600 hover:text-red-700 py-2"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-gray-200 mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-6 md:grid-cols-3">
          <div>
            <a href="/" className="flex items-center space-x-2">
              <img src="/icon.svg" alt="PixelSqueeze" className="h-8 w-8" />
              <span className="font-bold text-gray-900">Pixel<span className="text-primary-600">Squeeze</span></span>
            </a>
            <p className="mt-3 text-sm text-gray-600">Fast, secure, and powerful image optimization for web apps and APIs.</p>
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-semibold text-gray-900">Product</div>
            <ul className="mt-2 space-y-2">
              <li><a href="/features" className="hover:text-gray-900">Features</a></li>
              <li><a href="/how-it-works" className="hover:text-gray-900">How it works</a></li>
              <li><a href="/pricing" className="hover:text-gray-900">Pricing</a></li>
            </ul>
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-semibold text-gray-900">Account</div>
            <ul className="mt-2 space-y-2">
              {!isAuthenticated ? (
                <>
                  <li><a href="/login" className="hover:text-gray-900">Log in</a></li>
                  <li><a href="/register" className="hover:text-gray-900">Create account</a></li>
                </>
              ) : (
                <>
                  <li><a href="/dashboard" className="hover:text-gray-900">Dashboard</a></li>
                  <li><a href="/images" className="hover:text-gray-900">My Images</a></li>
                  <li><a href="/settings" className="hover:text-gray-900">Settings</a></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-gray-500 flex items-center justify-between">
            <span>© {new Date().getFullYear()} PixelSqueeze</span>
            <div className="space-x-4">
              <a href="/privacy" className="hover:text-gray-900">Privacy</a>
              <a href="/terms" className="hover:text-gray-900">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
