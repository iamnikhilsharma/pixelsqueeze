const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

class StorageService {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.bucket = process.env.AWS_S3_BUCKET;
    this.region = process.env.AWS_REGION || 'us-east-1';
  }

  /**
   * Upload file to S3
   * @param {Buffer} buffer - File buffer
   * @param {string} key - S3 key
   * @param {string} contentType - MIME type
   * @param {Object} options - Additional options
   * @returns {Object} - Upload result
   */
  async uploadFile(buffer, key, contentType, options = {}) {
    try {
      const {
        isPublic = false,
        expiresIn = 24 * 60 * 60, // 24 hours
        metadata = {}
      } = options;

      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          fileId: uuidv4()
        }
      };

      // Set ACL based on public flag
      if (isPublic) {
        params.ACL = 'public-read';
      }

      // Set expiration if specified
      if (expiresIn) {
        params.Expires = new Date(Date.now() + expiresIn * 1000);
      }

      const result = await this.s3.upload(params).promise();
      
      logger.info(`File uploaded successfully: ${key}`);
      
      return {
        success: true,
        key: result.Key,
        url: result.Location,
        etag: result.ETag,
        bucket: result.Bucket
      };

    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for file download
   * @param {string} key - S3 key
   * @param {number} expiresIn - URL expiration time in seconds
   * @returns {string} - Presigned URL
   */
  async generateDownloadUrl(key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      
      logger.info(`Generated download URL for: ${key}`);
      
      return url;

    } catch (error) {
      logger.error('S3 presigned URL generation error:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   * @param {string} key - S3 key
   * @returns {Object} - Delete result
   */
  async deleteFile(key) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      await this.s3.deleteObject(params).promise();
      
      logger.info(`File deleted successfully: ${key}`);
      
      return {
        success: true,
        key: key
      };

    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from S3
   * @param {Array} keys - Array of S3 keys
   * @returns {Object} - Delete result
   */
  async deleteMultipleFiles(keys) {
    try {
      if (!keys || keys.length === 0) {
        return { success: true, deleted: 0 };
      }

      const params = {
        Bucket: this.bucket,
        Delete: {
          Objects: keys.map(key => ({ Key: key })),
          Quiet: false
        }
      };

      const result = await this.s3.deleteObjects(params).promise();
      
      logger.info(`Deleted ${result.Deleted.length} files from S3`);
      
      return {
        success: true,
        deleted: result.Deleted.length,
        errors: result.Errors || []
      };

    } catch (error) {
      logger.error('S3 bulk delete error:', error);
      throw new Error(`Bulk delete failed: ${error.message}`);
    }
  }

  /**
   * Check if file exists in S3
   * @param {string} key - S3 key
   * @returns {boolean} - File existence
   */
  async fileExists(key) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      await this.s3.headObject(params).promise();
      return true;

    } catch (error) {
      if (error.code === 'NotFound' || error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   * @param {string} key - S3 key
   * @returns {Object} - File metadata
   */
  async getFileMetadata(key) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      const result = await this.s3.headObject(params).promise();
      
      return {
        success: true,
        key: key,
        size: result.ContentLength,
        contentType: result.ContentType,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata || {}
      };

    } catch (error) {
      logger.error('S3 metadata retrieval error:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Copy file within S3
   * @param {string} sourceKey - Source S3 key
   * @param {string} destinationKey - Destination S3 key
   * @returns {Object} - Copy result
   */
  async copyFile(sourceKey, destinationKey) {
    try {
      const params = {
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey
      };

      const result = await this.s3.copyObject(params).promise();
      
      logger.info(`File copied successfully: ${sourceKey} -> ${destinationKey}`);
      
      return {
        success: true,
        sourceKey: sourceKey,
        destinationKey: destinationKey,
        etag: result.ETag
      };

    } catch (error) {
      logger.error('S3 copy error:', error);
      throw new Error(`Copy failed: ${error.message}`);
    }
  }

  /**
   * List files in S3 bucket with prefix
   * @param {string} prefix - Key prefix
   * @param {number} maxKeys - Maximum number of keys to return
   * @returns {Object} - List result
   */
  async listFiles(prefix = '', maxKeys = 1000) {
    try {
      const params = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const result = await this.s3.listObjectsV2(params).promise();
      
      return {
        success: true,
        files: result.Contents || [],
        count: result.KeyCount,
        isTruncated: result.IsTruncated,
        nextContinuationToken: result.NextContinuationToken
      };

    } catch (error) {
      logger.error('S3 list files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Generate unique key for file
   * @param {string} originalName - Original filename
   * @param {string} format - File format
   * @param {string} prefix - Key prefix
   * @returns {string} - Unique S3 key
   */
  generateKey(originalName, format, prefix = 'uploads') {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    const extension = format === 'jpeg' ? 'jpg' : format;
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${prefix}/${timestamp}/${uuid}-${sanitizedName}.${extension}`;
  }

  /**
   * Clean up expired files
   * @param {Date} expirationDate - Files older than this date will be deleted
   * @returns {Object} - Cleanup result
   */
  async cleanupExpiredFiles(expirationDate) {
    try {
      const files = await this.listFiles();
      const expiredKeys = [];
      
      for (const file of files.files) {
        if (file.LastModified < expirationDate) {
          expiredKeys.push(file.Key);
        }
      }
      
      if (expiredKeys.length > 0) {
        const result = await this.deleteMultipleFiles(expiredKeys);
        logger.info(`Cleaned up ${result.deleted} expired files`);
        return result;
      }
      
      return {
        success: true,
        deleted: 0,
        message: 'No expired files found'
      };

    } catch (error) {
      logger.error('S3 cleanup error:', error);
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Get bucket statistics
   * @returns {Object} - Bucket statistics
   */
  async getBucketStats() {
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
        bucket: this.bucket,
        region: this.region
      };

    } catch (error) {
      logger.error('S3 bucket stats error:', error);
      throw new Error(`Failed to get bucket stats: ${error.message}`);
    }
  }

  /**
   * Test S3 connection
   * @returns {boolean} - Connection status
   */
  async testConnection() {
    try {
      await this.s3.headBucket({ Bucket: this.bucket }).promise();
      logger.info('S3 connection test successful');
      return true;
    } catch (error) {
      logger.error('S3 connection test failed:', error);
      return false;
    }
  }
}

module.exports = new StorageService(); 