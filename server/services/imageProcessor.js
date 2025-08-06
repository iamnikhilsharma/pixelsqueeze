const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class ImageProcessor {
  constructor() {
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  async optimizeImage(file, options = {}) {
    const {
      quality = 80,
      format = 'jpeg',
      width,
      height,
      preserveMetadata = false
    } = options;

    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (file.size > this.maxFileSize) {
        throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
      }

      // Generate unique filename
      const fileId = uuidv4();
      const originalExt = path.extname(file.originalname).toLowerCase();
      const outputFormat = format === 'auto' ? this.getBestFormat(originalExt) : format;
      const outputFilename = `${fileId}.${outputFormat}`;
      const outputPath = path.join(process.env.TEMP_UPLOAD_DIR || './uploads/temp', outputFilename);

      // Ensure temp directory exists
      await this.ensureDirectoryExists(path.dirname(outputPath));

      // Process image with Sharp
      let sharpInstance = sharp(file.buffer);

      // Resize if dimensions provided
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Apply format-specific optimizations
      switch (outputFormat) {
        case 'jpeg':
        case 'jpg':
          sharpInstance = sharpInstance.jpeg({
            quality: quality,
            progressive: true,
            mozjpeg: true
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            quality: quality,
            progressive: true,
            compressionLevel: 9
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality: quality,
            effort: 6
          });
          break;
        default:
          throw new Error(`Unsupported output format: ${outputFormat}`);
      }

      // Preserve metadata if requested
      if (preserveMetadata) {
        sharpInstance = sharpInstance.withMetadata();
      }

      // Save optimized image
      await sharpInstance.toFile(outputPath);

      // Get file stats
      const stats = await fs.stat(outputPath);
      const originalSize = file.size;
      const optimizedSize = stats.size;
      const compressionRatio = Math.round(((originalSize - optimizedSize) / originalSize) * 100);

      return {
        id: fileId,
        originalSize,
        optimizedSize,
        compressionRatio,
        format: outputFormat,
        width: width,
        height: height,
        quality,
        downloadUrl: `/uploads/${outputFilename}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date()
      };

    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  async optimizeFromUrl(imageUrl, options = {}) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const file = {
        buffer: Buffer.from(buffer),
        size: buffer.byteLength,
        originalname: path.basename(imageUrl)
      };

      return await this.optimizeImage(file, options);
    } catch (error) {
      console.error('URL image processing error:', error);
      throw new Error(`Failed to process image from URL: ${error.message}`);
    }
  }

  async batchOptimize(files, options = {}) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.optimizeImage(file, options);
        results.push(result);
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: files.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  getBestFormat(originalExt) {
    const ext = originalExt.toLowerCase();
    if (ext === '.png') return 'png';
    if (ext === '.webp') return 'webp';
    return 'jpeg'; // Default to JPEG for everything else
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async cleanupExpiredFiles() {
    try {
      const tempDir = process.env.TEMP_UPLOAD_DIR || './uploads/temp';
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up expired file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new ImageProcessor(); 