const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../utils/logger');

class WebAssemblyProcessor {
  constructor() {
    this.wasmPath = path.join(__dirname, '../wasm');
    this.isAvailable = false;
    this.initialized = false;
    this.initPromise = null;
    
    this.init();
  }

  /**
   * Initialize WebAssembly processor
   */
  async init() {
    try {
      // Check if WebAssembly files exist
      await this.checkWasmAvailability();
      
      if (this.isAvailable) {
        logger.info('WebAssembly processor initialized successfully');
        this.initialized = true;
      } else {
        logger.warn('WebAssembly processor not available, falling back to native processing');
      }
    } catch (error) {
      logger.error('Error initializing WebAssembly processor:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Check WebAssembly availability
   */
  async checkWasmAvailability() {
    try {
      const wasmFiles = [
        'image_processor.wasm',
        'image_processor.js',
        'image_processor.worker.js'
      ];

      for (const file of wasmFiles) {
        const filePath = path.join(this.wasmPath, file);
        await fs.access(filePath);
      }

      this.isAvailable = true;
    } catch (error) {
      this.isAvailable = false;
    }
  }

  /**
   * Process image using WebAssembly for optimal performance
   */
  async processImageWasm(imageBuffer, options = {}) {
    if (!this.isAvailable || !this.initialized) {
      throw new Error('WebAssembly processor not available');
    }

    const {
      operation = 'optimize',
      quality = 80,
      format = 'auto',
      width,
      height,
      progressive = true,
      mozjpeg = true
    } = options;

    try {
      // Create temporary input file
      const inputPath = path.join(this.wasmPath, `input_${Date.now()}.jpg`);
      const outputPath = path.join(this.wasmPath, `output_${Date.now()}.jpg`);
      
      await fs.writeFile(inputPath, imageBuffer);

      // Execute WebAssembly processing
      const result = await this.executeWasmProcessing(inputPath, outputPath, {
        operation,
        quality,
        format,
        width,
        height,
        progressive,
        mozjpeg
      });

      // Read processed image
      const processedBuffer = await fs.readFile(outputPath);

      // Clean up temporary files
      await this.cleanupTempFiles([inputPath, outputPath]);

      return {
        buffer: processedBuffer,
        originalSize: imageBuffer.length,
        processedSize: processedBuffer.length,
        compressionRatio: ((imageBuffer.length - processedBuffer.length) / imageBuffer.length) * 100,
        format: result.format,
        dimensions: result.dimensions,
        processingTime: result.processingTime
      };

    } catch (error) {
      logger.error('WebAssembly processing error:', error);
      throw new Error(`WebAssembly processing failed: ${error.message}`);
    }
  }

  /**
   * Execute WebAssembly processing
   */
  async executeWasmProcessing(inputPath, outputPath, options) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const wasmProcess = spawn('node', [
        path.join(this.wasmPath, 'image_processor.js'),
        inputPath,
        outputPath,
        JSON.stringify(options)
      ], {
        cwd: this.wasmPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      wasmProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      wasmProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      wasmProcess.on('close', (code) => {
        const processingTime = Date.now() - startTime;

        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve({
              ...result,
              processingTime
            });
          } catch (error) {
            reject(new Error('Invalid WebAssembly output format'));
          }
        } else {
          reject(new Error(`WebAssembly processing failed: ${stderr}`));
        }
      });

      wasmProcess.on('error', (error) => {
        reject(new Error(`WebAssembly process error: ${error.message}`));
      });

      // Set timeout for WebAssembly processing
      setTimeout(() => {
        wasmProcess.kill();
        reject(new Error('WebAssembly processing timeout'));
      }, 30000); // 30 seconds timeout
    });
  }

  /**
   * Batch process images using WebAssembly
   */
  async batchProcessWasm(images, options = {}) {
    if (!this.isAvailable || !this.initialized) {
      throw new Error('WebAssembly processor not available');
    }

    const results = [];
    const batchSize = options.batchSize || 5; // Process 5 images concurrently
    const batches = this.chunkArray(images, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPromises = batch.map(image => 
        this.processImageWasm(image.buffer, { ...options, ...image.options })
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push({
              ...result.value,
              originalName: batch[index].name,
              success: true
            });
          } else {
            results.push({
              originalName: batch[index].name,
              success: false,
              error: result.reason.message
            });
          }
        });

        // Progress callback if provided
        if (options.onProgress) {
          const progress = ((i + 1) * batchSize / images.length) * 100;
          options.onProgress(Math.min(progress, 100));
        }

      } catch (error) {
        logger.error(`Batch ${i + 1} processing error:`, error);
        // Continue with next batch
      }
    }

    return results;
  }

  /**
   * Optimize image using WebAssembly
   */
  async optimizeImageWasm(imageBuffer, options = {}) {
    return this.processImageWasm(imageBuffer, {
      operation: 'optimize',
      ...options
    });
  }

  /**
   * Resize image using WebAssembly
   */
  async resizeImageWasm(imageBuffer, width, height, options = {}) {
    return this.processImageWasm(imageBuffer, {
      operation: 'resize',
      width,
      height,
      ...options
    });
  }

  /**
   * Convert image format using WebAssembly
   */
  async convertFormatWasm(imageBuffer, targetFormat, options = {}) {
    return this.processImageWasm(imageBuffer, {
      operation: 'convert',
      format: targetFormat,
      ...options
    });
  }

  /**
   * Apply filters using WebAssembly
   */
  async applyFilterWasm(imageBuffer, filter, options = {}) {
    return this.processImageWasm(imageBuffer, {
      operation: 'filter',
      filter,
      ...options
    });
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.warn(`Failed to cleanup temp file ${filePath}:`, error);
      }
    }
  }

  /**
   * Split array into chunks
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      available: this.isAvailable,
      initialized: this.initialized,
      wasmPath: this.wasmPath
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isAvailable) {
        return { status: 'unavailable', reason: 'WebAssembly files not found' };
      }

      // Test with a small sample image
      const testImage = Buffer.alloc(100); // 100 bytes test image
      
      try {
        await this.processImageWasm(testImage, { operation: 'optimize', quality: 80 });
        return { status: 'healthy', message: 'WebAssembly processor working correctly' };
      } catch (error) {
        return { status: 'unhealthy', reason: error.message };
      }
    } catch (error) {
      return { status: 'error', reason: error.message };
    }
  }
}

module.exports = new WebAssemblyProcessor();
