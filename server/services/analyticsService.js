const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

class AnalyticsService {
  constructor() {
    this.metrics = new Map();
    this.realTimeData = new Map();
    this.insights = new Map();
    
    this.initializeMetrics();
  }

  initializeMetrics() {
    // Core metrics
    this.metrics.set('notifications', {
      total: 0,
      byType: {},
      byCategory: {},
      byPriority: {},
      byStatus: { read: 0, unread: 0 },
      byTime: { hourly: {}, daily: {}, weekly: {}, monthly: {} }
    });

    this.metrics.set('users', {
      total: 0,
      active: 0,
      preferences: { email: 0, inApp: 0, push: 0 },
      engagement: { high: 0, medium: 0, low: 0 }
    });

    this.metrics.set('performance', {
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      responseTime: 0,
      errorRate: 0
    });

    this.metrics.set('engagement', {
      totalInteractions: 0,
      interactionRate: 0,
      retentionRate: 0,
      churnRate: 0
    });

    console.log('Analytics service initialized');
  }

  // Track notification event
  async trackNotificationEvent(eventType, data) {
    try {
      const timestamp = new Date();
      const event = {
        type: eventType,
        data,
        timestamp,
        userId: data.userId || null,
        notificationId: data.notificationId || null,
        sessionId: data.sessionId || null,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null
      };

      // Store in real-time data
      this.updateRealTimeMetrics(eventType, event);

      // Update core metrics
      await this.updateCoreMetrics(eventType, event);

      // Generate insights
      await this.generateInsights();

      return { success: true, eventId: event.timestamp.getTime() };
    } catch (error) {
      console.error('Error tracking notification event:', error);
      return { success: false, error: error.message };
    }
  }

  // Update real-time metrics
  updateRealTimeMetrics(eventType, event) {
    const now = Date.now();
    const timeKey = Math.floor(now / 60000); // Minute-based key

    if (!this.realTimeData.has(timeKey)) {
      this.realTimeData.set(timeKey, {
        timestamp: now,
        events: [],
        counts: {}
      });
    }

    const timeData = this.realTimeData.get(timeKey);
    timeData.events.push(event);
    
    if (!timeData.counts[eventType]) {
      timeData.counts[eventType] = 0;
    }
    timeData.counts[eventType]++;

    // Clean up old data (keep last 24 hours)
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    for (const [key, data] of this.realTimeData.entries()) {
      if (data.timestamp < oneDayAgo) {
        this.realTimeData.delete(key);
      }
    }
  }

  // Update core metrics
  async updateCoreMetrics(eventType, event) {
    const metrics = this.metrics.get('notifications');
    
    switch (eventType) {
      case 'notification_sent':
        metrics.total++;
        this.incrementMetric(metrics.byType, event.data.type);
        this.incrementMetric(metrics.byCategory, event.data.category);
        this.incrementMetric(metrics.byPriority, event.data.priority);
        this.updateTimeMetrics(metrics.byTime, event.timestamp);
        break;

      case 'notification_read':
        metrics.byStatus.read++;
        metrics.byStatus.unread = Math.max(0, metrics.byStatus.unread - 1);
        break;

      case 'notification_clicked':
        this.updatePerformanceMetrics('clickRate', event);
        break;

      case 'notification_dismissed':
        this.updatePerformanceMetrics('dismissRate', event);
        break;
    }
  }

  // Update performance metrics
  updatePerformanceMetrics(metricType, event) {
    const metrics = this.metrics.get('performance');
    
    switch (metricType) {
      case 'deliveryRate':
        metrics.deliveryRate = this.calculateRate(metrics.total, event.data.delivered);
        break;
      case 'openRate':
        metrics.openRate = this.calculateRate(metrics.total, event.data.opened);
        break;
      case 'clickRate':
        metrics.clickRate = this.calculateRate(metrics.total, event.data.clicked);
        break;
      case 'responseTime':
        metrics.responseTime = this.calculateAverage(metrics.responseTime, event.data.responseTime);
        break;
    }
  }

