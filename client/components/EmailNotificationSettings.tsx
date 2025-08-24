import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  EnvelopeIcon, 
  BellIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  email: boolean;
  inApp: boolean;
  category: 'system' | 'user' | 'billing' | 'security';
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

interface EmailNotificationSettingsProps {
  className?: string;
}

const EmailNotificationSettings: React.FC<EmailNotificationSettingsProps> = ({
  className = ''
}) => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preferences' | 'templates'>('preferences');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const [prefsResponse, templatesResponse] = await Promise.all([
        fetch('/api/admin/notifications/preferences', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/notifications/templates', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (prefsResponse.ok) {
        const prefsData = await prefsResponse.json();
        setPreferences(prefsData.data || []);
      }
      
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.data || []);
      }
    } catch (err) {
      console.error('Error loading notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (prefId: string, field: 'email' | 'inApp', value: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/notifications/preferences/${prefId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ [field]: value })
      });
      
      if (response.ok) {
        setPreferences(preferences.map(p => 
          p.id === prefId ? { ...p, [field]: value } : p
        ));
      }
    } catch (err) {
      console.error('Error updating preference:', err);
    }
  };

  const saveTemplate = async (template: EmailTemplate) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/notifications/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(template)
      });
      
      if (response.ok) {
        setTemplates(templates.map(t => 
          t.id === template.id ? template : t
        ));
        setEditingTemplate(null);
      }
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  const toggleTemplate = async (templateId: string) => {
    try {
      const token = localStorage.getItem('token');
      const template = templates.find(t => t.id === templateId);
      if (!template) return;
      
      const response = await fetch(`/api/admin/notifications/templates/${templateId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setTemplates(templates.map(t => 
          t.id === templateId ? { ...t, isActive: !t.isActive } : t
        ));
      }
    } catch (err) {
      console.error('Error toggling template:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <CogIcon className="h-4 w-4" />;
      case 'user':
        return <BellIcon className="h-4 w-4" />;
      case 'billing':
        return <EnvelopeIcon className="h-4 w-4" />;
      case 'security':
        return <CogIcon className="h-4 w-4" />;
      default:
        return <BellIcon className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      case 'billing':
        return 'bg-purple-100 text-purple-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl bg-white p-6 shadow-lg ${className}`}>
        <div className="flex h-32 items-center justify-center">
          <div className="text-lg text-gray-600">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-white shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Email Notification Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure email notifications and templates for various system events
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {[
            { key: 'preferences', label: 'Preferences', icon: BellIcon },
            { key: 'templates', label: 'Email Templates', icon: EnvelopeIcon }
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
        {activeTab === 'preferences' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {preferences.map((pref) => (
                <motion.div
                  key={pref.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(pref.category)}
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(pref.category)}`}>
                        {pref.category}
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1">{pref.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">{pref.description}</p>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pref.email}
                        onChange={(e) => updatePreference(pref.id, 'email', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Email notification</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pref.inApp}
                        onChange={(e) => updatePreference(pref.id, 'inApp', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">In-app notification</span>
                    </label>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Email Templates</h4>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                Create New Template
              </button>
            </div>
            
            <div className="space-y-4">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h5 className="font-medium text-gray-900">{template.name}</h5>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleTemplate(template.id)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          template.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {template.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Subject:</span> {template.subject}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Variables:</span> {template.variables.join(', ')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Email Template</h3>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template Name</label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Body</label>
                    <textarea
                      rows={8}
                      value={editingTemplate.body}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Use {{variable}} syntax for dynamic content..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => saveTemplate(editingTemplate)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailNotificationSettings;
