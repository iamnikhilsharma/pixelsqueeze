const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  apiKey: {
    type: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'enterprise'],
      default: 'free'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid'],
      default: 'active'
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },
  usage: {
    monthlyImages: {
      type: Number,
      default: 0
    },
    monthlyBandwidth: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  settings: {
    defaultQuality: {
      type: Number,
      default: 80,
      min: 1,
      max: 100
    },
    preserveMetadata: {
      type: Boolean,
      default: false
    },
    autoOptimize: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Indexes - using sparse for optional fields to avoid conflicts
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ apiKey: 1 }, { sparse: true });
userSchema.index({ 'subscription.stripeCustomerId': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for subscription limits
userSchema.virtual('subscriptionLimits').get(function() {
  const limits = {
    free: 100,
    starter: 5000,
    pro: 20000,
    enterprise: 100000
  };
  return limits[this.subscription.plan] || limits.free;
});

// Virtual for remaining images
userSchema.virtual('remainingImages').get(function() {
  return Math.max(0, this.subscriptionLimits - this.usage.monthlyImages);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate API key
userSchema.pre('save', function(next) {
  if (!this.apiKey) {
    this.apiKey = crypto.randomBytes(parseInt(process.env.API_KEY_LENGTH) || 16).toString('hex');
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id,
      email: this.email,
      isAdmin: this.isAdmin
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Method to check if user can process more images
userSchema.methods.canProcessImage = function() {
  return this.usage.monthlyImages < this.subscriptionLimits;
};

// Method to increment usage
userSchema.methods.incrementUsage = function(imageSize) {
  this.usage.monthlyImages += 1;
  this.usage.monthlyBandwidth += imageSize;
  return this.save();
};

// Method to reset monthly usage
userSchema.methods.resetMonthlyUsage = function() {
  this.usage.monthlyImages = 0;
  this.usage.monthlyBandwidth = 0;
  this.usage.lastResetDate = new Date();
  return this.save();
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return this.save();
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  this.passwordResetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return this.save();
};

// Static method to find by API key
userSchema.statics.findByApiKey = function(apiKey) {
  return this.findOne({ apiKey, isActive: true });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// JSON serialization
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.loginAttempts;
  delete user.lockUntil;
  return user;
};

module.exports = mongoose.model('User', userSchema); 