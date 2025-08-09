import React from 'react';
import { Button } from '@/components/Button';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <img src="/icon.svg" alt="PixelSqueeze" className="h-8 w-8" />
            <span className="font-extrabold text-xl text-gray-900">Pixel<span className="text-primary-600">Squeeze</span></span>
          </a>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="/how-it-works" className="text-gray-600 hover:text-gray-900">How it works</a>
            <a href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="/login" className="text-gray-600 hover:text-gray-900">Log in</a>
            <Button href="/register" variant="primary" size="sm">Get started</Button>
          </nav>
        </div>
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
              <li><a href="/login" className="hover:text-gray-900">Log in</a></li>
              <li><a href="/register" className="hover:text-gray-900">Create account</a></li>
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
