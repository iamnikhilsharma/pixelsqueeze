const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const advancedImageProcessor = require('../services/advancedImageProcessor');
const { authenticateToken } = require('../middleware/auth');
const Image = require('../models/Image');
const storageService = require('../services/storageService');
const { v4: uuidv4 } = require('uuid');

// Configure multer for multiple file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 20 // Max 20 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|avif|tiff|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Batch optimization with progress tracking
router.post('/batch-optimize', authenticateToken, upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    console.log(`Processing ${req.files.length} images for user ${req.user.email}`);

    const options = {
      quality: parseInt(req.body.quality) || 80,
      format: req.body.format || 'auto',
      width: req.body.width ? parseInt(req.body.width) : undefined,
      height: req.body.height ? parseInt(req.body.height) : undefined,
      preserveMetadata: req.body.preserveMetadata === 'true',
      progressive: req.body.progressive !== 'false',
      mozjpeg: req.body.mozjpeg !== 'false',
      blur: parseFloat(req.body.blur) || 0,
      sharpen: parseFloat(req.body.sharpen) || 0,
      grayscale: req.body.grayscale === 'true',
      flip: req.body.flip === 'true',
      flop: req.body.flop === 'true',
      rotate: parseInt(req.body.rotate) || 0,
      brightness: parseFloat(req.body.brightness) || 1,
      contrast: parseFloat(req.body.contrast) || 1,
      saturation: parseFloat(req.body.saturation) || 1,
      gamma: parseFloat(req.body.gamma) || 1
    };

    console.log('Processing options:', options);

    // Set up Server-Sent Events for progress tracking
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const results = await advancedImageProcessor.batchOptimize(
      req.files,
      options,
      (progress) => {
        console.log('Progress:', progress);
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      }
    );

    console.log(`Completed processing ${results.length} images`);

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }

    // Save optimized images to disk, persist in DB, and generate download URLs
    const savedResults = [];
    for (const result of results) {
      if (result.error) {
        savedResults.push(result);
        continue;
      }

      try {
        // Generate filename
        const fileExtension = result.format === 'jpeg' ? 'jpg' : result.format || 'jpg';
        const filename = `optimized_${result.id}.${fileExtension}`;
        const filePath = path.join(uploadsDir, filename);

        // Save the optimized buffer to local storage
        await fs.writeFile(filePath, result.buffer);

        // Persist to DB (expires in 24h by default)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const imageDoc = new Image({
          user: req.user._id,
          originalName: result.originalName,
          originalSize: result.originalSize,
          originalFormat: (path.extname(result.originalName).replace('.', '') || 'jpg').toLowerCase(),
          optimizedSize: result.optimizedSize,
          optimizedFormat: fileExtension,
          compressionRatio: Math.round(result.compressionRatio),
          quality: options.quality,
          dimensions: { optimized: { width: result.width || undefined, height: result.height || undefined } },
          storage: {
            optimizedKey: filename,
            bucket: 'local',
            region: 'local'
          },
          downloadUrl: `/uploads/${filename}`,
          expiresAt,
          metadata: { preserved: !!options.preserveMetadata },
          processingTime: result.processingTime,
          status: 'completed'
        });

        await imageDoc.save();
        // Increment user usage for each processed image
        try { await req.user.incrementUsage(result.originalSize || 0); } catch {}

        const savedResult = {
          ...result,
          downloadUrl: `/uploads/${filename}`,
          id: imageDoc._id
        };

        savedResults.push(savedResult);
        console.log(`Saved optimized image and DB record: ${filename}`);
      } catch (error) {
        console.error(`Error saving optimized image ${result.originalName}:`, error);
        savedResults.push({
          ...result,
          error: `Failed to save optimized image: ${error.message}`
        });
      }
    }

    // Send final results with download URLs and DB ids
    res.write(`data: ${JSON.stringify({ type: 'complete', results: savedResults })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Batch optimization error:', error);
    res.status(500).json({ error: 'Failed to process images', details: error.message });
  }
});

// Format conversion
router.post('/convert-format', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const targetFormat = req.body.targetFormat;
    if (!targetFormat) {
      return res.status(400).json({ error: 'Target format is required' });
    }

    const options = {
      quality: parseInt(req.body.quality) || 80,
      progressive: req.body.progressive !== 'false'
    };

    const result = await advancedImageProcessor.convertFormat(req.file, targetFormat, options);

    // Save the converted file
    const fileName = `${result.id}.${targetFormat}`;
    const filePath = path.join(__dirname, '../../uploads', fileName);
    
    await fs.writeFile(filePath, result.buffer);
    
    result.downloadUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Format conversion error:', error);
    res.status(500).json({ error: 'Failed to convert format', details: error.message });
  }
});

// Add watermark
router.post('/add-watermark', authenticateToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'watermark', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files.image || !req.files.watermark) {
      return res.status(400).json({ error: 'Both image and watermark files are required' });
    }

    const watermarkOptions = {
      position: req.body.position || 'bottom-right',
      opacity: parseFloat(req.body.opacity) || 0.7,
      size: parseFloat(req.body.size) || 0.2,
      margin: parseInt(req.body.margin) || 20
    };

    // Save watermark temporarily
    const watermarkFileName = `watermark_${Date.now()}.png`;
    const watermarkPath = path.join(__dirname, '../../uploads/temp', watermarkFileName);
    
    await fs.writeFile(watermarkPath, req.files.watermark[0].buffer);
    watermarkOptions.watermarkPath = watermarkPath;

    const result = await advancedImageProcessor.addWatermark(req.files.image[0], watermarkOptions);

    // Clean up temporary watermark
    await fs.unlink(watermarkPath);

    res.setHeader('Content-Type', 'image/png');
    return res.send(Buffer.from(result.buffer));
  } catch (error) {
    console.error('Watermark error:', error);
    res.status(500).json({ error: 'Failed to add watermark', details: error.message });
  }
});

// Add watermark with styles and persist output separately
router.post('/watermark', authenticateToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'watermark', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files.image || !req.files.watermark) {
      return res.status(400).json({ error: 'Both image and watermark files are required' });
    }

    const options = {
      position: req.body.position || 'bottom-right',
      opacity: parseFloat(req.body.opacity) || 0.7,
      size: parseFloat(req.body.size) || 0.2,
      margin: parseInt(req.body.margin) || 20,
      style: req.body.style || 'single'
    };

    // Save watermark temporarily
    const watermarkFileName = `watermark_${Date.now()}.png`;
    const watermarkPath = path.join(__dirname, '../../uploads/temp', watermarkFileName);
    await fs.writeFile(watermarkPath, req.files.watermark[0].buffer);
    options.watermarkPath = watermarkPath;

    const result = await advancedImageProcessor.addWatermarkWithStyle(req.files.image[0], options);

    // Persist watermarked output separately (without altering original)
    const upload = await storageService.uploadFile(result.buffer, `watermarked_${Date.now()}.png`, 'image/png', { folder: 'watermarked' });

    // Clean up temporary watermark
    await fs.unlink(watermarkPath).catch(() => {});

    res.json({ success: true, data: { key: upload.key, url: upload.url } });
  } catch (error) {
    console.error('Watermark style error:', error);
    res.status(500).json({ error: 'Failed to add watermark', details: error.message });
  }
});

// Watermark processing with text or image watermarks
router.post('/watermark', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const {
      type = 'text', // 'text' or 'image'
      text = '',
      font = 'Arial',
      fontSize = 48,
      fontColor = '#ffffff',
      backgroundColor = 'rgba(0,0,0,0.5)',
      position = 'bottom-right',
      opacity = 0.8,
      size = 1.0,
      margin = 20,
      rotation = 0,
      blendMode = 'over',
      quality = 80,
      format = 'auto',
      preserveMetadata = false
    } = req.body;

    console.log(`Processing ${req.files.length} images with watermark for user ${req.user.email}`);
    console.log('Watermark options:', { type, text, position, opacity, size });

    // Validate watermark options
    if (type === 'text' && !text) {
      return res.status(400).json({ error: 'Text watermark requires text content' });
    }

    if (type === 'image' && !req.files.find(f => f.fieldname === 'watermark')) {
      return res.status(400).json({ error: 'Image watermark requires watermark file' });
    }

    // Get watermark image if needed
    let watermarkImageBuffer = null;
    if (type === 'image') {
      const watermarkFile = req.files.find(f => f.fieldname === 'watermark');
      if (watermarkFile) {
        watermarkImageBuffer = watermarkFile.buffer;
      }
    }

    // Set up Server-Sent Events for progress tracking
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const results = [];
    const totalFiles = req.files.filter(f => f.fieldname === 'images').length;
    let processedFiles = 0;

    // Process each image
    for (const file of req.files) {
      if (file.fieldname !== 'images') continue;

      try {
        console.log(`Processing watermark for: ${file.originalname}`);

        // Create watermark options
        const watermarkOptions = {
          type,
          text,
          font,
          fontSize: parseInt(fontSize),
          fontColor,
          backgroundColor,
          position,
          opacity: parseFloat(opacity),
          size: parseFloat(size),
          margin: parseInt(margin),
          rotation: parseInt(rotation),
          blendMode,
          imageBuffer: watermarkImageBuffer
        };

        // Process image with watermark
        const result = await advancedImageProcessor.optimizeImage(file, {
          quality: parseInt(quality),
          format,
          preserveMetadata: preserveMetadata === 'true',
          watermark: watermarkOptions
        });

        // Generate unique filename
        const fileExtension = result.format === 'jpeg' ? 'jpg' : result.format || 'jpg';
        const filename = `watermarked_${result.id}.${fileExtension}`;
        
        // Save to uploads directory
        const uploadsDir = path.join(__dirname, '../../uploads');
        try {
          await fs.mkdir(uploadsDir, { recursive: true });
        } catch (error) {
          console.error('Error creating uploads directory:', error);
        }

        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, result.buffer);

        // Generate download URL
        const downloadUrl = await storageService.generateDownloadUrl(filename, 24 * 60 * 60); // 24 hours

        // Save to database
        const image = new Image({
          user: req.user._id,
          originalName: file.originalname,
          originalSize: file.size,
          originalFormat: file.originalname.split('.').pop().toLowerCase(),
          optimizedSize: result.optimizedSize,
          optimizedFormat: result.format,
          quality: parseInt(quality),
          width: result.width,
          height: result.height,
          processingTime: result.processingTime,
          watermark: {
            type,
            text: type === 'text' ? text : undefined,
            position,
            opacity: parseFloat(opacity),
            size: parseFloat(size)
          },
          storageKey: filename,
          downloadUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        await image.save();

        processedFiles++;
        
        // Send progress update
        res.write(`data: ${JSON.stringify({
          processed: processedFiles,
          total: totalFiles,
          percentage: Math.round((processedFiles / totalFiles) * 100),
          currentFile: file.originalname,
          result: {
            id: result.id,
            filename,
            downloadUrl,
            originalSize: file.size,
            optimizedSize: result.optimizedSize,
            compressionRatio: result.compressionRatio,
            processingTime: result.processingTime
          }
        })}\n\n`);

        results.push({
          id: result.id,
          originalName: file.originalname,
          filename,
          downloadUrl,
          originalSize: file.size,
          optimizedSize: result.optimizedSize,
          compressionRatio: result.compressionRatio,
          processingTime: result.processingTime,
          watermark: watermarkOptions
        });

      } catch (error) {
        console.error(`Error processing watermark for ${file.originalname}:`, error);
        processedFiles++;
        
        res.write(`data: ${JSON.stringify({
          processed: processedFiles,
          total: totalFiles,
          percentage: Math.round((processedFiles / totalFiles) * 100),
          currentFile: file.originalname,
          error: error.message
        })}\n\n`);

        results.push({
          id: uuidv4(),
          originalName: file.originalname,
          error: error.message,
          originalSize: file.size,
          optimizedSize: 0,
          compressionRatio: 0
        });
      }
    }

    console.log(`Completed watermark processing. Processed ${results.length} files`);
    
    // Send completion event
    res.write(`data: ${JSON.stringify({
      completed: true,
      results,
      totalProcessed: results.length,
      totalErrors: results.filter(r => r.error).length
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error('Watermark processing error:', error);
    res.status(500).json({ error: 'Watermark processing failed', details: error.message });
  }
});

// Text watermark endpoint
router.post('/watermark-text', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    const options = {
      text: req.body.text || 'PixelSqueeze',
      position: req.body.position || 'bottom-right',
      opacity: parseFloat(req.body.opacity) || 0.7,
      size: parseFloat(req.body.size) || 0.15,
      margin: parseInt(req.body.margin) || 20,
      style: req.body.style || 'single',
      color: req.body.color || '#ffffff',
      fontSize: parseInt(req.body.fontSize) || 48,
      fontFamily: req.body.fontFamily || 'sans-serif',
      shadowColor: req.body.shadowColor || '#000000',
      shadowOpacity: req.body.shadowOpacity ? parseFloat(req.body.shadowOpacity) : 0.35,
      shadowBlur: req.body.shadowBlur ? parseFloat(req.body.shadowBlur) : 2,
      shadowOffsetX: req.body.shadowOffsetX ? parseFloat(req.body.shadowOffsetX) : 2,
      shadowOffsetY: req.body.shadowOffsetY ? parseFloat(req.body.shadowOffsetY) : 2,
      diagonalAngle: req.body.diagonalAngle ? parseFloat(req.body.diagonalAngle) : 30,
    };

    const result = await advancedImageProcessor.addTextWatermark(req.file, options);
    const upload = await storageService.uploadFile(result.buffer, `watermarked_text_${Date.now()}.png`, 'image/png', { folder: 'watermarked' });

    res.json({ success: true, data: { key: upload.key, url: upload.url } });
  } catch (e) {
    console.error('Text watermark error:', e);
    res.status(500).json({ error: 'Failed to add text watermark', details: e.message });
  }
});

