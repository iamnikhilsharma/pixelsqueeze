import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  CogIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

export default function Settings() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    company: '',
    website: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    qualityDefault: 80,
    preserveMetadata: false,
    autoOptimize: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    (async () => {
      if (!token) {
        router.replace('/login');
        return;
      }
      await checkAuth();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Handle loading and authentication states
  if (!token || authLoading) {
    return null;
  }
  
  if (!isAuthenticated) {
    return null;
  }

  const validateProfile = () => {
    if (!profileData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!profileData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!profileData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(profileData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleProfileSave = async () => {
    if (!validateProfile()) {
      return;
    }

    setIsLoading(true);
    try {
      const authData = localStorage.getItem('pixelsqueeze-auth');
      const token = authData ? JSON.parse(authData).state.token : '';
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      toast.success('Profile updated successfully!');
      
      // Update local user data
      if (result.data) {
        // Update the auth store with new user data
        // This would typically be done through a store update function
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.message || 'Failed to update profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validatePreferences = () => {
    if (preferences.qualityDefault < 1 || preferences.qualityDefault > 100) {
      toast.error('Quality must be between 1 and 100');
      return false;
    }
    return true;
  };

  const handlePreferencesSave = async () => {
    if (!validatePreferences()) {
      return;
    }

    setIsLoading(true);
    try {
      const authData = localStorage.getItem('pixelsqueeze-auth');
      const token = authData ? JSON.parse(authData).state.token : '';
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save preferences');
      }

      toast.success('Preferences saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const copyApiKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      toast.success('API key copied to clipboard!');
    }
  };

  const regenerateApiKey = async () => {
    if (confirm('Are you sure you want to regenerate your API key? This will invalidate the current key.')) {
      try {
        const authData = localStorage.getItem('pixelsqueeze-auth');
        const token = authData ? JSON.parse(authData).state.token : '';
        
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/regenerate-api-key`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to regenerate API key');
        }

        const result = await response.json();
        toast.success('API key regenerated successfully!');
        
        // Update local user data with new API key
        if (result.data?.apiKey) {
          // This would typically update the auth store
          // For now, we'll reload the page to get updated data
          window.location.reload();
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to regenerate API key');
      }
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const authData = localStorage.getItem('pixelsqueeze-auth');
      const token = authData ? JSON.parse(authData).state.token : '';
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'api', name: 'API Settings', icon: KeyIcon },
    { id: 'preferences', name: 'Preferences', icon: CogIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={handleProfileSave}
                  loading={isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">API Configuration</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={user?.apiKey || ''}
                        readOnly
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showApiKey ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={copyApiKey}
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={regenerateApiKey}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Use this API key to authenticate your requests to the PixelSqueeze API.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">API Documentation</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Base URL: <code className="bg-white px-2 py-1 rounded">https://api.pixelsqueeze.com</code>
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Authentication: <code className="bg-white px-2 py-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
                    </p>
                    <Button variant="outline" size="sm">
                      View Full Documentation
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Optimization Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Quality
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={preferences.qualityDefault}
                      onChange={(e) => setPreferences(prev => ({ ...prev, qualityDefault: Number(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">{preferences.qualityDefault}%</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Default quality setting for image optimization
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Preserve Metadata</h3>
                      <p className="text-sm text-gray-500">Keep EXIF data in optimized images</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.preserveMetadata}
                      onChange={(e) => setPreferences(prev => ({ ...prev, preserveMetadata: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Auto-optimize on Upload</h3>
                      <p className="text-sm text-gray-500">Automatically optimize images when uploaded</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.autoOptimize}
                      onChange={(e) => setPreferences(prev => ({ ...prev, autoOptimize: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="primary"
                    onClick={handlePreferencesSave}
                    loading={isLoading}
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications about your account and usage</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Marketing Emails</h3>
                    <p className="text-sm text-gray-500">Receive updates about new features and promotions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketingEmails}
                    onChange={(e) => setPreferences(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={handlePreferencesSave}
                  loading={isLoading}
                >
                  Save Notification Settings
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <Button 
                      variant="primary" 
                      onClick={handlePasswordChange}
                      loading={isLoading}
                    >
                      Update Password
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Add an extra layer of security to your account with two-factor authentication.
                    </p>
                    <Button variant="outline">
                      Enable 2FA
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Deletion</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-600 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
} 