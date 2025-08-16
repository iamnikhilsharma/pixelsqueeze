const webpush = require('web-push');
const admin = require('firebase-admin');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize web-push
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
          process.env.VAPID_MAILTO || 'mailto:admin@pixelsqueeze.com',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        console.log('Web push notifications initialized');
      }

      // Initialize Firebase Admin (optional)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
          });
          console.log('Firebase push notifications initialized');
        } catch (error) {
          console.warn('Firebase initialization failed:', error.message);
        }
      }

      this.isInitialized = true;
      console.log('Push notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      this.isInitialized = false;
    }
  }

  // Send web push notification
  async sendWebPush(subscription, payload) {
    try {
      if (!this.isInitialized) {
        throw new Error('Push notification service not initialized');
      }

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        image: payload.image,
        data: payload.data || {},
        actions: payload.actions || [],
        requireInteraction: payload.requireInteraction || false,
        tag: payload.tag,
        timestamp: Date.now()
      });

      const result = await webpush.sendNotification(subscription, pushPayload);
      return { success: true, result };
    } catch (error) {
      console.error('Web push notification failed:', error);
      
      // Handle expired subscriptions
      if (error.statusCode === 410) {
        return { success: false, error: 'Subscription expired', expired: true };
      }
      
      return { success: false, error: error.message };
    }
  }

  // Send Firebase push notification
  async sendFirebasePush(token, payload) {
    try {
      if (!admin.apps.length) {
        throw new Error('Firebase not initialized');
      }

      const message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data || {},
        android: {
          notification: {
            icon: payload.icon || 'ic_notification',
            color: payload.color || '#2196F3',
            sound: payload.sound || 'default',
            priority: payload.priority || 'high',
            channelId: payload.channelId || 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: payload.sound || 'default',
              badge: payload.badge || 1,
              category: payload.category || 'GENERAL'
            }
          }
        },
        webpush: {
          notification: {
            icon: payload.icon || '/favicon.ico',
            badge: payload.badge || '/favicon.ico',
            image: payload.image,
            actions: payload.actions || []
          }
        }
      };

      const result = await admin.messaging().send(message);
      return { success: true, messageId: result };
    } catch (error) {
      console.error('Firebase push notification failed:', error);
      
      // Handle invalid tokens
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return { success: false, error: 'Invalid token', expired: true };
      }
      
      return { success: false, error: error.message };
    }
  }

  // Send notification to user based on preferences
  async sendNotificationToUser(userId, notification, options = {}) {
    try {
      const preferences = await NotificationPreference.findOne({ userId });
      if (!preferences) {
        console.log(`No preferences found for user ${userId}`);
        return { success: false, error: 'No preferences found' };
      }

      const results = [];

      // Check if push notifications are enabled
      if (preferences.push.enabled) {
        const pushPayload = this.createPushPayload(notification, options);
        
        if (preferences.push.token) {
          let pushResult;
          
          if (preferences.push.platform === 'web') {
            // Web push notification
            const subscription = {
              endpoint: preferences.push.token,
              keys: {
                p256dh: preferences.push.p256dh || '',
                auth: preferences.push.auth || ''
              }
            };
            pushResult = await this.sendWebPush(subscription, pushPayload);
          } else {
            // Mobile push notification
            pushResult = await this.sendFirebasePush(preferences.push.token, pushPayload);
          }
          
          results.push({
            type: 'push',
            platform: preferences.push.platform,
            success: pushResult.success,
            error: pushResult.error,
            expired: pushResult.expired
          });

          // Handle expired tokens
          if (pushResult.expired) {
            await this.handleExpiredToken(userId, preferences.push.platform);
          }
        }
      }

      // Check if email notifications are enabled
      if (preferences.email.enabled && options.sendEmail !== false) {
        // Email notification logic would go here
        // This would integrate with your email service
        results.push({
          type: 'email',
          success: true,
          message: 'Email notification queued'
        });
      }

      return {
        success: true,
        results,
        userId,
        notificationId: notification._id
      };
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to multiple users
  async sendBulkNotification(userIds, notification, options = {}) {
    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const result = await this.sendNotificationToUser(userId, notification, options);
        results.push({ userId, ...result });
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    return {
      success: true,
      total: userIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };
  }

  // Send admin notification to all admin users
  async sendAdminNotification(notification, options = {}) {
    try {
      // Get all admin users with push notifications enabled
      const adminPreferences = await NotificationPreference.find({
        'push.enabled': true,
        'userId.isAdmin': true
      }).populate('userId');

      const adminUserIds = adminPreferences.map(pref => pref.userId._id);
      
      if (adminUserIds.length === 0) {
        return { success: false, error: 'No admin users with push notifications enabled' };
      }

      return await this.sendBulkNotification(adminUserIds, notification, {
        ...options,
        adminOnly: true
      });
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Create push notification payload
  createPushPayload(notification, options = {}) {
    const basePayload = {
      title: notification.title,
      body: notification.message,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      image: options.image,
      data: {
        notificationId: notification._id.toString(),
        type: notification.type,
        category: notification.category,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        ...options.data
      },
      actions: options.actions || [],
      requireInteraction: notification.priority === 'critical',
      tag: `${notification.category}_${notification.type}`,
      timestamp: Date.now()
    };

    // Add platform-specific options
    if (options.platform === 'android') {
      basePayload.android = {
        icon: options.androidIcon || 'ic_notification',
        color: options.color || '#2196F3',
        sound: options.sound || 'default',
        priority: notification.priority === 'critical' ? 'high' : 'normal'
      };
    } else if (options.platform === 'ios') {
      basePayload.ios = {
        sound: options.sound || 'default',
        badge: options.badge || 1,
        category: options.category || 'GENERAL'
      };
    }

    return basePayload;
  }

  // Handle expired tokens
  async handleExpiredToken(userId, platform) {
    try {
      await NotificationPreference.updateOne(
        { userId },
        { 
          $set: { 
            'push.enabled': false,
            'push.token': null,
            'push.expiredAt': new Date()
          }
        }
      );

      console.log(`Disabled push notifications for user ${userId} due to expired ${platform} token`);
    } catch (error) {
      console.error(`Error handling expired token for user ${userId}:`, error);
    }
  }

  // Update user's push notification token
  async updateUserToken(userId, token, platform = 'web', additionalData = {}) {
    try {
      const updateData = {
        'push.enabled': true,
        'push.token': token,
        'push.platform': platform,
        'push.updatedAt': new Date()
      };

      // Add platform-specific data
      if (platform === 'web' && additionalData.p256dh && additionalData.auth) {
        updateData['push.p256dh'] = additionalData.p256dh;
        updateData['push.auth'] = additionalData.auth;
      }

      await NotificationPreference.updateOne(
        { userId },
        { $set: updateData },
        { upsert: true }
      );

      return { success: true, message: 'Token updated successfully' };
    } catch (error) {
      console.error(`Error updating token for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Test push notification
  async testPushNotification(userId, testPayload = {}) {
    try {
      const preferences = await NotificationPreference.findOne({ userId });
      if (!preferences || !preferences.push.enabled) {
        return { success: false, error: 'Push notifications not enabled for user' };
      }

      const payload = {
        title: testPayload.title || 'Test Notification',
        body: testPayload.body || 'This is a test push notification',
        icon: testPayload.icon || '/favicon.ico',
        data: { test: true, timestamp: Date.now() }
      };

      if (preferences.push.platform === 'web') {
        const subscription = {
          endpoint: preferences.push.token,
          keys: {
            p256dh: preferences.push.p256dh || '',
            auth: preferences.push.auth || ''
          }
        };
        return await this.sendWebPush(subscription, payload);
      } else {
        return await this.sendFirebasePush(preferences.push.token, payload);
      }
    } catch (error) {
      console.error(`Error testing push notification for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get service status
  getStatus() {
    return {
      initialized: this.isInitialized,
      webPush: !!process.env.VAPID_PUBLIC_KEY,
      firebase: !!admin.apps.length,
      timestamp: new Date()
    };
  }

  // Clean up expired tokens
  async cleanupExpiredTokens() {
    try {
      const result = await NotificationPreference.updateMany(
        { 'push.expiredAt': { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        { $set: { 'push.enabled': false, 'push.token': null } }
      );

      console.log(`Cleaned up ${result.modifiedCount} expired push notification tokens`);
      return result.modifiedCount;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }
}

module.exports = PushNotificationService;
