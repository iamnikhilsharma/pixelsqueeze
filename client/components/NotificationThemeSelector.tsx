import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaintBrushIcon,
  SunIcon,
  MoonIcon,
  EyeIcon,
  CogIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  isActive: boolean;
  isCustom: boolean;
}

interface NotificationThemeSelectorProps {
  className?: string;
  onThemeChange?: (themeId: string) => void;
}

const NotificationThemeSelector: React.FC<NotificationThemeSelectorProps> = ({
  className = '',
  onThemeChange
}) => {
  const [themes, setThemes] = useState<Theme[]>([
    {
      id: 'default',
      name: 'Default Theme',
      description: 'Clean and modern default theme',
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#06B6D4',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        border: '#E5E7EB'
      },
      isActive: true,
      isCustom: false
    },
    {
      id: 'dark',
      name: 'Dark Theme',
      description: 'Elegant dark theme for low-light environments',
      colors: {
        primary: '#60A5FA',
        secondary: '#9CA3AF',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#22D3EE',
        background: '#111827',
        surface: '#1F2937',
        text: '#F9FAFB',
        border: '#374151'
      },
      isActive: false,
      isCustom: false
    },
    {
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'High contrast theme for accessibility',
      colors: {
        primary: '#000000',
        secondary: '#333333',
        success: '#006600',
        warning: '#CC6600',
        error: '#CC0000',
        info: '#0066CC',
        background: '#FFFFFF',
        surface: '#F0F0F0',
        text: '#000000',
        border: '#000000'
      },
      isActive: false,
      isCustom: false
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and minimal design',
      colors: {
        primary: '#000000',
        secondary: '#666666',
        success: '#000000',
        warning: '#000000',
        error: '#000000',
        info: '#000000',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        text: '#000000',
        border: '#E5E5E5'
      },
      isActive: false,
      isCustom: false
    }
  ]);

  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [showPreview, setShowPreview] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('notification-theme');
    if (savedTheme && themes.find(t => t.id === savedTheme)) {
      setSelectedTheme(savedTheme);
      activateTheme(savedTheme);
    }
  }, []);

  const activateTheme = (themeId: string) => {
    setThemes(prev => prev.map(theme => ({
      ...theme,
      isActive: theme.id === themeId
    })));
    setSelectedTheme(themeId);
    localStorage.setItem('notification-theme', themeId);
    onThemeChange?.(themeId);
  };

  const getThemePreview = (theme: Theme) => {
    return (
      <div 
        className="p-4 rounded-lg border"
        style={{ 
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border
        }}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: theme.colors.text }}
            >
              Theme Preview
            </span>
          </div>

          {/* Sample notification */}
          <div 
            className="p-3 rounded border"
            style={{ 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }}
          >
            <div className="flex items-start space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <span className="text-white text-xs">ℹ</span>
              </div>
              <div className="flex-1">
                <h4 
                  className="text-sm font-medium mb-1"
                  style={{ color: theme.colors.text }}
                >
                  Sample Notification
                </h4>
                <p 
                  className="text-sm"
                  style={{ color: theme.colors.secondary }}
                >
                  This is how notifications will look with this theme.
                </p>
              </div>
            </div>
          </div>

          {/* Color palette */}
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(theme.colors).slice(0, 5).map(([key, color]) => (
              <div key={key} className="text-center">
                <div 
                  className="w-6 h-6 rounded mx-auto mb-1 border border-gray-200"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-500">{key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const createCustomTheme = () => {
    const customTheme: Theme = {
      id: `custom-${Date.now()}`,
      name: 'Custom Theme',
      description: 'Your personalized notification theme',
      colors: {
        primary: '#8B5CF6',
        secondary: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#06B6D4',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text: '#1E293B',
        border: '#E2E8F0'
      },
      isActive: false,
      isCustom: true
    };

    setThemes(prev => [...prev, customTheme]);
    setSelectedTheme(customTheme.id);
    setShowCustomizer(true);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PaintBrushIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Notification Themes</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={createCustomTheme}
              className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded hover:bg-purple-100"
            >
              Custom
            </button>
          </div>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map((theme) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                theme.isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => activateTheme(theme.id)}
            >
              {/* Active indicator */}
              {theme.isActive && (
                <div className="absolute top-2 right-2">
                  <CheckIcon className="h-5 w-5 text-blue-600" />
                </div>
              )}

              {/* Theme info */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{theme.name}</h4>
                  {theme.isCustom && (
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{theme.description}</p>
              </div>

              {/* Color preview */}
              <div className="flex space-x-2">
                {Object.entries(theme.colors).slice(0, 6).map(([key, color]) => (
                  <div
                    key={key}
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: color }}
                    title={key}
                  />
                ))}
              </div>

              {/* Apply button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  activateTheme(theme.id);
                }}
                className={`mt-3 w-full py-2 px-3 text-xs font-medium rounded transition-colors ${
                  theme.isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {theme.isActive ? 'Active' : 'Apply Theme'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Theme Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 overflow-hidden"
          >
            <div className="p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Theme Preview</h4>
              {getThemePreview(themes.find(t => t.id === selectedTheme) || themes[0])}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Theme Creator */}
      <AnimatePresence>
        {showCustomizer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 overflow-hidden"
          >
            <div className="p-4 bg-purple-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Theme Creator</h4>
              <p className="text-sm text-gray-600 mb-4">
                Create your own notification theme by customizing colors and styles.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowCustomizer(false)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCustomizer(false)}
                  className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
                >
                  Save Theme
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Active theme: {themes.find(t => t.id === selectedTheme)?.name}
          </span>
          <span>
            {themes.filter(t => t.isCustom).length} custom themes
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotificationThemeSelector;
