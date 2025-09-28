const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['immediate', 'hourly', 'daily', 'weekly'],
      default: 'immediate'
    },
    categories: {
      system: { type: Boolean, default: true },
      user: { type: Boolean, default: true },
      billing: { type: Boolean, default: true },
      security: { type: Boolean, default: true }
    },
    priorities: {
      low: { type: Boolean, default: false },
      medium: { type: Boolean, default: true },
      high: { type: Boolean, default: true },
      critical: { type: Boolean, default: true }
    }
  },
  inApp: {
    enabled: {
      type: Boolean,
      default: true
    },
    sound: {
      type: Boolean,
      default: true
    },
    desktop: {
      type: Boolean,
      default: true
    },
    categories: {
      system: { type: Boolean, default: true },
      user: { type: Boolean, default: true },
      billing: { type: Boolean, default: true },
      security: { type: Boolean, default: true }
    },
    priorities: {
      low: { type: Boolean, default: true },
      medium: { type: Boolean, default: true },
      high: { type: Boolean, default: true },
      critical: { type: Boolean, default: true }
    }
  },
  push: {
    enabled: {
      type: Boolean,
      default: false
    },
    token: {
      type: String,
      trim: true
    },
    platform: {
      type: String,
      enum: ['web', 'ios', 'android'],
      default: 'web'
    },
    categories: {
      system: { type: Boolean, default: true },
      user: { type: Boolean, default: true },
      billing: { type: Boolean, default: true },
      security: { type: Boolean, default: true }
    },
    priorities: {
      low: { type: Boolean, default: false },
      medium: { type: Boolean, default: true },
      high: { type: Boolean, default: true },
      critical: { type: Boolean, default: true }
    }
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    start: {
      type: String,
      default: '22:00',
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    end: {
      type: String,
      default: '08:00',
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'End time must be in HH:MM format'
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  customRules: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    condition: {
      field: {
        type: String,
        enum: ['type', 'category', 'priority', 'sender'],
        required: true
      },
      operator: {
        type: String,
        enum: ['equals', 'contains', 'starts_with', 'ends_with', 'greater_than', 'less_than'],
        required: true
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      }
    },
    actions: {
      email: { type: Boolean, default: false },
      inApp: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      delay: { type: Number, default: 0 }, // Delay in minutes
      forward: { type: String, trim: true } // Forward to email
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationPreferenceSchema.index({ 'email.enabled': 1 });
notificationPreferenceSchema.index({ 'inApp.enabled': 1 });
notificationPreferenceSchema.index({ 'push.enabled': 1 });

// Virtual for checking if user has any notifications enabled
notificationPreferenceSchema.virtual('hasNotificationsEnabled').get(function() {
  return this.email.enabled || this.inApp.enabled || this.push.enabled;
});

// Method to check if notification should be sent based on preferences
notificationPreferenceSchema.methods.shouldSendNotification = function(notification, channel = 'email') {
  // Check if channel is enabled
  if (!this[channel]?.enabled) return false;

  // Check quiet hours
  if (this.quietHours.enabled && this.isInQuietHours()) return false;

  // Check category preferences
  if (!this[channel].categories[notification.category]) return false;

  // Check priority preferences
  if (!this[channel].priorities[notification.priority]) return false;

  // Check custom rules
  const customRule = this.getMatchingCustomRule(notification);
  if (customRule && !customRule.actions[channel]) return false;

  return true;
};

// Method to check if current time is in quiet hours
notificationPreferenceSchema.methods.isInQuietHours = function() {
  if (!this.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const start = this.quietHours.start;
  const end = this.quietHours.end;
  
  if (start <= end) {
    // Same day (e.g., 08:00 to 18:00)
    return currentTime >= start && currentTime <= end;
  } else {
    // Overnight (e.g., 22:00 to 08:00)
    return currentTime >= start || currentTime <= end;
  }
};

// Method to get matching custom rule for a notification
notificationPreferenceSchema.methods.getMatchingCustomRule = function(notification) {
  return this.customRules.find(rule => {
    if (!rule.enabled) return false;
    
    const { field, operator, value } = rule.condition;
    const notificationValue = notification[field];
    
    switch (operator) {
      case 'equals':
        return notificationValue === value;
      case 'contains':
        return String(notificationValue).includes(String(value));
      case 'starts_with':
        return String(notificationValue).startsWith(String(value));
      case 'ends_with':
        return String(notificationValue).endsWith(String(value));
      case 'greater_than':
        return notificationValue > value;
      case 'less_than':
        return notificationValue < value;
      default:
        return false;
    }
  });
};

// Method to update preferences
notificationPreferenceSchema.methods.updatePreferences = function(updates) {
  Object.assign(this, updates);
  this.lastUpdated = new Date();
  return this.save();
};

// Method to reset to defaults
notificationPreferenceSchema.methods.resetToDefaults = function() {
  this.email = {
    enabled: true,
    frequency: 'immediate',
    categories: {
      system: true,
      user: true,
      billing: true,
      security: true
    },
    priorities: {
      low: false,
      medium: true,
      high: true,
      critical: true
    }
  };
  
  this.inApp = {
    enabled: true,
    sound: true,
    desktop: true,
    categories: {
      system: true,
      user: true,
      billing: true,
      security: true
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      critical: true
    }
  };
  
  this.push = {
    enabled: false,
    token: null,
    platform: 'web',
    categories: {
      system: true,
      user: true,
      billing: true,
      security: true
    },
    priorities: {
      low: false,
      medium: true,
      high: true,
      critical: true
    }
  };
  
  this.quietHours = {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC'
  };
  
  this.customRules = [];
  this.lastUpdated = new Date();
  
  return this.save();
};

// Static method to get or create preferences for a user
notificationPreferenceSchema.statics.getOrCreate = function(userId) {
  return this.findOne({ userId }).then(preferences => {
    if (preferences) return preferences;
    
    return this.create({ userId });
  });
};

// Static method to get users who should receive notifications
notificationPreferenceSchema.statics.getUsersForNotification = function(notification, channel = 'email') {
  const query = {};
  query[`${channel}.enabled`] = true;
  query[`${channel}.categories.${notification.category}`] = true;
  query[`${channel}.priorities.${notification.priority}`] = true;
  
  return this.find(query).populate('userId', 'name email');
};

// Pre-save middleware to validate quiet hours
notificationPreferenceSchema.pre('save', function(next) {
  if (this.quietHours.enabled) {
    const start = this.quietHours.start;
    const end = this.quietHours.end;
    
    if (!start || !end) {
      return next(new Error('Start and end times are required when quiet hours are enabled'));
    }
  }
  next();
});

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
