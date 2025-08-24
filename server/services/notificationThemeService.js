const fs = require('fs');
const path = require('path');

class NotificationThemeService {
  constructor() {
    this.themes = new Map();
    this.currentTheme = 'default';
    this.customThemes = new Map();
    
    this.initializeThemes();
  }

  initializeThemes() {
    // Default theme
    this.themes.set('default', {
      id: 'default',
      name: 'Default Theme',
      description: 'Clean and modern default theme',
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#06B6D4',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        shadow: 'rgba(0, 0, 0, 0.1)'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: '400',
        lineHeight: '1.5',
        headingFontWeight: '600'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        duration: '200ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        enter: 'fadeIn 200ms ease-out',
        exit: 'fadeOut 200ms ease-in'
      }
    });

    // Dark theme
    this.themes.set('dark', {
      id: 'dark',
      name: 'Dark Theme',
      description: 'Elegant dark theme for low-light environments',
      colors: {
        primary: '#60A5FA',
        secondary: '#9CA3AF',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#22D3EE',
        background: '#111827',
        surface: '#1F2937',
        text: '#F9FAFB',
        textSecondary: '#D1D5DB',
        border: '#374151',
        shadow: 'rgba(0, 0, 0, 0.3)'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: '400',
        lineHeight: '1.5',
        headingFontWeight: '600'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
      },
      animations: {
        duration: '200ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        enter: 'fadeIn 200ms ease-out',
        exit: 'fadeOut 200ms ease-in'
      }
    });

    // High contrast theme
    this.themes.set('high-contrast', {
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'High contrast theme for accessibility',
      colors: {
        primary: '#000000',
        secondary: '#333333',
        success: '#006600',
        warning: '#CC6600',
        error: '#CC0000',
        info: '#0066CC',
        background: '#FFFFFF',
        surface: '#F0F0F0',
        text: '#000000',
        textSecondary: '#333333',
        border: '#000000',
        shadow: 'rgba(0, 0, 0, 0.8)'
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontWeight: '700',
        lineHeight: '1.4',
        headingFontWeight: '900'
      },
      spacing: {
        xs: '6px',
        sm: '12px',
        md: '20px',
        lg: '28px',
        xl: '36px',
        xxl: '52px'
      },
      borderRadius: {
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        full: '0px'
      },
      shadows: {
        sm: '2px 2px 0px rgba(0, 0, 0, 1)',
        md: '4px 4px 0px rgba(0, 0, 0, 1)',
        lg: '6px 6px 0px rgba(0, 0, 0, 1)',
        xl: '8px 8px 0px rgba(0, 0, 0, 1)'
      },
      animations: {
        duration: '0ms',
        easing: 'linear',
        enter: 'none',
        exit: 'none'
      }
    });

