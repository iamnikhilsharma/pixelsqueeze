import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import NotificationExperienceDashboard from '../../components/NotificationExperienceDashboard';

const NotificationExperienceDemo = () => {
  return (
    <>
      <Head>
        <title>Notification Experience Demo - PixelSqueeze</title>
        <meta name="description" content="Demo of advanced notification features including themes, sounds, and preferences" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PS</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">PixelSqueeze</h1>
                <span className="text-sm text-gray-500">Notification Experience Demo</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  Back to Home
                </Link>
                <Link
                  href="/admin"
                  className="text-sm text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md hover:bg-blue-50"
                >
                  Admin Panel
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <NotificationExperienceDashboard />

        {/* Feature Highlights */}
        <div className="bg-white border-t border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Advanced Notification Features
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Experience the next generation of notification management with our comprehensive suite of tools and customization options.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Preferences</h3>
                <p className="text-gray-600 text-sm">
                  Granular control over notification channels, categories, and priorities with intelligent filtering.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Themes</h3>
                <p className="text-gray-600 text-sm">
                  Beautiful, customizable themes with dark mode, high contrast, and minimal options for every preference.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Audio Feedback</h3>
                <p className="text-gray-600 text-sm">
                  Rich sound notifications with volume control, multiple sound options, and quiet hours support.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Operations</h3>
                <p className="text-gray-600 text-sm">
                  Efficiently manage multiple notifications with bulk actions, filtering, and batch processing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Technical Implementation</h2>
              <p className="text-gray-600">
                Built with modern web technologies and best practices for performance and accessibility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Frontend</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• React with TypeScript</li>
                  <li>• Framer Motion animations</li>
                  <li>• Tailwind CSS styling</li>
                  <li>• Responsive design</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Backend</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Node.js with Express</li>
                  <li>• MongoDB with Mongoose</li>
                  <li>• WebSocket real-time updates</li>
                  <li>• Push notification service</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Real-time notifications</li>
                  <li>• Custom themes & sounds</li>
                  <li>• Bulk operations</li>
                  <li>• Accessibility support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationExperienceDemo;
