import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    categories: Record<string, boolean>;
    priorities: Record<string, boolean>;
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    categories: Record<string, boolean>;
    priorities: Record<string, boolean>;
  };
  push: {
    enabled: boolean;
    platform: 'web' | 'ios' | 'android';
    categories: Record<string, boolean>;
    priorities: Record<string, boolean>;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

interface EnhancedNotificationPreferencesProps {
  className?: string;
}

const EnhancedNotificationPreferences: React.FC<EnhancedNotificationPreferencesProps> = ({
  className = ''
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      frequency: 'immediate',
      categories: { system: true, user: true, billing: true, security: true },
      priorities: { low: false, medium: true, high: true, critical: true }
    },
    inApp: {
      enabled: true,
      sound: true,
      desktop: true,
      categories: { system: true, user: true, billing: true, security: true },
      priorities: { low: true, medium: true, high: true, critical: true }
    },
    push: {
      enabled: false,
      platform: 'web',
      categories: { system: true, user: true, billing: true, security: true },
      priorities: { low: false, medium: true, high: true, critical: true }
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'UTC'
    }
  });

  const [activeTab, setActiveTab] = useState<'channels' | 'categories' | 'priorities' | 'quiet-hours'>('channels');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const categories = [
    { id: 'system', name: 'System', description: 'System maintenance and updates', icon: CogIcon },
    { id: 'user', name: 'User', description: 'User account activities', icon: EyeIcon },
    { id: 'billing', name: 'Billing', description: 'Payment and subscription updates', icon: EnvelopeIcon },
    { id: 'security', name: 'Security', description: 'Security alerts and warnings', icon: EyeSlashIcon }
  ];

  const priorities = [
    { id: 'low', name: 'Low', description: 'Informational updates', color: 'bg-gray-100 text-gray-800' },
    { id: 'medium', name: 'Medium', description: 'Important updates', color: 'bg-blue-100 text-blue-800' },
    { id: 'high', name: 'High', description: 'Urgent updates', color: 'bg-orange-100 text-orange-800' },
    { id: 'critical', name: 'Critical', description: 'Immediate attention required', color: 'bg-red-100 text-red-800' }
  ];

  const channels = [
    { id: 'email', name: 'Email', icon: EnvelopeIcon, description: 'Receive notifications via email' },
    { id: 'inApp', name: 'In-App', icon: BellIcon, description: 'Show notifications within the application' },
    { id: 'push', name: 'Push', icon: DevicePhoneMobileIcon, description: 'Push notifications to your device' }
  ];

  const handleChannelToggle = (channelId: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        enabled: !prev[channelId].enabled
      }
    }));
  };

  const handleCategoryToggle = (channelId: keyof NotificationPreferences, categoryId: string) => {
    setPreferences(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        categories: channelId === 'quietHours' ? {} : {
          ...(prev[channelId] as any).categories,
          [categoryId]: !(prev[channelId] as any).categories[categoryId]
        }
      }
    }));
  };

  const handlePriorityToggle = (channelId: keyof NotificationPreferences, priorityId: string) => {
    setPreferences(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        priorities: channelId === 'quietHours' ? {} : {
          ...(prev[channelId] as any).priorities,
          [priorityId]: !(prev[channelId] as any).priorities[priorityId]
        }
      }
    }));
  };

  const handleQuietHoursToggle = () => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all preferences to defaults?')) {
      setPreferences({
        email: { enabled: true, frequency: 'immediate', categories: { system: true, user: true, billing: true, security: true }, priorities: { low: false, medium: true, high: true, critical: true } },
        inApp: { enabled: true, sound: true, desktop: true, categories: { system: true, user: true, billing: true, security: true }, priorities: { low: true, medium: true, high: true, critical: true } },
        push: { enabled: false, platform: 'web', categories: { system: true, user: true, billing: true, security: true }, priorities: { low: false, medium: true, high: true, critical: true } },
        quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' }
      });
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
            <p className="text-sm text-gray-600 mt-1">Customize how and when you receive notifications</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {[
            { key: 'channels', label: 'Channels', icon: BellIcon },
            { key: 'categories', label: 'Categories', icon: CogIcon },
            { key: 'priorities', label: 'Priorities', icon: EyeIcon },
            { key: 'quiet-hours', label: 'Quiet Hours', icon: ClockIcon }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'channels' && (
          <div className="space-y-6">
            {channels.map((channel) => {
              const channelData = preferences[channel.id as keyof NotificationPreferences];
              return (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <channel.icon className="h-6 w-6 text-gray-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{channel.name}</h4>
                        <p className="text-sm text-gray-600">{channel.description}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channelData.enabled}
                        onChange={() => handleChannelToggle(channel.id as keyof NotificationPreferences)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-4">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <category.icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {channels.map((channel) => {
                    const channelData = preferences[channel.id as keyof NotificationPreferences];
                    return (
                      <label key={channel.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={channelData.enabled && (channelData as any).categories?.[category.id]}
                          disabled={!channelData.enabled}
                          onChange={() => handleCategoryToggle(channel.id as keyof NotificationPreferences, category.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700">{channel.name}</span>
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'priorities' && (
          <div className="space-y-4">
            {priorities.map((priority) => (
              <motion.div
                key={priority.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priority.color}`}>
                      {priority.name}
                    </span>
                    <p className="text-sm text-gray-600">{priority.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {channels.map((channel) => {
                    const channelData = preferences[channel.id as keyof NotificationPreferences];
                    return (
                      <label key={channel.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={channelData.enabled && (channelData as any).priorities?.[priority.id]}
                          disabled={!channelData.enabled}
                          onChange={() => handlePriorityToggle(channel.id as keyof NotificationPreferences, priority.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700">{channel.name}</span>
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'quiet-hours' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-6 w-6 text-gray-600" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Quiet Hours</h4>
                  <p className="text-sm text-gray-600">Pause notifications during specific hours</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.quietHours.enabled}
                  onChange={handleQuietHoursToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, start: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, end: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Save Status */}
      {lastSaved && (
        <div className="px-6 py-3 bg-green-50 border-t border-green-200">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              Preferences saved at {lastSaved.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedNotificationPreferences;
