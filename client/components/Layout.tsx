import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'PixelSqueeze - AI Image Compression' }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-green-50/30 to-primary-50/30">
      <Head>
        <title>{title}</title>
        <meta name="description" content="AI-powered image compression tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      {/* Enhanced Navigation */}
      <nav className="bg-white/95 backdrop-blur-xl border-b border-surface-200/50 sticky top-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 group">
                <div className="flex items-center space-x-3">
                  <img
                    className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                    src="/logo.svg"
                    alt="PixelSqueeze"
                  />
                  <span className="hidden sm:block text-xl font-bold gradient-text-primary">
                    PixelSqueeze
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {user ? (
                <>
                  <Link href="/dashboard" className="nav-link">
                    Dashboard
                  </Link>
                  <Link href="/images" className="nav-link">
                    Images
                  </Link>
                  <Link href="/advanced-tools" className="nav-link">
                    Advanced Tools
                  </Link>
                  <Link href="/watermark" className="nav-link">
                    Watermark
                  </Link>
                  <Link href="/settings" className="nav-link">
                    Settings
                  </Link>
                  <div className="w-px h-6 bg-surface-200 mx-2"></div>
                  <button
                    onClick={logout}
                    className="nav-link text-error-600 hover:bg-error-50 hover:text-error-700 hover:border-error-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/features"
                    className="nav-link"
                  >
                    Features
                  </Link>
                  <Link
                    href="/pricing"
                    className="nav-link"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/documentation"
                    className="nav-link"
                  >
                    Docs
                  </Link>
                  <div className="w-px h-6 bg-surface-200 mx-2"></div>
                  <Link
                    href="/login"
                    className="nav-link"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary text-sm px-6 py-2.5 ml-2"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-surface-200/50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="nav-link-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/images"
                    className="nav-link-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Images
                  </Link>
                  <Link
                    href="/advanced-tools"
                    className="nav-link-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Advanced Tools
                  </Link>
                  <Link
                    href="/watermark"
                    className="nav-link-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Watermark
                  </Link>
                  <Link
                    href="/settings"
                    className="nav-link-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="border-t border-surface-200 my-2"></div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="nav-link-mobile text-error-600 hover:bg-error-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/features"
                    className="nav-link-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="/pricing"
                    className="nav-link-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/documentation"
                    className="nav-link-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Documentation
                  </Link>
                  <div className="border-t border-surface-200 my-2"></div>
                  <Link
                    href="/login"
                    className="nav-link-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary text-sm px-6 py-3 w-full text-center mt-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-white/95 backdrop-blur-xl border-t border-surface-200/50 mt-auto">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img
                  className="h-10 w-auto"
                  src="/logo.svg"
                  alt="PixelSqueeze"
                />
                <span className="text-2xl font-bold gradient-text-primary">
                  PixelSqueeze
                </span>
              </div>
              <p className="text-surface-600 text-lg leading-relaxed max-w-md mb-6">
                Transform your images with AI-powered compression. Optimize, compress, and deliver faster than ever before.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-surface-400 hover:text-primary-600 transition-colors duration-200">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-surface-400 hover:text-primary-600 transition-colors duration-200">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-surface-400 hover:text-primary-600 transition-colors duration-200">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h3 className="text-surface-900 font-semibold mb-6 text-lg">Product</h3>
              <ul className="space-y-4">
                <li><Link href="/features" className="text-surface-600 hover:text-primary-600 transition-colors duration-200 hover:translate-x-1 transform inline-block">Features</Link></li>
                <li><Link href="/pricing" className="text-surface-600 hover:text-primary-600 transition-colors duration-200 hover:translate-x-1 transform inline-block">Pricing</Link></li>
                <li><Link href="/documentation" className="text-surface-600 hover:text-primary-600 transition-colors duration-200 hover:translate-x-1 transform inline-block">Documentation</Link></li>
                <li><Link href="/api" className="text-surface-600 hover:text-primary-600 transition-colors duration-200 hover:translate-x-1 transform inline-block">API</Link></li>
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h3 className="text-surface-900 font-semibold mb-6 text-lg">Company</h3>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-surface-600 hover:text-primary-600 transition-colors duration-200 hover:translate-x-1 transform inline-block">About</Link></li>
                <li><Link href="/contact" className="text-surface-600 hover:text-primary-600 transition-colors duration-200 hover:translate-x-1 transform inline-block">Contact</Link></li>
                <li><Link href="/privacy" className="text-surface-600 hover:text-primary-600 transition-colors duration-200 hover:translate-x-1 transform inline-block">Privacy</Link></li>
                <li><Link href="/terms" className="text-surface-600 hover:text-primary-600 transition-colors duration-200 hover:translate-x-1 transform inline-block">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-surface-200 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-surface-500 text-sm">
                © 2024 PixelSqueeze. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm text-surface-500">
                <span>Made with ❤️ for developers</span>
                <div className="w-1 h-1 bg-surface-300 rounded-full"></div>
                <span>Powered by AI</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 