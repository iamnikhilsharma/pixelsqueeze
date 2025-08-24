const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');

router.use(authenticateToken, requireAdmin);

router.get('/', async (req, res) => {
  // simplistic metrics example
  const totalImages = await User.aggregate([
    { $group: { _id: null, total: { $sum: '$usage.monthlyImages' } } }
  ]);
  const total = totalImages[0]?.total || 0;
  // fake 7-day data
  const daily = Array.from({ length: 7 }).map(() => Math.floor(Math.random() * 1000));
  const formats = { jpeg: 65, png: 22, webp: 11, avif: 2 };
  res.json({
    success: true,
    data: {
      totalImagesOptimized: total,
      dailyOptimizations: daily,
      topFormats: formats,
      storageUsageGB: 50,
      bandwidthSavedGB: 400
    }
  });
});

module.exports = router;
