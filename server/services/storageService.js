const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

class LocalStorageService {
  constructor() {
    this.baseDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../../uploads');
    // Auto-detect public URL based on environment
    this.publicUrl = this.getPublicUrl();
    console.log(`🌐 StorageService initialized with publicUrl: ${this.publicUrl}`);
    this.ensureDirectories();
  }

  /**
   * Get the correct public URL based on environment
   */
  getPublicUrl() {
    // 1. Check if PUBLIC_URL is explicitly set
    if (process.env.PUBLIC_URL) {
      return process.env.PUBLIC_URL.replace(/\/$/, ''); // Remove trailing slash
    }

    // 2. Auto-detect for common deployment platforms
    if (process.env.RENDER_EXTERNAL_URL) {
      // Render.com deployment
      return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
    }

    if (process.env.HEROKU_APP_NAME) {
      // Heroku deployment
      return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
    }

    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      // Railway deployment
      return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }

    if (process.env.VERCEL_URL) {
      // Vercel deployment (though backend shouldn't be on Vercel)
      return `https://${process.env.VERCEL_URL}`;
    }

    // 3. Production fallback - try to construct from PORT
    if (process.env.NODE_ENV === 'production') {
      const port = process.env.PORT || 5002;
      console.warn('⚠️  PUBLIC_URL not set in production. Auto-detecting...');
      
      // If running on a standard web port, assume it's accessible via domain
      if (port === 80 || port === 443) {
        return process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'https://your-backend-domain.com';
      }
      
      // Otherwise, include the port
      return process.env.DOMAIN ? `https://${process.env.DOMAIN}:${port}` : `https://your-backend-domain.com:${port}`;
    }

