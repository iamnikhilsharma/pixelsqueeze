const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  originalSize: {
    type: Number,
    required: true
  },
  originalFormat: {
    type: String,
    required: true,
    enum: ['jpg', 'jpeg', 'png', 'webp']
  },
  optimizedSize: {
    type: Number,
    required: true
  },
  optimizedFormat: {
    type: String,
    required: true,
    enum: ['jpg', 'jpeg', 'png', 'webp']
  },
  compressionRatio: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  quality: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  dimensions: {
    original: {
      width: Number,
      height: Number
    },
    optimized: {
      width: Number,
      height: Number
    }
  },
  storage: {
    originalKey: String,
    optimizedKey: String,
    bucket: String,
    region: String
  },
  downloadUrl: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  metadata: {
    preserved: {
      type: Boolean,
      default: false
    },
    exif: mongoose.Schema.Types.Mixed,
    iptc: mongoose.Schema.Types.Mixed,
    xmp: mongoose.Schema.Types.Mixed
  },
  processingTime: {
    type: Number, // in milliseconds
    required: true
  },
  watermark: {
    type: {
      type: String,
      enum: ['text', 'image']
    },
    text: String,
    position: {
      type: String,
      enum: ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right']
    },
    opacity: {
      type: Number,
      min: 0,
      max: 1
    },
    size: {
      type: Number,
      min: 0.1,
      max: 2.0
    },
    font: String,
    fontSize: Number,
    fontColor: String,
    backgroundColor: String,
    margin: Number,
    rotation: Number,
    blendMode: {
      type: String,
      default: 'over'
    }
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  error: {
    message: String,
    code: String
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: Date
}, {
  timestamps: true
});

// Indexes
imageSchema.index({ user: 1, createdAt: -1 });
imageSchema.index({ status: 1 });
imageSchema.index({ expiresAt: 1 });
imageSchema.index({ 'storage.optimizedKey': 1 });

// Virtual for file size savings
imageSchema.virtual('sizeSaved').get(function() {
  return this.originalSize - this.optimizedSize;
});

// Virtual for percentage saved
imageSchema.virtual('percentageSaved').get(function() {
  return ((this.originalSize - this.optimizedSize) / this.originalSize * 100).toFixed(2);
});

// Virtual for is expired
imageSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Pre-save middleware to calculate compression ratio
imageSchema.pre('save', function(next) {
  if (this.originalSize && this.optimizedSize) {
    this.compressionRatio = Math.round(((this.originalSize - this.optimizedSize) / this.originalSize) * 100);
  }
  next();
});

// Method to increment download count
imageSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Method to extend expiration
imageSchema.methods.extendExpiration = function(hours = 24) {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return this.save();
};

// Static method to find expired images
imageSchema.statics.findExpired = function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    status: 'completed'
  });
};

// Static method to get user statistics
imageSchema.statics.getUserStats = async function(userId, startDate, endDate) {
  const matchStage = {
    user: userId,
    status: 'completed'
  };

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalImages: { $sum: 1 },
        totalOriginalSize: { $sum: '$originalSize' },
        totalOptimizedSize: { $sum: '$optimizedSize' },
        totalSizeSaved: { $sum: { $subtract: ['$originalSize', '$optimizedSize'] } },
        averageCompressionRatio: { $avg: '$compressionRatio' },
        totalDownloads: { $sum: '$downloadCount' }
      }
    }
  ]);
};

// Static method to get daily processing stats
imageSchema.statics.getDailyStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 },
        totalSizeSaved: { $sum: { $subtract: ['$originalSize', '$optimizedSize'] } },
        averageCompressionRatio: { $avg: '$compressionRatio' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// JSON serialization
imageSchema.methods.toJSON = function() {
  const image = this.toObject();
  image.sizeSaved = this.sizeSaved;
  image.percentageSaved = this.percentageSaved;
  image.isExpired = this.isExpired;
  return image;
};

module.exports = mongoose.model('Image', imageSchema); 