    // Minimal theme
    this.themes.set('minimal', {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and minimal design',
      colors: {
        primary: '#000000',
        secondary: '#666666',
        success: '#000000',
        warning: '#000000',
        error: '#000000',
        info: '#000000',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        border: '#E5E5E5',
        shadow: 'none'
      },
      typography: {
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: '300',
        lineHeight: '1.6',
        headingFontWeight: '400'
      },
      spacing: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        xxl: '32px'
      },
      borderRadius: {
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        full: '0px'
      },
      shadows: {
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none'
      },
      animations: {
        duration: '100ms',
        easing: 'linear',
        enter: 'none',
        exit: 'none'
      }
    });

    console.log('Notification theme service initialized with', this.themes.size, 'themes');
  }

  // Get current theme
  getCurrentTheme() {
    return this.themes.get(this.currentTheme) || this.themes.get('default');
  }

  // Get theme by ID
  getTheme(themeId) {
    return this.themes.get(themeId) || this.themes.get('default');
  }

  // Get all available themes
  getAvailableThemes() {
    const themes = [];
    this.themes.forEach((theme) => {
      themes.push({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        isActive: theme.id === this.currentTheme,
        isCustom: this.customThemes.has(theme.id)
      });
    });
    return themes;
  }

  // Set current theme
  setTheme(themeId) {
    if (!this.themes.has(themeId)) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    this.currentTheme = themeId;
    console.log(`Theme changed to '${themeId}'`);
    return this.getCurrentTheme();
  }

  // Create custom theme
  createCustomTheme(themeData) {
    const { id, name, description, colors, typography, spacing, borderRadius, shadows, animations } = themeData;

    if (this.themes.has(id)) {
      throw new Error(`Theme with ID '${id}' already exists`);
    }

    const customTheme = {
      id,
      name,
      description,
      colors: { ...this.themes.get('default').colors, ...colors },
      typography: { ...this.themes.get('default').typography, ...typography },
      spacing: { ...this.themes.get('default').spacing, ...spacing },
      borderRadius: { ...this.themes.get('default').borderRadius, ...borderRadius },
      shadows: { ...this.themes.get('default').shadows, ...shadows },
      animations: { ...this.themes.get('default').animations, ...animations },
      isCustom: true,
      createdAt: new Date()
    };

    this.themes.set(id, customTheme);
    this.customThemes.set(id, customTheme);

    console.log(`Custom theme '${id}' created successfully`);
    return customTheme;
  }

  // Update custom theme
  updateCustomTheme(themeId, updates) {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    if (!theme.isCustom) {
      throw new Error(`Cannot modify built-in theme '${themeId}'`);
    }

    // Update theme properties
    Object.keys(updates).forEach(key => {
      if (key === 'id') return; // Don't allow ID changes
      
      if (typeof updates[key] === 'object' && updates[key] !== null) {
        theme[key] = { ...theme[key], ...updates[key] };
      } else {
        theme[key] = updates[key];
      }
    });

    theme.updatedAt = new Date();

    console.log(`Custom theme '${themeId}' updated successfully`);
    return theme;
  }

  // Delete custom theme
  deleteCustomTheme(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    if (!theme.isCustom) {
      throw new Error(`Cannot delete built-in theme '${themeId}'`);
    }

    // If this is the current theme, switch to default
    if (this.currentTheme === themeId) {
      this.currentTheme = 'default';
    }

    this.themes.delete(themeId);
    this.customThemes.delete(themeId);

    console.log(`Custom theme '${themeId}' deleted successfully`);
    return true;
  }

  // Get theme CSS variables
  getThemeCSS(themeId = null) {
    const theme = themeId ? this.getTheme(themeId) : this.getCurrentTheme();
    
    let css = `/* ${theme.name} Theme */\n`;
    css += `:root {\n`;

    // Color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      css += `  --notification-${key}: ${value};\n`;
    });

    // Typography variables
    Object.entries(theme.typography).forEach(([key, value]) => {
      css += `  --notification-${key}: ${value};\n`;
    });

    // Spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      css += `  --notification-spacing-${key}: ${value};\n`;
    });

    // Border radius variables
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      css += `  --notification-radius-${key}: ${value};\n`;
    });

    // Shadow variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      css += `  --notification-shadow-${key}: ${value};\n`;
    });

    // Animation variables
    Object.entries(theme.animations).forEach(([key, value]) => {
      css += `  --notification-animation-${key}: ${value};\n`;
    });

    css += `}\n\n`;

    // Add theme-specific styles
    css += this.getThemeSpecificCSS(theme);

    return css;
  }

  // Get theme-specific CSS
  getThemeSpecificCSS(theme) {
    let css = '';

    // High contrast theme specific styles
    if (theme.id === 'high-contrast') {
      css += `
.notification-high-contrast {
  border: 2px solid var(--notification-border);
  font-weight: bold;
}

.notification-high-contrast .notification-title {
  text-decoration: underline;
}
`;
    }

    // Dark theme specific styles
    if (theme.id === 'dark') {
      css += `
.notification-dark {
  backdrop-filter: blur(10px);
  background: rgba(31, 41, 55, 0.95);
}

.notification-dark .notification-icon {
  filter: brightness(0) invert(1);
}
`;
    }

    // Minimal theme specific styles
    if (theme.id === 'minimal') {
      css += `
.notification-minimal {
  border: 1px solid var(--notification-border);
  box-shadow: none;
}

.notification-minimal .notification-icon {
  display: none;
}
`;
    }

    return css;
  }

  // Export theme configuration
  exportTheme(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      theme: {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        colors: theme.colors,
        typography: theme.typography,
        spacing: theme.spacing,
        borderRadius: theme.borderRadius,
        shadows: theme.shadows,
        animations: theme.animations
      }
    };
  }

  // Import theme configuration
  importTheme(config) {
    try {
      if (config.version !== '1.0') {
        throw new Error('Unsupported theme configuration version');
      }

      const themeData = config.theme;
      
      // Validate required fields
      if (!themeData.id || !themeData.name) {
        throw new Error('Theme ID and name are required');
      }

      // Create or update theme
      if (this.themes.has(themeData.id)) {
        return this.updateCustomTheme(themeData.id, themeData);
      } else {
        return this.createCustomTheme(themeData);
      }
    } catch (error) {
      console.error('Error importing theme configuration:', error);
      throw error;
    }
  }

  // Get theme preview data
  getThemePreview(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    return {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      preview: {
        colors: theme.colors,
        typography: theme.typography,
        spacing: theme.spacing,
        borderRadius: theme.borderRadius
      },
      css: this.getThemeCSS(themeId)
    };
  }

  // Validate theme configuration
  validateTheme(themeData) {
    const errors = [];

    // Check required fields
    if (!themeData.id) errors.push('Theme ID is required');
    if (!themeData.name) errors.push('Theme name is required');

    // Validate colors
    if (themeData.colors) {
      Object.entries(themeData.colors).forEach(([key, value]) => {
        if (!this.isValidColor(value)) {
          errors.push(`Invalid color value for '${key}': ${value}`);
        }
      });
    }

    // Validate spacing
    if (themeData.spacing) {
      Object.entries(themeData.spacing).forEach(([key, value]) => {
        if (!this.isValidSpacing(value)) {
          errors.push(`Invalid spacing value for '${key}': ${value}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate color value
  isValidColor(value) {
    // Check for hex colors, rgb, rgba, named colors, etc.
    const colorRegex = /^(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|transparent|currentColor|inherit|initial|unset)$/;
    return colorRegex.test(value);
  }

  // Validate spacing value
  isValidSpacing(value) {
    // Check for valid CSS length units
    const spacingRegex = /^(\d+(\.\d+)?(px|em|rem|vh|vw|%)|0)$/;
    return spacingRegex.test(value);
  }

  // Get theme statistics
  getThemeStats() {
    const stats = {
      total: this.themes.size,
      builtIn: 0,
      custom: 0,
      current: this.currentTheme,
      themes: []
    };

    this.themes.forEach((theme) => {
      if (theme.isCustom) {
        stats.custom++;
      } else {
        stats.builtIn++;
      }

      stats.themes.push({
        id: theme.id,
        name: theme.name,
        type: theme.isCustom ? 'custom' : 'built-in',
        isActive: theme.id === this.currentTheme
      });
    });

    return stats;
  }

  // Reset to default theme
  resetToDefault() {
    this.currentTheme = 'default';
    console.log('Theme reset to default');
    return this.getCurrentTheme();
  }

  // Get theme recommendations based on user preferences
  getThemeRecommendations(userPreferences = {}) {
    const recommendations = [];

    // Check for accessibility preferences
    if (userPreferences.highContrast) {
      recommendations.push({
        themeId: 'high-contrast',
        reason: 'High contrast for better accessibility',
        priority: 'high'
      });
    }

    // Check for dark mode preference
    if (userPreferences.darkMode) {
      recommendations.push({
        themeId: 'dark',
        reason: 'Dark theme for low-light environments',
        priority: 'medium'
      });
    }

    // Check for minimal design preference
    if (userPreferences.minimal) {
      recommendations.push({
        themeId: 'minimal',
        reason: 'Minimal design for clean aesthetics',
        priority: 'medium'
      });
    }

    // Always include default theme
    recommendations.push({
      themeId: 'default',
      reason: 'Balanced design for most users',
      priority: 'low'
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}

module.exports = NotificationThemeService;
