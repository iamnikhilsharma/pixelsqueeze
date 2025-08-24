import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FunnelIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { NotificationFilters as Filters } from '../hooks/useNotifications';

interface NotificationFiltersProps {
  filters: Filters;
  onUpdateFilters: (filters: Partial<Filters>) => void;
  onClearFilters: () => void;
  className?: string;
}

const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  filters,
  onUpdateFilters,
  onClearFilters,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  const handleFilterChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onUpdateFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onUpdateFilters(localFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    !(Array.isArray(value) && value.length === 0)
  );

  const filterOptions = {
    type: [
      { value: 'success', label: 'Success', color: 'bg-green-100 text-green-800' },
      { value: 'warning', label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'error', label: 'Error', color: 'bg-red-100 text-red-800' },
      { value: 'info', label: 'Info', color: 'bg-blue-100 text-blue-800' },
      { value: 'system', label: 'System', color: 'bg-gray-100 text-gray-800' }
    ],
    category: [
      { value: 'system', label: 'System', color: 'bg-blue-100 text-blue-800' },
      { value: 'user', label: 'User', color: 'bg-green-100 text-green-800' },
      { value: 'billing', label: 'Billing', color: 'bg-purple-100 text-purple-800' },
      { value: 'security', label: 'Security', color: 'bg-red-100 text-red-800' }
    ],
    priority: [
      { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
      { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
      { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
    ],
    read: [
      { value: true, label: 'Read', color: 'bg-green-100 text-green-800' },
      { value: false, label: 'Unread', color: 'bg-blue-100 text-blue-800' }
    ]
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {isExpanded ? 'Hide' : 'Show'} Filters
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={localFilters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Type and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={localFilters.type || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    {filterOptions.type.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={localFilters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {filterOptions.category.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority and Read Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={localFilters.priority || ''}
                    onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Priorities</option>
                    {filterOptions.priority.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={localFilters.read === undefined ? '' : localFilters.read.toString()}
                    onChange={(e) => handleFilterChange('read', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    {filterOptions.read.map(option => (
                      <option key={option.value.toString()} value={option.value.toString()}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={localFilters.dateRange?.start?.toISOString().split('T')[0] || ''}
                      onChange={(e) => {
                        const start = e.target.value ? new Date(e.target.value) : undefined;
                        const end = localFilters.dateRange?.end;
                        handleFilterChange('dateRange', start && end ? { start, end } : undefined);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={localFilters.dateRange?.end?.toISOString().split('T')[0] || ''}
                      onChange={(e) => {
                        const end = e.target.value ? new Date(e.target.value) : undefined;
                        const start = localFilters.dateRange?.start;
                        handleFilterChange('dateRange', start && end ? { start, end } : undefined);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(filters).map(([key, value]) => {
                      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null;
                      
                      let displayValue = value;
                      if (key === 'dateRange' && value.start && value.end) {
                        displayValue = `${value.start.toLocaleDateString()} - ${value.end.toLocaleDateString()}`;
                      } else if (key === 'read') {
                        displayValue = value ? 'Read' : 'Unread';
                      }
                      
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                        >
                          {key}: {displayValue}
                          <button
                            onClick={() => onUpdateFilters({ [key]: undefined })}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationFilters;