  // Calculate rate percentage
  calculateRate(total, count) {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  // Calculate running average
  calculateAverage(currentAvg, newValue) {
    if (currentAvg === 0) return newValue;
    return Math.round((currentAvg + newValue) / 2);
  }

  // Increment metric counter
  incrementMetric(metricObj, key) {
    if (!metricObj[key]) {
      metricObj[key] = 0;
    }
    metricObj[key]++;
  }

  // Update time-based metrics
  updateTimeMetrics(timeMetrics, timestamp) {
    const hour = timestamp.getHours();
    const day = timestamp.getDay();
    const week = this.getWeekNumber(timestamp);
    const month = timestamp.getMonth();

    // Hourly
    if (!timeMetrics.hourly[hour]) timeMetrics.hourly[hour] = 0;
    timeMetrics.hourly[hour]++;

    // Daily
    if (!timeMetrics.daily[day]) timeMetrics.daily[day] = 0;
    timeMetrics.daily[day]++;

    // Weekly
    if (!timeMetrics.weekly[week]) timeMetrics.weekly[week] = 0;
    timeMetrics.weekly[week]++;

    // Monthly
    if (!timeMetrics.monthly[month]) timeMetrics.monthly[month] = 0;
    timeMetrics.monthly[month]++;
  }

  // Get week number
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Generate intelligent insights
  async generateInsights() {
    try {
      const insights = [];

      // Notification performance insights
      const performance = this.metrics.get('performance');
      if (performance.deliveryRate < 90) {
        insights.push({
          type: 'warning',
          category: 'performance',
          title: 'Low Delivery Rate',
          message: `Notification delivery rate is ${performance.deliveryRate}%. Consider checking server configuration.`,
          priority: 'medium',
          timestamp: new Date()
        });
      }

      if (performance.openRate < 20) {
        insights.push({
          type: 'info',
          category: 'engagement',
          title: 'Low Open Rate',
          message: `Only ${performance.openRate}% of notifications are being opened. Consider improving content quality.`,
          priority: 'low',
          timestamp: new Date()
        });
      }

      // User engagement insights
      const engagement = this.metrics.get('engagement');
      if (engagement.interactionRate < 15) {
        insights.push({
          type: 'warning',
          category: 'engagement',
          title: 'Low User Engagement',
          message: 'User interaction rate is below optimal levels. Consider A/B testing notification content.',
          priority: 'medium',
          timestamp: new Date()
        });
      }

      // Time-based insights
      const notifications = this.metrics.get('notifications');
      const peakHour = this.findPeakHour(notifications.byTime.hourly);
      if (peakHour !== null) {
        insights.push({
          type: 'info',
          category: 'timing',
          title: 'Peak Activity Time',
          message: `Peak notification activity occurs at ${peakHour}:00. Consider scheduling important notifications around this time.`,
          priority: 'low',
          timestamp: new Date()
        });
      }

      this.insights.set('recent', insights.slice(-10)); // Keep last 10 insights
      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  // Find peak hour
  findPeakHour(hourlyData) {
    let peakHour = null;
    let maxCount = 0;

    for (const [hour, count] of Object.entries(hourlyData)) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    }

    return peakHour;
  }

  // Get comprehensive analytics report
  async getAnalyticsReport(options = {}) {
    try {
      const {
        timeRange = '7d',
        includeInsights = true,
        includeRealTime = false
      } = options;

      const report = {
        timestamp: new Date(),
        timeRange,
        summary: await this.getSummaryMetrics(),
        trends: await this.getTrendData(timeRange),
        userBehavior: await this.getUserBehaviorMetrics(),
        performance: await this.getPerformanceMetrics(),
        recommendations: await this.getRecommendations()
      };

      if (includeInsights) {
        report.insights = Array.from(this.insights.get('recent') || []);
      }

      if (includeRealTime) {
        report.realTime = this.getRealTimeData();
      }

      return report;
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw error;
    }
  }

  // Get summary metrics
  async getSummaryMetrics() {
    const notifications = this.metrics.get('notifications');
    const users = this.metrics.get('users');
    const performance = this.metrics.get('performance');

    return {
      totalNotifications: notifications.total,
      totalUsers: users.total,
      activeUsers: users.active,
      deliveryRate: performance.deliveryRate,
      openRate: performance.openRate,
      clickRate: performance.clickRate
    };
  }

  // Get trend data
  async getTrendData(timeRange) {
    const notifications = this.metrics.get('notifications');
    
    switch (timeRange) {
      case '24h':
        return { hourly: notifications.byTime.hourly };
      case '7d':
        return { daily: notifications.byTime.daily };
      case '30d':
        return { weekly: notifications.byTime.weekly };
      case '12m':
        return { monthly: notifications.byTime.monthly };
      default:
        return { daily: notifications.byTime.daily };
    }
  }

  // Get user behavior metrics
  async getUserBehaviorMetrics() {
    try {
      const userMetrics = await NotificationPreference.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            emailEnabled: { $sum: { $cond: ['$email.enabled', 1, 0] } },
            inAppEnabled: { $sum: { $cond: ['$inApp.enabled', 1, 0] } },
            pushEnabled: { $sum: { $cond: ['$push.enabled', 1, 0] } },
            quietHoursEnabled: { $sum: { $cond: ['$quietHours.enabled', 1, 0] } }
          }
        }
      ]);

