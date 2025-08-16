const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['success', 'warning', 'error', 'info', 'system'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['system', 'user', 'billing', 'security'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  adminOnly: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    index: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1, category: 1, priority: 1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ adminOnly: 1, read: 1 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
});

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.read = false;
  this.readAt = undefined;
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId, adminOnly = false) {
  const query = { read: false };
  if (userId) query.userId = userId;
  if (adminOnly) query.adminOnly = true;
  
  return this.countDocuments(query);
};

// Static method to get notifications with pagination
notificationSchema.statics.getNotifications = function(options = {}) {
  const {
    userId,
    adminOnly = false,
    type,
    category,
    priority,
    read,
    search,
    dateRange,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = {};
  
  // User-specific notifications
  if (userId) {
    query.$or = [
      { userId: userId },
      { adminOnly: false }
    ];
  } else if (adminOnly) {
    query.adminOnly = true;
  }

  // Apply filters
  if (type) query.type = type;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (read !== undefined) query.read = read;

  // Date range filter
  if (dateRange && dateRange.start && dateRange.end) {
    query.createdAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end)
    };
  }

  // Search filter
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  // Expired notifications filter
  query.$or = query.$or || [];
  query.$or.push(
    { expiresAt: { $exists: false } },
    { expiresAt: { $gt: new Date() } }
  );

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'name email')
    .lean();
};

// Static method to get notification statistics
notificationSchema.statics.getStats = function(userId, adminOnly = false) {
  const matchStage = { read: false };
  if (userId) matchStage.userId = userId;
  if (adminOnly) matchStage.adminOnly = true;

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        byCategory: {
          $push: {
            category: '$category',
            count: 1
          }
        },
        byPriority: {
          $push: {
            priority: '$priority',
            count: 1
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        byType: {
          $arrayToObject: {
            $map: {
              input: '$byType',
              as: 'item',
              in: {
                k: '$$item.type',
                v: '$$item.count'
              }
            }
          }
        },
        byCategory: {
          $arrayToObject: {
            $map: {
              input: '$byCategory',
              as: 'item',
              in: {
                k: '$$item.category',
                v: '$$item.count'
              }
            }
          }
        },
        byPriority: {
          $arrayToObject: {
            $map: {
              input: '$byPriority',
              as: 'item',
              in: {
                k: '$$item.priority',
                v: '$$item.count'
              }
            }
          }
        }
      }
    }
  ]);
};

// Static method to create system notification
notificationSchema.statics.createSystemNotification = function(data) {
  return this.create({
    ...data,
    adminOnly: true,
    type: data.type || 'info',
    category: data.category || 'system'
  });
};

// Static method to create user notification
notificationSchema.statics.createUserNotification = function(userId, data) {
  return this.create({
    ...data,
    userId,
    adminOnly: false
  });
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = function(notifications) {
  return this.insertMany(notifications);
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId, adminOnly = false) {
  const query = { read: false };
  if (userId) query.userId = userId;
  if (adminOnly) query.adminOnly = true;

  return this.updateMany(query, {
    $set: { read: true, readAt: new Date() }
  });
};

// Static method to clean expired notifications
notificationSchema.statics.cleanExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Pre-save middleware to set default values
notificationSchema.pre('save', function(next) {
  if (this.isNew && !this.sentAt) {
    this.sentAt = new Date();
  }
  next();
});

// Pre-save middleware to update readAt
notificationSchema.pre('save', function(next) {
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
