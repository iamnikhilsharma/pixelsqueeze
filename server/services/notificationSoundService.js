const fs = require('fs');
const path = require('path');

class NotificationSoundService {
  constructor() {
    this.sounds = new Map();
    this.volume = 0.7; // Default volume (0.0 to 1.0)
    this.enabled = true;
    this.soundCache = new Map();
    
    this.initializeSounds();
  }

  initializeSounds() {
    // Define default sound mappings
    this.sounds.set('default', {
      path: '/sounds/notification-default.mp3',
      duration: 2000,
      volume: 0.7
    });

    this.sounds.set('success', {
      path: '/sounds/notification-success.mp3',
      duration: 1500,
      volume: 0.6
    });

    this.sounds.set('warning', {
      path: '/sounds/notification-warning.mp3',
      duration: 2000,
      volume: 0.7
    });

    this.sounds.set('error', {
      path: '/sounds/notification-error.mp3',
      duration: 2500,
      volume: 0.8
    });

    this.sounds.set('info', {
      path: '/sounds/notification-info.mp3',
      duration: 1800,
      volume: 0.6
    });

    this.sounds.set('critical', {
      path: '/sounds/notification-critical.mp3',
      duration: 3000,
      volume: 0.9
    });

    this.sounds.set('chime', {
      path: '/sounds/notification-chime.mp3',
      duration: 1200,
      volume: 0.5
    });

    this.sounds.set('ding', {
      path: '/sounds/notification-ding.mp3',
      duration: 1000,
      volume: 0.6
    });

    this.sounds.set('pop', {
      path: '/sounds/notification-pop.mp3',
      duration: 800,
      volume: 0.4
    });

    console.log('Notification sound service initialized with', this.sounds.size, 'sound types');
  }

  // Get sound configuration for notification type
  getSoundConfig(notificationType, priority = 'medium') {
    let soundKey = notificationType;

    // Override for critical priority
    if (priority === 'critical') {
      soundKey = 'critical';
    }

    // Get sound configuration
    const soundConfig = this.sounds.get(soundKey) || this.sounds.get('default');
    
    return {
      ...soundConfig,
      volume: this.volume * soundConfig.volume,
      enabled: this.enabled
    };
  }

  // Get all available sounds
  getAvailableSounds() {
    const sounds = [];
    this.sounds.forEach((config, key) => {
      sounds.push({
        id: key,
        name: this.formatSoundName(key),
        path: config.path,
        duration: config.duration,
        volume: config.volume,
        preview: `/api/notification-sounds/preview/${key}`
      });
    });
    return sounds;
  }