      return userMetrics[0] || {
        totalUsers: 0,
        emailEnabled: 0,
        inAppEnabled: 0,
        pushEnabled: 0,
        quietHoursEnabled: 0
      };
    } catch (error) {
      console.error('Error getting user behavior metrics:', error);
      return {
        totalUsers: 0,
        emailEnabled: 0,
        inAppEnabled: 0,
        pushEnabled: 0,
        quietHoursEnabled: 0
      };
    }
  }

  // Get performance metrics
  async getPerformanceMetrics() {
    const performance = this.metrics.get('performance');
    const engagement = this.metrics.get('engagement');

    return {
      delivery: {
        rate: performance.deliveryRate,
        total: this.metrics.get('notifications').total,
        successful: Math.round((performance.deliveryRate / 100) * this.metrics.get('notifications').total)
      },
      engagement: {
        openRate: performance.openRate,
        clickRate: performance.clickRate,
        interactionRate: engagement.interactionRate
      },
      timing: {
        averageResponseTime: performance.responseTime,
        errorRate: performance.errorRate
      }
    };
  }

  // Get actionable recommendations
  async getRecommendations() {
    const recommendations = [];
    const performance = this.metrics.get('performance');
    const engagement = this.metrics.get('engagement');

    // Performance recommendations
    if (performance.deliveryRate < 95) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Improve Delivery Rate',
        description: 'Check server configuration and network connectivity',
        action: 'Review server logs and network settings'
      });
    }

    if (performance.openRate < 25) {
      recommendations.push({
        category: 'engagement',
        priority: 'medium',
        title: 'Optimize Notification Content',
        description: 'Low open rates suggest content needs improvement',
        action: 'A/B test different notification messages and timing'
      });
    }

    if (engagement.interactionRate < 20) {
      recommendations.push({
        category: 'engagement',
        priority: 'medium',
        title: 'Increase User Engagement',
        description: 'Users are not interacting with notifications',
        action: 'Implement interactive elements and personalization'
      });
    }

    return recommendations;
  }

  // Get real-time data
  getRealTimeData() {
    const realTime = [];
    for (const [timeKey, data] of this.realTimeData.entries()) {
      realTime.push({
        timestamp: data.timestamp,
        counts: data.counts,
        eventCount: data.events.length
      });
    }
    return realTime.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Export analytics data
  async exportAnalyticsData(format = 'json', options = {}) {
    try {
      const data = await this.getAnalyticsReport(options);
      
      switch (format.toLowerCase()) {
        case 'json':
          return {
            data: JSON.stringify(data, null, 2),
            contentType: 'application/json',
            filename: `analytics-${new Date().toISOString().split('T')[0]}.json`
          };
        
        case 'csv':
          const csvData = this.convertToCSV(data);
          return {
            data: csvData,
            contentType: 'text/csv',
            filename: `analytics-${new Date().toISOString().split('T')[0]}.csv`
          };
        
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  // Convert data to CSV
  convertToCSV(data) {
    // Implementation for CSV conversion
    // This would convert the analytics data to CSV format
    return 'timestamp,metric,value\n'; // Placeholder
  }

  // Reset analytics data
  resetAnalytics() {
    this.metrics.clear();
    this.realTimeData.clear();
    this.insights.clear();
    this.initializeMetrics();
    console.log('Analytics data reset');
  }

  // Get service status
  getStatus() {
    return {
      initialized: true,
      metricsCount: this.metrics.size,
      realTimeDataPoints: this.realTimeData.size,
      insightsCount: this.insights.get('recent')?.length || 0,
      lastUpdate: new Date()
    };
  }
}

module.exports = AnalyticsService;
