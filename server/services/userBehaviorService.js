const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

class UserBehaviorService {
  constructor() {
    this.userSessions = new Map();
    this.behaviorPatterns = new Map();
    this.engagementMetrics = new Map();
    
    this.initializeService();
  }

  initializeService() {
    this.behaviorPatterns.set('notification_interaction', {
      openRate: 0,
      clickRate: 0,
      dismissRate: 0,
      patterns: []
    });

    this.behaviorPatterns.set('engagement_levels', {
      high: 0,
      medium: 0,
      low: 0,
      inactive: 0
    });

    console.log('User behavior service initialized');
  }

  async trackUserSession(userId, sessionData) {
    try {
      const session = {
        userId,
        startTime: new Date(),
        lastActivity: new Date(),
        userAgent: sessionData.userAgent,
        deviceType: this.detectDeviceType(sessionData.userAgent),
        activities: []
      };

      this.userSessions.set(userId, session);
      
      await this.trackBehaviorEvent('session_start', {
        userId,
        sessionData,
        timestamp: session.startTime
      });

      return { success: true, sessionId: session.startTime.getTime() };
    } catch (error) {
      console.error('Error tracking user session:', error);
      return { success: false, error: error.message };
    }
  }

  async trackUserActivity(userId, activityType, activityData) {
    try {
      const session = this.userSessions.get(userId);
      if (!session) return { success: false, error: 'No active session' };

      session.lastActivity = new Date();
      session.activities.push({
        type: activityType,
        data: activityData,
        timestamp: new Date()
      });

      await this.trackBehaviorEvent(activityType, {
        userId,
        activityData,
        sessionData: session,
        timestamp: new Date()
      });

      this.updateEngagementMetrics(userId, activityType, activityData);
      return { success: true, activityId: Date.now() };
    } catch (error) {
      console.error('Error tracking user activity:', error);
      return { success: false, error: error.message };
    }
  }

  async trackBehaviorEvent(eventType, eventData) {
    try {
      const event = {
        type: eventType,
        userId: eventData.userId,
        data: eventData.activityData || eventData.sessionData,
        timestamp: new Date()
      };

      this.updateBehaviorPatterns(eventType, event);
      return { success: true, eventId: event.timestamp.getTime() };
    } catch (error) {
      console.error('Error tracking behavior event:', error);
      return { success: false, error: error.message };
    }
  }

  updateBehaviorPatterns(eventType, event) {
    const patterns = this.behaviorPatterns.get('notification_interaction');
    
    switch (eventType) {
      case 'notification_opened':
        patterns.openRate = this.calculateRate(patterns.openRate, 1);
        patterns.patterns.push({ type: 'open', timestamp: event.timestamp, userId: event.userId });
        break;
      case 'notification_clicked':
        patterns.clickRate = this.calculateRate(patterns.clickRate, 1);
        patterns.patterns.push({ type: 'click', timestamp: event.timestamp, userId: event.userId });
        break;
      case 'notification_dismissed':
        patterns.dismissRate = this.calculateRate(patterns.dismissRate, 1);
        patterns.patterns.push({ type: 'dismiss', timestamp: event.timestamp, userId: event.userId });
        break;
    }

    if (patterns.patterns.length > 1000) {
      patterns.patterns = patterns.patterns.slice(-1000);
    }
  }

  updateEngagementMetrics(userId, activityType, activityData) {
    if (!this.engagementMetrics.has(userId)) {
      this.engagementMetrics.set(userId, {
        totalActivities: 0,
        lastActivity: new Date(),
        engagementScore: 0,
        activityTypes: new Map()
      });
    }

    const metrics = this.engagementMetrics.get(userId);
    metrics.totalActivities++;
    metrics.lastActivity = new Date();

    if (!metrics.activityTypes.has(activityType)) {
      metrics.activityTypes.set(activityType, 0);
    }
    metrics.activityTypes.set(activityType, metrics.activityTypes.get(activityType) + 1);

    metrics.engagementScore = this.calculateEngagementScore(metrics);
  }

  calculateEngagementScore(metrics) {
    let score = 0;
    score += Math.min(metrics.totalActivities * 2, 50);
    
    const hoursSinceLastActivity = (Date.now() - metrics.lastActivity.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastActivity < 1) score += 20;
    else if (hoursSinceLastActivity < 24) score += 10;
    else if (hoursSinceLastActivity < 168) score += 5;

    score += Math.min(metrics.activityTypes.size * 5, 20);
    return Math.min(score, 100);
  }

  getUserEngagementLevel(userId) {
    const metrics = this.engagementMetrics.get(userId);
    if (!metrics) return 'inactive';

    const score = metrics.engagementScore;
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 20) return 'low';
    return 'inactive';
  }

  detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
    if (ua.includes('desktop') || ua.includes('windows') || ua.includes('macintosh')) return 'desktop';
    return 'unknown';
  }

  calculateRate(currentRate, increment) {
    return Math.round((currentRate + increment) / 2);
  }

  async getUserBehaviorReport(userId) {
    try {
      const session = this.userSessions.get(userId);
      const engagement = this.engagementMetrics.get(userId);

      return {
        userId,
        timestamp: new Date(),
        summary: {
          hasActiveSession: !!session,
          sessionStartTime: session?.startTime,
          lastActivity: session?.lastActivity,
          totalActivities: engagement?.totalActivities || 0,
          engagementScore: engagement?.engagementScore || 0,
          engagementLevel: this.getUserEngagementLevel(userId)
        },
        session: session,
        engagement: engagement
      };
    } catch (error) {
      console.error('Error getting user behavior report:', error);
      throw error;
    }
  }

  async getAggregateBehaviorReport() {
    try {
      const notificationPatterns = this.behaviorPatterns.get('notification_interaction');
      const engagementPatterns = this.behaviorPatterns.get('engagement_levels');

      return {
        timestamp: new Date(),
        summary: {
          totalSessions: this.userSessions.size,
          activeUsers: this.engagementMetrics.size,
          openRate: notificationPatterns.openRate,
          clickRate: notificationPatterns.clickRate,
          dismissRate: notificationPatterns.dismissRate,
          engagementDistribution: {
            high: engagementPatterns.high,
            medium: engagementPatterns.medium,
            low: engagementPatterns.low,
            inactive: engagementPatterns.inactive
          }
        }
      };
    } catch (error) {
      console.error('Error getting aggregate behavior report:', error);
      throw error;
    }
  }

  async endUserSession(userId) {
    try {
      const session = this.userSessions.get(userId);
      if (session) {
        session.endTime = new Date();
        session.duration = session.endTime - session.startTime;
        
        await this.trackBehaviorEvent('session_end', {
          userId,
          sessionData: session,
          timestamp: new Date()
        });

        this.userSessions.delete(userId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error ending user session:', error);
      return { success: false, error: error.message };
    }
  }

  getStatus() {
    return {
      initialized: true,
      activeSessions: this.userSessions.size,
      trackedUsers: this.engagementMetrics.size,
      behaviorPatterns: this.behaviorPatterns.size,
      lastUpdate: new Date()
    };
  }
}

module.exports = UserBehaviorService;