  // Format sound name for display
  formatSoundName(soundKey) {
    return soundKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Add custom sound
  addCustomSound(soundId, config) {
    if (this.sounds.has(soundId)) {
      throw new Error(`Sound with ID '${soundId}' already exists`);
    }

    this.sounds.set(soundId, {
      path: config.path,
      duration: config.duration || 2000,
      volume: config.volume || 0.7
    });

    console.log(`Custom sound '${soundId}' added successfully`);
    return true;
  }

  // Remove custom sound
  removeCustomSound(soundId) {
    if (['default', 'success', 'warning', 'error', 'info', 'critical'].includes(soundId)) {
      throw new Error(`Cannot remove built-in sound '${soundId}'`);
    }

    const removed = this.sounds.delete(soundId);
    if (removed) {
      console.log(`Custom sound '${soundId}' removed successfully`);
    }
    return removed;
  }

  // Update sound configuration
  updateSoundConfig(soundId, updates) {
    const sound = this.sounds.get(soundId);
    if (!sound) {
      throw new Error(`Sound '${soundId}' not found`);
    }

    // Update allowed fields
    if (updates.duration !== undefined) {
      sound.duration = Math.max(500, Math.min(10000, updates.duration)); // 0.5s to 10s
    }
    
    if (updates.volume !== undefined) {
      sound.volume = Math.max(0.1, Math.min(1.0, updates.volume)); // 0.1 to 1.0
    }

    if (updates.path !== undefined && !['default', 'success', 'warning', 'error', 'info', 'critical'].includes(soundId)) {
      sound.path = updates.path;
    }

    console.log(`Sound '${soundId}' configuration updated`);
    return sound;
  }

  // Set global volume
  setVolume(volume) {
    this.volume = Math.max(0.0, Math.min(1.0, volume));
    console.log(`Global volume set to ${this.volume}`);
    return this.volume;
  }

  // Get global volume
  getVolume() {
    return this.volume;
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    console.log(`Notification sounds ${this.enabled ? 'enabled' : 'disabled'}`);
    return this.enabled;
  }

  // Check if sounds are enabled
  isEnabled() {
    return this.enabled;
  }

  // Get sound file path
  getSoundPath(soundId) {
    const sound = this.sounds.get(soundId);
    if (!sound) {
      return null;
    }

    // Check if file exists
    const fullPath = path.join(process.cwd(), 'public', sound.path);
    if (fs.existsSync(fullPath)) {
      return sound.path;
    }

    // Return default if custom sound doesn't exist
    return this.sounds.get('default').path;
  }

  // Validate sound file
  validateSoundFile(soundPath) {
    try {
      const fullPath = path.join(process.cwd(), 'public', soundPath);
      
      if (!fs.existsSync(fullPath)) {
        return { valid: false, error: 'File does not exist' };
      }

      const stats = fs.statSync(fullPath);
      const maxSize = 5 * 1024 * 1024; // 5MB max

      if (stats.size > maxSize) {
        return { valid: false, error: 'File size exceeds 5MB limit' };
      }

      // Check file extension
      const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
      const ext = path.extname(soundPath).toLowerCase();
      
      if (!allowedExtensions.includes(ext)) {
        return { valid: false, error: 'Invalid file format. Allowed: mp3, wav, ogg, m4a' };
      }

      return { valid: true, size: stats.size, extension: ext };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Upload custom sound
  async uploadCustomSound(soundId, fileBuffer, originalName) {
    try {
      // Validate file
      const validation = this.validateSoundFile(originalName);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(originalName);
      const filename = `custom-${soundId}-${timestamp}${ext}`;
      const uploadPath = `/sounds/custom/${filename}`;
      const fullPath = path.join(process.cwd(), 'public', uploadPath);

      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(fullPath, fileBuffer);

      // Add to sounds map
      this.addCustomSound(soundId, {
        path: uploadPath,
        duration: 2000,
        volume: 0.7
      });

      return {
        success: true,
        soundId,
        path: uploadPath,
        filename
      };
    } catch (error) {
      console.error('Error uploading custom sound:', error);
      throw error;
    }
  }

  // Delete custom sound file
  deleteCustomSoundFile(soundId) {
    try {
      const sound = this.sounds.get(soundId);
      if (!sound) {
        throw new Error(`Sound '${soundId}' not found`);
      }

      if (['default', 'success', 'warning', 'error', 'info', 'critical'].includes(soundId)) {
        throw new Error(`Cannot delete built-in sound '${soundId}'`);
      }

      // Remove from sounds map
      this.removeCustomSound(soundId);

      // Delete file
      const fullPath = path.join(process.cwd(), 'public', sound.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Sound file '${sound.path}' deleted`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting custom sound file:', error);
      throw error;
    }
  }

  // Get sound statistics
  getSoundStats() {
    const stats = {
      total: this.sounds.size,
      builtIn: 0,
      custom: 0,
      enabled: this.enabled,
      volume: this.volume,
      sounds: []
    };

    this.sounds.forEach((config, key) => {
      const isBuiltIn = ['default', 'success', 'warning', 'error', 'info', 'critical'].includes(key);
      
      if (isBuiltIn) {
        stats.builtIn++;
      } else {
        stats.custom++;
      }

      stats.sounds.push({
        id: key,
        type: isBuiltIn ? 'built-in' : 'custom',
        path: config.path,
        duration: config.duration,
        volume: config.volume
      });
    });

    return stats;
  }

  // Reset to default configuration
  resetToDefaults() {
    // Remove all custom sounds
    const customSounds = [];
    this.sounds.forEach((config, key) => {
      if (!['default', 'success', 'warning', 'error', 'info', 'critical'].includes(key)) {
        customSounds.push(key);
      }
    });

    customSounds.forEach(key => {
      this.removeCustomSound(key);
    });

    // Reset global settings
    this.volume = 0.7;
    this.enabled = true;

    console.log('Notification sound service reset to defaults');
    return true;
  }

  // Export sound configuration
  exportConfiguration() {
    const config = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      global: {
        volume: this.volume,
        enabled: this.enabled
      },
      sounds: {}
    };

    this.sounds.forEach((soundConfig, soundId) => {
      config.sounds[soundId] = {
        path: soundConfig.path,
        duration: soundConfig.duration,
        volume: soundConfig.volume
      };
    });

    return config;
  }

  // Import sound configuration
  importConfiguration(config) {
    try {
      if (config.version !== '1.0') {
        throw new Error('Unsupported configuration version');
      }

      // Update global settings
      if (config.global) {
        if (config.global.volume !== undefined) {
          this.setVolume(config.global.volume);
        }
        if (config.global.enabled !== undefined) {
          this.setEnabled(config.global.enabled);
        }
      }

      // Update sounds
      if (config.sounds) {
        Object.entries(config.sounds).forEach(([soundId, soundConfig]) => {
          if (['default', 'success', 'warning', 'error', 'info', 'critical'].includes(soundId)) {
            // Update built-in sound settings only
            this.updateSoundConfig(soundId, {
              duration: soundConfig.duration,
              volume: soundConfig.volume
            });
          } else {
            // Add custom sound
            this.addCustomSound(soundId, soundConfig);
          }
        });
      }

      console.log('Sound configuration imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing sound configuration:', error);
      throw error;
    }
  }
}

module.exports = NotificationSoundService;