    // 4. Development fallback
    const port = process.env.PORT || 5002;
    return `http://localhost:${port}`;
  }

  /**
   * Ensure storage directories exist
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      await fs.mkdir(path.join(this.baseDir, 'optimized'), { recursive: true });
      await fs.mkdir(path.join(this.baseDir, 'watermarked'), { recursive: true });
      await fs.mkdir(path.join(this.baseDir, 'watermarks'), { recursive: true });
      await fs.mkdir(path.join(this.baseDir, 'temp'), { recursive: true });
      logger.info('Local storage directories created');
    } catch (error) {
      logger.error('Error creating storage directories:', error);
    }
  }

  /**
   * Upload file to local storage
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Filename
   * @param {string} contentType - MIME type
   * @param {Object} options - Additional options
   * @returns {Object} - Upload result
   */
  async uploadFile(buffer, filename, contentType, options = {}) {
    try {
      const {
        isPublic = false,
        expiresIn = 24 * 60 * 60, // 24 hours (unused for local)
        metadata = {},
        folder,
      } = options;

      // Generate unique filename
      const timestamp = Date.now();
      const uuid = uuidv4().split('-')[0];
      const extension = path.extname(filename) || '';
      const uniqueFilename = `${timestamp}-${uuid}${extension}`;
      
      // Determine storage path
      let storagePath = 'optimized';
      if (folder) storagePath = folder;
      else if (isPublic) storagePath = 'public';

      const filePath = path.join(this.baseDir, storagePath, uniqueFilename);
      
      // Write file to disk
      await fs.writeFile(filePath, buffer);
      
      // Metadata (optional)
      const metadataPath = filePath + '.meta.json';
      const fileMetadata = {
        originalName: filename,
        contentType,
        size: buffer.length,
        uploadedAt: new Date().toISOString(),
        metadata,
        fileId: uuidv4()
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(fileMetadata, null, 2));
      
      logger.info(`File uploaded successfully: ${storagePath}/${uniqueFilename}`);
      
      return {
        success: true,
        key: `${storagePath}/${uniqueFilename}`,
        url: `${this.publicUrl}/uploads/${storagePath}/${uniqueFilename}`,
        path: filePath,
        size: buffer.length
      };

    } catch (error) {
      logger.error('Local upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Generate download URL for file
   */
  async generateDownloadUrl(key, expiresIn = 3600) {
    try {
      const filePath = path.join(this.baseDir, key);
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error('File not found');
      }
      const downloadUrl = `${this.publicUrl}/uploads/${key}`;
      logger.info(`Generated download URL: ${downloadUrl} (publicUrl: ${this.publicUrl}, key: ${key})`);
      return downloadUrl;
    } catch (error) {
      logger.error('Local download URL generation error:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /** Resolve absolute path for subdir */
  getFilePathIn(subdir, filenameOrKey) {
    const key = filenameOrKey.includes('/') ? filenameOrKey : `${subdir}/${filenameOrKey}`;
    return path.join(this.baseDir, key);
  }

  /**
   * Resolve absolute path for an optimized file
   */
  getOptimizedFilePath(filenameOrKey) {
    return this.getFilePathIn('optimized', filenameOrKey);
  }

  /**
   * Delete file from local storage
   * @param {string} filename - Filename
   * @returns {Object} - Delete result
   */
  async deleteFile(filename) {
    try {
      const preferredPath = this.getOptimizedFilePath(filename);
      const legacyPath = path.join(this.baseDir, filename);
      const metadataPreferred = preferredPath + '.meta.json';
      const metadataLegacy = legacyPath + '.meta.json';

      // Try deleting both preferred and legacy locations (idempotent)
      await Promise.all([
        fs.unlink(preferredPath).catch(() => {}),
        fs.unlink(legacyPath).catch(() => {}),
        fs.unlink(metadataPreferred).catch(() => {}),
        fs.unlink(metadataLegacy).catch(() => {})
      ]);
      
      logger.info(`File deleted successfully: ${filename}`);
      
      return {
        success: true,
        filename: filename
      };

    } catch (error) {
      logger.error('Local delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from local storage
   * @param {Array} filenames - Array of filenames
   * @returns {Object} - Delete result
   */
  async deleteMultipleFiles(filenames) {
    try {
      if (!filenames || filenames.length === 0) {
        return { success: true, deleted: 0 };
      }

      const deletePromises = filenames.map(filename => this.deleteFile(filename));
      const results = await Promise.allSettled(deletePromises);
      
      const deleted = results.filter(result => result.status === 'fulfilled').length;
      const errors = results.filter(result => result.status === 'rejected').length;
      
      logger.info(`Deleted ${deleted} files from local storage`);
      
      return {
        success: true,
        deleted,
        errors
      };

    } catch (error) {
      logger.error('Local bulk delete error:', error);
      throw new Error(`Bulk delete failed: ${error.message}`);
    }
  }

  /**
   * Check if file exists in local storage
   * @param {string} filename - Filename
   * @returns {boolean} - File existence
   */
  async fileExists(filename) {
    try {
      const filePath = path.join(this.baseDir, 'optimized', filename);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata from local storage
   * @param {string} filename - Filename
   * @returns {Object} - File metadata
   */
  async getFileMetadata(filename) {
    try {
      const filePath = path.join(this.baseDir, 'optimized', filename);
      const metadataPath = filePath + '.meta.json';
      
      const [stats, metadataContent] = await Promise.all([
        fs.stat(filePath),
        fs.readFile(metadataPath, 'utf8')
      ]);
      
      const metadata = JSON.parse(metadataContent);
      
      return {
        success: true,
        filename: filename,
        size: stats.size,
        contentType: metadata.contentType,
        lastModified: stats.mtime,
        metadata: metadata
      };

    } catch (error) {
      logger.error('Local metadata retrieval error:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Copy file within local storage
   * @param {string} sourceFilename - Source filename
   * @param {string} destinationFilename - Destination filename
   * @returns {Object} - Copy result
   */
  async copyFile(sourceFilename, destinationFilename) {
    try {
      const sourcePath = path.join(this.baseDir, 'optimized', sourceFilename);
      const destPath = path.join(this.baseDir, 'optimized', destinationFilename);
      
      await fs.copyFile(sourcePath, destPath);
      
      // Copy metadata if it exists
      const sourceMetaPath = sourcePath + '.meta.json';
      const destMetaPath = destPath + '.meta.json';
      
      try {
        await fs.copyFile(sourceMetaPath, destMetaPath);
      } catch (error) {
        // Metadata doesn't exist, that's okay
      }
      
      logger.info(`File copied successfully: ${sourceFilename} -> ${destinationFilename}`);
      
      return {
        success: true,
        sourceFilename: sourceFilename,
        destinationFilename: destinationFilename
      };

    } catch (error) {
      logger.error('Local copy error:', error);
      throw new Error(`Copy failed: ${error.message}`);
    }
  }

  /**
   * List files in local storage
   * @param {string} prefix - File prefix
   * @param {number} maxFiles - Maximum number of files to return
   * @returns {Object} - List result
   */
  async listFiles(prefix = '', maxFiles = 1000) {
    try {
      const optimizedDir = path.join(this.baseDir, 'optimized');
      
      try {
        await fs.access(optimizedDir);
      } catch (error) {
        return {
          success: true,
          files: [],
          count: 0,
          isTruncated: false
        };
      }
      
      const files = await fs.readdir(optimizedDir);
      
      // Filter by prefix and exclude metadata files
      const filteredFiles = files
        .filter(file => file.startsWith(prefix) && !file.endsWith('.meta.json'))
        .slice(0, maxFiles);
      
      // Get file stats
      const fileStats = await Promise.all(
        filteredFiles.map(async (filename) => {
          const filePath = path.join(optimizedDir, filename);
          const stats = await fs.stat(filePath);
          return {
            Key: filename,
            Size: stats.size,
            LastModified: stats.mtime
          };
        })
      );
      
      return {
        success: true,
        files: fileStats,
        count: fileStats.length,
        isTruncated: fileStats.length >= maxFiles
      };

    } catch (error) {
      logger.error('Local list files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Generate unique key for file
   * @param {string} originalName - Original filename
   * @param {string} format - File format
   * @param {string} prefix - Key prefix
   * @returns {string} - Unique filename
   */
  generateKey(originalName, format, prefix = 'uploads') {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    const extension = format === 'jpeg' ? 'jpg' : format;
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${timestamp}-${uuid}-${sanitizedName}.${extension}`;
  }

  /**
   * Clean up expired files
   * @param {Date} expirationDate - Files older than this date will be deleted
   * @returns {Object} - Cleanup result
   */
  async cleanupExpiredFiles(expirationDate) {
    try {
      const files = await this.listFiles();
      const expiredFiles = [];
      
      for (const file of files.files) {
        if (file.LastModified < expirationDate) {
          expiredFiles.push(file.Key);
        }
      }
      
      if (expiredFiles.length > 0) {
        const result = await this.deleteMultipleFiles(expiredFiles);
        logger.info(`Cleaned up ${result.deleted} expired files`);
        return result;
      }
      
      return {
        success: true,
        deleted: 0,
        message: 'No expired files found'
      };

    } catch (error) {
      logger.error('Local cleanup error:', error);
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} - Storage statistics
   */
  async getStorageStats() {
    try {
      const files = await this.listFiles();
      let totalSize = 0;
      
      for (const file of files.files) {
        totalSize += file.Size;
      }
      
      return {
        success: true,
        fileCount: files.count,
        totalSize: totalSize,
        storagePath: this.baseDir,
        publicUrl: this.publicUrl
      };

    } catch (error) {
      logger.error('Local storage stats error:', error);
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }

  /**
   * Test local storage connection
   * @returns {boolean} - Connection status
   */
  async testConnection() {
    try {
      await this.ensureDirectories();
      logger.info('Local storage connection test successful');
      return true;
    } catch (error) {
      logger.error('Local storage connection test failed:', error);
      return false;
    }
  }

  /**
   * Serve static files (for Express middleware)
   */
  getStaticMiddleware() {
    return async (req, res, next) => {
      // When mounted at '/uploads', req.path is relative to that mount
      const relativePath = req.path.replace(/^\/+/, '');
      const filePath = path.join(this.baseDir, relativePath);

      try {
        // Pre-flight for any odd embeds
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Origin, Range');
          return res.status(204).end();
        }

        // Check if file exists
        await fs.access(filePath);

        // CORS/CORP headers to allow <img src> from other origins (e.g., Vercel)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        // Set appropriate headers
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Expires', new Date(Date.now() + 3600000).toUTCString());

        // Serve the file
        res.sendFile(filePath);
      } catch (error) {
        console.error(`File not found: ${filePath}`, error);
        res.status(404).json({ error: 'File not found', path: req.originalUrl });
      }
    };
  }
}

module.exports = new LocalStorageService(); 