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

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
  }

  // Analyze image for comprehensive insights
  async analyzeImage(imageBuffer, options = {}) {
    const {
      extractMetadata = true,
      analyzeColors = true,
      assessQuality = true,
      generateRecommendations = true,
      detailedAnalysis = false
    } = options;

    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      const analysis = {
        basic: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          channels: metadata.channels,
          depth: metadata.depth,
          density: metadata.density,
          hasProfile: metadata.hasProfile,
          hasAlpha: metadata.hasAlpha,
          isOpaque: metadata.isOpaque,
          orientation: metadata.orientation
        },
        size: {
          originalSize: imageBuffer.length,
          estimatedOptimizedSize: 0,
          compressionPotential: 0
        },
        metadata: {},
        colors: {},
        quality: {},
        recommendations: []
      };

      // Extract metadata if requested
      if (extractMetadata) {
        analysis.metadata = await this.extractImageMetadata(imageBuffer, metadata);
      }

      // Analyze colors if requested
      if (analyzeColors) {
        analysis.colors = await this.analyzeImageColors(imageBuffer, metadata);
      }

      // Assess quality if requested
      if (assessQuality) {
        analysis.quality = await this.assessImageQuality(imageBuffer, metadata);
      }

      // Generate optimization recommendations
      if (generateRecommendations) {
        analysis.recommendations = await this.generateOptimizationRecommendations(
          analysis, 
          detailedAnalysis
        );
      }

      // Calculate size estimates
      analysis.size.estimatedOptimizedSize = await this.estimateOptimizedSize(
        imageBuffer, 
        analysis
      );
      analysis.size.compressionPotential = analysis.size.originalSize > 0 
        ? ((analysis.size.originalSize - analysis.size.estimatedOptimizedSize) / analysis.size.originalSize) * 100 
        : 0;

      return analysis;

    } catch (error) {
      console.error('Image analysis error:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  // Extract comprehensive image metadata
  async extractImageMetadata(imageBuffer, metadata) {
    try {
      const extracted = {
        basic: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          channels: metadata.channels,
          depth: metadata.depth,
          density: metadata.density,
          hasProfile: metadata.hasProfile,
          hasAlpha: metadata.hasAlpha,
          isOpaque: metadata.isOpaque,
          orientation: metadata.orientation
        },
        exif: {},
        iptc: {},
        icc: {},
        xmp: {},
        other: {}
      };

      // Extract EXIF data if available
      try {
        const exifData = await sharp(imageBuffer).metadata();
        if (exifData.exif) {
          extracted.exif = this.parseExifData(exifData.exif);
        }
      } catch (error) {
        // EXIF extraction failed, continue
      }

      // Extract IPTC data if available
      try {
        const iptcData = await sharp(imageBuffer).metadata();
        if (iptcData.iptc) {
          extracted.iptc = this.parseIptcData(iptcData.iptc);
        }
      } catch (error) {
        // IPTC extraction failed, continue
      }

      // Extract ICC profile data if available
      try {
        const iccData = await sharp(imageBuffer).metadata();
        if (iccData.icc) {
          extracted.icc = this.parseIccData(iccData.icc);
        }
      } catch (error) {
        // ICC extraction failed, continue
      }

      return extracted;

    } catch (error) {
      console.error('Metadata extraction error:', error);
      return { error: error.message };
    }
  }

  // Analyze image colors and extract palette
  async analyzeImageColors(imageBuffer, metadata) {
    try {
      const image = sharp(imageBuffer);
      
      // Resize for faster processing while maintaining color accuracy
      const analysisSize = Math.min(metadata.width, metadata.height, 200);
      const resizedImage = image.resize(analysisSize, analysisSize, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // Get dominant colors using k-means clustering
      const dominantColors = await this.extractDominantColors(resizedImage, 8);
      
      // Get color histogram
      const colorHistogram = await this.generateColorHistogram(resizedImage);
      
      // Analyze color temperature and mood
      const colorAnalysis = this.analyzeColorCharacteristics(dominantColors);
      
      // Generate color palette
      const colorPalette = this.generateColorPalette(dominantColors, colorHistogram);

      return {
        dominant: dominantColors,
        histogram: colorHistogram,
        analysis: colorAnalysis,
        palette: colorPalette,
        totalColors: this.estimateTotalColors(metadata),
        averageBrightness: this.calculateAverageBrightness(dominantColors),
        colorHarmony: this.assessColorHarmony(dominantColors)
      };

    } catch (error) {
      console.error('Color analysis error:', error);
      return { error: error.message };
    }
  }

  // Extract dominant colors using k-means clustering
  async extractDominantColors(image, numColors = 8) {
    try {
      // Convert to raw pixel data
      const rawData = await image.raw().toBuffer();
      const pixels = [];
      
      // Sample pixels for analysis (every 10th pixel for performance)
      for (let i = 0; i < rawData.length; i += 30) {
        if (i + 2 < rawData.length) {
          pixels.push([
            rawData[i],     // R
            rawData[i + 1], // G
            rawData[i + 2]  // B
          ]);
        }
      }

      // Simple k-means clustering
      const clusters = this.kMeansClustering(pixels, numColors);
      
      // Convert clusters to color objects
      return clusters.map(cluster => ({
        rgb: cluster.centroid,
        hex: this.rgbToHex(cluster.centroid[0], cluster.centroid[1], cluster.centroid[2]),
        hsl: this.rgbToHsl(cluster.centroid[0], cluster.centroid[1], cluster.centroid[2]),
        percentage: (cluster.points.length / pixels.length) * 100
      }));

    } catch (error) {
      console.error('Dominant color extraction error:', error);
      return [];
    }
  }

  // Generate color histogram
  async generateColorHistogram(image) {
    try {
      const rawData = await image.raw().toBuffer();
      const histogram = {
        red: new Array(256).fill(0),
        green: new Array(256).fill(0),
        blue: new Array(256).fill(0)
      };

      for (let i = 0; i < rawData.length; i += 3) {
        if (i + 2 < rawData.length) {
          histogram.red[rawData[i]]++;
          histogram.green[rawData[i + 1]]++;
          histogram.blue[rawData[i + 2]]++;
        }
      }

      return histogram;

    } catch (error) {
      console.error('Histogram generation error:', error);
      return { red: [], green: [], blue: [] };
    }
  }

  // Analyze color characteristics
  analyzeColorCharacteristics(colors) {
    if (!colors || colors.length === 0) return {};

    const analysis = {
      temperature: 'neutral',
      mood: 'balanced',
      saturation: 'medium',
      contrast: 'medium',
      brightness: 'medium'
    };

    // Calculate average saturation and brightness
    let totalSaturation = 0;
    let totalBrightness = 0;
    let totalContrast = 0;

    colors.forEach(color => {
      const hsl = color.hsl;
      totalSaturation += hsl.s;
      totalBrightness += hsl.l;
      
      // Calculate contrast (difference from gray)
      const grayValue = (color.rgb[0] + color.rgb[1] + color.rgb[2]) / 3;
      totalContrast += Math.abs(color.rgb[0] - grayValue) + 
                      Math.abs(color.rgb[1] - grayValue) + 
                      Math.abs(color.rgb[2] - grayValue);
    });

    const avgSaturation = totalSaturation / colors.length;
    const avgBrightness = totalBrightness / colors.length;
    const avgContrast = totalContrast / colors.length;

    // Determine characteristics
    analysis.saturation = avgSaturation < 0.3 ? 'low' : avgSaturation > 0.7 ? 'high' : 'medium';
    analysis.brightness = avgBrightness < 0.3 ? 'dark' : avgBrightness > 0.7 ? 'bright' : 'medium';
    analysis.contrast = avgContrast < 50 ? 'low' : avgContrast > 150 ? 'high' : 'medium';

    // Determine temperature and mood
    const warmColors = colors.filter(c => c.hsl.h >= 0 && c.hsl.h <= 60 || c.hsl.h >= 300);
    const coolColors = colors.filter(c => c.hsl.h >= 180 && c.hsl.h <= 240);
    
    if (warmColors.length > coolColors.length) {
      analysis.temperature = 'warm';
      analysis.mood = 'energetic';
    } else if (coolColors.length > warmColors.length) {
      analysis.temperature = 'cool';
      analysis.mood = 'calming';
    }

    return analysis;
  }

  // Generate color palette
  generateColorPalette(dominantColors, histogram) {
    if (!dominantColors || dominantColors.length === 0) return [];

    // Sort by percentage and create palette
    const sortedColors = [...dominantColors].sort((a, b) => b.percentage - a.percentage);
    
    return sortedColors.map((color, index) => ({
      ...color,
      role: this.assignColorRole(index, color.hsl),
      complementary: this.findComplementaryColor(color.hsl),
      analogous: this.findAnalogousColors(color.hsl)
    }));
  }

  // Assess image quality
  async assessImageQuality(imageBuffer, metadata) {
    try {
      const image = sharp(imageBuffer);
      
      const quality = {
        resolution: this.assessResolution(metadata.width, metadata.height),
        format: this.assessFormat(metadata.format),
        compression: this.assessCompression(imageBuffer.length, metadata),
        sharpness: await this.assessSharpness(image),
        noise: await this.assessNoise(image),
        overall: 'good'
      };

      // Calculate overall quality score
      const scores = [
        quality.resolution.score,
        quality.format.score,
        quality.compression.score,
        quality.sharpness.score,
        quality.noise.score
      ];

      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      if (averageScore >= 8) quality.overall = 'excellent';
      else if (averageScore >= 6) quality.overall = 'good';
      else if (averageScore >= 4) quality.overall = 'fair';
      else quality.overall = 'poor';

      quality.score = averageScore;

      return quality;

    } catch (error) {
      console.error('Quality assessment error:', error);
      return { error: error.message };
    }
  }

  // Assess resolution quality
  assessResolution(width, height) {
    const megapixels = (width * height) / 1000000;
    
    let score = 10;
    let rating = 'excellent';
    let recommendation = '';

    if (megapixels < 1) {
      score = 3;
      rating = 'poor';
      recommendation = 'Consider using higher resolution images for better quality';
    } else if (megapixels < 3) {
      score = 5;
      rating = 'fair';
      recommendation = 'Resolution is adequate for web use';
    } else if (megapixels < 8) {
      score = 7;
      rating = 'good';
      recommendation = 'Good resolution for most use cases';
    } else if (megapixels < 20) {
      score = 9;
      rating = 'excellent';
      recommendation = 'Excellent resolution for professional use';
    } else {
      score = 10;
      rating = 'outstanding';
      recommendation = 'Very high resolution, may be overkill for web use';
    }

    return {
      megapixels,
      width,
      height,
      aspectRatio: (width / height).toFixed(2),
      score,
      rating,
      recommendation
    };
  }

  // Assess format quality
  assessFormat(format) {
    const formatScores = {
      'jpeg': 7,
      'jpg': 7,
      'png': 9,
      'webp': 8,
      'avif': 9,
      'tiff': 10,
      'bmp': 5,
      'gif': 6
    };

    const score = formatScores[format] || 5;
    let rating = 'good';
    let recommendation = '';

    if (score >= 8) {
      rating = 'excellent';
      recommendation = 'Format provides excellent quality and features';
    } else if (score >= 6) {
      rating = 'good';
      recommendation = 'Format is suitable for most use cases';
    } else {
      rating = 'fair';
      recommendation = 'Consider converting to a more efficient format';
    }

    return {
      format,
      score,
      rating,
      recommendation
    };
  }

  // Assess compression quality
  assessCompression(fileSize, metadata) {
    const megapixels = (metadata.width * metadata.height) / 1000000;
    const bytesPerPixel = fileSize / (metadata.width * metadata.height);
    
    let score = 10;
    let rating = 'excellent';
    let recommendation = '';

    if (bytesPerPixel > 10) {
      score = 3;
      rating = 'poor';
      recommendation = 'File size is very large, consider aggressive compression';
    } else if (bytesPerPixel > 5) {
      score = 5;
      rating = 'fair';
      recommendation = 'File size could be reduced with optimization';
    } else if (bytesPerPixel > 2) {
      score = 7;
      rating = 'good';
      recommendation = 'File size is reasonable for the resolution';
    } else {
      score = 9;
      rating = 'excellent';
      recommendation = 'File size is well optimized';
    }

    return {
      fileSize,
      bytesPerPixel: bytesPerPixel.toFixed(2),
      megapixels,
      score,
      rating,
      recommendation
    };
  }

  // Assess image sharpness
  async assessSharpness(image) {
    try {
      // Create a small version for edge detection
      const smallImage = image.resize(100, 100, { fit: 'inside' });
      const buffer = await smallImage.toBuffer();
      
      // Simple edge detection using Laplacian variance
      const sharpness = this.calculateSharpness(buffer);
      
      let score = 10;
      let rating = 'excellent';
      let recommendation = '';

      if (sharpness < 100) {
        score = 3;
        rating = 'poor';
        recommendation = 'Image appears blurry, consider using a sharper source';
      } else if (sharpness < 300) {
        score = 5;
        rating = 'fair';
        recommendation = 'Image sharpness could be improved';
      } else if (sharpness < 600) {
        score = 7;
        rating = 'good';
        recommendation = 'Image has good sharpness';
      } else {
        score = 9;
        rating = 'excellent';
        recommendation = 'Image is very sharp and clear';
      }

      return {
        sharpness,
        score,
        rating,
        recommendation
      };

    } catch (error) {
      console.error('Sharpness assessment error:', error);
      return { error: error.message };
    }
  }

  // Assess image noise
  async assessNoise(image) {
    try {
      // Create a small version for noise analysis
      const smallImage = image.resize(50, 50, { fit: 'inside' });
      const buffer = await smallImage.toBuffer();
      
      // Simple noise estimation using pixel variance
      const noise = this.calculateNoise(buffer);
      
      let score = 10;
      let rating = 'excellent';
      let recommendation = '';

      if (noise > 50) {
        score = 3;
        rating = 'poor';
        recommendation = 'Image has significant noise, consider noise reduction';
      } else if (noise > 25) {
        score = 5;
        rating = 'fair';
        recommendation = 'Some noise detected, moderate noise reduction may help';
      } else if (noise > 10) {
        score = 7;
        rating = 'good';
        recommendation = 'Low noise level, image quality is good';
      } else {
        score = 9;
        rating = 'excellent';
        recommendation = 'Very clean image with minimal noise';
      }

      return {
        noise,
        score,
        rating,
        recommendation
      };

    } catch (error) {
      console.error('Noise assessment error:', error);
      return { error: error.message };
    }
  }

  // Generate optimization recommendations
  async generateOptimizationRecommendations(analysis, detailed = false) {
    const recommendations = [];

    // Format recommendations
    if (analysis.basic.format === 'png' && analysis.basic.hasAlpha === false) {
      recommendations.push({
        type: 'format',
        priority: 'high',
        title: 'Convert PNG to JPEG',
        description: 'PNG without transparency can be converted to JPEG for better compression',
        potential: '20-40% size reduction',
        action: 'Use JPEG format for non-transparent images'
      });
    }

    if (analysis.basic.format === 'jpeg' || analysis.basic.format === 'jpg') {
      recommendations.push({
        type: 'format',
        priority: 'medium',
        title: 'Consider WebP conversion',
        description: 'WebP provides better compression than JPEG while maintaining quality',
        potential: '15-25% size reduction',
        action: 'Convert to WebP for web use'
      });
    }

    // Quality recommendations
    if (analysis.quality.compression.bytesPerPixel > 5) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Reduce image quality',
        description: 'Current quality is higher than necessary for web use',
        potential: '30-50% size reduction',
        action: 'Reduce JPEG quality to 70-80%'
      });
    }

    // Resolution recommendations
    if (analysis.quality.resolution.megapixels > 8) {
      recommendations.push({
        type: 'resolution',
        priority: 'medium',
        title: 'Resize for web use',
        description: 'Resolution is higher than needed for most web applications',
        potential: '40-60% size reduction',
        action: 'Resize to 1920x1080 or smaller for web use'
      });
    }

    // Color recommendations
    if (analysis.colors.analysis.saturation === 'high') {
      recommendations.push({
        type: 'color',
        priority: 'low',
        title: 'Optimize color profile',
        description: 'High saturation may indicate unnecessary color depth',
        potential: '5-15% size reduction',
        action: 'Consider reducing color depth to 8-bit'
      });
    }

    // Metadata recommendations
    if (analysis.metadata.exif && Object.keys(analysis.metadata.exif).length > 0) {
      recommendations.push({
        type: 'metadata',
        priority: 'low',
        title: 'Strip unnecessary metadata',
        description: 'EXIF data adds file size without affecting visual quality',
        potential: '5-10% size reduction',
        action: 'Remove EXIF data for web use'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return recommendations;
  }

  // Estimate optimized size
  async estimateOptimizedSize(imageBuffer, analysis) {
    try {
      const baseSize = imageBuffer.length;
      let estimatedSize = baseSize;

      // Apply format conversion savings
      if (analysis.basic.format === 'png' && !analysis.basic.hasAlpha) {
        estimatedSize *= 0.7; // 30% reduction for PNG to JPEG
      }

      // Apply quality reduction savings
      if (analysis.quality.compression.bytesPerPixel > 5) {
        estimatedSize *= 0.6; // 40% reduction for quality optimization
      }

      // Apply resolution reduction savings
      if (analysis.quality.resolution.megapixels > 8) {
        estimatedSize *= 0.5; // 50% reduction for resolution optimization
      }

      // Apply metadata stripping savings
      if (analysis.metadata.exif && Object.keys(analysis.metadata.exif).length > 0) {
        estimatedSize *= 0.95; // 5% reduction for metadata removal
      }

      return Math.round(estimatedSize);

    } catch (error) {
      console.error('Size estimation error:', error);
      return imageBuffer.length;
    }
  }

  // Helper methods for color analysis
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  // K-means clustering for color analysis
  kMeansClustering(points, k, maxIterations = 100) {
    if (points.length === 0) return [];

    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
      const randomPoint = points[Math.floor(Math.random() * points.length)];
      centroids.push([...randomPoint]);
    }

    let iterations = 0;
    let converged = false;

    while (!converged && iterations < maxIterations) {
      // Assign points to nearest centroid
      const clusters = Array.from({ length: k }, () => ({ centroid: [], points: [] }));
      
      points.forEach(point => {
        let minDistance = Infinity;
        let nearestCentroid = 0;

        centroids.forEach((centroid, i) => {
          const distance = this.euclideanDistance(point, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = i;
          }
        });

        clusters[nearestCentroid].points.push(point);
      });

      // Update centroids
      let newCentroids = [];
      clusters.forEach(cluster => {
        if (cluster.points.length > 0) {
          const newCentroid = cluster.points[0].map((_, dim) => {
            const sum = cluster.points.reduce((acc, point) => acc + point[dim], 0);
            return sum / cluster.points.length;
          });
          newCentroids.push(newCentroid);
        } else {
          newCentroids.push([...centroids[0]]);
        }
      });

      // Check convergence
      converged = this.arraysEqual(centroids, newCentroids);
      centroids = newCentroids;
      iterations++;
    }

    return clusters.map(cluster => ({
      centroid: cluster.centroid,
      points: cluster.points
    }));
  }

  // Helper methods
  euclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => Math.abs(val - b[i]) < 0.1);
  }

  estimateTotalColors(metadata) {
    return Math.pow(2, metadata.depth) * metadata.channels;
  }

  calculateAverageBrightness(colors) {
    if (!colors || colors.length === 0) return 0;
    const totalBrightness = colors.reduce((sum, color) => sum + color.hsl.l, 0);
    return Math.round(totalBrightness / colors.length);
  }

  assessColorHarmony(colors) {
    if (!colors || colors.length < 2) return 'single';
    
    // Simple harmony assessment based on color relationships
    const hues = colors.map(c => c.hsl.h);
    const hasComplementary = hues.some(h1 => 
      hues.some(h2 => Math.abs(h1 - h2) >= 170 && Math.abs(h1 - h2) <= 190)
    );
    
    if (hasComplementary) return 'complementary';
    
    const hasAnalogous = hues.some(h1 => 
      hues.some(h2 => Math.abs(h1 - h2) <= 30)
    );
    
    if (hasAnalogous) return 'analogous';
    
    return 'mixed';
  }

  assignColorRole(index, hsl) {
    if (index === 0) return 'primary';
    if (index === 1) return 'secondary';
    if (index === 2) return 'accent';
    return 'supporting';
  }

  findComplementaryColor(hsl) {
    return {
      h: (hsl.h + 180) % 360,
      s: hsl.s,
      l: hsl.l
    };
  }

  findAnalogousColors(hsl) {
    return [
      { h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l },
      { h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l }
    ];
  }

  calculateSharpness(buffer) {
    // Simple Laplacian variance calculation for sharpness
    let variance = 0;
    const width = 100;
    const height = 100;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 3;
        const center = buffer[idx];
        const neighbors = [
          buffer[idx - 3], buffer[idx + 3],
          buffer[idx - width * 3], buffer[idx + width * 3]
        ];
        
        const laplacian = 4 * center - neighbors.reduce((sum, n) => sum + n, 0);
        variance += laplacian * laplacian;
      }
    }
    
    return variance / (width * height);
  }

  calculateNoise(buffer) {
    // Simple noise estimation using pixel variance
    let variance = 0;
    const width = 50;
    const height = 50;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 3;
        const center = buffer[idx];
        const neighbors = [
          buffer[idx - 3], buffer[idx + 3],
          buffer[idx - width * 3], buffer[idx + width * 3]
        ];
        
        const avgNeighbor = neighbors.reduce((sum, n) => sum + n, 0) / neighbors.length;
        variance += Math.pow(center - avgNeighbor, 2);
      }
    }
    
    return Math.sqrt(variance / (width * height));
  }

  parseExifData(exifBuffer) {
    // Basic EXIF parsing - in a real implementation, you'd use a library like exif-reader
    return {
      hasExif: true,
      size: exifBuffer.length,
      note: 'EXIF data detected (detailed parsing requires exif-reader library)'
    };
  }

  parseIptcData(iptcBuffer) {
    // Basic IPTC parsing
    return {
      hasIptc: true,
      size: iptcBuffer.length,
      note: 'IPTC data detected (detailed parsing requires specialized library)'
    };
  }

  parseIccData(iccBuffer) {
    // Basic ICC profile parsing
    return {
      hasIcc: true,
      size: iccBuffer.length,
      note: 'ICC profile detected (detailed parsing requires color-profile library)'
    };
  }
}

module.exports = new AdvancedImageProcessor(); 