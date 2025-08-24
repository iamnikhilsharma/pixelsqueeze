const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/notifications'
    });
    
    this.clients = new Map(); // Map to store client connections
    this.heartbeatInterval = null;
    
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Start heartbeat to keep connections alive
    this.startHeartbeat();
    
    console.log('WebSocket service initialized');
  }

  async handleConnection(ws, req) {
    try {
      // Extract token from query parameters
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Authentication token required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // Store client connection
      this.clients.set(userId, {
        ws,
        userId,
        connectedAt: new Date(),
        lastHeartbeat: new Date(),
        isAdmin: decoded.isAdmin || false
      });

      console.log(`Client connected: ${userId} (Admin: ${decoded.isAdmin})`);

      // Send initial connection confirmation
      this.sendToClient(userId, {
        type: 'connection_established',
        data: {
          userId,
          timestamp: new Date(),
          message: 'WebSocket connection established'
        }
      });

      // Send unread notification count
      const unreadCount = await Notification.getUnreadCount(userId, decoded.isAdmin);
      this.sendToClient(userId, {
        type: 'unread_count',
        data: { count: unreadCount }
      });

      // Handle incoming messages
      ws.on('message', (message) => {
        this.handleMessage(userId, message);
      });

      // Handle client disconnect
      ws.on('close', (code, reason) => {
        this.handleDisconnect(userId, code, reason);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        this.handleDisconnect(userId, 1006, 'Connection error');
      });

      // Handle pong responses
      ws.on('pong', () => {
        const client = this.clients.get(userId);
        if (client) {
          client.lastHeartbeat = new Date();
        }
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  handleMessage(userId, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ping':
          this.sendToClient(userId, { type: 'pong', timestamp: new Date() });
          break;
          
        case 'get_notifications':
          this.handleGetNotifications(userId, data);
          break;
          
        case 'mark_read':
          this.handleMarkRead(userId, data);
          break;
          
        case 'subscribe':
          this.handleSubscribe(userId, data);
          break;
          
        default:
          console.log(`Unknown message type from user ${userId}:`, data.type);
      }
    } catch (error) {
      console.error(`Error handling message from user ${userId}:`, error);
      this.sendToClient(userId, {
        type: 'error',
        data: { message: 'Invalid message format' }
      });
    }
  }

  async handleGetNotifications(userId, data) {
    try {
      const { page = 1, limit = 20, filters = {} } = data;
      
      const options = {
        userId,
        page: parseInt(page),
        limit: parseInt(limit),
        ...filters
      };

      const notifications = await Notification.getNotifications(options);
      
      this.sendToClient(userId, {
        type: 'notifications_list',
        data: { notifications, page, limit }
      });
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      this.sendToClient(userId, {
        type: 'error',
        data: { message: 'Failed to fetch notifications' }
      });
    }
  }

  async handleMarkRead(userId, data) {
    try {
      const { notificationId } = data;
      
      if (!notificationId) {
        this.sendToClient(userId, {
          type: 'error',
          data: { message: 'Notification ID required' }
        });
        return;
      }

      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        this.sendToClient(userId, {
          type: 'error',
          data: { message: 'Notification not found' }
        });
        return;
      }

      // Check if user can access this notification
      if (notification.userId && notification.userId.toString() !== userId) {
        this.sendToClient(userId, {
          type: 'error',
          data: { message: 'Access denied' }
        });
        return;
      }

      await notification.markAsRead();

      // Send updated notification
      this.sendToClient(userId, {
        type: 'notification_updated',
        data: { notification }
      });

      // Update unread count for all connected clients
      this.broadcastUnreadCounts();
      
    } catch (error) {
      console.error(`Error marking notification as read for user ${userId}:`, error);
      this.sendToClient(userId, {
        type: 'error',
        data: { message: 'Failed to mark notification as read' }
      });
    }
  }

  handleSubscribe(userId, data) {
    try {
      const { channels = [] } = data;
      const client = this.clients.get(userId);
      
      if (client) {
        client.subscribedChannels = channels;
        console.log(`User ${userId} subscribed to channels:`, channels);
        
        this.sendToClient(userId, {
          type: 'subscription_confirmed',
          data: { channels, timestamp: new Date() }
        });
      }
    } catch (error) {
      console.error(`Error handling subscription for user ${userId}:`, error);
    }
  }

  handleDisconnect(userId, code, reason) {
    const client = this.clients.get(userId);
    if (client) {
      console.log(`Client disconnected: ${userId} (Code: ${code}, Reason: ${reason})`);
      this.clients.delete(userId);
    }
  }

  // Send message to specific client
  sendToClient(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to user ${userId}:`, error);
        this.handleDisconnect(userId, 1006, 'Send error');
      }
    }
  }

  // Send message to all connected clients
  broadcast(message, filter = null) {
    this.clients.forEach((client, userId) => {
      if (filter && !filter(client)) return;
      
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Error broadcasting to user ${userId}:`, error);
          this.handleDisconnect(userId, 1006, 'Broadcast error');
        }
      }
    });
  }

  // Send notification to specific user
  async sendNotification(userId, notification) {
    try {
      // Check user preferences
      const preferences = await NotificationPreference.findOne({ userId });
      
      if (preferences && !preferences.shouldSendNotification(notification, 'inApp')) {
        console.log(`Notification blocked by preferences for user ${userId}`);
        return false;
      }

      this.sendToClient(userId, {
        type: 'notification',
        data: { notification }
      });

      return true;
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
      return false;
    }
  }

  // Send notification to all admin users
  async sendAdminNotification(notification) {
    const adminClients = Array.from(this.clients.values())
      .filter(client => client.isAdmin);

    const results = await Promise.all(
      adminClients.map(client => 
        this.sendNotification(client.userId, notification)
      )
    );

    return results.filter(Boolean).length;
  }

  // Send notification to multiple users
  async sendBulkNotification(userIds, notification) {
    const results = await Promise.all(
      userIds.map(userId => 
        this.sendNotification(userId, notification)
      )
    );

    return results.filter(Boolean).length;
  }

  // Update unread counts for all connected clients
  async broadcastUnreadCounts() {
    const updates = [];
    
    for (const [userId, client] of this.clients) {
      try {
        const unreadCount = await Notification.getUnreadCount(userId, client.isAdmin);
        updates.push({ userId, count: unreadCount });
      } catch (error) {
        console.error(`Error getting unread count for user ${userId}:`, error);
      }
    }

    // Send individual updates to avoid overwhelming clients
    updates.forEach(({ userId, count }) => {
      this.sendToClient(userId, {
        type: 'unread_count',
        data: { count }
      });
    });
  }

  // Start heartbeat to keep connections alive
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, userId) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.ping();
          } catch (error) {
            console.error(`Error sending ping to user ${userId}:`, error);
            this.handleDisconnect(userId, 1006, 'Ping error');
          }
        }
      });
    }, 30000); // Send ping every 30 seconds
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Get connection statistics
  getStats() {
    const totalClients = this.clients.size;
    const adminClients = Array.from(this.clients.values())
      .filter(client => client.isAdmin).length;
    const regularClients = totalClients - adminClients;

    return {
      total: totalClients,
      admin: adminClients,
      regular: regularClients,
      uptime: process.uptime()
    };
  }

  // Gracefully shutdown WebSocket service
  shutdown() {
    console.log('Shutting down WebSocket service...');
    
    this.stopHeartbeat();
    
    this.clients.forEach((client, userId) => {
      try {
        client.ws.close(1001, 'Server shutdown');
      } catch (error) {
        console.error(`Error closing connection for user ${userId}:`, error);
      }
    });
    
    this.clients.clear();
    
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('WebSocket service shutdown complete');
  }
}

module.exports = WebSocketService;
