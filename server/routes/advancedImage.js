const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const advancedImageProcessor = require('../services/advancedImageProcessor');
const { authenticateToken } = require('../middleware/auth');

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
    const uploadsDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }

    // Save optimized images and generate download URLs
    const savedResults = [];
    for (const result of results) {
      if (result.error) {
        savedResults.push(result);
        continue;
      }

      try {
        // Generate filename
        const fileExtension = result.format || 'jpg';
        const fileName = `optimized_${result.id}.${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Save the optimized image
        await fs.writeFile(filePath, result.buffer);
        
        // Add download URL to result
        const savedResult = {
          ...result,
          downloadUrl: `/uploads/${fileName}`
        };
        
        savedResults.push(savedResult);
        console.log(`Saved optimized image: ${fileName}`);
      } catch (error) {
        console.error(`Error saving optimized image ${result.originalName}:`, error);
        savedResults.push({
          ...result,
          error: `Failed to save optimized image: ${error.message}`
        });
      }
    }

    // Send final results with download URLs
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
    const filePath = path.join(__dirname, '../uploads', fileName);
    
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
    const watermarkPath = path.join(__dirname, '../uploads/temp', watermarkFileName);
    
    await fs.writeFile(watermarkPath, req.files.watermark[0].buffer);
    watermarkOptions.watermarkPath = watermarkPath;

    const result = await advancedImageProcessor.addWatermark(req.files.image[0], watermarkOptions);

    // Save the watermarked image
    const fileName = `watermarked_${result.id}.png`;
    const filePath = path.join(__dirname, '../uploads', fileName);
    
    await fs.writeFile(filePath, result.buffer);
    
    // Clean up temporary watermark
    await fs.unlink(watermarkPath);
    
    result.downloadUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Watermark error:', error);
    res.status(500).json({ error: 'Failed to add watermark', details: error.message });
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
      const filePath = path.join(__dirname, '../uploads', fileName);
      
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
    const filePath = path.join(__dirname, '../uploads', fileName);
    
    await fs.writeFile(filePath, result.buffer);
    
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