// Image analysis
router.post('/analyze', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const analysis = await advancedImageProcessor.analyzeImage(req.file);
    const suggestions = advancedImageProcessor.getOptimizationSuggestions(analysis);

    res.json({
      success: true,
      data: {
        ...analysis,
        suggestions
      }
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze image', details: error.message });
  }
});

// Generate thumbnails
router.post('/thumbnails', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : [150, 300, 600];
    const thumbnails = await advancedImageProcessor.generateThumbnails(req.file, sizes);

    // Save thumbnails
    const savedThumbnails = [];
    for (const thumbnail of thumbnails) {
      const fileName = `thumb_${thumbnail.size}_${Date.now()}.${thumbnail.format}`;
      const filePath = path.join(__dirname, '../../uploads', fileName);
      
      await fs.writeFile(filePath, thumbnail.buffer);
      
      savedThumbnails.push({
        ...thumbnail,
        downloadUrl: `/uploads/${fileName}`
      });
    }

    res.json({
      success: true,
      data: savedThumbnails
    });

  } catch (error) {
    console.error('Thumbnail generation error:', error);
    res.status(500).json({ error: 'Failed to generate thumbnails', details: error.message });
  }
});

// Get optimization presets
router.get('/presets', (req, res) => {
  try {
    const presets = advancedImageProcessor.createPreset();
    
    res.json({
      success: true,
      data: presets
    });

  } catch (error) {
    console.error('Presets error:', error);
    res.status(500).json({ error: 'Failed to get presets', details: error.message });
  }
});

