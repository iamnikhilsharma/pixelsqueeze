import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowDownTrayIcon, 
  DocumentTextIcon,
  TableCellsIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Notification } from '../hooks/useNotifications';

interface NotificationExportProps {
  notifications: Notification[];
  className?: string;
}

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: React.ReactNode;
  description: string;
}

interface ExportSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  format: string;
  email: string;
  isActive: boolean;
}

const NotificationExport: React.FC<NotificationExportProps> = ({
  notifications,
  className = ''
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date()
  });
  const [includeFilters, setIncludeFilters] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [schedules, setSchedules] = useState<ExportSchedule[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<ExportSchedule>>({
    name: '',
    frequency: 'weekly',
    time: '09:00',
    format: 'csv',
    email: '',
    isActive: true
  });

  const exportFormats: ExportFormat[] = [
    {
      id: 'csv',
      name: 'CSV',
      extension: '.csv',
      icon: <TableCellsIcon className="h-5 w-5" />,
      description: 'Comma-separated values for spreadsheet applications'
    },
    {
      id: 'json',
      name: 'JSON',
      extension: '.json',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      description: 'Structured data format for APIs and development'
    },
    {
      id: 'pdf',
      name: 'PDF',
      extension: '.pdf',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      description: 'Portable document format for reports and sharing'
    }
  ];

  const exportFrequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/notifications/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          format: selectedFormat,
          dateRange,
          includeFilters,
          notifications: notifications.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: n.timestamp,
            read: n.read,
            category: n.category,
            priority: n.priority
          }))
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notifications-${new Date().toISOString().split('T')[0]}${exportFormats.find(f => f.id === selectedFormat)?.extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error exporting notifications:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/notifications/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSchedule)
      });

      if (response.ok) {
        const schedule = await response.json();
        setSchedules([...schedules, schedule.data]);
        setShowScheduleModal(false);
        setNewSchedule({
          name: '',
          frequency: 'weekly',
          time: '09:00',
          format: 'csv',
          email: '',
          isActive: true
        });
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
    }
  };

  const toggleSchedule = async (scheduleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/notifications/schedules/${scheduleId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSchedules(schedules.map(s => 
          s.id === scheduleId ? { ...s, isActive: !s.isActive } : s
        ));
      }
    } catch (err) {
      console.error('Error toggling schedule:', err);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/notifications/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSchedules(schedules.filter(s => s.id !== scheduleId));
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Export & Reports</h3>
        <p className="text-xs text-gray-500 mt-1">Export notifications and schedule automated reports</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Export Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Export Notifications</h4>
          
          {/* Format Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {exportFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  selectedFormat === format.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-600">{format.icon}</span>
                  <span className="font-medium text-gray-900">{format.name}</span>
                </div>
                <p className="text-xs text-gray-600">{format.description}</p>
              </button>
            ))}
          </div>

          {/* Export Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="includeFilters"
              checked={includeFilters}
              onChange={(e) => setIncludeFilters(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="includeFilters" className="ml-2 text-sm text-gray-700">
              Include current filter settings in export
            </label>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : `Export as ${exportFormats.find(f => f.id === selectedFormat)?.name}`}
          </button>
        </div>

        {/* Scheduled Reports */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Scheduled Reports</h4>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Schedule
            </button>
          </div>

          <div className="space-y-2">
            {schedules.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No scheduled reports</p>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{schedule.name}</p>
                      <p className="text-xs text-gray-500">
                        {schedule.frequency} at {schedule.time} • {schedule.format.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleSchedule(schedule.id)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        schedule.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Automated Report</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Schedule Name</label>
                    <input
                      type="text"
                      value={newSchedule.name}
                      onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Weekly Summary Report"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Frequency</label>
                      <select
                        value={newSchedule.frequency}
                        onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value as any })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      >
                        {exportFrequencies.map(freq => (
                          <option key={freq.value} value={freq.value}>{freq.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <input
                        type="time"
                        value={newSchedule.time}
                        onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Format</label>
                      <select
                        value={newSchedule.format}
                        onChange={(e) => setNewSchedule({ ...newSchedule, format: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      >
                        {exportFormats.map(format => (
                          <option key={format.id} value={format.id}>{format.name.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={newSchedule.email}
                        onChange={(e) => setNewSchedule({ ...newSchedule, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="admin@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleCreateSchedule}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Create Schedule
                </button>
                <button
                  onClick={() => setShowScheduleModal(false)}
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

export default NotificationExport;
