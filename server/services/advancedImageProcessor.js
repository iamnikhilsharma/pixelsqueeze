const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class AdvancedImageProcessor {
  constructor() {
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'gif'];
    this.maxConcurrentOperations = 5;
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
      gamma = 1
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
  async addWatermark(file, watermarkOptions = {}) {
    const {
      watermarkPath,
      position = 'bottom-right',
      opacity = 0.7,
      size = 0.2, // 20% of image size
      margin = 20
    } = watermarkOptions;

    try {
      if (!watermarkPath) {
        throw new Error('Watermark file not provided');
      }

      const image = sharp(file.buffer);
      const watermark = sharp(watermarkPath).ensureAlpha();
      
      // Get image dimensions
      const imageMetadata = await image.metadata();
      const watermarkMetadata = await watermark.metadata();
      
      // Calculate watermark size
      const watermarkWidth = Math.round((imageMetadata.width || 0) * size);
      const watermarkHeight = Math.round((watermarkWidth * (watermarkMetadata.height || 1)) / (watermarkMetadata.width || 1));
      
      // Resize watermark and apply opacity by multiplying alpha channel
      const resized = await watermark
        .resize(watermarkWidth, watermarkHeight)
        .png()
        .toBuffer();

      // Create an alpha overlay for opacity control
      const alphaOverlay = await sharp({
        create: {
          width: watermarkWidth,
          height: watermarkHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: opacity }
        }
      }).png().toBuffer();

      const resizedWatermark = await sharp(resized)
        .composite([{ input: alphaOverlay, blend: 'dest-in' }])
        .png()
        .toBuffer();

      // Calculate position
      const positionCoords = this.calculateWatermarkPosition(
        imageMetadata.width || 0,
        imageMetadata.height || 0,
        watermarkWidth,
        watermarkHeight,
        position,
        margin
      );

      // Composite watermark onto image
      const result = await image
        .composite([{
          input: resizedWatermark,
          top: positionCoords.y,
          left: positionCoords.x,
          blend: 'over'
        }])
        .png()
        .toBuffer();

      return {
        id: uuidv4(),
        originalName: file.originalname,
        originalSize: file.buffer.length,
        watermarkedSize: result.length,
        watermarkPosition: position,
        buffer: result
      };
    } catch (error) {
      console.error('Watermark error:', error);
      throw new Error(`Failed to add watermark: ${error.message}`);
    }
  }

  async addWatermarkWithStyle(file, watermarkOptions = {}) {
    const {
      watermarkPath,
      position = 'bottom-right',
      opacity = 0.7,
      size = 0.2,
      margin = 20,
      style = 'single' // single | tiled | diagonal
    } = watermarkOptions;

    const baseResult = await this.addWatermark(file, { watermarkPath, position, opacity, size, margin });

    if (style === 'single') return baseResult;

    const image = sharp(file.buffer);
    const imageMetadata = await image.metadata();
    const imgW = imageMetadata.width || 0;
    const imgH = imageMetadata.height || 0;

    // build a pattern watermark buffer based on style
    const wmBase = await sharp(watermarkPath).ensureAlpha().toBuffer();
    const wmSize = Math.round(imgW * size);
    const wmResized = await sharp(wmBase).resize({ width: wmSize }).png().toBuffer();

    // Create a tiled canvas
    const tileCanvas = await sharp({
      create: { width: imgW, height: imgH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).png().toBuffer();

    const composites = [];

    const stepX = wmSize + margin;
    const stepY = Math.round((wmSize * 0.35) + margin);

    if (style === 'tiled') {
      for (let y = margin; y < imgH; y += stepX) {
        for (let x = margin; x < imgW; x += stepX) {
          composites.push({ input: wmResized, left: x, top: y, blend: 'over' });
        }
      }
    } else if (style === 'diagonal') {
      for (let y = margin, row = 0; y < imgH; y += stepX, row++) {
        for (let x = margin + (row % 2 === 0 ? 0 : Math.floor(stepX / 2)); x < imgW; x += stepX) {
          composites.push({ input: wmResized, left: x, top: y, blend: 'over' });
        }
      }
    }

    // Apply opacity via dest-in trick
    const alphaOverlay = await sharp({
      create: { width: wmSize, height: wmSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: opacity } }
    }).png().toBuffer();
    const wmResizedWithOpacity = await sharp(wmResized).composite([{ input: alphaOverlay, blend: 'dest-in' }]).png().toBuffer();

    const patternBuffer = await sharp(tileCanvas).composite(
      composites.map(c => ({ ...c, input: wmResizedWithOpacity }))
    ).png().toBuffer();

    const final = await image.composite([{ input: patternBuffer, blend: 'over' }]).png().toBuffer();

    return {
      id: uuidv4(),
      originalName: file.originalname,
      originalSize: file.buffer.length,
      watermarkedSize: final.length,
      watermarkStyle: style,
      buffer: final
    };
  }

  async addTextWatermark(file, watermarkOptions = {}) {
    const {
      text = 'PixelSqueeze',
      position = 'bottom-right',
      opacity = 0.7,
      size = 0.15, // fraction of image width that text box should roughly occupy
      margin = 20,
      style = 'single', // single | tiled | diagonal
      color = '#ffffff',
      fontSize = 48,
      fontFamily = 'sans-serif'
    } = watermarkOptions;

    const image = sharp(file.buffer);
    const imageMetadata = await image.metadata();
    const imgW = imageMetadata.width || 0;
    const imgH = imageMetadata.height || 0;

    // Estimate text box width from fontSize and text length
    const estTextWidth = Math.max(50, Math.min(imgW, Math.round((imgW * size))));
    const estTextHeight = Math.round(fontSize * 1.4);

    const svg = (w, h) => Buffer.from(
      `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .tw { font-family: ${fontFamily}, 'DejaVu Sans', sans-serif; font-size: ${fontSize}px; fill: ${color}; fill-opacity: ${opacity}; dominant-baseline: middle; paint-order: stroke fill; }
        </style>
        <text x="50%" y="50%" text-anchor="middle" class="tw">${String(text).replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>
      </svg>`
    );

    // Base single watermark buffer
    const singleBuffer = await sharp(svg(estTextWidth, estTextHeight)).png().toBuffer();

    if (style === 'single') {
      const pos = this.calculateWatermarkPosition(imgW, imgH, estTextWidth, estTextHeight, position, margin);
      const out = await image.composite([{ input: singleBuffer, left: pos.x, top: pos.y, blend: 'over' }]).png().toBuffer();
      return {
        id: uuidv4(),
        originalName: file.originalname,
        originalSize: file.buffer.length,
        watermarkedSize: out.length,
        watermarkStyle: style,
        buffer: out
      };
    }

    // Build pattern for tiled / diagonal
    const composites = [];
    const step = Math.round(Math.max(estTextWidth, estTextHeight) + margin);

    if (style === 'tiled') {
      for (let y = margin; y < imgH; y += step) {
        for (let x = margin; x < imgW; x += step) {
          composites.push({ input: singleBuffer, left: x, top: y, blend: 'over' });
        }
      }
    } else if (style === 'diagonal') {
      let row = 0;
      for (let y = margin; y < imgH; y += step, row++) {
        for (let x = margin + (row % 2 === 0 ? 0 : Math.floor(step / 2)); x < imgW; x += step) {
          composites.push({ input: singleBuffer, left: x, top: y, blend: 'over' });
        }
      }
    }

    const pattern = await sharp({ create: { width: imgW, height: imgH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .png()
      .composite(composites)
      .png()
      .toBuffer();

    const final = await image.composite([{ input: pattern, blend: 'over' }]).png().toBuffer();
    return {
      id: uuidv4(),
      originalName: file.originalname,
      originalSize: file.buffer.length,
      watermarkedSize: final.length,
      watermarkStyle: style,
      buffer: final
    };
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

  // Generate image thumbnails
  async generateThumbnails(file, sizes = [150, 300, 600]) {
    try {
      const thumbnails = [];
      
      for (const size of sizes) {
        const thumbnail = await sharp(file.buffer)
          .resize(size, size, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        thumbnails.push({
          size,
          width: size,
          height: size,
          buffer: thumbnail,
          format: 'jpeg'
        });
      }

      return thumbnails;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw new Error(`Failed to generate thumbnails: ${error.message}`);
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