// Create custom preset
router.post('/presets', authenticateToken, (req, res) => {
  try {
    const { name, options } = req.body;
    
    if (!name || !options) {
      return res.status(400).json({ error: 'Preset name and options are required' });
    }

    const preset = advancedImageProcessor.createPreset(name, options);
    
    res.json({
      success: true,
      data: preset
    });

  } catch (error) {
    console.error('Create preset error:', error);
    res.status(500).json({ error: 'Failed to create preset', details: error.message });
  }
});

// Advanced optimization with custom options
router.post('/optimize-advanced', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const options = {
      quality: parseInt(req.body.quality) || 80,
      format: req.body.format || 'auto',
      width: req.body.width ? parseInt(req.body.width) : undefined,
      height: req.body.height ? parseInt(req.body.height) : undefined,
      preserveMetadata: req.body.preserveMetadata === 'true',
      progressive: req.body.progressive !== 'false',
      mozjpeg: req.body.mozjpeg !== 'false',
      blur: parseFloat(req.body.blur) || 0,
      sharpen: parseFloat(req.body.sharpen) || 0,
      grayscale: req.body.grayscale === 'true',
      flip: req.body.flip === 'true',
      flop: req.body.flop === 'true',
      rotate: parseInt(req.body.rotate) || 0,
      brightness: parseFloat(req.body.brightness) || 1,
      contrast: parseFloat(req.body.contrast) || 1,
      saturation: parseFloat(req.body.saturation) || 1,
      gamma: parseFloat(req.body.gamma) || 1,
      webp: {
        quality: parseInt(req.body.webpQuality) || 80,
        effort: parseInt(req.body.webpEffort) || 4
      },
      avif: {
        quality: parseInt(req.body.avifQuality) || 80,
        effort: parseInt(req.body.avifEffort) || 4
      }
    };

    const result = await advancedImageProcessor.optimizeImage(req.file, options);

    // Save the optimized file
    const fileName = `advanced_${result.id}.${result.format}`;
    const filePath = path.join(__dirname, '../../uploads', fileName);
    
    await fs.writeFile(filePath, result.buffer);
    
    // Increment usage (count + bandwidth based on original file size)
    try { await req.user.incrementUsage(req.file.size || 0); } catch {}

    result.downloadUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Advanced optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize image', details: error.message });
  }
});

// Get supported formats
router.get('/formats', (req, res) => {
  res.json({
    success: true,
    data: {
      supported: advancedImageProcessor.supportedFormats,
      conversion: ['jpeg', 'png', 'webp', 'avif', 'tiff']
    }
  });
});

module.exports = router; 