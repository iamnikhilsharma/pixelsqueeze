import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Notification } from '../hooks/useNotifications';

interface BulkNotificationManagerProps {
  notifications: Notification[];
  onBulkAction: (action: string, notificationIds: string[]) => Promise<void>;
  className?: string;
}

interface BulkAction {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  requiresConfirmation: boolean;
}

const BulkNotificationManager: React.FC<BulkNotificationManagerProps> = ({
  notifications,
  onBulkAction,
  className = ''
}) => {
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  const bulkActions: BulkAction[] = [
    {
      id: 'mark-read',
      name: 'Mark as Read',
      icon: <EyeIcon className="h-4 w-4" />,
      description: 'Mark selected notifications as read',
      color: 'bg-blue-500 hover:bg-blue-600',
      requiresConfirmation: false
    },
    {
      id: 'mark-unread',
      name: 'Mark as Unread',
      icon: <EyeSlashIcon className="h-4 w-4" />,
      description: 'Mark selected notifications as unread',
      color: 'bg-gray-500 hover:bg-gray-600',
      requiresConfirmation: false
    },
    {
      id: 'delete',
      name: 'Delete',
      icon: <TrashIcon className="h-4 w-4" />,
      description: 'Permanently delete selected notifications',
      color: 'bg-red-500 hover:bg-red-600',
      requiresConfirmation: true
    },
    {
      id: 'archive',
      name: 'Archive',
      icon: <CheckIcon className="h-4 w-4" />,
      description: 'Archive selected notifications',
      color: 'bg-green-500 hover:bg-green-600',
      requiresConfirmation: false
    }
  ];

  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false;
    if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;
    if (filterRead !== 'all') {
      const isRead = notification.read;
      if (filterRead === 'read' && !isRead) return false;
      if (filterRead === 'unread' && isRead) return false;
    }
    return true;
  });

  // Update select all state
  useEffect(() => {
    if (filteredNotifications.length === 0) {
      setSelectAll(false);
      setSelectedNotifications(new Set());
    } else {
      const allSelected = filteredNotifications.every(n => selectedNotifications.has(n.id));
      setSelectAll(allSelected);
    }
  }, [filteredNotifications, selectedNotifications]);

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications(new Set());
    } else {
      const allIds = new Set(filteredNotifications.map(n => n.id));
      setSelectedNotifications(allIds);
    }
  };

  // Handle individual notification selection
  const handleNotificationSelect = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  // Handle bulk action
  const handleBulkAction = async (action: BulkAction) => {
    if (selectedNotifications.size === 0) return;

    if (action.requiresConfirmation) {
      const confirmed = window.confirm(
        `Are you sure you want to ${action.name.toLowerCase()} ${selectedNotifications.size} notification(s)? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    setIsProcessing(true);
    try {
      await onBulkAction(action.id, Array.from(selectedNotifications));
      setLastAction(action.name);
      setSelectedNotifications(new Set());
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setLastAction(null), 3000);
    } catch (error) {
      console.error(`Bulk action failed:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get category color
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

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-medium text-gray-900">Bulk Notification Manager</h3>
            {selectedNotifications.size > 0 && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {selectedNotifications.size} selected
              </span>
            )}
          </div>
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            disabled={selectedNotifications.size === 0}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              selectedNotifications.size > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {showBulkActions ? 'Hide' : 'Show'} Actions
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="info">Info</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="system">System</option>
            <option value="user">User</option>
            <option value="billing">Billing</option>
            <option value="security">Security</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {showBulkActions && selectedNotifications.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 border-b border-gray-200 bg-blue-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-900">
                  Bulk Actions ({selectedNotifications.size} selected)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {bulkActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleBulkAction(action)}
                    disabled={isProcessing}
                    className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium text-white rounded-md transition-colors ${action.color} ${
                      isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                    }`}
                  >
                    {action.icon}
                    <span>{action.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-2 bg-green-50 border-b border-green-200"
          >
            <div className="flex items-center space-x-2 text-green-800">
              <CheckIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                Successfully {lastAction.toLowerCase()}d {selectedNotifications.size} notification(s)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {/* Select All Row */}
        {filteredNotifications.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({filteredNotifications.length})
            </span>
          </div>
        )}

        {/* Individual Notifications */}
        {filteredNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No notifications match the current filters</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedNotifications.has(notification.id)}
                  onChange={() => handleNotificationSelect(notification.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className={`text-sm font-medium ${
                        notification.read ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(notification.category)}`}>
                        {notification.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm mt-1 ${
                    notification.read ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {notification.message}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Processing bulk action...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkNotificationManager;
