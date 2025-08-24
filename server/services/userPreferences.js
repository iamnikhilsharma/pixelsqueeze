const User = require('../models/User');
const { logger } = require('../utils/logger');

class UserPreferences {
  constructor() {
    this.defaultPreferences = {
      watermark: {
        defaultText: 'PixelSqueeze',
        defaultPosition: 'bottom-right',
        defaultOpacity: 0.7,
        defaultSize: 0.15,
        defaultColor: '#ffffff',
        defaultFontSize: 48,
        defaultFontFamily: 'sans-serif',
        savedTemplates: []
      },
      thumbnail: {
        defaultPresets: ['small', 'medium', 'large'],
        defaultQuality: 80,
        defaultFormat: 'auto',
        defaultFit: 'inside',
        defaultBackground: '#ffffff',
        savedPresets: []
      },
      analysis: {
        defaultOptions: {
          extractMetadata: true,
          analyzeColors: true,
          assessQuality: true,
          generateRecommendations: true,
          detailedAnalysis: false
        },
        savedProfiles: []
      },
      optimization: {
        defaultQuality: 80,
        defaultFormat: 'auto',
        defaultProgressive: true,
        defaultMozjpeg: true,
        savedProfiles: []
      },
      dashboard: {
        layout: 'default',
        widgets: ['usage', 'recent', 'stats'],
        refreshInterval: 30000,
        showNotifications: true
      },
      notifications: {
        email: true,
        push: false,
        processingComplete: true,
        errors: true,
        weekly: false
      },
      theme: {
        mode: 'light',
        primaryColor: '#3B82F6',
        accentColor: '#10B981',
        fontSize: 'medium',
        compactMode: false
      }
    };
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Merge user preferences with defaults
      const preferences = {
        ...this.defaultPreferences,
        ...user.preferences
      };

      return preferences;
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId, updates) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize preferences if they don't exist
      if (!user.preferences) {
        user.preferences = this.defaultPreferences;
      }

      // Deep merge updates
      user.preferences = this.deepMerge(user.preferences, updates);
      
      // Validate preferences
      this.validatePreferences(user.preferences);
      
      await user.save();
      
      return user.preferences;
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Save watermark template
   */
  async saveWatermarkTemplate(userId, template) {
    try {
      const templateData = {
        id: this.generateId(),
        name: template.name,
        text: template.text || 'PixelSqueeze',
        position: template.position || 'bottom-right',
        opacity: template.opacity || 0.7,
        size: template.size || 0.15,
        color: template.color || '#ffffff',
        fontSize: template.fontSize || 48,
        fontFamily: template.fontFamily || 'sans-serif',
        style: template.style || 'single',
        shadowColor: template.shadowColor || '#000000',
        shadowOpacity: template.shadowOpacity || 0.35,
        shadowBlur: template.shadowBlur || 2,
        shadowOffsetX: template.shadowOffsetX || 2,
        shadowOffsetY: template.shadowOffsetY || 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.preferences) {
        user.preferences = this.defaultPreferences;
      }

      if (!user.preferences.watermark) {
        user.preferences.watermark = this.defaultPreferences.watermark;
      }

      // Check if template with same name exists
      const existingIndex = user.preferences.watermark.savedTemplates.findIndex(
        t => t.name === template.name
      );

      if (existingIndex >= 0) {
        // Update existing template
        user.preferences.watermark.savedTemplates[existingIndex] = templateData;
      } else {
        // Add new template
        user.preferences.watermark.savedTemplates.push(templateData);
      }

      await user.save();
      
      return templateData;
    } catch (error) {
      logger.error('Error saving watermark template:', error);
      throw error;
    }
  }

  /**
   * Save thumbnail preset
   */
  async saveThumbnailPreset(userId, preset) {
    try {
      const presetData = {
        id: this.generateId(),
        name: preset.name,
        presets: preset.presets || ['small', 'medium', 'large'],
        customSizes: preset.customSizes || [],
        quality: preset.quality || 80,
        format: preset.format || 'auto',
        fit: preset.fit || 'inside',
        background: preset.background || '#ffffff',
        progressive: preset.progressive !== false,
        mozjpeg: preset.mozjpeg !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.preferences) {
        user.preferences = this.defaultPreferences;
      }

      if (!user.preferences.thumbnail) {
        user.preferences.thumbnail = this.defaultPreferences.thumbnail;
      }

      // Check if preset with same name exists
      const existingIndex = user.preferences.thumbnail.savedPresets.findIndex(
        p => p.name === preset.name
      );

      if (existingIndex >= 0) {
        // Update existing preset
        user.preferences.thumbnail.savedPresets[existingIndex] = presetData;
      } else {
        // Add new preset
        user.preferences.thumbnail.savedPresets.push(presetData);
      }

      await user.save();
      
      return presetData;
    } catch (error) {
      logger.error('Error saving thumbnail preset:', error);
      throw error;
    }
  }

