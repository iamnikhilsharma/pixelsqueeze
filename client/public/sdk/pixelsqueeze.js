/**
 * PixelSqueeze JavaScript SDK
 * Version: 1.0.0
 * 
 * A lightweight JavaScript library for integrating PixelSqueeze image optimization
 * into web applications, Node.js projects, and browser-based tools.
 */

class PixelSqueezeSDK {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.pixelsqueeze.com';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
  }

  /**
   * Make HTTP request with authentication and error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: this.timeout,
      ...options
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.retries) {
          throw new Error(`Request failed after ${this.retries} attempts: ${error.message}`);
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Optimize a single image
   * @param {File|Blob} image - Image file to optimize
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimization result
   */
  async optimizeImage(image, options = {}) {
    const formData = new FormData();
    formData.append('image', image);
    
    // Add optimization options
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const response = await this.request('/optimize', {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey
        // Don't set Content-Type for FormData
      },
      body: formData
    });

    return response.data;
  }

  /**
   * Optimize image from URL
   * @param {string} imageUrl - URL of the image to optimize
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimization result
   */
  async optimizeFromUrl(imageUrl, options = {}) {
    const response = await this.request('/optimize-url', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl,
        ...options
      })
    });

    return response.data;
  }

  /**
   * Optimize multiple images
   * @param {File[]|Blob[]} images - Array of image files
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Batch optimization result
   */
  async optimizeBatch(images, options = {}) {
    const formData = new FormData();
    
    images.forEach((image, index) => {
      formData.append('images', image);
    });
    
    // Add optimization options
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const response = await this.request('/batch-optimize', {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey
      },
      body: formData
    });

    return response.data;
  }

  /**
   * Advanced batch processing with progress tracking
   * @param {File[]|Blob[]} images - Array of image files
   * @param {Object} options - Advanced optimization options
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Batch processing result
   */
  async advancedBatchOptimize(images, options = {}, onProgress = null) {
    const formData = new FormData();
    
    images.forEach((image, index) => {
      formData.append('images', image);
    });
    
    // Add optimization options
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const url = `${this.baseUrl}/advanced/batch-optimize`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'complete') {
              return data.results;
            } else if (onProgress) {
              onProgress(data);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  }

  /**
   * Convert image format
   * @param {File|Blob} image - Image file to convert
   * @param {string} targetFormat - Target format (jpeg, png, webp, avif, tiff)
   * @param {Object} options - Conversion options
   * @returns {Promise<Object>} Conversion result
   */
  async convertFormat(image, targetFormat, options = {}) {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('targetFormat', targetFormat);
    
    // Add conversion options
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const response = await this.request('/advanced/convert-format', {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey
      },
      body: formData
    });

    return response.data;
  }

  /**
   * Add watermark to image
   * @param {File|Blob} image - Image file
   * @param {File|Blob} watermark - Watermark image file
   * @param {Object} options - Watermark options
   * @returns {Promise<Object>} Watermarking result
   */
  async addWatermark(image, watermark, options = {}) {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('watermark', watermark);
    
    // Add watermark options
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const response = await this.request('/advanced/add-watermark', {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey
      },
      body: formData
    });

    return response.data;
  }

  /**
   * Analyze image metadata
   * @param {File|Blob} image - Image file to analyze
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeImage(image) {
    const formData = new FormData();
    formData.append('image', image);

    const response = await this.request('/advanced/analyze', {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey
      },
      body: formData
    });

    return response.data;
  }

  /**
   * Generate thumbnails
   * @param {File|Blob} image - Image file
   * @param {number[]} sizes - Array of thumbnail sizes
   * @returns {Promise<Object[]>} Thumbnail results
   */
  async generateThumbnails(image, sizes = [150, 300, 600]) {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('sizes', JSON.stringify(sizes));

    const response = await this.request('/advanced/thumbnails', {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey
      },
      body: formData
    });

    return response.data;
  }

  /**
   * Get API usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsage() {
    const response = await this.request('/developer/usage', {
      method: 'GET'
    });

    return response.data;
  }

  /**
   * Get monthly usage breakdown
   * @returns {Promise<Object>} Monthly usage data
   */
  async getMonthlyUsage() {
    const response = await this.request('/developer/usage/monthly', {
      method: 'GET'
    });

    return response.data;
  }

  /**
   * Get API status
   * @returns {Promise<Object>} API status
   */
  async getStatus() {
    const response = await this.request('/developer/status', {
      method: 'GET'
    });

    return response.data;
  }

  /**
   * Create webhook
   * @param {string} url - Webhook URL
   * @param {string[]} events - Array of events to listen for
   * @param {string} secret - Webhook secret (optional)
   * @returns {Promise<Object>} Webhook configuration
   */
  async createWebhook(url, events, secret = null) {
    const response = await this.request('/developer/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        url,
        events,
        secret
      })
    });

    return response.data;
  }

  /**
   * List webhooks
   * @returns {Promise<Object[]>} List of webhooks
   */
  async listWebhooks() {
    const response = await this.request('/developer/webhooks', {
      method: 'GET'
    });

    return response.data;
  }

  /**
   * Delete webhook
   * @param {string} webhookId - Webhook ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteWebhook(webhookId) {
    const response = await this.request(`/developer/webhooks/${webhookId}`, {
      method: 'DELETE'
    });

    return response.data;
  }

  /**
   * Test webhook
   * @param {string} webhookId - Webhook ID
   * @returns {Promise<Object>} Test result
   */
  async testWebhook(webhookId) {
    const response = await this.request(`/developer/webhooks/${webhookId}/test`, {
      method: 'POST'
    });

    return response.data;
  }

  /**
   * Utility: Download optimized image
   * @param {string} downloadUrl - Download URL from optimization result
   * @param {string} filename - Optional filename
   */
  downloadImage(downloadUrl, filename = null) {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'optimized-image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Utility: Format file size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Utility: Calculate compression ratio
   * @param {number} originalSize - Original file size
   * @param {number} optimizedSize - Optimized file size
   * @returns {number} Compression ratio percentage
   */
  calculateCompressionRatio(originalSize, optimizedSize) {
    return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  }
}

// Browser global export
if (typeof window !== 'undefined') {
  window.PixelSqueezeSDK = PixelSqueezeSDK;
}

// Node.js/CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PixelSqueezeSDK;
}

// ES6 module export
if (typeof exports !== 'undefined') {
  exports.default = PixelSqueezeSDK;
} 