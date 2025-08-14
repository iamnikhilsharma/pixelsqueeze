const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class AdvancedImageProcessor {
  constructor() {
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'gif'];
    this.maxConcurrentOperations = 5;
    
    // Watermark positioning presets
    this.watermarkPositions = {
      'top-left': { gravity: 'northwest', x: 20, y: 20 },
      'top-center': { gravity: 'north', x: 0, y: 20 },
      'top-right': { gravity: 'northeast', x: -20, y: 20 },
      'center-left': { gravity: 'west', x: 20, y: 0 },
      'center': { gravity: 'center', x: 0, y: 0 },
      'center-right': { gravity: 'east', x: -20, y: 0 },
      'bottom-left': { gravity: 'southwest', x: 20, y: -20 },
      'bottom-center': { gravity: 'south', x: 0, y: -20 },
      'bottom-right': { gravity: 'southeast', x: -20, y: -20 }
    };
  }

  // Enhanced optimization with advanced options
  async optimizeImage(file, options = {}) {
    const {
      quality = 80,
      format = 'auto',
      width,
      height,
      preserveMetadata = false,
      progressive = true,
      mozjpeg = true,
      webp = { quality: 80, effort: 4 },
      avif = { quality: 80, effort: 4 },
      blur = 0,
      sharpen = 0,
      grayscale = false,
      flip = false,
      flop = false,
      rotate = 0,
      brightness = 1,
      contrast = 1,
      saturation = 1,
      gamma = 1,
      watermark = null // New watermark option
    } = options;

    try {
      console.log(`Processing image: ${file.originalname}, size: ${file.buffer.length} bytes`);
      const startedAt = Date.now();
      
      let image = sharp(file.buffer);

      // Apply transformations
      if (width || height) {
        image = image.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      if (blur > 0) {
        image = image.blur(blur);
      }

      if (sharpen > 0) {
        image = image.sharpen(sharpen);
      }

      if (grayscale) {
        image = image.grayscale();
      }

      if (flip) {
        image = image.flip();
      }

      if (flop) {
        image = image.flop();
      }

      if (rotate !== 0) {
        image = image.rotate(rotate);
      }

      if (brightness !== 1 || contrast !== 1 || saturation !== 1 || gamma !== 1) {
        image = image.modulate({
          brightness,
          contrast,
          saturation,
          gamma
        });
      }

      // Apply watermark if specified
      if (watermark && (watermark.text || watermark.imageBuffer)) {
        console.log('Applying watermark to image');
        image = await this.addWatermark(await image.toBuffer(), watermark);
        image = sharp(image);
      }

      // Determine output format
      const outputFormat = this.determineOutputFormat(file.originalname, format);
      console.log(`Output format: ${outputFormat}`);
      
      // Apply format-specific optimizations
      image = this.applyFormatOptimizations(image, outputFormat, {
        quality,
        progressive,
        mozjpeg,
        webp,
        avif
      });

      // Preserve metadata if requested
      if (preserveMetadata) {
        image = image.withMetadata();
      }

      const result = await image.toBuffer();
      const originalSize = file.buffer.length;
      const optimizedSize = result.length;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;
      const processingTime = Date.now() - startedAt;

      console.log(`Optimized ${file.originalname}: ${originalSize} -> ${optimizedSize} bytes (${compressionRatio.toFixed(1)}% reduction) in ${processingTime}ms`);

      return {
        id: uuidv4(),
        originalName: file.originalname,
        originalSize,
        optimizedSize,
        compressionRatio,
        format: outputFormat,
        width: width || null,
        height: height || null,
        quality,
        buffer: result,
        processingTime
      };
    } catch (error) {
      console.error(`Advanced image optimization error for ${file.originalname}:`, error);
      throw new Error(`Failed to optimize image ${file.originalname}: ${error.message}`);
    }
  }

  // Batch processing with progress tracking
  async batchOptimize(files, options = {}, progressCallback = null) {
    const results = [];
    const totalFiles = files.length;
    let processedFiles = 0;

    console.log(`Starting batch optimization of ${totalFiles} files`);

    // Process files in batches to avoid memory issues
    const batchSize = this.maxConcurrentOperations;
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(files.length / batchSize)}`);
      
      const batchPromises = batch.map(async (file) => {
        try {
          const result = await this.optimizeImage(file, options);
          processedFiles++;
          
          if (progressCallback) {
            progressCallback({
              processed: processedFiles,
              total: totalFiles,
              percentage: Math.round((processedFiles / totalFiles) * 100),
              currentFile: file.originalname,
              result
            });
          }
          
          return result;
        } catch (error) {
          processedFiles++;
          console.error(`Error processing ${file.originalname}:`, error);
          
          if (progressCallback) {
            progressCallback({
              processed: processedFiles,
              total: totalFiles,
              percentage: Math.round((processedFiles / totalFiles) * 100),
              currentFile: file.originalname,
              error: error.message
            });
          }
          
          return {
            id: uuidv4(),
            originalName: file.originalname,
            error: error.message,
            originalSize: file.buffer.length,
            optimizedSize: 0,
            compressionRatio: 0
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    console.log(`Completed batch optimization. Processed ${results.length} files`);
    return results;
  }

  // Format conversion
  async convertFormat(file, targetFormat, options = {}) {
    const supportedFormats = ['jpeg', 'png', 'webp', 'avif', 'tiff'];
    
    if (!supportedFormats.includes(targetFormat)) {
      throw new Error(`Unsupported format: ${targetFormat}`);
    }

    try {
      let image = sharp(file.buffer);

      // Apply format-specific optimizations
      image = this.applyFormatOptimizations(image, targetFormat, options);

      const result = await image.toBuffer();
      const originalSize = file.buffer.length;
      const convertedSize = result.length;

      return {
        id: uuidv4(),
        originalName: file.originalname,
        originalFormat: this.getFileExtension(file.originalname),
        targetFormat,
        originalSize,
        convertedSize,
        buffer: result
      };
    } catch (error) {
      console.error('Format conversion error:', error);
      throw new Error(`Failed to convert format: ${error.message}`);
    }
  }

  // Add watermark to image
  async addWatermark(imageBuffer, watermarkOptions = {}) {
    const {
      type = 'text', // 'text' or 'image'
      text = '',
      font = 'Arial',
      fontSize = 48,
      fontColor = '#ffffff',
      backgroundColor = 'rgba(0,0,0,0.5)',
      imageBuffer: watermarkImageBuffer = null,
      position = 'bottom-right',
      opacity = 0.8,
      size = 1.0, // Scale factor for image watermarks
      margin = 20,
      rotation = 0,
      blendMode = 'over'
    } = watermarkOptions;

    try {
      let image = sharp(imageBuffer);
      
      if (type === 'text' && text) {
        image = await this.addTextWatermark(image, {
          text,
          font,
          fontSize,
          fontColor,
          backgroundColor,
          position,
          opacity,
          margin,
          rotation
        });
      } else if (type === 'image' && watermarkImageBuffer) {
        image = await this.addImageWatermark(image, {
          watermarkImageBuffer,
          position,
          opacity,
          size,
          margin,
          rotation,
          blendMode
        });
      }

      return await image.toBuffer();
    } catch (error) {
      console.error('Watermarking error:', error);
      throw new Error(`Failed to add watermark: ${error.message}`);
    }
  }

  // Add text watermark
  async addTextWatermark(image, options) {
    const {
      text,
      font = 'Arial',
      fontSize = 48,
      fontColor = '#ffffff',
      backgroundColor = 'rgba(0,0,0,0.5)',
      position = 'bottom-right',
      opacity = 0.8,
      margin = 20,
      rotation = 0
    } = options;

    const pos = this.watermarkPositions[position] || this.watermarkPositions['bottom-right'];
    
    // Create text watermark SVG
    const svgText = `
      <svg width="100%" height="100%">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
          </filter>
        </defs>
        <text 
          x="${pos.x === 0 ? '50%' : pos.x > 0 ? pos.x : '100%'}" 
          y="${pos.y === 0 ? '50%' : pos.y > 0 ? pos.y : '100%'}"
          font-family="${font}, sans-serif" 
          font-size="${fontSize}" 
          fill="${fontColor}"
          opacity="${opacity}"
          text-anchor="${pos.x === 0 ? 'middle' : pos.x > 0 ? 'start' : 'end'}"
          dominant-baseline="${pos.y === 0 ? 'middle' : pos.y > 0 ? 'hanging' : 'auto'}"
          transform="${rotation !== 0 ? `rotate(${rotation})` : ''}"
          filter="url(#shadow)"
        >
          ${text}
        </text>
      </svg>
    `;

    return image.composite([{
      input: Buffer.from(svgText),
      top: pos.y,
      left: pos.x,
      blend: 'over'
    }]);
  }

  // Add image watermark
  async addImageWatermark(image, options) {
    const {
      watermarkImageBuffer,
      position = 'bottom-right',
      opacity = 0.8,
      size = 1.0,
      margin = 20,
      rotation = 0,
      blendMode = 'over'
    } = options;

    const pos = this.watermarkPositions[position] || this.watermarkPositions['bottom-right'];
    
    // Process watermark image
    let watermark = sharp(watermarkImageBuffer);
    
    // Get original image dimensions
    const imageMetadata = await image.metadata();
    const watermarkMetadata = await watermark.metadata();
    
    // Calculate watermark size (default to 20% of original image width)
    const watermarkWidth = Math.round(imageMetadata.width * 0.2 * size);
    const watermarkHeight = Math.round((watermarkMetadata.height / watermarkMetadata.width) * watermarkWidth);
    
    // Resize watermark
    watermark = watermark.resize(watermarkWidth, watermarkHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
    
    // Apply opacity and rotation
    if (opacity < 1) {
      watermark = watermark.composite([{
        input: Buffer.from(`<svg><rect width="100%" height="100%" fill="white" opacity="${1 - opacity}"/></svg>`),
        blend: 'multiply'
      }]);
    }
    
    if (rotation !== 0) {
      watermark = watermark.rotate(rotation);
    }
    
    // Calculate positioning
    let top, left;
    if (pos.gravity === 'northwest') {
      top = margin;
      left = margin;
    } else if (pos.gravity === 'north') {
      top = margin;
      left = (imageMetadata.width - watermarkWidth) / 2;
    } else if (pos.gravity === 'northeast') {
      top = margin;
      left = imageMetadata.width - watermarkWidth - margin;
    } else if (pos.gravity === 'west') {
      top = (imageMetadata.height - watermarkHeight) / 2;
      left = margin;
    } else if (pos.gravity === 'center') {
      top = (imageMetadata.height - watermarkHeight) / 2;
      left = (imageMetadata.width - watermarkWidth) / 2;
    } else if (pos.gravity === 'east') {
      top = (imageMetadata.height - watermarkHeight) / 2;
      left = imageMetadata.width - watermarkWidth - margin;
    } else if (pos.gravity === 'southwest') {
      top = imageMetadata.height - watermarkHeight - margin;
      left = margin;
    } else if (pos.gravity === 'south') {
      top = imageMetadata.height - watermarkHeight - margin;
      left = (imageMetadata.width - watermarkWidth) / 2;
    } else if (pos.gravity === 'southeast') {
      top = imageMetadata.height - watermarkHeight - margin;
      left = imageMetadata.width - watermarkWidth - margin;
    }

    return image.composite([{
      input: await watermark.toBuffer(),
      top: Math.round(top),
      left: Math.round(left),
      blend: blendMode
    }]);
  }

  // Generate thumbnails with multiple size presets
  async generateThumbnails(imageBuffer, options = {}) {
    const {
      presets = ['small', 'medium', 'large', 'xl'],
      customSizes = [],
      quality = 80,
      format = 'auto',
      preserveAspectRatio = true,
      fit = 'inside',
      background = { r: 255, g: 255, b: 255, alpha: 1 },
      progressive = true,
      mozjpeg = true
    } = options;

    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      // Define preset sizes
      const presetSizes = {
        'xs': { width: 150, height: 150 },
        'small': { width: 300, height: 300 },
        'medium': { width: 600, height: 600 },
        'large': { width: 1200, height: 1200 },
        'xl': { width: 1920, height: 1920 },
        'square-150': { width: 150, height: 150 },
        'square-300': { width: 300, height: 300 },
        'square-600': { width: 600, height: 600 },
        'portrait-300': { width: 300, height: 450 },
        'portrait-600': { width: 600, height: 900 },
        'landscape-400': { width: 600, height: 400 },
        'landscape-800': { width: 1200, height: 800 }
      };

      // Combine presets and custom sizes
      const allSizes = [];
      
      // Add selected presets
      presets.forEach(preset => {
        if (presetSizes[preset]) {
          allSizes.push({
            ...presetSizes[preset],
            name: preset,
            type: 'preset'
          });
        }
      });

      // Add custom sizes
      customSizes.forEach((size, index) => {
        allSizes.push({
          width: size.width,
          height: size.height,
          name: `custom-${index + 1}`,
          type: 'custom'
        });
      });

      // Generate thumbnails for each size
      const thumbnails = [];
      for (const size of allSizes) {
        try {
          let thumbnail = image.clone();
          
          // Calculate dimensions preserving aspect ratio if requested
          let { width, height } = size;
          if (preserveAspectRatio) {
            const aspectRatio = metadata.width / metadata.height;
            if (width && height) {
              // Both dimensions specified, use fit mode
              thumbnail = thumbnail.resize(width, height, { fit, background });
            } else if (width) {
              // Only width specified, calculate height
              height = Math.round(width / aspectRatio);
              thumbnail = thumbnail.resize(width, height);
            } else if (height) {
              // Only height specified, calculate width
              width = Math.round(height * aspectRatio);
              thumbnail = thumbnail.resize(width, height);
            }
          } else {
            thumbnail = thumbnail.resize(width, height, { fit, background });
          }

          // Determine output format
          const outputFormat = this.determineOutputFormat('image.jpg', format);
          
          // Apply format-specific optimizations
          thumbnail = this.applyFormatOptimizations(thumbnail, outputFormat, {
            quality,
            progressive,
            mozjpeg
          });

          // Generate thumbnail buffer
          const thumbnailBuffer = await thumbnail.toBuffer();
          
          thumbnails.push({
            name: size.name,
            type: size.type,
            width: width || metadata.width,
            height: height || metadata.height,
            format: outputFormat,
            size: thumbnailBuffer.length,
            buffer: thumbnailBuffer,
            originalWidth: metadata.width,
            originalHeight: metadata.height
          });

        } catch (error) {
          console.error(`Error generating thumbnail for ${size.name}:`, error);
          thumbnails.push({
            name: size.name,
            type: size.type,
            error: error.message,
            width: size.width,
            height: size.height
          });
        }
      }

      return thumbnails;

    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw new Error(`Failed to generate thumbnails: ${error.message}`);
    }
  }

  // Generate single thumbnail with specific dimensions
  async generateThumbnail(imageBuffer, width, height, options = {}) {
    const {
      quality = 80,
      format = 'auto',
      fit = 'inside',
      background = { r: 255, g: 255, b: 255, alpha: 1 },
      preserveAspectRatio = true,
      progressive = true,
      mozjpeg = true
    } = options;

    try {
      let image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      // Calculate dimensions preserving aspect ratio if requested
      let finalWidth = width;
      let finalHeight = height;
      
      if (preserveAspectRatio) {
        const aspectRatio = metadata.width / metadata.height;
        if (width && height) {
          // Both dimensions specified, use fit mode
          image = image.resize(width, height, { fit, background });
        } else if (width) {
          // Only width specified, calculate height
          finalHeight = Math.round(width / aspectRatio);
          image = image.resize(width, finalHeight);
        } else if (height) {
          // Only height specified, calculate width
          finalWidth = Math.round(height * aspectRatio);
          image = image.resize(finalWidth, height);
        }
      } else {
        image = image.resize(width, height, { fit, background });
      }

      // Determine output format
      const outputFormat = this.determineOutputFormat('image.jpg', format);
      
      // Apply format-specific optimizations
      image = this.applyFormatOptimizations(image, outputFormat, {
        quality,
        progressive,
        mozjpeg
      });

      // Generate thumbnail buffer
      const thumbnailBuffer = await image.toBuffer();
      
      return {
        width: finalWidth || metadata.width,
        height: finalHeight || metadata.height,
        format: outputFormat,
        size: thumbnailBuffer.length,
        buffer: thumbnailBuffer,
        originalWidth: metadata.width,
        originalHeight: metadata.height
      };

    } catch (error) {
      console.error('Single thumbnail generation error:', error);
      throw new Error(`Failed to generate thumbnail: ${error.message}`);
    }
  }

  // Create custom optimization presets
  createPreset(name, options) {
    const presets = {
      'web-optimized': {
        quality: 85,
        format: 'webp',
        progressive: true,
        width: 1920,
        height: 1080
      },
      'social-media': {
        quality: 90,
        format: 'jpeg',
        width: 1200,
        height: 630,
        progressive: true
      },
      'thumbnail': {
        quality: 75,
        format: 'jpeg',
        width: 300,
        height: 300,
        blur: 0.5
      },
      'print-ready': {
        quality: 100,
        format: 'tiff',
        preserveMetadata: true,
        dpi: 300
      },
      'mobile-optimized': {
        quality: 80,
        format: 'webp',
        width: 800,
        height: 600,
        progressive: true
      }
    };

    if (name && options) {
      presets[name] = options;
    }

    return presets[name] || presets;
  }

  // Get image metadata and analysis
  async analyzeImage(file) {
    try {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      const stats = await image.stats();

      return {
        id: uuidv4(),
        originalName: file.originalname,
        metadata: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          size: file.buffer.length,
          channels: metadata.channels,
          hasAlpha: metadata.hasAlpha,
          hasProfile: metadata.hasProfile,
          isOpaque: metadata.isOpaque,
          orientation: metadata.orientation
        },
        stats: {
          dominant: stats.dominant,
          mean: stats.mean,
          stdev: stats.stdev,
          min: stats.min,
          max: stats.max
        },
        analysis: {
          aspectRatio: metadata.width / metadata.height,
          megapixels: (metadata.width * metadata.height) / 1000000,
          fileSizeMB: file.buffer.length / (1024 * 1024)
        }
      };
    } catch (error) {
      console.error('Image analysis error:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  // Helper methods
  determineOutputFormat(originalName, requestedFormat) {
    if (requestedFormat === 'auto') {
      const ext = this.getFileExtension(originalName).toLowerCase();
      return ext === 'png' ? 'png' : 'jpeg';
    }
    return requestedFormat;
  }

  applyFormatOptimizations(image, format, options) {
    switch (format) {
      case 'jpeg':
      case 'jpg':
        return image.jpeg({
          quality: options.quality,
          progressive: options.progressive,
          mozjpeg: options.mozjpeg
        });
      
      case 'png':
        return image.png({
          progressive: options.progressive,
          compressionLevel: 9
        });
      
      case 'webp':
        return image.webp({
          quality: options.webp?.quality || options.quality,
          effort: options.webp?.effort || 4
        });
      
      case 'avif':
        return image.avif({
          quality: options.avif?.quality || options.quality,
          effort: options.avif?.effort || 4
        });
      
      case 'tiff':
        return image.tiff({
          compression: 'lzw'
        });
      
      default:
        return image.jpeg({ quality: options.quality });
    }
  }

  getFileExtension(filename) {
    return path.extname(filename).toLowerCase().replace('.', '');
  }

  calculateWatermarkPosition(imageWidth, imageHeight, watermarkWidth, watermarkHeight, position, margin) {
    let x, y;

    switch (position) {
      case 'top-left':
        x = margin;
        y = margin;
        break;
      case 'top-right':
        x = imageWidth - watermarkWidth - margin;
        y = margin;
        break;
      case 'bottom-left':
        x = margin;
        y = imageHeight - watermarkHeight - margin;
        break;
      case 'bottom-right':
        x = imageWidth - watermarkWidth - margin;
        y = imageHeight - watermarkHeight - margin;
        break;
      case 'center':
        x = (imageWidth - watermarkWidth) / 2;
        y = (imageHeight - watermarkHeight) / 2;
        break;
      default:
        x = imageWidth - watermarkWidth - margin;
        y = imageHeight - watermarkHeight - margin;
    }

    return { x: Math.max(0, x), y: Math.max(0, y) };
  }

  // Get optimization suggestions based on image analysis
  getOptimizationSuggestions(analysis) {
    const suggestions = [];

    if (analysis.metadata.size > 5 * 1024 * 1024) { // 5MB
      suggestions.push({
        type: 'size',
        message: 'Image is very large. Consider reducing quality or dimensions.',
        recommendation: 'Use quality 70-80 and resize to 1920px max width'
      });
    }

    if (analysis.analysis.megapixels > 20) {
      suggestions.push({
        type: 'resolution',
        message: 'High resolution image detected.',
        recommendation: 'Resize to 1920px max width for web use'
      });
    }

    if (analysis.metadata.format === 'png' && !analysis.metadata.hasAlpha) {
      suggestions.push({
        type: 'format',
        message: 'PNG without transparency detected.',
        recommendation: 'Convert to JPEG for better compression'
      });
    }

    if (analysis.metadata.format === 'jpeg' && analysis.metadata.size > 2 * 1024 * 1024) {
      suggestions.push({
        type: 'quality',
        message: 'Large JPEG detected.',
        recommendation: 'Reduce quality to 80-85 for web optimization'
      });
    }

    return suggestions;
  }
}

module.exports = new AdvancedImageProcessor(); 