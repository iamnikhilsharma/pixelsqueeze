import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'system' | 'user' | 'billing' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  type?: Notification['type'];
  category?: Notification['category'];
  priority?: Notification['priority'];
  read?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<Notification['type'], number>;
  byCategory: Record<Notification['category'], number>;
  byPriority: Record<Notification['priority'], number>;
}

const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5002';
      const ws = new WebSocket(`${wsUrl}/ws/notifications?token=${token}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected for notifications');
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            handleNewNotification(data.notification);
          } else if (data.type === 'stats_update') {
            setStats(data.stats);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error initializing WebSocket:', err);
      setError('Failed to establish real-time connection');
    }
  }, []);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      initializeWebSocket();
    }, 5000); // Retry after 5 seconds
  }, [initializeWebSocket]);

  // Handle new notification
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Show toast for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'critical') {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <div className="h-6 w-6 text-green-400">✓</div>}
                {notification.type === 'warning' && <div className="h-6 w-6 text-yellow-400">⚠</div>}
                {notification.type === 'error' && <div className="h-6 w-6 text-red-400">✗</div>}
                {notification.type === 'info' && <div className="h-6 w-6 text-blue-400">ℹ</div>}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      ), {
        duration: 6000,
        position: 'top-right',
      });
    }
  }, []);

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setStats(data.stats || null);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Error loading notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters to notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Type filter
      if (filters.type && notification.type !== filters.type) return false;
      
      // Category filter
      if (filters.category && notification.category !== filters.category) return false;
      
      // Priority filter
      if (filters.priority && notification.priority !== filters.priority) return false;
      
      // Read status filter
      if (filters.read !== undefined && notification.read !== filters.read) return false;
      
      // Date range filter
      if (filters.dateRange) {
        const notificationDate = new Date(notification.timestamp);
        if (notificationDate < filters.dateRange.start || notificationDate > filters.dateRange.end) {
          return false;
        }
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          notification.title.toLowerCase().includes(searchLower) ||
          notification.message.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [notifications, filters]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        
        // Update stats
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            unread: Math.max(0, prev.unread - 1)
          } : null);
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [stats]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/notifications/mark-all-read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setStats(prev => prev ? { ...prev, unread: 0 } : null);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Update stats
        if (stats && deletedNotification) {
          setStats(prev => prev ? {
            ...prev,
            total: Math.max(0, prev.total - 1),
            unread: deletedNotification.read ? prev.unread : Math.max(0, prev.unread - 1),
            byType: {
              ...prev.byType,
              [deletedNotification.type]: Math.max(0, prev.byType[deletedNotification.type] - 1)
            },
            byCategory: {
              ...prev.byCategory,
              [deletedNotification.category]: Math.max(0, prev.byCategory[deletedNotification.category] - 1)
            },
            byPriority: {
              ...prev.byPriority,
              [deletedNotification.priority]: Math.max(0, prev.byPriority[deletedNotification.priority] - 1)
            }
          } : null);
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications, stats]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<NotificationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadNotifications();
    initializeWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [loadNotifications, initializeWebSocket]);

  return {
    notifications: filteredNotifications,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,
  };
};

export default useNotifications;
