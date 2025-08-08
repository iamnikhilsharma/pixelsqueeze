const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { logger } = require('./logger');

class ImageProcessor {
  constructor() {
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'webp'];
    this.maxDimensions = {
      width: 8000,
      height: 8000
    };
  }

  /**
   * Process and optimize an image
   * @param {Buffer} imageBuffer - The image buffer to process
   * @param {Object} options - Processing options
   * @returns {Object} - Processing result
   */
  async processImage(imageBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        quality = 80,
        format = 'auto',
        preserveMetadata = false,
        maxWidth,
        maxHeight,
        progressive = true
      } = options;

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      
      // Validate image dimensions
      if (metadata.width > this.maxDimensions.width || metadata.height > this.maxDimensions.height) {
        throw new Error('Image dimensions too large');
      }

      // Determine output format
      const outputFormat = this.determineOutputFormat(metadata.format, format);
      
      // Calculate new dimensions if maxWidth/maxHeight specified
      const newDimensions = this.calculateDimensions(metadata, maxWidth, maxHeight);
      
      // Process image with Sharp
      let processedBuffer = await this.processWithSharp(
        imageBuffer,
        outputFormat,
        quality,
        newDimensions,
        progressive,
        preserveMetadata
      );

    // Further optimize with Imagemin if needed
    if (outputFormat === 'jpg' || outputFormat === 'jpeg' || outputFormat === 'png') {
      processedBuffer = await this.optimizeWithImagemin(processedBuffer, outputFormat, quality);
    }

      const processingTime = Date.now() - startTime;
      
      // Get final metadata
      const finalMetadata = await sharp(processedBuffer).metadata();
      
      return {
        success: true,
        buffer: processedBuffer,
        originalSize: imageBuffer.length,
        optimizedSize: processedBuffer.length,
        compressionRatio: this.calculateCompressionRatio(imageBuffer.length, processedBuffer.length),
        format: outputFormat,
        dimensions: {
          original: {
            width: metadata.width,
            height: metadata.height
          },
          optimized: {
            width: finalMetadata.width,
            height: finalMetadata.height
          }
        },
        processingTime,
        metadata: preserveMetadata ? await this.extractMetadata(imageBuffer) : null
      };

    } catch (error) {
      logger.error('Image processing error:', error);
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Process image with Sharp
   */
  async processWithSharp(buffer, format, quality, dimensions, progressive, preserveMetadata) {
    let sharpInstance = sharp(buffer, {
      failOnError: true
    });

    // Apply transformations
    if (dimensions) {
      sharpInstance = sharpInstance.resize(dimensions.width, dimensions.height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Apply format-specific processing
    switch (format) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive,
          mozjpeg: true
        });
        break;
      
      case 'png':
        sharpInstance = sharpInstance.png({
          quality,
          progressive,
          compressionLevel: 9
        });
        break;
      
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality,
          effort: 6
        });
        break;
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Preserve metadata if requested
    if (preserveMetadata) {
      sharpInstance = sharpInstance.withMetadata();
    }

    return await sharpInstance.toBuffer();
  }

  /**
   * Further optimize with Imagemin
   */
  async optimizeWithImagemin(buffer, format, quality) {
    // Dynamically import ESM imagemin and plugins from CommonJS
    const { default: imagemin } = await import('imagemin');

    const plugins = [];
    if (format === 'jpeg' || format === 'jpg') {
      const { default: imageminMozjpeg } = await import('imagemin-mozjpeg');
      plugins.push(
        imageminMozjpeg({
          quality,
          progressive: true,
        })
      );
    } else if (format === 'png') {
      const { default: imageminPngquant } = await import('imagemin-pngquant');
      const q = Math.max(0, Math.min(1, quality / 100));
      plugins.push(
        imageminPngquant({
          quality: [q, q],
        })
      );
    }

    if (plugins.length === 0) {
      return buffer;
    }

    // imagemin.buffer returns a Buffer in v8+
    const optimized = await imagemin.buffer(buffer, { plugins });
    return optimized || buffer;
  }

  /**
   * Determine output format
   */
  determineOutputFormat(inputFormat, requestedFormat) {
    if (requestedFormat && requestedFormat !== 'auto') {
      if (this.supportedFormats.includes(requestedFormat)) {
        return requestedFormat;
      }
      throw new Error(`Unsupported output format: ${requestedFormat}`);
    }

    // Auto-detect best format based on input
    switch (inputFormat) {
      case 'jpeg':
      case 'jpg':
        return 'jpeg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      default:
        return 'jpeg'; // Default fallback
    }
  }

  /**
   * Calculate new dimensions
   */
  calculateDimensions(metadata, maxWidth, maxHeight) {
    if (!maxWidth && !maxHeight) {
      return null;
    }

    let { width, height } = metadata;
    
    if (maxWidth && width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    
    if (maxHeight && height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    return { width, height };
  }

  /**
   * Calculate compression ratio
   */
  calculateCompressionRatio(originalSize, optimizedSize) {
    return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  }

  /**
   * Extract metadata from image
   */
  async extractMetadata(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        exif: metadata.exif,
        iptc: metadata.iptc,
        xmp: metadata.xmp,
        icc: metadata.icc
      };
    } catch (error) {
      logger.warn('Failed to extract metadata:', error);
      return null;
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName, format) {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    const extension = format === 'jpeg' ? 'jpg' : format;
    return `${timestamp}-${uuid}.${extension}`;
  }

  /**
   * Validate image buffer
   */
  async validateImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image: no dimensions found');
      }
      
      if (!this.supportedFormats.includes(metadata.format)) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }
      
      return metadata;
    } catch (error) {
      throw new Error(`Image validation failed: ${error.message}`);
    }
  }

  /**
   * Process multiple images
   */
  async processMultipleImages(images, options = {}) {
    const results = [];
    
    for (const image of images) {
      try {
        const result = await this.processImage(image.buffer, {
          ...options,
          ...image.options
        });
        results.push({
          ...result,
          originalName: image.originalName
        });
      } catch (error) {
        results.push({
          success: false,
          originalName: image.originalName,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Get supported formats
   */
  getSupportedFormats() {
    return [...this.supportedFormats];
  }

  /**
   * Get format info
   */
  getFormatInfo(format) {
    const formatInfo = {
      jpeg: {
        name: 'JPEG',
        description: 'Lossy compression, good for photographs',
        mimeType: 'image/jpeg',
        extensions: ['jpg', 'jpeg']
      },
      png: {
        name: 'PNG',
        description: 'Lossless compression, good for graphics with transparency',
        mimeType: 'image/png',
        extensions: ['png']
      },
      webp: {
        name: 'WebP',
        description: 'Modern format with excellent compression',
        mimeType: 'image/webp',
        extensions: ['webp']
      }
    };
    
    return formatInfo[format] || null;
  }
}

module.exports = new ImageProcessor(); 