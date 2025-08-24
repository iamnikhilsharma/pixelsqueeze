import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BellIcon,
  CogIcon,
  PaintBrushIcon,
  MusicalNoteIcon,
  DevicePhoneMobileIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import EnhancedNotificationPreferences from './EnhancedNotificationPreferences';
import NotificationThemeSelector from './NotificationThemeSelector';
import NotificationSoundPlayer from './NotificationSoundPlayer';
import BulkNotificationManager from './BulkNotificationManager';

interface NotificationExperienceDashboardProps {
  className?: string;
}

const NotificationExperienceDashboard: React.FC<NotificationExperienceDashboardProps> = ({
  className = ''
}) => {
  const [activeSection, setActiveSection] = useState<'preferences' | 'themes' | 'sounds' | 'bulk'>('preferences');
  const [notifications] = useState([
    {
      id: '1',
      type: 'success' as const,
      title: 'Welcome to PixelSqueeze!',
      message: 'Your account has been successfully created.',
      timestamp: new Date(),
      read: false,
      category: 'user' as const,
      priority: 'medium' as const
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'System Update Available',
      message: 'A new system update is ready to install.',
      timestamp: new Date(Date.now() - 60000),
      read: true,
      category: 'system' as const,
      priority: 'low' as const
    }
  ]);

  const sections = [
    {
      id: 'preferences',
      name: 'Preferences',
      description: 'Manage notification channels and settings',
      icon: CogIcon,
      color: 'blue'
    },
    {
      id: 'themes',
      name: 'Themes',
      description: 'Customize notification appearance',
      icon: PaintBrushIcon,
      color: 'purple'
    },
    {
      id: 'sounds',
      name: 'Sounds',
      description: 'Configure audio notifications',
      icon: MusicalNoteIcon,
      color: 'green'
    },
    {
      id: 'bulk',
      name: 'Bulk Management',
      description: 'Manage multiple notifications',
      icon: EyeIcon,
      color: 'orange'
    }
  ];

  const handleBulkAction = async (action: string, notificationIds: string[]) => {
    console.log(`Bulk action: ${action} on ${notificationIds.length} notifications`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const getSectionContent = () => {
    switch (activeSection) {
      case 'preferences':
        return <EnhancedNotificationPreferences />;
      case 'themes':
        return <NotificationThemeSelector />;
      case 'sounds':
        return <NotificationSoundPlayer />;
      case 'bulk':
        return <BulkNotificationManager notifications={notifications} onBulkAction={handleBulkAction} />;
      default:
        return <EnhancedNotificationPreferences />;
    }
  };

  const getSectionIcon = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return null;
    
    const IconComponent = section.icon;
    return <IconComponent className="h-5 w-5" />;
  };

  const getSectionColor = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 'gray';
    return section.color;
  };

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BellIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Experience</h1>
              <p className="text-gray-600 mt-1">
                Customize and manage your notification preferences, themes, and settings
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Settings</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  const colorClasses = {
                    blue: isActive ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-blue-50 hover:border-blue-200',
                    purple: isActive ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:bg-purple-50 hover:border-purple-200',
                    green: isActive ? 'bg-green-50 border-green-200 text-green-700' : 'hover:bg-green-50 hover:border-green-200',
                    orange: isActive ? 'bg-orange-50 border-orange-200 text-orange-700' : 'hover:bg-orange-50 hover:border-orange-200'
                  };

                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => setActiveSection(section.id as any)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                        isActive 
                          ? colorClasses[section.color as keyof typeof colorClasses]
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <section.icon className={`h-5 w-5 ${
                        isActive ? `text-${section.color}-600` : 'text-gray-400'
                      }`} />
                      <div className="text-left">
                        <div className="font-medium">{section.name}</div>
                        <div className={`text-xs ${
                          isActive ? `text-${section.color}-600` : 'text-gray-500'
                        }`}>
                          {section.description}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Notifications</span>
                    <span className="font-medium text-gray-900">{notifications.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Unread</span>
                    <span className="font-medium text-gray-900">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Theme</span>
                    <span className="font-medium text-gray-900">Default</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {getSectionContent()}
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>
              Notification preferences are saved automatically and synchronized across all your devices.
            </p>
            <p className="mt-2">
              Need help? Check our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                notification guide
              </a>
              {' '}or{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationExperienceDashboard;