  /**
   * Save analysis profile
   */
  async saveAnalysisProfile(userId, profile) {
    try {
      const profileData = {
        id: this.generateId(),
        name: profile.name,
        options: {
          extractMetadata: profile.extractMetadata !== false,
          analyzeColors: profile.analyzeColors !== false,
          assessQuality: profile.assessQuality !== false,
          generateRecommendations: profile.generateRecommendations !== false,
          detailedAnalysis: profile.detailedAnalysis === true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.preferences) {
        user.preferences = this.defaultPreferences;
      }

      if (!user.preferences.analysis) {
        user.preferences.analysis = this.defaultPreferences.analysis;
      }

      // Check if profile with same name exists
      const existingIndex = user.preferences.analysis.savedProfiles.findIndex(
        p => p.name === profile.name
      );

      if (existingIndex >= 0) {
        // Update existing profile
        user.preferences.analysis.savedProfiles[existingIndex] = profileData;
      } else {
        // Add new profile
        user.preferences.analysis.savedProfiles.push(profileData);
      }

      await user.save();
      
      return profileData;
    } catch (error) {
      logger.error('Error saving analysis profile:', error);
      throw error;
    }
  }

  /**
   * Save optimization profile
   */
  async saveOptimizationProfile(userId, profile) {
    try {
      const profileData = {
        id: this.generateId(),
        name: profile.name,
        quality: profile.quality || 80,
        format: profile.format || 'auto',
        progressive: profile.progressive !== false,
        mozjpeg: profile.mozjpeg !== false,
        webp: profile.webp !== false,
        avif: profile.avif !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.preferences) {
        user.preferences = this.defaultPreferences;
      }

      if (!user.preferences.optimization) {
        user.preferences.optimization = this.defaultPreferences.optimization;
      }

      // Check if profile with same name exists
      const existingIndex = user.preferences.optimization.savedProfiles.findIndex(
        p => p.name === profile.name
      );

      if (existingIndex >= 0) {
        // Update existing profile
        user.preferences.optimization.savedProfiles[existingIndex] = profileData;
      } else {
        // Add new profile
        user.preferences.optimization.savedProfiles.push(profileData);
      }

      await user.save();
      
      return profileData;
    } catch (error) {
      logger.error('Error saving optimization profile:', error);
      throw error;
    }
  }

  /**
   * Delete saved template/preset/profile
   */
  async deleteSavedItem(userId, category, itemId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.preferences || !user.preferences[category]) {
        throw new Error('User or preferences not found');
      }

      const items = user.preferences[category].savedTemplates || 
                   user.preferences[category].savedPresets || 
                   user.preferences[category].savedProfiles;

      if (!items) {
        throw new Error('No saved items found for this category');
      }

      const index = items.findIndex(item => item.id === itemId);
      if (index === -1) {
        throw new Error('Item not found');
      }

      items.splice(index, 1);
      await user.save();
      
      return { success: true, message: 'Item deleted successfully' };
    } catch (error) {
      logger.error('Error deleting saved item:', error);
      throw error;
    }
  }

  /**
   * Get user's saved items
   */
  async getSavedItems(userId, category) {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences[category]) {
        return [];
      }

      const items = preferences[category].savedTemplates || 
                   preferences[category].savedPresets || 
                   preferences[category].savedProfiles;

      return items || [];
    } catch (error) {
      logger.error('Error getting saved items:', error);
      throw error;
    }
  }

  /**
   * Reset user preferences to defaults
   */
  async resetUserPreferences(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.preferences = this.defaultPreferences;
      await user.save();
      
      return user.preferences;
    } catch (error) {
      logger.error('Error resetting user preferences:', error);
      throw error;
    }
  }

  /**
   * Export user preferences
   */
  async exportUserPreferences(userId) {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      return {
        exportDate: new Date(),
        version: '1.0',
        preferences
      };
    } catch (error) {
      logger.error('Error exporting user preferences:', error);
      throw error;
    }
  }

  /**
   * Import user preferences
   */
  async importUserPreferences(userId, importData) {
    try {
      if (!importData.preferences || typeof importData.preferences !== 'object') {
        throw new Error('Invalid import data format');
      }

      // Validate imported preferences
      this.validatePreferences(importData.preferences);
      
      // Update user preferences
      const updatedPreferences = await this.updateUserPreferences(userId, importData.preferences);
      
      return {
        success: true,
        message: 'Preferences imported successfully',
        preferences: updatedPreferences
      };
    } catch (error) {
      logger.error('Error importing user preferences:', error);
      throw error;
    }
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Validate preferences structure
   */
  validatePreferences(preferences) {
    // Basic validation - ensure required structure exists
    const requiredSections = ['watermark', 'thumbnail', 'analysis', 'optimization', 'dashboard', 'notifications', 'theme'];
    
    for (const section of requiredSections) {
      if (!preferences[section] || typeof preferences[section] !== 'object') {
        throw new Error(`Invalid preferences structure: missing or invalid ${section} section`);
      }
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = new UserPreferences();
